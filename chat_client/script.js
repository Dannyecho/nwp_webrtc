// js/script.js
let socket;
let currentUser = null;
let selectedReceiverId = null;

function connectWebSocket(userId) {
    socket = new WebSocket('ws://localhost:8080');

    socket.onopen = () => {
        // Authenticate user
        socket.send(JSON.stringify({
            type: 'authenticate',
            userId: userId
        }));

        // Request user connections
        /*socket.send(JSON.stringify({
            type: 'get_connections',
            userId: userId
        }));*/
    };

    socket.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
            case 'authentication':
                if( data.nwp_token ){
					document.getElementById('current-user').innerHTML = currentUser;
				}else{
					//Auth Failed
					document.getElementById('login-section').style.display = 'block';
					document.getElementById('chat-section').style.display = 'none';
					
					//close connection
					socket.close();
				}
                break;
            case 'user_connections':
                populateUserConnections(data.connections);
                break;
			case 'typing_indicator':
				handleTypingIndicator(data);
				break;
			case 'read_receipt':
				handleReadReceipt(data);
				break;
            case 'private_message':
                handlePrivateMessage(data);
                break;
        }
    };
	
	socket.onclose = (event) => {
        console.error("WebSocket connection closed:", event.reason);

        if (event.wasClean) {
            console.log("Connection closed cleanly.");
        } else {
            console.error("Connection lost. Attempting to reconnect...");
            attemptReconnect(userId);
        }
    };

    socket.onerror = (error) => {
        console.error("WebSocket error:", error);
        socket.close(); // Ensure the connection is closed after an error
    };
}

function attemptReconnect(userId) {
    if (reconnectAttempts < maxReconnectAttempts) {
        const timeout = Math.pow(2, reconnectAttempts) * 1000; // Exponential backoff
        console.log(`Reconnecting in ${timeout / 1000} seconds...`);

        setTimeout(() => {
            reconnectAttempts++;
            connectWebSocket(userId);
        }, timeout);
    } else {
        console.error("Max reconnect attempts reached. Unable to reconnect.");
        alert("Connection lost. Please refresh the page or try again later.");
    }
}

function createChatNotification() {
  const notificationDiv = document.createElement('div');
  notificationDiv.id = 'chat-notification-msg';
  notificationDiv.classList.add('chat-notification-msg');

  const alertDiv = document.createElement('div');
  alertDiv.classList.add('alert', 'alert-dismissable', 'note', 'note-warning');

  const closeButton = document.createElement('button');
  closeButton.type = 'button';
  closeButton.classList.add('close');
  closeButton.setAttribute('data-dismiss', 'alert');
  closeButton.setAttribute('aria-hidden', 'true');
  closeButton.textContent = '×'; // Or use an "x" icon

  const messageParagraph = document.createElement('p');
  messageParagraph.textContent = 'Connecting...';

  alertDiv.appendChild(closeButton);
  alertDiv.appendChild(messageParagraph);
  notificationDiv.appendChild(alertDiv);

  // Safely append the notification to the DOM
  document.getElementById('chat-layout-wrapper').appendChild(notificationDiv); 
}

function populateUserConnections(connections) {
  const connectionsList = document.getElementById('user-connections');
  connectionsList.innerHTML = '';

  // Loop through each username key in the connections object
  for (const username in connections) {
    const user = connections[username]; // Get the user object

    const li = document.createElement('li');
    li.textContent = user.username; // Use username property from object

    if (user.status != 1) {
		li.style.color = '#ff0000';
	}
	
    // Check if the user has an id property before setting data attribute
    if (user.id) {
      li.dataset.userId = user.id;
    }

    li.addEventListener('click', () => selectUser(user.id)); // Use user.id
    connectionsList.appendChild(li);
  }
}

function populateUserConnectionsList(connections) {
    const connectionsList = document.getElementById('user-connections');
    connectionsList.innerHTML = '';

    connections.forEach(connection => {
        const li = document.createElement('li');
        li.textContent = connection.username;
        li.dataset.userId = connection.id;
        li.addEventListener('click', () => selectUser(connection.id));
        connectionsList.appendChild(li);
    });
}

function selectUser(receiverId) {
    selectedReceiverId = receiverId;
    loadChatHistory(currentUser, receiverId);
    document.getElementById('chat-receiver').innerHTML = receiverId;
    document.getElementById('chat-container').style.display = 'block';
}

function loadChatHistory(senderId, receiverId) {
    fetch(`get_chat_history.php?sender=${senderId}&receiver=${receiverId}`)
        .then(response => response.json())
        .then(messages => {
            const chatMessages = document.getElementById('chat-messages');
            chatMessages.innerHTML = '';
            messages.forEach(msg => {
                const messageEl = document.createElement('div');
                messageEl.textContent = `${msg.sender_username}: ${msg.message}`;
                chatMessages.appendChild(messageEl);
            });
        });
}

// Typing Indicator Functions
let typingTimer;
const TYPING_TIMEOUT = 2000; // 2 seconds of inactivity

function sendTypingStatus(receiverId, status) {
    if (!socket) return;

    socket.send(JSON.stringify({
        type: 'typing_indicator',
        senderId: currentUser,
        receiverId: receiverId,
        isTyping: status
    }));
}

function handleTypingInput() {
    const messageInput = document.getElementById('message-input');
    
    // Clear previous typing timer
    clearTimeout(typingTimer);

    // Send typing started
    if (messageInput.value.length > 0) {
        sendTypingStatus(selectedReceiverId, true);
        
        // Set timeout to stop typing
        typingTimer = setTimeout(() => {
            sendTypingStatus(selectedReceiverId, false);
        }, TYPING_TIMEOUT);
    }
}

function handleTypingIndicator(data) {
    // Only show typing indicator for the currently selected user
    if (data.senderId === selectedReceiverId) {
        const typingIndicator = document.getElementById('typing-indicator');
        
        if (data.isTyping) {
            typingIndicator.textContent = `${data.senderId} is typing...`;
            typingIndicator.style.display = 'block';
        } else {
            typingIndicator.style.display = 'none';
        }
    }
}

//should be called when browser receives focus and unread message is visible
function sendReadReceipt(senderId, messageId) {
    if (!socket) return;

    socket.send(JSON.stringify({
        type: 'read_receipt',
        senderId: currentUser,
        originalSenderId: senderId,
        messageId: messageId
    }));
}

function handleReadReceipt(data) {
    // Update UI to show message has been read
    const messageElement = document.getElementById(`message-${data.messageId}`);
    if (messageElement) {
        messageElement.classList.add('read');
        
        // Optional: Add read status indicator
        const statusIndicator = document.createElement('span');
        statusIndicator.textContent = 'Read';
        statusIndicator.classList.add('read-status');
        messageElement.appendChild(statusIndicator);
    }
}

// Message sending function to include unique ID
function sendPrivateMessage() {
    const messageInput = document.getElementById('message-input');
    const message = messageInput.value.trim();
    const messageId = generateUniqueId(); // Implement unique ID generation

    if (message && selectedReceiverId) {
        socket.send(JSON.stringify({
            type: 'private_message',
            senderId: currentUser,
            receiverId: selectedReceiverId,
            message: message,
            messageId: messageId
        }));

        // Add message to chat with unique ID
        const chatMessages = document.getElementById('chat-messages');
        const messageEl = document.createElement('div');
        messageEl.id = `message-${messageId}`;
        messageEl.textContent = `You: ${message}`;
        messageEl.classList.add('message', 'sent');
        chatMessages.appendChild(messageEl);

        messageInput.value = '';
        
        // Clear typing status
        clearTimeout(typingTimer);
        sendTypingStatus(selectedReceiverId, false);
    }
}

// Unique ID generation
function generateUniqueId() {
    return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}


// Add event listener to message input for typing indicators
document.getElementById('message-input').addEventListener('input', handleTypingInput);

function handlePrivateMessage(data) {
    // Only display if the message is from the currently selected user
    if (data.senderId === selectedReceiverId) {
        const chatMessages = document.getElementById('chat-messages');
        const messageEl = document.createElement('div');
        messageEl.textContent = `Sender(${data.senderId}): ${data.message}`;
        chatMessages.appendChild(messageEl);
    }
}

// Login and initial setup
document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
	
    const username = document.getElementById('username').value;
    const password = '';
	
	currentUser = username;
	document.getElementById('login-section').style.display = 'none';
	document.getElementById('chat-section').style.display = 'block';
	connectWebSocket(currentUser);
	

    /* fetch('login.php', {
        method: 'POST',
        body: JSON.stringify({ username, password })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            currentUser = data.userId;
            document.getElementById('login-section').style.display = 'none';
            document.getElementById('chat-section').style.display = 'block';
            connectWebSocket(currentUser);
        }
    }); */
});