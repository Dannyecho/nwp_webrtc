 CREATE TABLE `feyi2`.`chat_messages` ( `id` varchar(55) NOT NULL , `chat_messages6995` varchar(100) DEFAULT NULL , `chat_messages6996` varchar(100) DEFAULT NULL , `chat_messages6997` varchar(100) DEFAULT NULL , `chat_messages6998` text DEFAULT NULL , `chat_messages6999` varchar(100) DEFAULT NULL , `chat_messages7000` varchar(100) DEFAULT NULL , `chat_messages7014` varchar(100) DEFAULT NULL , `serial_num` int(11) NOT NULL, `creator_role` varchar(100) DEFAULT NULL, `created_source` varchar(100) DEFAULT NULL, `created_by` varchar(100) DEFAULT NULL, `creation_date` int(11) DEFAULT NULL, `modified_source` varchar(100) DEFAULT NULL, `modified_by` varchar(100) DEFAULT NULL, `modification_date` int(11) DEFAULT NULL, `ip_address` varchar(100) DEFAULT NULL, `device_id` text NOT NULL, `record_status` varchar(100) DEFAULT NULL ) ENGINE=InnoDB DEFAULT CHARSET=latin1 ; 
ALTER TABLE `feyi2`.`chat_messages` ADD PRIMARY KEY (`serial_num`), ADD UNIQUE KEY `id` (`id`) ; 
ALTER TABLE `feyi2`.`chat_messages` MODIFY `serial_num` int(11) NOT NULL AUTO_INCREMENT ; 
ALTER TABLE `feyi2`.`chat_messages` ADD INDEX(`chat_messages6995`) ; 
ALTER TABLE `feyi2`.`chat_messages` ADD INDEX(`chat_messages6996`) ; 
ALTER TABLE `feyi2`.`chat_messages` ADD INDEX(`chat_messages6997`) ; 
ALTER TABLE `feyi2`.`chat_messages` ADD INDEX(`chat_messages6999`) ; 
ALTER TABLE `feyi2`.`chat_messages` ADD INDEX(`chat_messages7000`) ; 
ALTER TABLE `feyi2`.`chat_messages` ADD INDEX(`chat_messages7014`) ; 
