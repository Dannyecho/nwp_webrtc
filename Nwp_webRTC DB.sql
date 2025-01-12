-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jan 02, 2025 at 04:54 PM
-- Server version: 10.4.27-MariaDB
-- PHP Version: 8.2.0

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `feyi2`
--

-- --------------------------------------------------------

--
-- Table structure for table `chat_contact_status`
--

CREATE TABLE `chat_contact_status` (
  `id` varchar(55) NOT NULL,
  `chat_contact_status7004` varchar(100) DEFAULT NULL,
  `chat_contact_status7005` varchar(100) DEFAULT NULL,
  `chat_contact_status7006` varchar(100) DEFAULT NULL,
  `chat_contact_status7007` varchar(100) DEFAULT NULL,
  `chat_contact_status7008` varchar(200) DEFAULT NULL,
  `chat_contact_status7009` varchar(200) DEFAULT NULL,
  `chat_contact_status7010` int(11) DEFAULT NULL,
  `chat_contact_status7011` varchar(200) DEFAULT NULL,
  `chat_contact_status7012` varchar(200) DEFAULT NULL,
  `chat_contact_status7013` int(11) DEFAULT NULL,
  `serial_num` int(11) NOT NULL,
  `creator_role` varchar(100) DEFAULT NULL,
  `created_source` varchar(100) DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `creation_date` int(11) DEFAULT NULL,
  `modified_source` varchar(100) DEFAULT NULL,
  `modified_by` varchar(100) DEFAULT NULL,
  `modification_date` int(11) DEFAULT NULL,
  `ip_address` varchar(100) DEFAULT NULL,
  `device_id` text NOT NULL,
  `record_status` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_group`
--

CREATE TABLE `chat_group` (
  `id` varchar(55) NOT NULL,
  `chat_group7001` varchar(200) DEFAULT NULL,
  `serial_num` int(11) NOT NULL,
  `creator_role` varchar(100) DEFAULT NULL,
  `created_source` varchar(100) DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `creation_date` int(11) DEFAULT NULL,
  `modified_source` varchar(100) DEFAULT NULL,
  `modified_by` varchar(100) DEFAULT NULL,
  `modification_date` int(11) DEFAULT NULL,
  `ip_address` varchar(100) DEFAULT NULL,
  `device_id` text NOT NULL,
  `record_status` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_group_members`
--

CREATE TABLE `chat_group_members` (
  `id` varchar(55) NOT NULL,
  `chat_group_members7002` varchar(100) DEFAULT NULL,
  `chat_group_members7003` varchar(100) DEFAULT NULL,
  `serial_num` int(11) NOT NULL,
  `creator_role` varchar(100) DEFAULT NULL,
  `created_source` varchar(100) DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `creation_date` int(11) DEFAULT NULL,
  `modified_source` varchar(100) DEFAULT NULL,
  `modified_by` varchar(100) DEFAULT NULL,
  `modification_date` int(11) DEFAULT NULL,
  `ip_address` varchar(100) DEFAULT NULL,
  `device_id` text NOT NULL,
  `record_status` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_messages`
--

CREATE TABLE `chat_messages` (
  `id` varchar(55) NOT NULL,
  `chat_messages6995` varchar(100) DEFAULT NULL,
  `chat_messages6996` varchar(100) DEFAULT NULL,
  `chat_messages6997` varchar(100) DEFAULT NULL,
  `chat_messages6998` text DEFAULT NULL,
  `chat_messages6999` varchar(100) DEFAULT NULL,
  `chat_messages7000` varchar(100) DEFAULT NULL,
  `chat_messages7014` varchar(100) DEFAULT NULL,
  `serial_num` int(11) NOT NULL,
  `creator_role` varchar(100) DEFAULT NULL,
  `created_source` varchar(100) DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `creation_date` int(11) DEFAULT NULL,
  `modified_source` varchar(100) DEFAULT NULL,
  `modified_by` varchar(100) DEFAULT NULL,
  `modification_date` int(11) DEFAULT NULL,
  `ip_address` varchar(100) DEFAULT NULL,
  `device_id` text NOT NULL,
  `record_status` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

-- --------------------------------------------------------

--
-- Table structure for table `chat_profile`
--

CREATE TABLE `chat_profile` (
  `id` varchar(55) NOT NULL,
  `chat_profile6989` varchar(100) DEFAULT NULL,
  `chat_profile6990` text DEFAULT NULL,
  `chat_profile6991` varchar(100) DEFAULT NULL,
  `chat_profile6992` int(11) DEFAULT NULL,
  `chat_profile6993` int(11) DEFAULT NULL,
  `chat_profile7015` varchar(100) DEFAULT NULL,
  `serial_num` int(11) NOT NULL,
  `creator_role` varchar(100) DEFAULT NULL,
  `created_source` varchar(100) DEFAULT NULL,
  `created_by` varchar(100) DEFAULT NULL,
  `creation_date` int(11) DEFAULT NULL,
  `modified_source` varchar(100) DEFAULT NULL,
  `modified_by` varchar(100) DEFAULT NULL,
  `modification_date` int(11) DEFAULT NULL,
  `ip_address` varchar(100) DEFAULT NULL,
  `device_id` text NOT NULL,
  `record_status` varchar(100) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1 COLLATE=latin1_swedish_ci;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `chat_contact_status`
--
ALTER TABLE `chat_contact_status`
  ADD PRIMARY KEY (`serial_num`),
  ADD UNIQUE KEY `id` (`id`),
  ADD KEY `chat_contact_status7004` (`chat_contact_status7004`),
  ADD KEY `chat_contact_status7005` (`chat_contact_status7005`),
  ADD KEY `chat_contact_status7006` (`chat_contact_status7006`),
  ADD KEY `chat_contact_status7007` (`chat_contact_status7007`);

--
-- Indexes for table `chat_group`
--
ALTER TABLE `chat_group`
  ADD PRIMARY KEY (`serial_num`),
  ADD UNIQUE KEY `id` (`id`);

--
-- Indexes for table `chat_group_members`
--
ALTER TABLE `chat_group_members`
  ADD PRIMARY KEY (`serial_num`),
  ADD UNIQUE KEY `id` (`id`),
  ADD KEY `chat_group_members7002` (`chat_group_members7002`),
  ADD KEY `chat_group_members7003` (`chat_group_members7003`);

--
-- Indexes for table `chat_messages`
--
ALTER TABLE `chat_messages`
  ADD PRIMARY KEY (`serial_num`),
  ADD UNIQUE KEY `id` (`id`),
  ADD KEY `chat_messages6995` (`chat_messages6995`),
  ADD KEY `chat_messages6996` (`chat_messages6996`),
  ADD KEY `chat_messages6997` (`chat_messages6997`),
  ADD KEY `chat_messages6999` (`chat_messages6999`),
  ADD KEY `chat_messages7000` (`chat_messages7000`),
  ADD KEY `chat_messages7014` (`chat_messages7014`);

--
-- Indexes for table `chat_profile`
--
ALTER TABLE `chat_profile`
  ADD PRIMARY KEY (`serial_num`),
  ADD UNIQUE KEY `id` (`id`),
  ADD KEY `chat_profile6989` (`chat_profile6989`),
  ADD KEY `chat_profile6991` (`chat_profile6991`),
  ADD KEY `chat_profile7015` (`chat_profile7015`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `chat_contact_status`
--
ALTER TABLE `chat_contact_status`
  MODIFY `serial_num` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_group`
--
ALTER TABLE `chat_group`
  MODIFY `serial_num` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_group_members`
--
ALTER TABLE `chat_group_members`
  MODIFY `serial_num` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_messages`
--
ALTER TABLE `chat_messages`
  MODIFY `serial_num` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `chat_profile`
--
ALTER TABLE `chat_profile`
  MODIFY `serial_num` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
