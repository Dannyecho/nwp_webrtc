Aim: Live Chat and Video Calls (Telemedicine features) -> Mobile App
to achieve online consultation

Objectives
Phase 1
1. Live Chat on Hyella Core
Requirement: backward compatible with non docker deployment
-->php web socket & database driven chat

- Saved chat messages
DB to save:

2. Upgrade Live Chat Features
- File Uploads
- File Viewing
- Text Formatting
- Truncating long messages
- Emoji's
- Audio to Text
- Audio Recording feature / voice notes

3. Deploy Live Chat to Clients
- Make observations & improvements
	Staff hyella core - staff hyella core

4. Live Chat to Mobile (Health Provider)
- Staff to staff chat
	Staff mobile - staff mobile
	Staff mobile - staff hyella core

Phase 2
5. Video call (Jitsi)
- Limitation: Unable to run in local environment seamlessly, calls redirect to browser

6. Video call solution (Node.js Webrtc)

Backlog
- Format message
- Edit messages
- Delete messages


Tables
A ----- B
	Intercept and save
	
A -- Save to DB -- B

Example Pato
- Abuja Branch
- IT Department
- Super Admin


Abuja Branch
Super Admin
IT Department
IT Department in Abuja Branch
Super Admin in Abuja Branch
Super Admin in IT Department


Chat_profile
User
status (unavialable, available)
status message (automatic reply sent to people whenever he is unavialable)
status (start expiry time)
status (end expiry time)
mute (yes/no)
mute time (how to mute)

Chat_messages
sender
receiver
type of receiver (individual, group_user, group_system, department, branch, access role)
message
datetime
status (edited, deleted)
read/unread


Group 
name

Group_members
group id
user id


Chat_contact_status
reference
reference_table (users)
child_reference 
child_reference_table (users, group_user, group_system, department, branch, access role)
status (online/offline)
mute (yes/no)
mute time (how to mute)
block (yes/no)
block time (how long to block)