<?php
// includes/user_functions.php

// Add a connection between two users
function addUserConnection($userId, $connectedUserId) {
    global $pdo;
    try {
        $stmt = $pdo->prepare("INSERT IGNORE INTO user_connections (user_id, connected_user_id) VALUES (?, ?)");
        return $stmt->execute([$userId, $connectedUserId]);
    } catch (PDOException $e) {
        error_log("Connection error: " . $e->getMessage());
        return false;
    }
}

// Get all users a specific user can connect with
function getUserConnections($userId) {
    global $pdo;
    try {
        $stmt = $pdo->prepare("
            SELECT u.id, u.username 
            FROM users u
            JOIN user_connections uc ON u.id = uc.connected_user_id
            WHERE uc.user_id = ?
        ");
        $stmt->execute([$userId]);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    } catch (PDOException $e) {
        error_log("Fetch connections error: " . $e->getMessage());
        return [];
    }
}

// Save a private message
function savePrivateMessage($senderId, $receiverId, $message) {
    global $pdo;
    try {
        $stmt = $pdo->prepare("
            INSERT INTO private_messages (sender_id, receiver_id, message) 
            VALUES (?, ?, ?)
        ");
        return $stmt->execute([$senderId, $receiverId, $message]);
    } catch (PDOException $e) {
        error_log("Message save error: " . $e->getMessage());
        return false;
    }
}

// Retrieve private messages between two users
function getPrivateMessages($userId, $otherUserId) {
    global $pdo;
    try {
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
    } catch (PDOException $e) {
        error_log("Fetch messages error: " . $e->getMessage());
        return [];
    }
}

// Check if two users are allowed to connect
function canUserConnect($senderId, $receiverId) {
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
}