 CREATE TABLE `feyi2`.`chat_contact_status` ( `id` varchar(55) NOT NULL , `chat_contact_status7004` varchar(100) DEFAULT NULL , `chat_contact_status7005` varchar(100) DEFAULT NULL , `chat_contact_status7006` varchar(100) DEFAULT NULL , `chat_contact_status7007` varchar(100) DEFAULT NULL , `chat_contact_status7008` varchar(200) DEFAULT NULL , `chat_contact_status7009` varchar(200) DEFAULT NULL , `chat_contact_status7010` int(11) DEFAULT NULL , `chat_contact_status7011` varchar(200) DEFAULT NULL , `chat_contact_status7012` varchar(200) DEFAULT NULL , `chat_contact_status7013` int(11) DEFAULT NULL , `serial_num` int(11) NOT NULL, `creator_role` varchar(100) DEFAULT NULL, `created_source` varchar(100) DEFAULT NULL, `created_by` varchar(100) DEFAULT NULL, `creation_date` int(11) DEFAULT NULL, `modified_source` varchar(100) DEFAULT NULL, `modified_by` varchar(100) DEFAULT NULL, `modification_date` int(11) DEFAULT NULL, `ip_address` varchar(100) DEFAULT NULL, `device_id` text NOT NULL, `record_status` varchar(100) DEFAULT NULL ) ENGINE=InnoDB DEFAULT CHARSET=latin1 ; 
ALTER TABLE `feyi2`.`chat_contact_status` ADD PRIMARY KEY (`serial_num`), ADD UNIQUE KEY `id` (`id`) ; 
ALTER TABLE `feyi2`.`chat_contact_status` MODIFY `serial_num` int(11) NOT NULL AUTO_INCREMENT ; 
ALTER TABLE `feyi2`.`chat_contact_status` ADD INDEX(`chat_contact_status7004`) ; 
ALTER TABLE `feyi2`.`chat_contact_status` ADD INDEX(`chat_contact_status7005`) ; 
ALTER TABLE `feyi2`.`chat_contact_status` ADD INDEX(`chat_contact_status7006`) ; 
ALTER TABLE `feyi2`.`chat_contact_status` ADD INDEX(`chat_contact_status7007`) ; 
