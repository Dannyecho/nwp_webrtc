<?php
use Ratchet\MessageComponentInterface;
use Ratchet\ConnectionInterface;

class ChatServer implements MessageComponentInterface {
    protected $clients;
    protected $users;

    public function __construct() {
        $this->clients = new \SplObjectStorage();
        $this->users = [];
    }

    public function onOpen(ConnectionInterface $conn) {
        $this->clients->attach($conn);
        echo "New connection! ({$conn->resourceId})\n";
    }

    public function onMessage(ConnectionInterface $from, $msg) {
        $data = json_decode($msg, true);

        switch ($data['type']) {
            case 'login':
                $this->handleLogin($from, $data);
                break;
            case 'chat':
                $this->broadcastMessage($from, $data);
                break;
        }
    }

    protected function handleLogin(ConnectionInterface $conn, $data) {
        $username = $data['username'];
        $this->users[$conn->resourceId] = $username;

        // Broadcast user join
        $this->broadcastSystemMessage("{$username} has joined the chat");
    }

    protected function broadcastMessage(ConnectionInterface $sender, $data) {
        $messageData = [
            'type' => 'chat',
            'username' => $data['username'],
            'message' => $data['message']
        ];

        foreach ($this->clients as $client) {
            if ($client !== $sender) {
                $client->send(json_encode($messageData));
            }
        }
    }

    protected function broadcastSystemMessage($message) {
        $systemMessage = [
            'type' => 'system',
            'message' => $message
        ];

        foreach ($this->clients as $client) {
            $client->send(json_encode($systemMessage));
        }
    }

    public function onClose(ConnectionInterface $conn) {
        $username = $this->users[$conn->resourceId] ?? 'Anonymous';
        $this->clients->detach($conn);
        unset($this->users[$conn->resourceId]);

        // Broadcast user leave
        $this->broadcastSystemMessage("{$username} has left the chat");
    }

    public function onError(ConnectionInterface $conn, \Exception $e) {
        echo "An error has occurred: {$e->getMessage()}\n";
        $conn->close();
    }
}