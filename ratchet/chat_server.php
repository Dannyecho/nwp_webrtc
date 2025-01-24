<?php
use Ratchet\Server\IoServer;
use Ratchet\Http\HttpServer;
use Ratchet\WebSocket\WsServer;

require 'vendor/autoload.php';
//require '_data_mgt_functions.php';
require '_utility_functions.php';
require 'util/_cChatController.php';

class PrivateChatServer implements \Ratchet\MessageComponentInterface {
    protected $clients = [];
    protected $debug = 1;
    protected $_files = [];
    protected ChatController $_controller;

    public function onOpen(\Ratchet\ConnectionInterface $conn) {
        $this->_controller = new ChatController();
        $this->_controller->register_chat_profiles();
        echo "New connection established\n";
    }

    public function onMessage(\Ratchet\ConnectionInterface $from, $msg) {
        // Log large message warnings
		$messageSize = strlen($msg);
		if ($messageSize > 1024 * 1024) {
            error_log("Large message detected: {$messageSize} bytes");
			try{
                $data = json_decode($msg, true);
				if( isset( $data['senderId'] ) ){
					$responseData = [
						'type' => 'info',
						'senderId' => $data[ 'senderId' ],
						'message' => 'Your message is too large'
					];
					$this->clients[ $data[ 'senderId' ] ]->send(json_encode($responseData));
				}
			}catch(Exception $e){
				echo $e->getMessage();
			}
			return;
		}
		
		$data = json_decode($msg, true);
        echo "TYPE: ".$data[ 'type' ]."\n";
        switch ($data['type']) {
            case 'authenticate':
                $this->handleAuthentication($from, $data);
                break;

            case 'private_message':
                $this->handlePrivateMessage($from, $data);
                break;

            case 'get_connections':
                $profile_type = isset( $data[ 'profile_type' ] ) ? $data[ 'profile_type' ] : 'private_chat';
                $this->sendUserConnections($from, $data['userId'], $profile_type );
                break;
            case 'typing_indicator':
                $this->handleTypingIndicator($from, $data);
                break;

            case 'read_receipt':
                $this->handleReadReceipt($from, $data);
                break;
            case 'load_chat_messages':
                $this->_handleChatLoading($from, $data);
            break;
            case 'get_user_chats':
                $this->_getUserChats($from, $data);
            break;
            case 'connection_close':
                $this->_handleUserCloseConnection( $from, $data );
            break;
            case 'send_file':
                $this->_handleSendFile( $from, $data );
            break;
        }
    }

    private function _handleSendFile( $from, $data ){
        $responseData = [];
        $file_id = $data['file_id'];
        $mime_arg = isset( $data[ 'file_mime' ] ) ? explode( '/', $data[ 'file_mime' ] ) : array();
        $offset = isset( $data['offset'] ) ? intval( $data['offset'] ) : '';
        $chunk = isset( $data['chunk'] ) ? base64_decode($data['chunk'] ) : '';
        $file_ext = isset( $data['file_ext'] ) ? $data['file_ext'] : '';
        $receiverId = isset( $data[ 'receiver' ] ) ? $data[ 'receiver' ] : '';
        unset( $data[ 'chunk' ] );
        print_r( $data );
        $error = 0;

        if( $file_id && $mime_arg ){
            $file_type = $mime_arg[0];
            $chunk_index = isset( $data['chunk_index'] ) ? $data['chunk_index'] : '';
            $total_chunks = isset( $data['total_chunks'] ) ? $data['total_chunks'] : '';

            $filename = NwpWebRTCChatConfig::get_uploads_dir() .'/'. $file_id .'.'.$file_ext;
            
            if( !isset( $this->_files[ $file_id ] ) ){
                $this->_files[ $file_id ] = '';

                $data[ 'id' ] = $file_id;
                $data[ 'recipient_status' ] = 'sending';
                $data[ 'message' ] = $file_ext;
                $data[ 'message_type' ] = $file_type;
                $saved = $this->_controller->saveMessage( $data );
                // print_r( $saved );
                // exit;
                if( $saved ){
                    $responseData = [
                        'type' => 'private_message',
                        'data' => $saved,
                    ];
                }else{
                    $this->notifyApp(
                        $from, 
                        ['type' => 'error', 'message' => 'Message not sent']
                    );
                    return;               
                }
            }

            $this->_files[ $file_id ] .= $chunk;

            if( $total_chunks == $chunk_index ){
                $saved = $this->_controller->updateMessage( [ 'recipient_status' => 'sent'], $file_id );
                
                /* echo 'Update';
                print_r( $saved ); */
                $responseData = [
                    'type' => 'private_message',
                    'data' => $saved,
                ];

                touch( $filename );
                file_put_contents( $filename, $this->_files[ $file_id ] );
                unset( $this->_files[ $file_id ] );

                // Send to receiver if online
                if ( isset( $this->clients[ $receiverId ] ) ) {
                    $this->clients[ $receiverId ]->send( json_encode( $responseData ) );
                }
            }

            if( $responseData ){
                $from->send( json_encode( $responseData ) );
            }
        }

        /* if ( ! isset( $this->files[ $file_id ] ) ) {
            // touch( $filename );
            $this->files[ $file_id ] = fopen($filename, 'wb+'); 
            
            print_r( $filename );
            print_r( $this->files );
        } */

        // fseek( $this->files[ $file_id ], $offset );
        // fwrite( $this->files[ $file_id ], $chunk );

        /* if ( $data[ 'file_size' ] >= filesize( $filename ) ) {
            fclose( $this->files[ $filename ] );
            unset( $this->files[ $filename ] );

            $from->send(json_encode([
                'type' => 'fileUploadComplete',
                'filename' => $filename
            ]));
        } */
        // print_r( pack( 'C*', $data[ 'chunk' ] ) );
    }

    private function _handleUserCloseConnection($from, $data) {
        if( isset( $data[ 'user' ] ) && $data[ 'user' ] ){
            $user = $this->_controller->updateUserlogOutStatus($data[ 'user' ]);
            foreach( $this->clients as $client ){
                $client->send( json_encode( [
                    'type' => 'connection_close',
                    'user' => $user
                ] ) );
            }
    
            unset( $this->clients[ $data[ 'user' ] ] );
        }
    }

    private function _getUserChats($from, $data) {
        if( isset( $data[ 'user' ] ) && $data[ 'user' ] ){
            $client = $this->clients[ $data[ 'user' ] ];
            $user_chats = $this->_controller->get_recent_Chats( $data[ 'user' ] );
            
            // Update messages 
            $this->_controller->deliver_my_messages( $data[ 'user' ] );
            
            if( $user_chats ){

                foreach( $user_chats as $k => $v  ){
                    $user_chats[ $k ][ 'is_online' ] = false;
                    if( in_array( $v[ 'id' ], array_keys( $this->clients ) ) ){
                        $user_chats[ $k ][ 'is_online' ] = true;
                    }
                    

                    $user_chats[ $k ][ 'name' ] = $v[ 'firstname' ] .' '. $v[ 'lastname' ]; 
                    $user_chats[ $k ][ 'username' ] = $v[ 'firstname' ] .' '. $v[ 'lastname' ]; 
                    $user_chats[ $k ][ 'initials' ] = $v[ 'firstname' ] .' '. $v[ 'lastname' ]; 
                }
            }

            // print_r( $user_chats );
            $client->send(
                json_encode([
                    'type' => 'get_user_chats',
                    'data' => $user_chats
                ])
            );
        }else{
            $from->send(
                json_encode([
                    'type' => 'notify_app',
                    'notification' => [
                        'type' => 'error',
                        'message' => 'Error on getting your chats'
                    ],
                ])
            );
        }
    }

    private function _handleChatLoading($from, $data) {
        
        $senderId = isset( $data['sender'] ) && $data['sender'] ? $data['sender'] : '';
        $receiverId = isset( $data['receiver'] ) && $data['receiver'] ? $data['receiver'] : '';
        $client = $this->clients[$senderId];
        $error = false;

        if( !($senderId && $receiverId) ){
            $error = 1;
            $client->send( json_encode([
                'type' => 'notify_app',
                'notification' => [
                    'type' => 'danger',
                    'message' => 'Error on loading chat'
                ]
            ]) );
        }

        if( !$error ){
            $profile_type = isset( $data[ 'profile_type' ] ) ? $data[ 'profile_type' ] : 'private_chat';
            $chats = $this->_controller->load_chat_messages( $senderId, $receiverId );

            $responseData = [
                'type' => 'load_chat_messages',
                'chats' => $chats,
            ];
    
            $client->send(json_encode($responseData));
        }
    }

    private function handleAuthentication($conn, $data) {
		$userId = (isset( $data['userId'] ) && $data['userId'])?$data['userId']:'';
		$user = $this->_controller->get_user( $userId );
		addUserConnection($userId, 1);
		//$valid_auth = 0;
		
		//valid connection: keep track of the connection
        $nwp_token = isset( $user[ 'id' ] ) ? $user[ 'id' ] : '';

		if( $nwp_token ){
            $this->clients[$nwp_token] = $conn;
            $conn->userId = $userId;
            
            if( $this->debug ){
                echo "User {$userId} authenticated\n";
            }
            //update all clients online others
            $responseData = [
                'type' => 'authentication',
                'nwp_token' => $nwp_token,
                'user' => $user
            ];

            $conn->send(json_encode($responseData));
			$this->_broadcast_user_status( $user, true );
		}else{
			//invalid: close the connection
			if( $this->debug ){
				echo "User {$userId} failed to authenticate\n";
			}
			$conn->close();
		}
    }

    private function handlePrivateMessage($from, $data) {
        $senderId = $data['sender'];
        $receiverId = $data['receiver'];
        $message = $data['message'];

        // Verify connection permission
        if (!canUserConnect($senderId, $receiverId)) {
            echo "Unauthorized message attempt\n";
            return;
        }

        // Save message to database
        $saved = $this->_controller->saveMessage( $data );
        // savePrivateMessage($senderId, $receiverId, $message);

        if( empty( $saved ) ){
            $this->clients[$senderId]->send( json_encode( array(
                'type'=> 'notify_app',
                'notification' => array(
                    'type' => 'error',
                    'message' => 'Error on sending message',
                )
            ) ) );

            $this->_handleChatLoading( $from, $data );
            return;
        }

        $responseData = [
            'type' => 'private_message',
            'data' => $saved,
        ];
        // Send to receiver if online
        if ( isset($this->clients[$receiverId]) ) {
            $this->clients[$receiverId]->send(json_encode($responseData));
        }

        $this->clients[$senderId]->send(json_encode($responseData));
    }

    private function sendUserConnections($conn, $userId) {
        $connections = getUserConnections($userId);

        $responseData = [
            'type' => 'user_connections',
            'connections' => $connections
        ];
        $conn->send(json_encode($responseData));
    }

    private function _broadcast_user_status($user, $is_online) {
        $responseData = [
            'type' => 'notify_user_status',
            'user' => $user,
            'is_online' => $is_online,
        ];
        
        foreach ($this->clients as $client) {
            $client->send(json_encode($responseData));
		}
    }
    private function broadcastUserConnections($user) {
		//get existing users
        $connections = getUserConnections('');
		
		//inform all active clients
    }
	
    private function handleTypingIndicator($from, $data) {
        $senderId = $data['senderId'];
        $receiverId = $data['receiverId'];

        // Check if receiver is connected
        if (isset($this->clients[$receiverId])) {
            $typingData = [
                'type' => 'typing_indicator',
                'senderId' => $senderId,
                'isTyping' => $data['isTyping']
            ];

            // Send typing indicator to receiver
            $this->clients[$receiverId]->send(json_encode($typingData));
        }
    }

    private function handleReadReceipt($from, $data) {
        $senderId = $data['user'];
        $receiverId = $data['recipient'];

        $this->_controller->send_read_receipt( $senderId, $receiverId );
        
        $readReceiptData = [
            'type' => 'read_receipt',
            'sender' => $senderId,
            'receiver' => $receiverId,
        ];
        // Check if original reciever is connected
        if ( isset($this->clients[ $receiverId ]) && $this->clients[$receiverId] ) {
            $this->clients[$receiverId]->send(json_encode($readReceiptData));
        }

        if( isset( $this->clients[$senderId] ) ){
            // Send read receipt to original sender
            $this->clients[$senderId]->send(json_encode($readReceiptData));
        }

        //$this->saveReadReceipt($senderId, $originalSenderId, $messageId);
    }

    public function notifyApp($from, $data) {
        $from->send(
            json_encode([
                'type' => 'notify_app',
                'notification' => $data,
            ])
        );
    }

    public function onClose(\Ratchet\ConnectionInterface $conn) {
        // Remove client when disconnected
		$clientHasLeft = 0;
        foreach ($this->clients as $userId => $client) {
            $this->_controller->updateUserlogOutStatus($userId);
            if ($client === $conn) {
                unset($this->clients[$userId]);
                echo "User {$userId} disconnected\n";
				//drop connection
				//removeUserConnection($userId);
				addUserConnection($userId, 0);
				$clientHasLeft = 1;
                break;
            }
        }
		
		if( $clientHasLeft ){
			//update others
			$this->_broadcast_user_status(['id'=>$userId], false);
		}
    }

    public function onError(\Ratchet\ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}\n";
        $conn->close();
    }
}
$server = IoServer::factory(
    new HttpServer(
        new WsServer(
            new PrivateChatServer()
        )
    ),
    8080,
	'0.0.0.0',	//IP Address
	[
        'max_frame_size' => 2 * 1024 * 1024, // 2 MB
        'max_message_size' => 10 * 1024 * 1024 // 10 MB
    ]
);

echo "WebSocket server started on port 8080\n";
$server->run();