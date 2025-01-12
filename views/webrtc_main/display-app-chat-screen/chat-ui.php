<div class="app-inner-layout chat-layout">
	<div class="app-inner-layout__wrapper" id="chat-layout-wrapper">
		
		<div class="app-inner-layout__content card">
			<div class="table-responsive">
				<div class="app-inner-layout__top-pane">
					<div class="pane-left" id="active-user-card">
						<?php include "chat-ui-active.php"; ?>
					</div>
					<div class="pane-right">
						<?php include "chat-ui-actions.php"; ?>
					</div>
				</div>
				<div class="chat-wrapper user-chat" id="active-chat-box">
					<?php //include "chat-ui-message.php"; ?>
				</div>
				<div class="app-inner-layout__bottom-pane d-block text-center m-3">
					<div class="d-flex justify-content-around text-center align-items-center">
						<div class="attachment-section">
							<a href="#" class="attachment-btn text-secondary">
								<i class="fa fa-paperclip fa-2x"></i>
							</a>
							<form action="#" class="dropup-items">
								<label for="nwl-media-picker" class="text-secondary">
									<i class="fas fa-camera-retro fa-2x"></i> Photos & Videos
								</label>
								<input id="nwl-media-picker" class="nwl-attachment-input" type="file" accept="image/*,video/*" multiple>

								<label for="nwl-file-picker" class="text-secondary">
									<i class="fas fa-file-alt fa-2x"></i> Document
								</label>
								<input id="nwl-file-picker" class="nwl-attachment-input" type="file" accept=".doc,.docx,.xml,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" multiple>
							</form>
						</div>
						<div class="mb-0 position-relative form-group message-input-wrapper">
							<div id="typing-indicator" class="typing-indicator" style="display:none;"></div>
							<div class="">
								<textarea id="message-input" placeholder="Write here and hit enter to send..." type="text" class="form-control-lgx form-control"></textarea>
							</div>
						</div>
						<div class="send-section">
							<a href="#" id="send-message-btn" class="text-secondary"><i class="fa fa-paper-plane fa-2x"></i></a>
						</div>
					</div>
				</div>
			</div>
		</div>
		<div class="app-inner-layout__sidebar card">
			<div class="app-inner-layout__sidebar-header">
				<ul class="nav flex-column">
					<li class="pt-4 pl-3 pr-3 pb-3 nav-item">
						<div class="input-group">
							<div class="input-group-prepend">
								<div class="input-group-text">
									<i class="fa fa-search"></i>
								</div>
							</div>
							<input id="chat-search-field" action="?action=users&todo=get_select2" placeholder="Search..." type="text" class="form-control select2" minlength="0">
						</div>
					</li>
					<li class="nav-item-header nav-item">Status: <b id="connection-status">Offline</b></li>
				</ul>
			</div>
			<ul id="user-chats-list" class="nav flex-column chat-height-control">
				<?php include "chat-ui-friends.php"; ?>
			</ul>
			<div class="app-inner-layout__sidebar-footer pb-3">
				<hr>
				<ul class="nav flex-column">
					<?php /* //include "chat-ui-friends-offline.php"; ?>
					<li class="nav-item-divider nav-item"></li> 
					<li class="nav-item-header nav-item">Recently Online</li>
					<li class="text-center p-2 nav-item">
						<div class="avatar-wrapper avatar-wrapper-overlap"  id="user-connections">
							<?php //include "chat-ui-friends-online.php"; ?>
						</div>
					</li> */ ?>
					<li class="nav-item-btn text-center nav-item">
						<button class="btn-wide btn-pill btn btn-success btn-sm">New Group
							Conversation</button>
					</li>
				</ul>
			</div>
		</div>
	</div>
</div>