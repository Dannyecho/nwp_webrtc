<?php
function getData($tableName) {
	$data = [];
	$data_file = dirname(__FILE__). DIRECTORY_SEPARATOR . $tableName . '.json';
	if( file_exists( $data_file ) ){
		$data = json_decode( file_get_contents( $data_file ), 1 );
	}
	return [$data, $data_file];
}

function saveData($newData, $tableName) {
	$list = getData($tableName);
	
	$data = $list[0];
	$data_file = $list[1];
	
	foreach( $newData as $k => $v ){
		$v["date"] = date("U");
		$data[$k] = $v;
	}
	return file_put_contents( $data_file, json_encode( $data ) );
}

function deleteData($id, $tableName) {
	$list = getData($tableName);
	
	$data = $list[0];
	$data_file = $list[1];
	
	if( isset( $data[$id] ) ){
		unset( $data[$id] );
	}
	return file_put_contents( $data_file, json_encode( $data ) );
}

function addUserConnection($userId, $connectionStatus) {
    return saveData( [ $userId => ["id" => $userId, "username" => $userId, "status" => $connectionStatus] ], 'connections' );
}

function removeUserConnection($userId) {
    return deleteData( $userId, 'connections' );
}

function getUserConnections($userId) {
    /*
	global $pdo;
    $stmt = $pdo->prepare("
        SELECT u.id, u.username 
        FROM users u
        JOIN user_connections uc ON u.id = uc.connected_user_id
        WHERE uc.user_id = ?
    ");
    $stmt->execute([$userId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
	*/
	return getData( 'connections' )[0];
	
    /* return [
		["id" => '11', "username" => '110'],
		["id" => '22', "username" => '220'],
		["id" => '33', "username" => '330'],
	]; */
}

function savePrivateMessage($senderId, $receiverId, $message) {
    return saveData( [ date("U") => ["message" => $message] ], 'message_' . $senderId. '_' . $receiverId );
	/*
	global $pdo;
    $stmt = $pdo->prepare("INSERT INTO private_messages (sender_id, receiver_id, message) VALUES (?, ?, ?)");
    return $stmt->execute([$senderId, $receiverId, $message]);
	*/
}

function getPrivateMessages($userId, $otherUserId) {
    global $pdo;
    $stmt = $pdo->prepare("
        SELECT pm.*, 
            (SELECT username FROM users WHERE id = pm.sender_id) as sender_username
        FROM private_messages pm
        WHERE (pm.sender_id = ? AND pm.receiver_id = ?) 
        OR (pm.sender_id = ? AND pm.receiver_id = ?)
        ORDER BY pm.timestamp
    ");
    $stmt->execute([$userId, $otherUserId, $otherUserId, $userId]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

function canUserConnect($senderId, $receiverId) {
    return true;
	/*
	global $pdo;
    try {
        $stmt = $pdo->prepare("
            SELECT COUNT(*) 
            FROM user_connections 
            WHERE user_id = ? AND connected_user_id = ?
        ");
        $stmt->execute([$senderId, $receiverId]);
        return $stmt->fetchColumn() > 0;
    } catch (PDOException $e) {
        error_log("Connection check error: " . $e->getMessage());
        return false;
    }
	*/
}
?>