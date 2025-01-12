class ChatApp {
    constructor() {
        this.username = null;
        this.socket = null;
        this.initElements();
        this.setupEventListeners();
    }

    initElements() {
        this.loginContainer = document.getElementById('login-container');
        this.chatContainer = document.getElementById('chat-container');
        this.usernameInput = document.getElementById('username');
        this.loginBtn = document.getElementById('login-btn');
        this.messageForm = document.getElementById('message-form');
        this.messageInput = document.getElementById('message-input');
        this.messagesContainer = document.getElementById('messages');
    }

    setupEventListeners() {
        this.loginBtn.addEventListener('click', () => this.login());
        this.messageForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.sendMessage();
        });
    }

    login() {
        this.username = this.usernameInput.value.trim();
        if (this.username) {
            this.loginContainer.style.display = 'none';
            this.chatContainer.style.display = 'flex';
            this.connectWebSocket();
        }
    }

    connectWebSocket() {
        this.socket = new WebSocket('ws://localhost:8080');

        this.socket.onopen = () => {
            this.sendSocketMessage('login', { username: this.username });
        };

        this.socket.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.displayMessage(message);
        };

        this.socket.onclose = () => {
            this.displaySystemMessage('Disconnected from server');
        };
    }

    sendMessage() {
        const messageText = this.messageInput.value.trim();
        if (messageText) {
            this.sendSocketMessage('chat', { 
                username: this.username, 
                message: messageText 
            });
            this.messageInput.value = '';
        }
    }

    sendSocketMessage(type, data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type,
                ...data
            }));
        }
    }

    displayMessage(message) {
        const messageElement = document.createElement('div');
        
        switch(message.type) {
            case 'chat':
                messageElement.innerHTML = `
                    <strong>${message.username}:</strong> 
                    ${this.escapeHTML(message.message)}
                `;
                break;
            case 'system':
                messageElement.classList.add('system-message');
                messageElement.innerHTML = message.message;
                break;
        }

        this.messagesContainer.appendChild(messageElement);
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }

    displaySystemMessage(message) {
        this.displayMessage({
            type: 'system',
            message
        });
    }

    escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag));
    }
}

// Initialize chat app
document.addEventListener('DOMContentLoaded', () => {
    new ChatApp();
});