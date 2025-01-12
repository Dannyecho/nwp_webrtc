 CREATE TABLE `feyi2`.`chat_profile` ( `id` varchar(55) NOT NULL , `chat_profile6989` varchar(100) DEFAULT NULL , `chat_profile6990` text DEFAULT NULL , `chat_profile6991` varchar(100) DEFAULT NULL , `chat_profile6992` int(11) DEFAULT NULL , `chat_profile6993` int(11) DEFAULT NULL , `chat_profile7015` varchar(100) DEFAULT NULL , `chat_profile7016` int(11) DEFAULT NULL , `serial_num` int(11) NOT NULL, `creator_role` varchar(100) DEFAULT NULL, `created_source` varchar(100) DEFAULT NULL, `created_by` varchar(100) DEFAULT NULL, `creation_date` int(11) DEFAULT NULL, `modified_source` varchar(100) DEFAULT NULL, `modified_by` varchar(100) DEFAULT NULL, `modification_date` int(11) DEFAULT NULL, `ip_address` varchar(100) DEFAULT NULL, `device_id` text NOT NULL, `record_status` varchar(100) DEFAULT NULL ) ENGINE=InnoDB DEFAULT CHARSET=latin1 ; 
ALTER TABLE `feyi2`.`chat_profile` ADD PRIMARY KEY (`serial_num`), ADD UNIQUE KEY `id` (`id`) ; 
ALTER TABLE `feyi2`.`chat_profile` MODIFY `serial_num` int(11) NOT NULL AUTO_INCREMENT ; 
ALTER TABLE `feyi2`.`chat_profile` ADD INDEX(`chat_profile6989`) ; 
ALTER TABLE `feyi2`.`chat_profile` ADD INDEX(`chat_profile6991`) ; 
ALTER TABLE `feyi2`.`chat_profile` ADD INDEX(`chat_profile7015`) ; 
