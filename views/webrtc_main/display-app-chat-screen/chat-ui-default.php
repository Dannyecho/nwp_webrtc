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
					<?php include "chat-ui-message.php"; ?>
				</div>
				<div class="app-inner-layout__bottom-pane d-block text-center">
					<div class="mb-0 position-relative form-group">
						<div class="">
							<textarea id="message-input" placeholder="Write here and hit enter to send..." type="text" class="form-control-lg form-control"></textarea>
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
							<input placeholder="Search..." type="text" class="form-control">
						</div>
					</li>
					<li class="nav-item-header nav-item">Status: <b id="connection-status">Offline</b></li>
				</ul>
			</div>
			<ul class="nav flex-column chat-height-control">
				<?php include "chat-ui-friends.php"; ?>
			</ul>
			<div class="app-inner-layout__sidebar-footer pb-3">
				<ul class="nav flex-column">
					<?php //include "chat-ui-friends-offline.php"; ?>
					<li class="nav-item-divider nav-item"></li>
					<li class="nav-item-header nav-item">Online Contacts</li>
					<li class="text-center p-2 nav-item">
						<div class="avatar-wrapper avatar-wrapper-overlap"  id="user-connections">
							<?php include "chat-ui-friends-online.php"; ?>
						</div>
					</li>
					<li class="nav-item-btn text-center nav-item">
						<button class="btn-wide btn-pill btn btn-success btn-sm">New Group
							Conversation</button>
					</li>
				</ul>
			</div>
		</div>
	</div>
</div>