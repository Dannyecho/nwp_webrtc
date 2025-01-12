<?php
/**
 * Main Plugin Class
 * @created  Hyella Nathan | 06:27 | 20-Nov-2024
 */
class cNwp_webrtc extends cPlugin_class{
	
	public $class_settings = array();
	
	private $current_record_id = '';
	
	public $table_name = 'nwp_webrtc';
	
	public $label = 'Realtime Communication';
	public $dir_path = __FILE__;
	
	public $plugin_options = array(
		"main_menu" => array(
			"webrtc" => array(
				"title" => "Realtime Comm.",
				"class" => "customers",
				"action" => "display_app_view_manage_consultation",
				"icon" => "icon-stethoscope",
				"access" => "14426540071",
				"tab" => array( "mis" => 1, "system" => 1, "inventory" => 1 ),
				"sub_menu" => array(
					"nwp_webrtc", "webrtc_chat"
				),
			),
		),
		"sub_menu" => array(
			"webrtc_chat" => array(
				'title' =>   'Live Chat',
				'class' =>  'nwp_webrtc',
				'action' =>  'execute&nwp_action=webrtc_main&nwp_todo=display_app_chat_screen',
			),
			"nwp_webrtc" => array(
				"title" => "About",
				"class" => "nwp_webrtc",
				"action" => "display_plugin_details",
			),
		),
	);
	
	function nwp_webrtc(){
		
		$returned_value = array();
		
		$this->class_settings['current_module'] = '';
		
		switch ( $this->class_settings['action_to_perform'] ){
		case "display_plugin_details":
		case "get_plugin_details":
			$returned_value = $this->_get_plugin_details();
		break;
		case "execute":
			$returned_value = $this->_execute();
		break;
		}
		
		return $returned_value;
	}
	
	public static function get_settings($o=[]){
		$settings = [];
		$settings["virtual_app_booking"] = 1;
		if( isset( $o["key"] ) && $o["key"] ){
			return $settings[ $o["key"] ];
		}
		return 0;
	}
}
if( file_exists( dirname( __FILE__ ) . '/functions.php' ) )include dirname( __FILE__ ) . '/functions.php';
?>