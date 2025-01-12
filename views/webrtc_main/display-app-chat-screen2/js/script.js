var nwLChat = {
	data:{},
	socket:null,
	websocket_endpoint:'ws://localhost:8080',
	currentReceiver:null,
	currentUser:{
		id: 'Admin',
		username: 'Admin'
	},
	selectedReceiverId:null,
	typing_timeout:2000,
	typingTimer:null,
	doNotReconnect:false,
	connectionToken:'',
	reconnectAttempts:0,
	maxReconnectAttempts:6,
	lastNotification: null,
	init:function(){
		$(".heading-compose").click(function () {
			$(".side-two").css({
				"left": "0"
			});
		});

		$(".newMessage-back").click(function () {
			$(".side-two").css({
				"left": "-100%"
			});
		});

		toastr.options = {
			"closeButton": true,
			"debug": false,
			"progressBar": true,
			"positionClass": "toast-bottom-right",
			"onclick": null,
			"showDuration": "300",
			"hideDuration": "1000",
			"timeOut": "5000",
			"extendedTimeOut": "1000",
			"showEasing": "swing",
			"hideEasing": "linear",
			"showMethod": "fadeIn",
			"hideMethod": "fadeOut"
			// "newestOnTop": true,
			// "preventDuplicates": false,
		}

		nwLChat.connectionToken = '';
		nwLChat.reconnectAttempts = 0;
		nwLChat.doNotReconnect = false;
		nwLChat.currentReceiver = null;
		
		nwLChat.createChatNotification({'message':'Initializing... Please wait.', 'manual_close':1});
		
		// Add event listener to message input for typing indicators
		document.getElementById('message-input').addEventListener('input', nwLChat.handleTypingInput);
		nwLChat.handleSendMessage();

		// Connect to WS Server
		nwLChat.connectWebSocket(nwLChat.currentUser);
	},
	connectWebSocket:function(user) {
		socket = new WebSocket(nwLChat.websocket_endpoint);

		socket.onopen = () => {
			nwLChat.createChatNotification({'message':'Connecting!'});
			
			// Authenticate user
			socket.send(JSON.stringify({
				type: 'authenticate',
				userId: user.id
			}));

			// Request user connections
			/*socket.send(JSON.stringify({
				type: 'get_connections',
				userId: user.id
			}));*/
		};

		socket.onmessage = (event) => {
			const data = JSON.parse(event.data);

			switch (data.type) {
				case 'authentication':
					if( data.nwp_token ){
						nwLChat.createChatNotification({'message':'Connected!'});
						nwLChat.connectionToken = data.nwp_token;
						$('.heading-avatar-icon').removeClass( 'offline' ).addClass('online');
						// document.getElementById('connection-status').innerText = 'Online';
						//document.getElementById('current-user').innerHTML = currentUser;
					}else{
						//close connection
						nwLChat.doNotReconnect = true;
						socket.close();
						nwLChat.createChatNotification({'message':'Failed to Authenticate'});
					}
					break;
				case 'user_connections':
					nwLChat.populateUserConnections(data.connections);
					break;
				case 'typing_indicator':
					nwLChat.handleTypingIndicator(data);
					break;
				case 'read_receipt':
					nwLChat.handleReadReceipt(data);
					break;
				case 'private_message':
					nwLChat.handlePrivateMessage(data);
					break;
			}
		};
		
		socket.onclose = (event) => {
			nwLChat.connectionToken = '';
			$('heading-avatar-icon').removeClass( 'online' ).addClass( 'offline' );
			// document.getElementById('connection-status').innerText = 'Offline';
			if( ! nwLChat.doNotReconnect ){
				if (event.wasClean) {
					//console.log("Connection closed cleanly.");
					nwLChat.createChatNotification({'message':'WebSocket connection closed cleanly', 'manual_close':1});
				} else {
					nwLChat.createChatNotification({'message':'Connection lost. Attempting to reconnect... ' + event.reason, 'manual_close':1});
					nwLChat.attemptReconnect(user.id);
				}
			}
		};

		socket.onerror = (error) => {
			//console.error("WebSocket error:", error);
			nwLChat.createChatNotification({'message':'Connection failed. Please try again later', 'manual_close':1});
			socket.close(); // Ensure the connection is closed after an error
		};
	},
	attemptReconnect:function(userId) {
		if (nwLChat.reconnectAttempts < nwLChat.maxReconnectAttempts) {
			const timeout = Math.pow(2, nwLChat.reconnectAttempts) * 1000; // Exponential backoff
			nwLChat.createChatNotification({'message':`Connection failed!!! Reconnecting in ${timeout / 1000} seconds...`, 'manual_close':1});

			setTimeout(() => {
				nwLChat.reconnectAttempts++;
				nwLChat.connectWebSocket(userId);
			}, timeout);
		} else {
			nwLChat.createChatNotification({'message':'Connection lost. Please refresh the page or try again later.', 'manual_close':1});
		}
	},
	createChatNotification:function(data) {
		let notType = 'info';
		if( !data.message.length ){
			return;
		}

		if( data.type ){
			notType = data.type;
		}

		nwLChat.closeChatNotification();
		nwLChat.lastNotification =  toastr[notType]( data.message );

		if( ! data.manual_close ){
			setTimeout(nwLChat.closeChatNotification, 8000);
		}
	},
	closeChatNotification:function() {
		const notificationDiv = document.getElementById('chat-notification-msg');
		if (nwLChat.lastNotification) { 
			toastr.clear( nwLChat.lastNotification ); 
		}
	},
	populateUserConnections: function(connections) {
		console.log( connections );
		const connectionsList = document.getElementById('user-connections');
		connectionsList.innerHTML = '';
		
		const badgeElements = document.querySelectorAll('[class*="badge-of-"]');
		badgeElements.forEach(badge => {
			if (badge.classList.contains('badge-success')) {
				badge.classList.remove('badge-success');
				badge.classList.add('badge-danger');
			}
		});


		// Loop through each username key in the connections object
		for (const username in connections) {
			const user = connections[username]; // Get the user object

			// Create the outer wrapper element
			const userWrapper = document.createElement('div');
			userWrapper.classList.add('avatar-icon-wrapper');

			// Create the status badge element (conditionally)
			
			const statusBadge = document.createElement('div');
			const badgeClass = `badge-of-${user.id.replace(" ", "").toLowerCase()}`;
			statusBadge.classList.add('badge', 'badge-bottom', badgeClass, 'badge-dot', 'badge-dot-lg');
			if (user.status === 1) {
				statusBadge.classList.add('badge-success');
				const badgeElements = document.querySelectorAll(`.${badgeClass}`);

				badgeElements.forEach(badge => {
					badge.classList.add('badge-success');
					badge.classList.remove('badge-danger');
				});
			}else{
				statusBadge.classList.add('badge-danger');
			}
			userWrapper.appendChild(statusBadge);
			
			const avatarIcon = nwLChat.generateAvatarIcon(user, {});
			

			// Check if the user has an id property before setting data attributes
			if (user.id) {
				userWrapper.title = user.id;
				userWrapper.dataset.userId = user.id;
			}
			userWrapper.appendChild(avatarIcon);

			// Attach click event listener (assuming nwLChat.selectUser exists)
			userWrapper.addEventListener('click', () => nwLChat.selectUser(user, {'color': avatarIcon.style.backgroundColor }));

			// Append the user element to the connections list
			connectionsList.appendChild(userWrapper);
			
			if( nwLChat.currentReceiver && nwLChat.currentReceiver.id == user.id ){
				nwLChat.currentReceiver = user;
				nwLChat.selectUser(nwLChat.currentReceiver, {'update_user_card_only':1})
			}
		}
	},
	generateAvatarIcon: function(user, options){
		// Create the avatar icon element
		const username = user.username;
		const avatarIcon = document.createElement('div');
		avatarIcon.classList.add('avatar-icon', 'rounded');
		
		if( options['class'] !== undefined && options['class'] !== '' ){
			avatarIcon.classList.add(options['class']);
		}

		// Check if user has an avatar image
		if (user.img && user.img !== '') {
			const avatarImage = document.createElement('img');
			avatarImage.src = user.img; // Use the user's avatar image
			avatarImage.alt = username;
			if( options['width'] !== '' ){
				avatarImage.width = options['width'];
			}
			avatarIcon.appendChild(avatarImage);
		} else {
			// Generate initials from the username
			const initials = nwLChat.generateInitials(username);

			// Create a span element for initials
			const initialsSpan = document.createElement('span');
			initialsSpan.textContent = initials;

			// Generate a random background color
			const bgColor = options.color ? options.color : nwLChat.getRandomBgColor();
			avatarIcon.style.backgroundColor = bgColor;
			avatarIcon.style.color = 'white'; // Ensure text is readable

			avatarIcon.appendChild(initialsSpan);
		}
		
		return avatarIcon;
	},
	getRandomBgColor: function(){
		const colors = [
		  '#C0392B', // Dark Red
		  '#1E8449', // Dark Green
		  '#1F618D', // Dark Blue
		  '#9B59B6', // Deep Purple
		  '#AF601A', // Burnt Orange
		  '#27AE60', // Emerald Green
		  '#6C3483', // Grape Purple
		  '#D35400', // Rust Orange
		  '#2C3E50', // Midnight Blue
		  '#884EA0', // Deep Violet
		  '#16A085', // Teal Green
		  '#8E44AD'  // Rich Lavender
		];

		return colors[Math.floor(Math.random() * colors.length)];
	},
	generateInitials: function(name){
		const nameParts = name.split(' ');
		const firstLetter = nameParts[0]?.[0]?.toUpperCase() || '';
		const lastLetter = nameParts[1]?.[0]?.toUpperCase() || '';
		return firstLetter + lastLetter;
	},
	createUserCard: function(user, options){
		//console.log('u', user);
		// Create the main wrapper
		const userCard = document.createElement('div');
		userCard.classList.add('d-flex', 'align-items-center'); 

		// Create the avatar section
		const avatarWrapper = document.createElement('div');
		avatarWrapper.classList.add('avatar-icon-wrapper', 'mr-2');

		const statusBadge = document.createElement('div');
		statusBadge.classList.add('badge', 'badge-bottom', 'btn-shine', ( user.status === 1 ? 'badge-success' : 'badge-danger' ), 'badge-dot', 'badge-dot-lg', 'badge-of-' + user.id.replace(" ", "").toLowerCase() );
		avatarWrapper.appendChild(statusBadge);

		const avatarIcon = nwLChat.generateAvatarIcon(user, {'class':'avatar-icon-xl', 'width':82, 'color':(options.color ? options.color : '') });
		avatarWrapper.appendChild(avatarIcon);

		userCard.appendChild(avatarWrapper);

		// Create the user information section
		const userInfo = document.createElement('h4');
		userInfo.classList.add('mb-0', 'text-nowrap');
		userInfo.textContent = user.username; // Assuming user.name is available

		const lastSeen = document.createElement('div');
		lastSeen.classList.add('opacity-7', 'chat-small-title');
		lastSeen.textContent = "Last Seen Online: ";
		const lastSeenTime = document.createElement('span');
		lastSeenTime.classList.add('opacity-8');
		lastSeenTime.textContent = nwLChat.getRelativeTime(user.date);
		lastSeen.appendChild(lastSeenTime);

		userInfo.appendChild(lastSeen);
		userCard.appendChild(userInfo);

		return userCard;
	},
	getRelativeTime: function(timestamp) {
		const now = Date.now(); // Current time in milliseconds
		const timeInMs = timestamp * 1000; // Convert the input to milliseconds
		const diffInMs = now - timeInMs; // Difference in milliseconds

		if (diffInMs < 0) {
			return "just now"; // Handle future timestamps gracefully
		}

		const seconds = Math.floor(diffInMs / 1000);
		const minutes = Math.floor(seconds / 60);
		const hours = Math.floor(minutes / 60);
		const days = Math.floor(hours / 24);
		const weeks = Math.floor(days / 7);
		const months = Math.floor(days / 30);
		const years = Math.floor(days / 365);

		if (seconds < 60) return `${seconds} second(s) ago`;
		if (minutes < 60) return `${minutes} minute(s) ago`;
		if (hours < 24) return `${hours} hour(s) ago`;
		if (days < 7) return `${days} day(s) ago`;
		if (weeks < 4) return `${weeks} week(s) ago`;
		if (months < 12) return `${months} month(s) ago`;
		return `${years} year(s) ago`;
	},
	formatTimestamp: function(timestamp) {
		const now = new Date(); // Current date and time
		const date = new Date(timestamp * 1000); // Convert the timestamp to milliseconds and create a Date object

		// Format time
		const hours = date.getHours();
		const minutes = date.getMinutes();
		const formattedTime = `${hours % 12 || 12}:${minutes.toString().padStart(2, '0')} ${hours >= 12 ? 'PM' : 'AM'}`;

		// Calculate date difference
		const isToday = now.toDateString() === date.toDateString();
		const isYesterday = new Date(now - 86400000).toDateString() === date.toDateString();

		let dateString;
		if (isToday) {
			dateString = "Today";
		} else if (isYesterday) {
			dateString = "Yesterday";
		} else {
			// Use a readable date format (e.g., "Dec 21, 2024")
			const options = { month: "short", day: "numeric", year: "numeric" };
			dateString = date.toLocaleDateString(undefined, options);
		}

		return `${formattedTime} | ${dateString}`;
	},
	createMobileAppMenuBtn: function(){
	  const menuBtnContainer = document.createElement('div');
	  menuBtnContainer.classList.add('mobile-app-menu-btn');

	  const button = document.createElement('button');
	  button.type = "button";
	  button.classList.add('hamburger', 'hamburger--elastic');

	  const hamburgerBox = document.createElement('span');
	  hamburgerBox.classList.add('hamburger-box');

	  const hamburgerInner = document.createElement('span');
	  hamburgerInner.classList.add('hamburger-inner');

	  hamburgerBox.appendChild(hamburgerInner);
	  button.appendChild(hamburgerBox);
	  menuBtnContainer.appendChild(button);

	  return menuBtnContainer;
	},
	populateUserConnectionsList:function(connections) {
		const connectionsList = document.getElementById('user-connections');
		connectionsList.innerHTML = '';

		connections.forEach(connection => {
			const li = document.createElement('li');
			li.textContent = connection.username;
			li.dataset.userId = connection.id;
			li.addEventListener('click', () => nwLChat.selectUser(connection, {}));
			connectionsList.appendChild(li);
		});
	},
	selectUser:function(receiverData, options) {
		
		//set current receiver
		
		const userCard = nwLChat.createUserCard(receiverData, options);
		const activeUserCardContainer = document.getElementById('active-user-card');
		activeUserCardContainer.innerHTML = '';
		activeUserCardContainer.appendChild(nwLChat.createMobileAppMenuBtn());
		activeUserCardContainer.appendChild(userCard);
		
		if( options.update_user_card_only === 1 ){
			return;
		}
		
		nwLChat.currentReceiver = receiverData;
			
		nwLChat.setChat(receiverData, options);
	},
	setChat: function(receiverData, options) {
		
		//populate messages
		const chatData = {
		  messages: [
			{
			  sender: 'user', 
			  text: "But I must explain to you how all this mistaken idea of denouncing pleasure and praising pain was born and I will give you a complete account of the system.",
			  timestamp: "11:01 AM | Yesterday" 
			},
			{
			  sender: 'bot', 
			  text: "Expound the actual teachings of the great explorer of the truth, the master-builder of human happiness.",
			  timestamp: "11:01 AM | Yesterday" 
			},
			{
			  sender: 'user',
			  text: "This is another message from the user.",
			  timestamp: "11:05 AM | Yesterday"
			},
			{
			  sender: 'bot',
			  text: "And this is a response from the bot.",
			  timestamp: "11:07 AM | Yesterday"
			},
			{
			  sender: 'user',
			  text: "A short message from the user.",
			  timestamp: "11:08 AM | Yesterday"
			},
			{
			  sender: 'user',
			  text: "A2 short message from the user.",
			  timestamp: "11:08 AM | Yesterday"
			},
			{
			  sender: 'bot',
			  text: "A longer response from the bot: Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
			  timestamp: "11:10 AM | Yesterday"
			}
		  ]
		};
		

		const chatContainer = nwLChat.generateChatMessages({}, receiverData, options);
		//const chatContainer = nwLChat.generateChatMessages(chatData, receiverData, options);
		const chatBox = document.getElementById('active-chat-box');
		chatBox.innerHTML = '';
		chatBox.appendChild(chatContainer);
		
	},
	addNewMessage: function(messageData, receiverData, options) {
		const chatContainer = nwLChat.generateChatMessages(messageData, receiverData, options);
		const chatBox = document.getElementById('active-chat-box');
		chatBox.appendChild(chatContainer);
	},
	generateChatMessages: function(chatData, receiverData, options) {
		const chatContainer = document.createElement('div');
		
		//const receiverIcon = nwLChat.generateAvatarIcon(receiverData, {'color':(options.color ? options.color : '') });
		//console.log('a' , receiverIcon);
		if (chatData && chatData.messages && chatData.messages.length > 0) {
			chatData.messages.forEach((message) => {
				const chatBoxMainWrapper = document.createElement('div');
				if (message.sender !== nwLChat.currentUser.id ) {
				  chatBoxMainWrapper.classList.add('flex-row-reverse');
				}

				const chatBoxWrapper = document.createElement('div');
				if (message.sender === nwLChat.currentUser.id ) {
				  chatBoxWrapper.classList.add('chat-box-wrapper');
				} else {
				  chatBoxWrapper.classList.add('chat-box-wrapper', 'chat-box-wrapper-right');
				}

				/* const avatarContainer = document.createElement('div');

				const avatarWrapper = document.createElement('div');
				avatarWrapper.classList.add('avatar-icon-wrapper', message.sender === 'user' ? 'mr-1' : 'ml-1');

				const statusBadge = document.createElement('div');
				statusBadge.classList.add('badge', 'badge-bottom', 'btn-shine', 'badge-success', 'badge-dot', 'badge-dot-lg');
				avatarWrapper.appendChild(statusBadge);
				
				if( message.sender === 'user' ){
					const avatarIcon = document.createElement('div');
					avatarIcon.classList.add('avatar-icon', 'avatar-icon-lg', 'rounded');
					const avatarImage = document.createElement('img');
					avatarImage.src = `assets/img/avatar${message.sender === 'user' ? '1' : '2'}.jpg`; 
					avatarImage.alt = '';
					avatarIcon.appendChild(avatarImage);
					avatarWrapper.appendChild(avatarIcon);
				}else{
					console.log('av', message , receiverIcon);
					avatarWrapper.appendChild(receiverIcon);
				}
				
				avatarContainer.appendChild(avatarWrapper); */

				const messageContainer = document.createElement('div');

				const chatBox = document.createElement('div');
				chatBox.classList.add('chat-box');
				const chatText = document.createElement('div');
				chatText.classList.add('chat-text');
				chatText.textContent = message.text;
				chatBox.appendChild(chatText);
				messageContainer.appendChild(chatBox);

				const timestamp = document.createElement('small');
				timestamp.classList.add('opacity-6');
				const timeIcon = document.createElement('i');
				timeIcon.classList.add('fa', 'fa-calendar-alt', 'mr-1');
				timestamp.appendChild(timeIcon);
				timestamp.appendChild(document.createTextNode(message.timestamp)); 
				messageContainer.appendChild(timestamp);

				//chatBoxWrapper.appendChild(avatarContainer);
				chatBoxWrapper.appendChild(messageContainer);
				chatBoxMainWrapper.appendChild(chatBoxWrapper);

				chatContainer.appendChild(chatBoxMainWrapper);
			});
		}

		return chatContainer;
	},
	loadChatHistory:function(senderId, receiverId) {
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
	},
	sendTypingStatus:function(receiverId, status) {
		if (!socket) return;

		socket.send(JSON.stringify({
			type: 'typing_indicator',
			senderId: nwLChat.currentUser.id,
			receiverId: receiverId,
			isTyping: status
		}));
	},
	handleTypingInput:function() {
		const messageInput = document.getElementById('message-input');
		
		// Clear previous typing timer
		clearTimeout(nwLChat.typingTimer);

		// Send typing started
		if (nwLChat.currentReceiver && messageInput.value.length > 0) {
			nwLChat.sendTypingStatus(nwLChat.currentReceiver.id, true);
			
			// Set timeout to stop typing
			typingTimer = setTimeout(() => {
				nwLChat.sendTypingStatus(nwLChat.currentReceiver.id, false);
			}, nwLChat.typing_timeout);
		}
	},
	handleTypingIndicator:function(data) {
		// Only show typing indicator for the currently selected user
		if (nwLChat.currentReceiver && data.senderId === nwLChat.currentReceiver.id) {
			const typingIndicator = document.getElementById('typing-indicator');
			
			if (data.isTyping) {
				typingIndicator.textContent = `${data.senderId} is typing...`;
				typingIndicator.style.display = 'block';
			} else {
				typingIndicator.style.display = 'none';
			}
		}
	},
	//should be called when browser receives focus and unread message is visible
	sendReadReceipt:function(senderId, messageId) {
		if (!socket) return;

		socket.send(JSON.stringify({
			type: 'read_receipt',
			senderId: nwLChat.currentUser.id,
			originalSenderId: senderId,
			messageId: messageId
		}));
	},
	handleReadReceipt:function(data) {
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
	},
	handleSendMessage:function() {
		document.getElementById('message-input').addEventListener('keydown', function (event) {
			// Check if Enter is pressed
			if (event.key === 'Enter') {
				if (event.ctrlKey) {
					// Ctrl+Enter: Insert a new line
					const cursorPosition = this.selectionStart;
					const textBeforeCursor = this.value.substring(0, cursorPosition);
					const textAfterCursor = this.value.substring(cursorPosition);
					this.value = textBeforeCursor + "\n" + textAfterCursor;
					this.selectionStart = this.selectionEnd = cursorPosition + 1; // Move cursor to the new line
					event.preventDefault(); // Prevent default behavior
				} else {
					// Enter: Call the desired function and prevent default newline
					event.preventDefault(); // Prevent the default behavior
					nwLChat.sendPrivateMessage(); // Call the function for sending a message
				}
			}
		});
	},
	sendPrivateMessage:function() {
		const messageInput = document.getElementById('message-input');
		const message = messageInput.value.trim();
		const messageId = nwLChat.generateUniqueId(); // Implement unique ID generation

		if (message && nwLChat.currentReceiver) {
			socket.send(JSON.stringify({
				type: 'private_message',
				senderId: nwLChat.currentUser.id,
				receiverId: nwLChat.currentReceiver.id,
				message: message,
				id: messageId
			}));

			// Add message to chat with unique ID
			const chatMessage = {
			  id: messageId,
			  sender: nwLChat.currentUser.id,
			  text: message,
			  timestamp: nwLChat.formatTimestamp( nwLChat.getSystemTimestamp() )
			};
			nwLChat.addNewMessage({'messages': [chatMessage]}, nwLChat.currentUser, {});

			messageInput.value = '';
			
			// Clear typing status
			clearTimeout(nwLChat.typingTimer);
			nwLChat.sendTypingStatus(nwLChat.currentReceiver.id, false);
		}
	},
	getSystemTimestamp: function() {
		// Get the current date and time
		const now = new Date();

		// Get the timestamp in milliseconds
		const timestamp = now.getTime(); 

		return timestamp / 1000; 
	},
	getTimestampInTimezone: function(timezone) {
		// Create a Date object 
		const now = new Date();

		// Create an Intl.DateTimeFormat object with the specified timezone
		const options = { timeZone: timezone }; 
		const formatter = new Intl.DateTimeFormat('en-US', options); 

		// Format the date in ISO 8601 format with timezone information
		const isoString = now.toLocaleString('en-US', options); 

		// Parse the ISO string to get a Date object with timezone information
		const timezoneAwareDate = new Date(isoString); 

		// Get the timestamp in seconds
		const timestamp = timezoneAwareDate.getTime() / 1000; 

		return timestamp;
	},
	// Unique ID generation
	generateUniqueId:function() {
		return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	},
	handlePrivateMessage:function(data) {
		// Only display if the message is from the currently selected user
		if (nwLChat.currentReceiver && data.senderId === nwLChat.currentReceiver.id) {
			const chatMessage = {
			  sender: nwLChat.currentReceiver.id,
			  text: data.message,
			  timestamp: nwLChat.formatTimestamp(parseInt(data.date))
			};
			nwLChat.addNewMessage({'messages': [chatMessage]}, nwLChat.currentReceiver, {});
		}
	}
};
setTimeout(nwLChat.init, 500);