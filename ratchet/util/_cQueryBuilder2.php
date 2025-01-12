<?php 
class Mysql_query{
    private $_connection;
    protected $_from;
    protected $_fields = array();
    protected $_limit;
    protected $_offset;
    protected $_order;
    protected $_group_by;
    protected $_custom_order;
    protected $_direction;
    protected $_join = array();
    protected $_where = array();
    protected $_multi_insert_count = 0;
    protected $_use_record_status_filter = true;

    public function __construct(PDO $connection){
        $this->_connection = $connection;
    }

    public function disable_record_status_filter(){
        $this->_use_record_status_filter = false;
        return $this;
    }

    public function begin_transaction(){
        $this->_connection->beginTransaction();
        return $this;
    }
    
    public function commit(){
        $this->_connection->commit();
        return $this;
    }
    
    public function roll_back(){
        $this->_connection->rollBack();
        return $this;
    }

    public function from( $from, $fields = array("*") ){
        if( empty( $from ) ){
            // throw new Fimi_db_exception( "Invalid 'FROM' arguement" );
        }

        $this->_from = $from;
        
        if( $fields ){
            $this->_fields[ $from ] = $fields;
        }

        return $this;
    }

    public function join( $join, $on, $fields = array() ){
        if( empty( $join ) ){
            // throw new Fimi_db_exception( "Invalid 'JOIN' arguement" );
        }

        if( empty( $on ) ){
            // throw new Fimi_db_exception( "Invalid 'ON' arguement" );
        }

        if( $this->_use_record_status_filter ){
            $join_arr = explode( ' ', $join );
            $this->_where[] = trim(end( $join_arr )).".`record_status` = '1'";
        }

        $this->_fields += array( $join => $fields );
        $this->_join[] = "JOIN {$join} on {$on}";
        
        return $this;
    }

    public function left_join( $join, $on, $fields = array() ){
        if( empty( $join ) ){
            // throw new Fimi_db_exception( "Invalid 'JOIN' arguement" );
        }

        if( empty( $on ) ){
            // throw new Fimi_db_exception( "Invalid 'ON' arguement" );
        }
        
        if( $this->_use_record_status_filter ){
            $join_arr = explode( ' ', $join );
            $this->_where[] = trim(end( $join_arr )).".`record_status` = '1'";
        }

        $this->_fields += array( $join => $fields );
        $this->_join[] = "LEFT JOIN {$join} on {$on}";
        
        return $this;
    }

    public function right_join( $join, $on, $fields = array() ){
        if( empty( $join ) ){
            // throw new Fimi_db_exception( "Invalid 'JOIN' arguement" );
        }

        if( empty( $on ) ){
            // throw new Fimi_db_exception( "Invalid 'ON' arguement" );
        }
        
        if( $this->_use_record_status_filter ){
            $join_arr = explode( ' ', $join );
            $this->_where[] = trim(end( $join_arr )).".`record_status` = '1'";
        }

        $this->_fields += array( $join => $fields );
        $this->_join[] = "RIGHT JOIN {$join} on {$on}";
        
        return $this;
    }

    public function limit( $limit, $page = 1 ){
        if(  is_null( $limit ) ){
            // throw new Fimi_db_exception( "Invalid 'LIMIT' arguement" );
        }

        $this->_limit = $limit;
        $this->_offset = $limit * ( $page - 1 );

        return $this;
    }

    public function order($order, $direction="desc"){
        if (empty($order)){
            // throw new Fimi_db_exception("Invalid 'ORDER' argument");
        }
        
        $this->_order = "$order";
        $this->_direction = $direction;
        return $this;
    }

    public function group_by($group_by){
        if (empty($group_by)){
            // throw new Fimi_db_exception("Invalid 'ORDER' argument");
        }
        
        $this->_group_by = $group_by;
        return $this;
    }

    public function custom_order_query( $order ){
        if (empty($order)){
            // throw new Fimi_db_exception("Invalid 'ORDER' argument");
        }

        $this->_custom_order = $order;
        return $this;
    }

    public function where(){
        $arguments = func_get_args();
        if (sizeof($arguments)<1){
            // throw new Fimi_db_exception("Invalid 'WHERE' argument");
        }

        $arguments[0] = preg_replace("#\?#", "%s", $arguments[0]);

        if( !isset( $arguments[1] ) ){
            $this->_where[] = $arguments[0];
            return $this;
        }

        foreach( array_slice($arguments, 1, null, true) as $i => $parameter ){
            if( is_array( $parameter ) ){
                foreach( $parameter as $pi => $pv ){
                    $arguments[ $i.$pi ] = $this->_connection->quote( $parameter[ $pi ] );
                } 
                unset( $arguments[ $i ] );
            }else{
                $arguments[ $i ] = $this->_connection->quote( $arguments[ $i ] );
            }
            
        }

        $this->_where[] = call_user_func_array("sprintf", $arguments);
        return $this;
    }

    protected function _build_select(){
        $fields = array();
        $where = $order = $limit = $join = "";
        $template = "SELECT %s FROM %s %s %s %s %s %s";

        foreach( $this->_fields as $table => $_fields ){
            foreach ($_fields as $field =>$alias){
                if( is_string( $field ) ){
                    $fields[] = "{$field} AS {$alias}";
                }else{
                    $fields[] = $alias;
                }
            }
        }

        if( $this->_use_record_status_filter ){
            $this->_where[] = " `$this->_from`.`record_status` = '1'";
        }

        $fields = implode(", ", $fields);
        $_join = $this->_join;
        if ( !empty( $_join ) ){
            $join = implode(" ", $_join);
        }

        $_where = $this->_where;
        if( !empty( $_where ) ){
            $joined = implode(" AND ", $_where);
            $where = "WHERE {$joined}";
        }

        $_order = $this->_order;
        
        $_from = $this->_from;
        $order = "ORDER BY `$_from`.`serial_num` DESC";
        
        $group_by = $this->_group_by ? "GROUP BY {$this->_group_by}" : '';

        if( !empty( $_order ) ){
            $_direction = $this->_direction;
            $order = "ORDER BY `{$_from}`.`{$_order}` {$_direction}";
        }

        if( ! empty( $this->_custom_order ) ){
            $order = "ORDER BY ".$this->_custom_order;
            $this->_custom_order = '';
        }

        $_limit = $this->_limit;
        if( !empty( $_limit ) ){
            $_offset = $this->_offset;
            if( $_offset ){
                $limit = "LIMIT {$_limit}, {$_offset}";
            }else{
                $limit = "LIMIT {$_limit}";
            }
        }

        return sprintf($template, $fields, $this->_from, $join, $where, $group_by, $order, $limit);
    }

    protected function _build_insert( $data, $append_to_id = "" ){
        $fields = array();
        $values = array();
        $template = "INSERT INTO %s (%s) VALUES(%s)";

        $id = strrev( $this->_from );
        
        if(! (isset( $data[ 'id' ] ) && $data[ 'id' ]) ){
            $fields[] = 'id';
            $values[] =  $this->_connection->quote( $append_to_id . substr( $id, 0, 2 ). time() );
        }
        
        $fields[] = 'record_status';
        $values[] = 1; 
        foreach( $data as $field => $value ) {
            $fields[] = $field;
            $values[] = $this->_connection->quote( $value );
        }
        $fields[] = 'created_by';
        $values[] = isset( $_SESSION[ 'reuse_settings' ][ 'user_cert' ][ 'id' ] ) ? $_SESSION[ 'reuse_settings' ][ 'user_cert' ][ 'id' ] : 0;
        
        $fields[] = 'creation_date';
        $values[] = date('U');

        $fields[] = 'modification_date'; 
        $values[] = date( 'U' );

        $fields = implode( ", ", $fields );
        $values = implode( ", ", $values );

        return sprintf( $template, $this->_from, $fields, $values );
    }

    function _build_multi_insert( $data ){
        $query = array();
        foreach( $data as $sval ){
            $this->_multi_insert_count++;
            $query[]= $this->_build_insert( $sval, 'SW'. $this->_multi_insert_count  );
        }

        return implode( ";\n", $query );
    }

    protected function _build_update( $data ){
        $parts = array();
        $where = $limit="";
        $template ="UPDATE %s SET %s %s %s";

        foreach ($data as $field =>$value){
            $parts[] = "{$field}=". $this->_connection->quote($value);
        }

        $parts = implode(", ", $parts);
        $_where = $this->_where;

        if (!empty($_where)){
            $joined = implode(", ", $_where);
            $where = "WHERE {$joined}";
        }

        $_limit = $this->_limit;
        if (!empty($_limit)){
            $_offset = $this->_offset;
            $limit = "LIMIT {$_limit} {$_offset}";
        }

        return sprintf($template, $this->_from, $parts, $where, $limit);
    } 

    protected function _build_delete(){
        $where = $limit = '';
        $template = "DELETE FROM %s %s %s";

        $_where = $this->_where;

        if( ! empty( $_where ) ){
            $joined = implode( ', ', $_where );
            $where = "WHERE {$joined}";
        }

        if ( ! empty( $_limit ) ){
            $_offset = $this->_offset;
            $limit ="LIMIT {$_limit} {$_offset}";
        }
        return sprintf($template, $this->_from, $where, $limit);
    }

    public function get_select_query(){
        return $this->_build_select();
    }

    public function get_insert_query( $data ){
        return $this->_build_insert( $data );
    }

    public function get_update_query( $data ){
        return $this->_build_update( $data );
    }

    public function get_delete_query(){
        return $this->_build_delete();
    }

    public function save( $data ){
        $is_insert = sizeof( $this->_where ) == 0;

        if( $is_insert ){
            $sql = $this->_build_insert( $data );
        }else{
            $sql = $this->_build_update( $data );
        }

        $result = $this->execute( $sql );

        if( $result === false ){
            return false;
        }

        // $record_query_template = "SELECT * from %s WHERE serial_num = '%s'";
        // $result = $this->execute( sprintf( $record_query_template, $this->_from, $this->_connection->lastInsertId() ) );
        $record_query_template = "SELECT * from %s ORDER BY serial_num DESC LIMIT 1";
        $result = $this->execute( sprintf( $record_query_template, $this->_from ) );
        
        $row = $result->fetch( PDO::FETCH_ASSOC );
        $result->closeCursor();
        return array('saved' => 1,'record' => $row );
        // return $result->fetch(PDO::FETCH_ASSOC);
    }

    public function multi_save( $data ){
        $is_insert = sizeof( $this->_where ) == 0;

        if( $is_insert ){
            $sql = $this->_build_multi_insert( $data );
        }

        /* else{
            $sql = $this->_build_update( $data );
        } */

        $result = $this->execute( $sql );

        if( ! $result ){
            return false;
        }

        $result->closeCursor();
        $record_query_template = "SELECT * from %s WHERE serial_num BETWEEN '%s' AND '%s'";
        $result = $this->execute( sprintf( $record_query_template, $this->_from, intval($this->_connection->lastInsertId()) - $this->_multi_insert_count, $this->_connection->lastInsertId() ) );
        
        $row = $result->fetchAll( PDO::FETCH_ASSOC );
        return array('saved' => 1, 'records' => $row );
        // return $result->rowCount();
    }

    public function force_delete(){
        $sql = $this->_build_delete();

        $result = $this->execute( $sql );

        if( $result === false ){
            return $result;
        }

        return $result->rowCount();
    }

    public function first(){
        $limit = $this->_limit;
        $offset = $this->_offset;

        $this->limit( 1 );

        $all = $this->all();
        $first = isset( $all[0] ) ? $all[0] : array();

        if( $limit ){
            $this->_limit = $limit;            
        }

        if( $offset ){
            $this->_offset = $offset;
        }

        return $first;
    }

    public function count(){
        $limit = $this->_limit;
        $offset = $this->_offset;
        $fields = $this->_fields;

        $this->_fields[ $this->_from ] = array( "COUNT(*)" => $this->_connection->quote( 'rows' ) );
        $this->limit(1);
        $row = $this->first();

        $this->_fields = $fields;
        
        if( $fields ){
            $this->_fields = $fields;
        }
        
        if( $limit ){
            $this->_limit = $limit;
        }
        
        if( $offset ){
            $this->_offset = $offset;
        }

        return $row[ 'rows' ];
    }

    public function all(){
        $sql = $this->_build_select();
        $result = $this->execute( $sql );

        if( $result === null ){
            return false;
        }

        $rows = $result->fetchAll( PDO::FETCH_ASSOC );
        $this->unset_query();
        /* while( $row = $result->fetch( PDO::FETCH_ASSOC ) ){
            $rows[] = $row;
        } */

        return $rows;
    }

    public function execute( $sql ){
        try{    
            return $this->_connection->query( $sql );
        }catch( PDOException $e ){
            print_r( $e->getMessage() );
            echo ("<br><br>Query:&nbsp;". print_r( $sql, true ) );
        }
    }

    public function unset_query(){
            // $this->_from = '';
            $this->_fields = array();
            $this->_limit = '';
            $this->_offset = '';
            $this->_order = '';
            $this->_group_by = '';
            $this->_direction = '';
            $this->_multi_insert_count = 0;
            $this->_join = array();
            $this->_where = array();
            $this->_use_record_status_filter = true;

        return $this;
    }

    public function row_count(){
        // $this->_connection->row_count();
    } 
    
    public function reset_query(){
        $this->_from = '';
        $this->_fields = array();
        $this->_limit = [];
        $this->_offset = [];
        $this->_order = [];
        $this->_group_by = '';
        $this->_direction = '';
        $this->_join = array();
        $this->_where = array();
        $this->_use_record_status_filter = true;
        return $this;
    }
    
    public function custom_query(string $query ){
        return $this->_connection->prepare($query);
    }
}
?>