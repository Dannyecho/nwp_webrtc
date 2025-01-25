var nwLChat = {
	data: {},
	socket: null,
	websocket_endpoint: 'ws://localhost:8080',
	currentReceiver: null,
	currentUser: currentUser,
	selectedReceiverId: null,
	typing_timeout: 2000,
	typingTimer: null,
	doNotReconnect: false,
	connectionToken: '',
	reconnectAttempts: 0,
	maxReconnectAttempts: 6,
	maxFileSizeInMb: 2,
	fileChunkSize: 64 * 1024, // 64kb,
	plugir_uri: window.location.origin+'/feyi2/engine/plugins/nwp_webrtc/uploads/',
	init: function () {
		CustomNwlChatJS.init();
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
		$.fn.cProcessForm.activateAjaxForm();

		// console.log($('#chat-search-field.select2'));
		$('#chat-search-field').on('change', function (e) {
			let user = $(this).select2('data');
			user.username = user.name;
			let userAvatar = nwLChat.generateAvatarIcon(user, {});
			console.log(user);
			nwLChat.selectUser(user, userAvatar.css('background-color'));
		});

		nwLChat.connectionToken = '';
		nwLChat.reconnectAttempts = 0;
		nwLChat.doNotReconnect = false;
		nwLChat.currentReceiver = null;

		nwLChat.createChatNotification({ 'message': 'Initializing... Please wait.', 'manual_close': 1 });

		// Add event listener to message input for typing indicators
		document.getElementById('message-input').addEventListener('input', nwLChat.handleTypingInput);
		nwLChat.handleSendMessage();
		nwLChat.activateSendFile();

		// Connect to WS Server
		nwLChat.connectWebSocket(nwLChat.currentUser);
	},
	connectWebSocket: function (user) {
		socket = new WebSocket(nwLChat.websocket_endpoint);

		socket.onopen = () => {
			nwLChat.createChatNotification({ 'message': 'Connecting!' });

			// Authenticate user
			socket.send(JSON.stringify({
				type: 'authenticate',
				userId: user.id
			}));

			// Request user chats
			nwLChat.getUserChats();
		};

		socket.onmessage = (event) => {
			const data = JSON.parse(event.data);

			switch (data.type) {
				case 'authentication':
					if (data.nwp_token) {

						nwLChat.createChatNotification({ 'message': 'Connected!' });
						nwLChat.connectionToken = data.nwp_token;
						document.getElementById('connection-status').innerText = 'Online';
						//document.getElementById('current-user').innerHTML = currentUser;
					} else {
						//close connection
						nwLChat.doNotReconnect = true;
						socket.close();
						nwLChat.createChatNotification({ 'message': 'Failed to Authenticate' });
					}
					if( data.user ){
						nwLChat.currentUser = data.user;
						console.log( data.user );
					}

					break;
				case 'user_connections':
					// nwLChat.populateUserConnections(data.connections);
					break;
				case 'get_user_chats':
					nwLChat.populateUserChats(data.data);
					break;
				case 'typing_indicator':
					nwLChat.handleTypingIndicator(data);
					break;
				case 'read_receipt':
					nwLChat.handleReadReceipt(data);
					break;
				case 'private_message':
					nwLChat.handlePrivateMessage(data.data);
					break;
				case 'notify_app':
					nwLChat.createChatNotification(data.notification);
					break;
				case 'load_chat_messages':
					nwLChat.setChat(data.chats);
					break;
				case 'connection_close':
					nwLChat.handleConnectionClose(data.chats);
					break;
				case  'notify_user_status':
					let userBadge = $('.badge-of-'+ data.user.id);
					userBadge.removeClass( 'badge-danger' ).removeClass('badge-success');
					
					if(data.is_online){
						userBadge.addClass( 'badge-success' );
					}
				break;
			}
		};

		socket.onclose = (event) => {
			nwLChat.connectionToken = '';
			document.getElementById('connection-status').innerText = 'Offline';

			socket.send( {
				type: 'connection_close',
				user: nwLChat.currentUser.id
			} );

			if (!nwLChat.doNotReconnect) {
				if (event.wasClean) {
					//console.log("Connection closed cleanly.");
					nwLChat.createChatNotification({ 'message': 'WebSocket connection closed cleanly', 'manual_close': 1 });
				} else {
					nwLChat.createChatNotification({ 'message': 'Connection lost. Attempting to reconnect... ' + event.reason, 'manual_close': 1 });
					nwLChat.attemptReconnect(user.id);
				}
			}
		};

		socket.onerror = (error) => {
			//console.error("WebSocket error:", error);
			nwLChat.createChatNotification({ 'message': 'Connection failed. Please try again later', 'manual_close': 1 });
			socket.close(); // Ensure the connection is closed after an error
		};
	},
	handleConnectionClose: function( user ){
		nwLChat.changeUserStatus(user);
	},

	activateSendFile: function(){
		// Activate attachment input
		$('form.dropup-items input.nwl-attachment-input').on( 'change', function(e){
			alert('About to send file' );
			const files = e.target.files;
			console.log( 'files', files );
			if( files.length ){
				for(let i = 0; i< files.length; i++){
					nwLChat.handleSendFile( files[i], i, files.length-1 );
				}
			}
		} );
	},
	handleSendFile: function( file, fileIndex, fileLength ){
		console.log('File', file);
		let error = '';
		if (!file) {
			error = 'Please select a file first.';
		}

		const fileSize = file.size;
		if( fileSize > ( (1024 **2 ) * nwLChat.maxFileSizeInMb ) ){
			error = 'File(s) is too large.';
		}

		if( nwLChat.currentReceiver == null ){
			error = 'Please a select a user to chat with';		
		}

		if( error.length ){
			nwLChat.createChatNotification({
				type: 'warning',
				message: error
			});
			return;
		}

		const chunkSize = nwLChat.fileChunkSize;
		const totalChunks = Math.ceil(file.size / chunkSize);

		let offset = 0;
		let chunkIndex = 0;
		let fileId = nwLChat.generateUniqueId();
		
		function sendNextChunk() {
			if (offset < fileSize) {
				const reader = new FileReader();

				reader.onloadend = (event) => {
					let result = event.target.result;
					let chunk = new Uint8Array( result.slice(offset, offset + chunkSize) ) ; 

					base64String = btoa(String.fromCharCode.apply(null, chunk)); 

					// console.log( 'chunk type:', (chunk instanceof ArrayBuffer) )

					// console.log( 'chunk', chunk );
					socket.send(JSON.stringify({
						type: 'send_file',
						file_id: fileId,
						chunk: base64String,
						chunk_offset: offset,
						file_mime: file.type,
						file_ext: file.name.split('.').pop(),
						chunk_index: chunkIndex,
						total_chunks: totalChunks - 1,
						file_size: fileSize,
						file_index: fileIndex,
						total_files: fileLength,
						sender: nwLChat.currentUser.id,
						receiver: nwLChat.currentReceiver.id,
						type_of_receiver: 'user'
					}));
					// Send the chunk as binary data
					console.log(`Chunk sent: ${offset} - ${offset + chunkSize}`);
					offset += chunkSize;
					chunkIndex++;
					
					// Continue sending the next chunk
					sendNextChunk();
				};
	
				reader.onerror = (error) => {
					nwLChat.createChatNotification({
						type: 'error',
						message:'Error on reading file'
					});
				};
	
				reader.readAsArrayBuffer(file); // Read the chunk as ArrayBuffer
			} else {
				console.log('File transfer complete.');
				// socket.send(JSON.stringify({ type: 'end', fileName: file.name })); // Notify the server of completion
			}
		}

		sendNextChunk();
		// socket.send(JSON.stringify({ type: 'start', fileName: file.name, fileSize: file.size })); // Notify the server of file start
	},
	changeUserStatus: function(user){
		$('.badge-of-'+user).removeClass( 'badge-success' ).addClass( 'badge-danger' );
		$('#last-seen-'+user).find('span').html( 'Last Seen Online: '+ user.last_seen );
	},
	attemptReconnect: function (userId) {
		if (nwLChat.reconnectAttempts < nwLChat.maxReconnectAttempts) {
			const timeout = Math.pow(2, nwLChat.reconnectAttempts) * 1000; // Exponential backoff
			nwLChat.createChatNotification({ 'message': `Connection failed!!! Reconnecting in ${timeout / 1000} seconds...`, 'manual_close': 1 });

			setTimeout(() => {
				nwLChat.reconnectAttempts++;
				nwLChat.connectWebSocket(userId);
			}, timeout);
		} else {
			nwLChat.createChatNotification({ 'message': 'Connection lost. Please refresh the page or try again later.', 'manual_close': 1 });
		}
	},
	createChatNotification: function (data) {
		let notType = 'info';
		if (!data.message.length) {
			return;
		}

		if (data.type) {
			notType = data.type;
		}

		nwLChat.closeChatNotification();
		nwLChat.lastNotification = toastr[notType](data.message);

		if (!data.manual_close) {
			setTimeout(nwLChat.closeChatNotification, 8000);
		}
	},
	closeChatNotification: function () {
		const notificationDiv = document.getElementById('chat-notification-msg');
		if (nwLChat.lastNotification) {
			toastr.clear(nwLChat.lastNotification);
		}
	},
	populateUserConnections: function (connections) {
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
			} else {
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
			userWrapper.addEventListener('click', () => nwLChat.selectUser(user, { 'color': avatarIcon.style.backgroundColor }));

			// Append the user element to the connections list
			connectionsList.appendChild(userWrapper);

			if (nwLChat.currentReceiver && nwLChat.currentReceiver.id == user.id) {
				nwLChat.currentReceiver = user;
				nwLChat.selectUser(nwLChat.currentReceiver, { 'update_user_card_only': 1 })
			}
		}
	},
	populateUserChats: function (chats) {
		const chatUl = $('#user-chats-list');

		if (!chats.length) {
			chatUl.html(
				`<li class="nav-item">
					<div class="m-3 p-3 alert alert-info">
						<h4>No Recent Chat!</h4>
						<p>Search chat new to begin</p>
				</div></li>`
			);
			return;
		}
		chatUl.html('');

		// Loop through each username key in the connections object
		chats.forEach(chat => {
			console.log( 'chat', chat );
			const listItem = $(`
				<li class="nav-item">
					<button type="button" tabindex="0" class="dropdown-item">
						<div class="d-flex widget-content p-0">
							<div class="widget-content-wrapper">
								<div class="widget-content-left mr-3 widget-content-avatar">
									
								</div>
								<div class="widget-content-left">
									<div class="widget-heading"></div>
									<div class="widget-subheading"></div>
									<div class="widget-is-typing"></div>
								</div>
							</div>
						</div>
					</button>
				</li>
				`);
			let statusColor = chat.is_online ? 'badge-success' : 'badge-danger';
			let profileType = 'Private';

			switch (chat.profile_type) {
				case 'private':
					profile_type = '<span class="badge bage-primary m-0">Private</span>'
					break;
			}

			if( chat.hasOwnProperty('unread_msg_count') && chat.unread_msg_count ){
				listItem.find( '.widget-content' ).append( $(`<div id="unread-msg-count-${chat.id}"><span class="badge badge-success">${chat.unread_msg_count}</span></div>`) );
			}

			const avatarWrapper = $(`<div id="avatar-icon-${chat.id}" class="avatar-icon-wrapper">
				<div class="badge badge-bottom badge-of-${chat.id} ${statusColor} badge-dot badge-dot-lg">
				</div>
			</div>`);

			const userAvatar = nwLChat.generateAvatarIcon(chat, {});
			avatarWrapper.append(userAvatar);

			listItem.find('.widget-content-avatar').html(avatarWrapper);
			listItem.find('.widget-heading').html(chat.username);
			listItem.find('.widget-subheading').html(profile_type);
			listItem.on('click', function (e) {
				nwLChat.selectUser(chat, {});
			});

			listItem.attr('id', 'user-chat-' + chat.id);
			if (nwLChat.currentReceiver != null && nwLChat.currentReceiver.id == chat.id) {
				listItem.find('.dropdown-item').addClass('active')
			}

			listItem.appendTo(chatUl);
		});
	},
	generateAvatarIcon: function (user, options) {
		// Create the avatar icon element
		const username = user.username;
		const avatarIcon = document.createElement('div');
		avatarIcon.classList.add('avatar-icon', 'rounded');

		if (options['class'] !== undefined && options['class'] !== '') {
			avatarIcon.classList.add(options['class']);
		}

		// Check if user has an avatar image
		if (user.img && user.img !== '') {
			const avatarImage = document.createElement('img');
			avatarImage.src = user.img; // Use the user's avatar image
			avatarImage.alt = username;
			if (options['width'] !== '') {
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

		return $(avatarIcon);
	},
	getRandomBgColor: function () {
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
	generateInitials: function (name) {
		const nameParts = name.split(' ');
		const firstLetter = nameParts[0]?.[0]?.toUpperCase() || '';
		const lastLetter = nameParts[1]?.[0]?.toUpperCase() || '';
		return firstLetter + lastLetter;
	},
	createUserCard: function (user, options) {
		console.log('u', user);
		// Create the main wrapper
		const userCard = $(`<div class="d-flex align-items-center">
				<div class="avatar-icon-wrapper mr-2">
					<div class="badge badge-bottom badge-dot badge-dot-lg badge-of-${user.id.toLowerCase().trim()} ${user.is_online?'badge-success':'badge-danger'}">
					</div>
				</div>
			</div>`);

		const avatarIcon = nwLChat.generateAvatarIcon(user, { 'class': 'avatar-icon-xl', 'width': 82, 'color': (options.color ? options.color : '') });

		$(userCard).find('.avatar-icon-wrapper').append(avatarIcon);

		// Create the user information section
		const userInfo = $('<h4 class="mb-0 text-wrap">'+ user.username +'</h4>');
		// Assuming user.name is available

		const lastSeen = $(`
			<div id="last-seen-${user.id}" class="opacity-7 chat-small-title">
				${ user.is_online ? '' : 'Last Seen Online: <span class="opacity-8">'+user.last_seen +'</span>'
			}<div>`);
		
		userInfo.append(lastSeen);
		userCard.append(userInfo);

		return userCard[0];
	},
	getRelativeTime: function (timestamp) {
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
	formatTimestamp: function (timestamp) {
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
	createMobileAppMenuBtn: function () {
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
	populateUserConnectionsList: function (connections) {
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
	selectUser: function (receiverData, options) {

		//set current receiver

		const userCard = nwLChat.createUserCard(receiverData, options);
		const activeUserCardContainer = document.getElementById('active-user-card');

		$('#active-chat-box').html('');
		activeUserCardContainer.innerHTML = '';
		activeUserCardContainer.appendChild(nwLChat.createMobileAppMenuBtn());
		activeUserCardContainer.appendChild(userCard);

		if (options.update_user_card_only === 1) {
			return;
		}

		nwLChat.currentReceiver = receiverData;
		socket.send(JSON.stringify({
			type: 'load_chat_messages',
			receiver: receiverData.id,
			sender: nwLChat.currentUser.id
		}));
		// nwLChat.setChat(receiverData, options);
	},
	setChat: function (chatData, options) {
		//populate messages
		// console.log('chatData', chatData);
		const chatContainer = nwLChat.generateChatMessages(chatData);
		//const chatContainer = nwLChat.generateChatMessages(chatData, receiverData, options);
		const chatBox = document.getElementById('active-chat-box');
		chatBox.innerHTML = '';
		chatBox.appendChild(chatContainer);

		nwLChat.scrollToTheEndOfChat();

		$('#user-chats-list .nav-item').each(function (i, v) {
			$(v).find('.dropdown-item').removeClass('active');
		});

		$('#user-chats-list #user-chat-' + nwLChat.currentReceiver.id).find('.dropdown-item').addClass('active');

		if( chatData.hasOwnProperty( 'unread_msg_count' ) && chatData.unread_msg_count ){
			nwLChat.sendReadReceipt(nwLChat.currentReceiver.id)
		}

		const typing_indicator = $(`
			<div id="typing-indicator-${nwLChat.currentReceiver.id}" class="typing-indicator chat-box-typing-indicator">
					<span class="typing-dot"></span>
					<span class="typing-dot"></span>
					<span class="typing-dot"></span>
				</div>`);
				typing_indicator.hide();

		chatBox.appendChild(typing_indicator[0]);
	},
	addNewMessage: function (messageData, receiverData, options) {
		let chatBoxGroup = $('#msg-group-wrapper-today');
		if (!chatBoxGroup.length) {
			chatBoxGroup = $(`
				<div id="msg-group-wrapper-today" class="chat-group-wrapper py-3">
					<div class="text-center">
						<span class="badge badge-primary chat-time-group">Today</span>
					</div>
				</div>`);
		}
		const chatContainer = nwLChat.generateChatBox(messageData);
		chatBoxGroup.append(chatContainer);

		const chatBox = document.getElementById('active-chat-box');
		chatBox.appendChild(chatBoxGroup[0]);

		nwLChat.scrollToTheEndOfChat();
	},
	generateChatMessages: function (chatData) {
		let chatsContainer = $('<div>');
		//const receiverIcon = nwLChat.generateAvatarIcon(receiverData, {'color':(options.color ? options.color : '') });
		//console.log('a' , receiverIcon);

		if (chatData && chatData.messages) {
			for (const msgGroup in chatData.messages) {
				const chatBoxGroup = $(`
				<div id="msg-group-wrapper-${msgGroup.toLowerCase()}" class="chat-group-wrapper py-3">
					<div class="text-center">
						<span class="badge badge-primary chat-time-group">${msgGroup}</span>
					</div>
				</div>`);

				chatData.messages[msgGroup].forEach((message) => {
					userID = message.id;
					const chatBox = nwLChat.generateChatBox(message);
					$(chatBoxGroup).append(chatBox);
				});

				$(chatsContainer).append(chatBoxGroup);
			}
		}
		
		return $(chatsContainer)[0];
	},
	generateChatBox: function (chatData) {
		console.log( 'message', chatData );
		const chatbox = $(`
			<div id="chat-box-${chatData.id}" class="chat-box-container chat-box-${chatData.sender}">
				<div class="chat-box-wrapper">
					<div>
						<div class="chat-box">
							<div class="chat-text"></div>
						</div>
						<small class="opacity-6"><span class="chat-box-time"></span> &nbsp;<span class="chat-box-receipt"></span></small>
					</div>
				</div>
			</div>
		`);
		let chatReceipt = '';
		if (chatData.sender == nwLChat.currentUser.id) {
			$(chatbox).addClass('flex-row-reverse');
			$(chatbox).find('.chat-box-wrapper').addClass('chat-box-wrapper-right');
			
			if (chatData.recipient_status == 'delivered') {
				chatReceipt = '<i class="fas fa-check-double"></i>';
			} else if (chatData.recipient_status == 'read') {
				chatReceipt = '<i class="fas fa-check-double text-primary"></i>';
			}else if (chatData.recipient_status == 'sent'){
				chatReceipt = '<i class="fas fa-check"></i>';
			}
		}else{
		}

		let content = chatData.text;

		switch( chatData.message_type ){
			case 'image':
				switch( chatData.recipient_status ){
					case 'sending':
						content = '<i class="far fa-image"></i>&nbps;&nbps;'+ chatData.status;
					break;
					default:
						content = $(`<div class="nwl-chat-gallery">
							<a href="${nwLChat.plugir_uri + chatData.id + '.'+ chatData.text }">
								<img width="200px" style="object-fit:cover;" src="${nwLChat.plugir_uri + chatData.id + '.'+ chatData.text }" >
							</a>
						</div>`);
						
						// Activate magnific popup
						$(content).magnificPopup({
							delegate: 'a', // the selector for gallery item
							type: 'image',
							gallery: {
								enabled: true
							}
						});
					break;
				}
			break
			case 'video':
				switch( chatData.recipient_status ){
					case 'sending':
						content = '<i class="fa fa-video"></i>&nbps;&nbps;'+ chatData.status;
						break;
					default:
					content = `<video width="300px" src="${nwLChat.plugir_uri + chatData.id + '.'+ chatData.text }" control ><video>`
					break;
				}
			break;
			case 'application':
				switch( chatData.recipient_status ){
					case 'sending':
						content = '<i class="fa fa-file"></i>&nbsp;&nbsp;'+ chatData.status;
						break;
					default:
						content = `<a target="_blank" class="btn btn-outline-secondary rounded" href="${nwLChat.plugir_uri + chatData.id + '.'+ chatData.text }"><i class="fa fa-file"></i>&nbsp; Document</a>`
					break;
				}
			break;
		}

		$(chatbox).find('.chat-text').html(content);
		if (chatData.timestamp) {
			$(chatbox).find('.chat-box-time').html('<i class="fa fa-calendar-alt mr-1"></i>' + chatData.timestamp);
		}

		$(chatbox).find('.chat-box-receipt').html(chatReceipt);

		return $(chatbox)[0];
	},
	loadChatHistory: function (senderId, receiverId) {
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
	sendTypingStatus: function (receiverId, status) {
		if (!socket) return;

		socket.send(JSON.stringify({
			type: 'typing_indicator',
			senderId: nwLChat.currentUser.id,
			receiverId: receiverId,
			isTyping: status
		}));
	},
	handleTypingInput: function () {
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
	handleTypingIndicator: function (data) {
		if( data.senderId ){
			let isTypingWidget = $('#user-chat-'+ data.senderId).find( '.widget-is-typing' );
			if( data.isTyping ){
				isTypingWidget.text('is typing...');
			}else{
				isTypingWidget.text('');
			}
		}

		// Only show typing indicator for the currently selected user
		if (nwLChat.currentReceiver && data.senderId === nwLChat.currentReceiver.id) {
			const typingIndicator = $('#typing-indicator-'+data.senderId );

			if (data.isTyping) {
				typingIndicator.show(300);
			} else {
				typingIndicator.hide(100);
			}
		}
	},
	//should be called when browser receives focus and unread message is visible
	sendReadReceipt: function (recipient) {
		if (!socket) return;

		socket.send(JSON.stringify({
			type: 'read_receipt',
			user: nwLChat.currentUser.id,
			recipient: recipient,
			// messageId: messageId
		}));
	},
	handleReadReceipt: function (data) {
		console.log( 'receipt', data );
		// Update UI to show message has been read
		// Remove message count badge if it exist
		$('#unread-msg-count-'+data.receiver).remove();
		
		if( data.receiver == nwLChat.currentUser.id ){
			$( '.chat-box-'+data.receiver ).find( '.chat-box-receipt' ).html('<i class="fa fa-check-double text-primary"></i>');

			$('#unread-msg-count-'+data.sender).remove();
		}
	},
	handleSendMessage: function () {
		$('#send-message-btn').on( 'click', function (e) {
			nwLChat.sendPrivateMessage();
		} );
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
	sendPrivateMessage: function () {
		// alert("About send message");
		const messageInput = document.getElementById('message-input');
		const message = messageInput.value.trim();
		const messageId = nwLChat.generateUniqueId(); // Implement unique ID generation

		if (message && nwLChat.currentReceiver) {
			// Add message to chat with unique ID
			const chatMessage = {
				id: messageId,
				type: 'private_message',
				type_of_receiver: 'user',
				message_type: 'text',
				sender: nwLChat.currentUser.id,
				receiver: nwLChat.currentReceiver.id,
				text: message,
				timestamp: nwLChat.formatTimestamp(nwLChat.getSystemTimestamp())
			};
			chatMessage['message'] = message;
			nwLChat.addNewMessage(chatMessage);

			socket.send(JSON.stringify(chatMessage));
			
			nwLChat.getUserChats();
			messageInput.value = '';

			// Clear typing status
			clearTimeout(nwLChat.typingTimer);
			nwLChat.sendTypingStatus(nwLChat.currentReceiver.id, false);
		}else{
			nwLChat.createChatNotification({
				message: 'Message could not be sent!',
				type: 'warning'
			});
		}
	},
	handlePrivateMessage: function (data) {
		if( nwLChat.currentUser.id !== data.sender ){
			// Refreshes user chats
			nwLChat.getUserChats();
			if( nwLChat.currentReceiver != null && nwLChat.currentReceiver.id == data.sender ){
				nwLChat.selectUser( nwLChat.currentReceiver, {} );
			}
		}else{
			// Only display if the message is from the currently selected user
			$('#chat-box-' + data.id).remove();
			nwLChat.addNewMessage(data);
		}

	},
	getSystemTimestamp: function () {
		// Get the current date and time
		const now = new Date();

		// Get the timestamp in milliseconds
		const timestamp = now.getTime();

		return timestamp / 1000;
	},
	getTimestampInTimezone: function (timezone) {
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
	generateUniqueId: function () {
		return `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	},

	scrollToTheEndOfChat: function (scrollEffect = false) {
		const wrapper = $('.chat-wrapper');
		if (wrapper.length) {
			wrapper.animate({ scrollTop: $(wrapper)[0].scrollHeight }, scrollEffect ? 'slow' : 'fast' );
		}
	},

	getUserChats: function(){
		socket.send(JSON.stringify({
			type: 'get_user_chats',
			user: nwLChat.currentUser.id
		}));
	}
};
setTimeout(nwLChat.init, 500);

var CustomNwlChatJS = {
	init: function(){
		$('.attachment-btn').on( 'click', function(e){
			$(this).parent().find('.dropup-items').toggle();
		} );

		$('.attachment-section .dropup-items label').click(function(e){
			$('.attachment-section .dropup-items').hide();
		});
	}
}