<?php
require '_cQueryBuilder2.php';
require dirname(__DIR__, 1).'/config/NwpWebRTChatConfig.php';

class ChatController{
    private $_query_instance;
    protected $_labels;
    
    public function __construct(){
        $this->_query_instance = new Mysql_query( 
            new PDO(
                'mysql:host='. NwpWebRTCChatConfig::$db_host .';dbname='. NwpWebRTCChatConfig::$db_name .'', NwpWebRTCChatConfig::$db_username, NwpWebRTCChatConfig::$db_password
            )
        );
        $this->_initialize_table_labels();
        echo 'Controller Initialized';
    }

    protected function _initialize_table_labels(){
        foreach( NwpWebRTCChatConfig::$tables as $tb ){
            if( file_exists( NwpWebRTCChatConfig::get_plugin_dep_path().'/'.$tb.'.json' ) ){
                $file = NwpWebRTCChatConfig::get_plugin_dep_path().'/'.$tb.'.json';
                $this->_labels[ $tb ] = json_decode(file_get_contents( $file ), true);
            }else if( file_exists( NwpWebRTCChatConfig::get_class_dep_path().'/'.$tb.'.json' ) ){
                $file = NwpWebRTCChatConfig::get_class_dep_path().'/'.$tb.'.json';
                $this->_labels[ $tb ] = json_decode(file_get_contents( $file ), true);
            }
        }
    }

    public function register_chat_profiles(){
        $tb = 'users';
        $tb2 = 'chat_profile';
        $tbf = $this->get_table_fields( $tb );
        $tbf2 = $this->get_table_fields( $tb2 );

        // unregistered users
        $unreg_users = $this->_query( $tb, ["`$tb`.`id`" => 'id'] )
            ->disable_record_status_filter()
            ->left_join( $tb2, "`$tb`.`id` = `$tb2`.`{$tbf2[ 'user' ]}`", [ "`$tb2`.`{$tbf2[ 'user' ]}`" => 'profile_id' ] )
            ->where( "`$tb2`.`{$tbf2[ 'user' ]}` is null" )
            ->all();

        if( $unreg_users ){
            $query = $this->_query( $tb2 );
            $query->unset_query();

            $data = [];

            foreach( $unreg_users as $user ){
                if( isset( $user[ 'id' ] ) && $user[ 'id' ] ){
                    $data[] = array(
                        $tbf2[ 'user' ] => $user[ 'id' ],
                        $tbf2[ 'profile_type' ] => 'private', 
                    );
                }
            }

            $query->multi_save( $data );
        }
    }

    public function create_private_chat_profile( string $userId ){
        $tb = 'chat_profile';
        $tbf = $this->get_table_fields( $tb );

        $userProfile = $this->get_user( $userId );
        if( empty( $userProfile ) ){            
            $query = $this->_query( $tb );
            $query->save(
                array(
                    $tbf[ 'user' ] => $userId,
                    $tbf[ 'profile_type' ] => 'private' 
                )
            );

            $userProfile = $this->get_user( $userId );
        }

        return $userProfile;
    }

    public function get_user( $userId, $type_of_user = 'private' ){
        $tb = 'users';
        $tb2 = 'chat_profile';
        $tbf = $this->get_table_fields( $tb );
        $tbf2 = $this->get_table_fields( $tb2 );
        $return = array();
        
        switch( $type_of_user ){
            case 'private':
                $query = $this->_query( $tb, array('`'. $tb .'`.`id`') + array_flip( $tbf ) );
                $query->join( $tb2, '`'. $tb2 .'`.`'. $tbf2[ 'user' ] .'` = `'. $tb .'`.`id`', array_flip( $tbf2 ) )
                ->where( '`'.$tb.'`.`id` = "'. $userId .'"' );

                $return = $query->first();
            break;
        }

        return $return;
    }

    public function saveMessage(array $data){
        $required = array( 'message_type', 'sender', 'receiver', 'message' );
        foreach( $required as $v ){
            if( !isset( $data[$v] ) || empty($data[$v]) ) return;
        }

        $tb = 'chat_messages';
        $tbf = $this->get_table_fields( $tb );
        $sdata = [];

        $sdata[ 'id' ] = $data[ 'id' ];
        $sdata[ $tbf[ 'type_of_receiver' ] ] = $data[ 'type_of_receiver' ];
        $sdata[ $tbf[ 'message_type' ] ] = $data[ 'message_type' ];
        $sdata[ $tbf[ 'sender' ] ] = $data[ 'sender' ];
        $sdata[ $tbf[ 'receiver' ] ] = $data[ 'receiver' ];
        $sdata[ $tbf[ 'message' ] ] = $data[ 'message' ];
        $sdata[ $tbf[ 'recipient_status' ] ] = isset( $data[ 'recipient_status' ] ) ? $data[ 'recipient_status' ] : 'sent'; // sent, delivered, read,

        $query  = $this->_query( $tb );
        $saved = $query->save( $sdata );
        // print_r( $saved );
        if( isset( $saved[ 'saved' ] ) && $saved[ 'saved' ] ){
            $return = array();

            $return[ 'id' ] = $saved[ 'record' ][ 'id' ];
            $return[ 'sender' ] = $saved[ 'record' ][ $tbf[ 'sender' ] ];
            $return[ 'receiver' ] = $saved[ 'record' ][ $tbf[ 'receiver' ] ];
            $return[ 'text' ] = $saved[ 'record' ][ $tbf[ 'message' ] ];
            $return[ 'receipt' ] = $saved[ 'record' ][ $tbf[ 'recipient_status' ] ];
            $return[ 'message_type' ] = $saved[ 'record' ][ $tbf[ 'message_type' ] ];
            $return[ 'status' ] = $saved[ 'record' ][ $tbf[ 'status' ] ];
            $return[ 'timestamp' ] = date('h:i A', $saved[ 'record' ][ 'creation_date' ]);
            return $return;
        }
    }

    public function updateMessage(array $data, $msg_id){
        $tb = 'chat_messages';
        $tbf = $this->get_table_fields( $tb );
        $sdata = [];

        foreach( $data as $k => $v ){
            if( isset( $tbf[ $k ] ) ) $sdata[ $tbf[ $k ] ] = $v;
        }

        $query  = $this->_query( $tb );
        $query->where( "id = '$msg_id'" );

        $saved = $query->save( $sdata );
        // print_r( $saved );
        if( isset( $saved[ 'record' ] ) && $saved[ 'record' ] ){
            $return = array();

            $return[ 'id' ] = $saved[ 'record' ][ 'id' ];
            $return[ 'sender' ] = $saved[ 'record' ][ $tbf[ 'sender' ] ];
            $return[ 'receiver' ] = $saved[ 'record' ][ $tbf[ 'receiver' ] ];
            $return[ 'text' ] = $saved[ 'record' ][ $tbf[ 'message' ] ];
            $return[ 'receipt' ] = $saved[ 'record' ][ $tbf[ 'recipient_status' ] ];
            $return[ 'message_type' ] = $saved[ 'record' ][ $tbf[ 'message_type' ] ];
            $return[ 'status' ] = $saved[ 'record' ][ $tbf[ 'status' ] ];
            $return[ 'timestamp' ] = date('h:i A', $saved[ 'record' ][ 'creation_date' ]);
            return $return;
        }
    }

    public function send_read_receipt( $sender, $receiver ){
        $tb = 'chat_messages';
        $tbf = $this->get_table_fields( $tb );

        $query = $this->_query( $tb );
        $query->where( $tbf[ 'receiver' ].' = "'. $sender .'" AND '. $tbf[ 'sender' ] .' = "'. $receiver .'" && '. $tbf[ 'recipient_status' ] .' != "read" ' );

        $query->save([
            $tbf['recipient_status'] => 'read',
        ]);
    }

    public function deliver_my_messages( $user ){
        $tb = 'chat_messages';
        $tbf = $this->get_table_fields( $tb );

        $query = $this->_query( $tb );
        $query->where( $tbf[ 'receiver' ].' = "'. $user .'" && '. $tbf[ 'recipient_status' ] .' = "sent" ' );

        $query->save([
            $tbf['recipient_status'] => 'delivered',
        ]);
    }

    public function load_chat_messages( string $sender, string $receiver,  ):array{
        $tb = 'chat_messages';
        $tb2 = 'chat_profile';
        $tbf2 = $this->get_table_fields( $tb2 );
        $tbf = $this->get_table_fields( $tb );

        $return = array(
            'messages' => array(),
            'unread_msg_count' => 0,
        );

        $this->_query( $tb )->unset_query();
        $query = $this->_query( $tb, [
            'id',
            'creation_date' => 'timestamp',
            $tbf[ 'sender' ] => 'sender',
            $tbf[ 'receiver' ] => 'receiver',
            $tbf[ 'message' ] => 'text',
            $tbf[ 'recipient_status' ] => 'recipient_status',
            $tbf[ 'message_type' ] => 'message_type',
            $tbf[ 'status' ] => 'status',
        ] )
            ->where( '('. $tbf[ 'sender' ]. ' = ? AND '.$tbf[ 'receiver' ].' = ?) OR ('. $tbf[ 'receiver' ]. ' = ? AND '.$tbf[ 'sender' ].' = ?)', $sender, $receiver, $sender, $receiver )
            ->order('serial_num', 'asc')
            ->limit(50);
        
        // print_r( $query->get_select_query() );
        $chats = $query->all();
        
        if( $chats ){
            $sn = 0;
            foreach( $chats as $chat ){
                if( $chat[ 'timestamp' ] >= strtotime('today') ){
                    $msg_group = 'Today';
                }else{
                    if( $chat[ 'timestamp' ] >= strtotime( 'yesterday' ) ){
                        $msg_group = 'Yesterday';
                    }else{
                        $msg_group = date( 'D, j M', $chat[ 'timestamp' ] );
                    }
                }
                // $timestamp = isset( $chats[ $sn+1 ] ) && date( 'h:i A', $chats[$sn+1][ 'timestamp' ] ) == date( 'h:i A', $chat[ 'timestamp' ] ) ? '' : date( 'h:i A', $chat[ 'timestamp' ] );


                $timestamp = date( 'h:i A', $chat[ 'timestamp' ] );
                $chat[ 'timestamp' ] = $timestamp;

                if( $chat[ 'receiver' ] == $sender && $chat[ 'recipient_status' ] != 'read' ){
                    $return[ 'unread_msg_count' ] += 1;
                }

                $return[ 'messages' ][ $msg_group ][] = $chat;

                $sn++;
            }
        }
        return $return;
    }

    public function get_recent_Chats( String $userId ){
        $tb = 'chat_profile';
        $tb2 = 'chat_messages';
        $tb3 = 'chat_contact_status';
        $tb4 = 'users';
        $tbf = $this->get_table_fields( $tb );
        $tbf2 = $this->get_table_fields( $tb2 );
        $tbf3 = $this->get_table_fields( $tb3 );
        $tbf4 = $this->get_table_fields( $tb4 );

        $tbf2_flipped = array_flip($tbf2);
        $tbf2_flipped[ $tbf2[ 'receiver' ] ] = 'id';
        $tbf2_flipped[  '`'. $tb .'`.`serial_num`' ] = 'chat_serial_num';

        // $query = $this->_query_instance;

        $query = $this->_query($tb, [
                
                '`'. $tb .'`.`'. $tbf[ 'profile_type' ] .'`' => 'profile_type',
                '`'. $tb .'`.`'. $tbf[ 'user' ] .'`' => 'user',
                '`'. $tb .'`.`'. $tbf[ 'last_seen' ] .'`' => 'last_seen',
            ]);
            
            $query->join( 
                $tb2, 
                '`'. $tb2 .'`.`'. $tbf2[ 'receiver' ] .'` = `'. $tb .'`.`'. $tbf[ 'user' ] .'` OR `'. $tb2 .'`.`'. $tbf2[ 'sender' ] .'` = `'. $tb .'`.`'. $tbf[ 'user' ] .'`',
                [
                    "`$tb2`.`{$tbf2[ 'receiver' ]}`" => 'receiver',
                    "`$tb2`.`{$tbf2[ 'sender' ]}`" => 'sender',
                    "`$tb2`.`{$tbf2[ 'recipient_status' ]}`" => 'recipient_status',
                ]
        )
        ->left_join( 
            $tb4, 
            '`'. $tb4 .'`.`id` = `'. $tb .'`.`'. $tbf[ 'user' ] .'`', 
            array(
                "`$tb4`.`id`" => 'id',
                "`$tb4`.`{$tbf4[ 'firstname' ]}`" => 'firstname',
                "`$tb4`.`{$tbf4[ 'lastname' ]}`" => 'lastname',
                "`$tb4`.`{$tbf4[ 'email' ]}`" => 'email',
                "`$tb4`.`{$tbf4[ 'photograph' ]}`" => 'photograph',
            )
        )
        ->where( "(`$tb2`.`{$tbf2[ 'sender' ]}` = '{$userId}' OR `$tb2`.`{$tbf2[ 'receiver' ]}` = '{$userId}') AND `$tb4`.`id` != '{$userId}'" )
        // ->group_by( "`$tb4`.`id`" )
        ->custom_order_query( '`'. $tb2 .'`.`serial_num` DESC' );
        
        $result = $query->all();
        $chat_profiles = array();
        
        if( $result ){
            foreach( $result as $e ){
                if( !isset( $chat_profiles[ $e[ 'id' ] ] ) ) $chat_profiles[ $e[ 'id' ] ] = $e;

                if( $e[ 'recipient_status' ] != 'read' && $e[ 'receiver' ] == $userId ){
                    $chat_profiles[ $e[ 'id' ] ][ 'unread_msg_count' ] =  isset($chat_profiles[ $e[ 'id' ] ][ 'unread_msg_count' ]) ? $chat_profiles[ $e[ 'id' ] ][ 'unread_msg_count' ] + 1 : 1;
                }

            }

            $chat_profiles = array_values( $chat_profiles );
        }
        
        // print_r($chat_profiles);
        return $chat_profiles;

        $query->reset_query();
        $query = $this->_query( $tb4 );
        $query->join(
            $tb,
        )
        ->where( "`$tb4`.`id` IN ('". implode( "'.'", array_column( $chat_profiles, 'user', 'user' ) ) ."')" )
        

        ->left_join( 
            $tb3, 
            '`'. $tb3 .'`.`'. $tbf3[ 'reference' ] .'` = `'. $tb .'`.`'. $tbf[ 'user' ] .'`', 
            array_flip($tbf3)
            )
        ->where( '(`'. $tb2 .'`.`'. $tbf2[ 'sender' ] .'` = "'. $userId .'" OR `'. $tb2 .'`.`'. $tbf2[ 'receiver' ] .'` = "'. $userId .'") AND `'. $tb .'`.`record_status` = "1" GROUP BY `id`' )
        ->custom_order_query( '`'. $tb2 .'`.`serial_num` DESC' );

        // print_r( $query->get_select_query() );
        
        $result = $query->all();  
        return $result;
    }

    public function get_table_fields( string $table ) : array|null {
        return isset( $this->_labels[ $table ][ 'fields' ] ) ? $this->_labels[ $table ][ 'fields' ] : null;
    }

    public function updateUserlogOutStatus( $userId ) {
        $tb = 'chat_profile';
        $tbf = $this->get_table_fields( $tb );

        $query = $this->_query( $tb );
        $query->where( $tbf[ 'user' ] .' = '. $userId );
        $saved = $query->save( [$tbf[ 'last_seen' ] => date('U') ] );

        if( isset( $saved[ 'saved' ] ) && $saved[ 'saved' ] ){
            $query = $this->_query( $tb, null, 0 );
            $query->where( $tbf[ 'user' ] .' = '. $userId );

            $return = $query->first(); 
            if( $return ){
                if( $return[ 'last_seen' ] >= strtotime('today') ){
                    $msg_group = 'Today';
                }else{
                    if( $return[ 'last_seen' ] >= strtotime( 'yesterday' ) ){
                        $msg_group = 'Yesterday';
                    }else{
                        $msg_group = date( 'D, j M', $return[ 'last_seen' ] );
                    }
                }
                
                $last_seen = date( 'h:i A', $return[ 'last_seen' ] ) . ' | '. $msg_group;

                $return[ 'last_seen' ] = $last_seen;
            }

            return $return;
        }
    }

    protected function _query( $table, $fields = null, $unset_query = true ){
        if( is_null( $fields ) ){
            if( isset( $this->_labels[ $table ][ 'fields' ] ) ){
                $fields = array_flip( $this->_labels[ $table ][ 'fields' ] );
            }else{
                $fields = array('*');
            }
        }

        if( $unset_query )$this->_query_instance->unset_query();
        return $this->_query_instance->from($table, $fields);
    }

    public function log($data){
        file_put_contents( 'log.txt', json_encode($data) );
    }
}

?>