<?php 
class NwpWebRTCChatConfig{
    public static $db_host = 'localhost';
    public static $db_name = 'feyi2';
    public static $db_username = 'root';
    public static $db_password = '';

    public static $tables = array(
        'chat_profile', 'chat_messages', 'chat_group', 'chat_group_members', 'chat_contact_status', 'users'
    );

    public static function get_plugin_dep_path():string{
        return dirname(__DIR__, 2).'/classes/dependencies';
    }

    public static function get_class_dep_path():string{
        return dirname(__DIR__, 4).'/classes/dependencies';
    }

    public static function get_uploads_dir():string{
        return dirname(__DIR__, 2).'/uploads';
    }
    
}

?>