-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 11, 2025 at 01:06 AM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `skolu_departamentas`
--

-- --------------------------------------------------------

--
-- Table structure for table `asmeniniai_pranesimai`
--

CREATE TABLE `asmeniniai_pranesimai` (
  `id_asmeninis_pranesimas` int(11) NOT NULL,
  `fk_id_vartotojas_siuntejas` int(11) NOT NULL,
  `fk_id_vartotojas_gavejas` int(11) NOT NULL,
  `turinys` varchar(255) NOT NULL,
  `data` datetime NOT NULL,
  `pranesimo_busena` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `asmeniniai_pranesimai`
--

INSERT INTO `asmeniniai_pranesimai` (`id_asmeninis_pranesimas`, `fk_id_vartotojas_siuntejas`, `fk_id_vartotojas_gavejas`, `turinys`, `data`, `pranesimo_busena`) VALUES
(22, 8, 9, 'alio', '2025-12-03 19:18:46', 1),
(23, 8, 10, 'labas', '2025-12-03 19:18:57', 1),
(24, 8, 10, 'aaaaaaaaaa', '2025-12-03 19:18:59', 1),
(25, 8, 10, 'LABAS', '2025-12-03 19:19:02', 1),
(26, 8, 10, 'VEIKIA', '2025-12-03 19:19:04', 1),
(27, 9, 8, 'alio', '2025-12-07 20:08:35', 1),
(28, 8, 9, 'test', '2025-12-07 20:16:40', 1),
(29, 9, 8, 'nereikia refresh', '2025-12-07 20:16:52', 1),
(30, 9, 10, 'asd', '2025-12-07 20:17:10', 1),
(31, 9, 8, 'vel test', '2025-12-07 20:24:07', 1),
(32, 8, 9, 'veikia', '2025-12-07 20:24:28', 1),
(33, 8, 9, 'test', '2025-12-07 20:24:55', 1),
(34, 8, 9, '1', '2025-12-07 20:25:09', 1),
(35, 8, 9, '32', '2025-12-07 20:25:10', 1),
(36, 8, 9, '3', '2025-12-07 20:25:12', 1),
(37, 8, 9, '1', '2025-12-07 20:25:34', 1),
(38, 8, 9, '3', '2025-12-07 20:25:35', 1),
(39, 9, 8, 'jo', '2025-12-07 20:25:48', 1),
(40, 9, 8, 'dar test', '2025-12-07 20:57:21', 1),
(41, 9, 8, 'a', '2025-12-07 21:00:40', 1),
(42, 9, 8, 'a', '2025-12-07 21:00:41', 1),
(43, 9, 8, 'a', '2025-12-07 21:00:41', 1),
(44, 9, 8, 'a', '2025-12-07 21:00:41', 1),
(45, 9, 8, 'a', '2025-12-07 21:00:42', 1),
(46, 9, 8, 'a', '2025-12-07 21:00:42', 1),
(47, 9, 8, 'a', '2025-12-07 21:00:42', 1),
(48, 9, 8, 'a', '2025-12-07 21:00:42', 1),
(49, 8, 9, 'test', '2025-12-07 21:06:38', 1),
(50, 8, 9, 'asd', '2025-12-07 21:10:47', 1),
(51, 8, 9, 'test', '2025-12-07 21:11:59', 1),
(52, 8, 9, 'test', '2025-12-07 21:12:22', 1),
(53, 8, 9, 'asd', '2025-12-07 21:22:33', 1),
(54, 8, 9, 'asd', '2025-12-07 21:22:45', 1),
(55, 8, 9, 'alio', '2025-12-07 21:22:53', 1),
(56, 9, 8, 'nu', '2025-12-07 21:23:09', 1),
(57, 8, 9, 'sw', '2025-12-07 21:25:37', 1),
(58, 8, 9, 'sw', '2025-12-07 21:25:44', 1),
(59, 8, 9, 'alio', '2025-12-07 21:25:50', 1),
(60, 10, 8, 'sw', '2025-12-10 19:05:35', 1),
(61, 9, 8, 'duhas', '2025-12-10 21:44:11', 1),
(62, 9, 8, 'duhas', '2025-12-10 21:44:25', 1),
(63, 9, 8, 'sw', '2025-12-10 21:44:57', 1),
(64, 8, 9, 'dw', '2025-12-10 21:45:18', 1),
(65, 8, 9, 'duhas', '2025-12-10 21:47:08', 1),
(66, 8, 9, 'aa', '2025-12-10 21:59:19', 1),
(67, 9, 8, 'aa', '2025-12-10 21:59:40', 1),
(68, 9, 8, 'aa', '2025-12-10 21:59:53', 1),
(69, 9, 8, 'aa', '2025-12-11 00:12:49', 1),
(70, 8, 9, 'aa', '2025-12-11 00:14:55', 1),
(71, 9, 8, 'aaaaaa', '2025-12-11 00:28:15', 1),
(72, 9, 8, 'aaaa', '2025-12-11 00:28:17', 1),
(73, 9, 8, 'aaaa', '2025-12-11 00:28:19', 1),
(74, 9, 8, 'aaaaaa', '2025-12-11 00:28:20', 1),
(75, 9, 8, 'aaaaa', '2025-12-11 00:28:21', 1),
(76, 9, 8, 'aaaa', '2025-12-11 00:39:45', 1),
(77, 9, 8, 'aaaa', '2025-12-11 00:39:48', 1),
(78, 9, 8, 'aaaa', '2025-12-11 00:39:54', 1),
(79, 9, 8, 'aaaa', '2025-12-11 00:39:54', 1),
(80, 9, 8, 'aaaa', '2025-12-11 00:39:55', 1),
(81, 9, 8, 'a', '2025-12-11 00:39:56', 1),
(82, 9, 8, 'a', '2025-12-11 00:39:57', 1),
(83, 9, 8, 'a', '2025-12-11 00:39:58', 1),
(84, 9, 8, 'aaa', '2025-12-11 00:41:57', 1),
(85, 9, 8, 'aaa', '2025-12-11 00:41:58', 1),
(86, 9, 8, 'aaa', '2025-12-11 00:41:59', 1),
(87, 9, 8, 'aaaa', '2025-12-11 00:46:17', 1),
(88, 9, 8, 'aaa', '2025-12-11 00:46:20', 1),
(89, 9, 8, 'aa', '2025-12-11 00:51:35', 1),
(90, 9, 8, 'aa', '2025-12-11 01:10:12', 1),
(91, 9, 8, 'aa', '2025-12-11 01:17:12', 1),
(92, 9, 8, 'aa', '2025-12-11 02:05:43', 1);

-- --------------------------------------------------------

--
-- Table structure for table `ataskaitos`
--

CREATE TABLE `ataskaitos` (
  `id_ataskaita` int(11) NOT NULL,
  `fk_id_vartotojas` int(11) NOT NULL,
  `pavadinimas` varchar(50) NOT NULL,
  `sukurimo_data` date NOT NULL,
  `failo_kelias` varchar(100) NOT NULL,
  `laikotarpio_pradzia` date NOT NULL,
  `laikotarpio_pabaiga` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `ataskaitos_tipas`
--

CREATE TABLE `ataskaitos_tipas` (
  `id_ataskaitos_tipas` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `ataskaitos_tipas`
--

INSERT INTO `ataskaitos_tipas` (`id_ataskaitos_tipas`, `name`) VALUES
(1, 'menesine'),
(2, 'grupes'),
(3, 'asmens');

-- --------------------------------------------------------

--
-- Table structure for table `delspinigiai`
--

CREATE TABLE `delspinigiai` (
  `id_delspinigiai` int(11) NOT NULL,
  `fk_id_skolos_dalis` int(11) NOT NULL,
  `dienos_proc` decimal(5,2) NOT NULL,
  `pradzios_data` date NOT NULL,
  `pabaigos_data` date NOT NULL,
  `apskaiciuota_suma` decimal(10,2) NOT NULL,
  `aktyvus` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `grupes`
--

CREATE TABLE `grupes` (
  `id_grupe` int(11) NOT NULL,
  `fk_id_vartotojas` int(11) NOT NULL,
  `pavadinimas` varchar(30) NOT NULL,
  `aprasas` varchar(255) DEFAULT NULL,
  `sukurimo_data` date NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `grupes`
--

INSERT INTO `grupes` (`id_grupe`, `fk_id_vartotojas`, `pavadinimas`, `aprasas`, `sukurimo_data`) VALUES
(18, 8, 'testinis', NULL, '2025-12-11');

-- --------------------------------------------------------

--
-- Table structure for table `grupes_istorija`
--

CREATE TABLE `grupes_istorija` (
  `id_istorija` int(11) NOT NULL,
  `fk_id_grupe` int(11) NOT NULL,
  `fk_id_vartotojas` int(11) DEFAULT NULL,
  `tipas` varchar(50) NOT NULL,
  `aprasymas` text NOT NULL,
  `sukurta` datetime NOT NULL DEFAULT current_timestamp(),
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `grupes_istorija`
--

INSERT INTO `grupes_istorija` (`id_istorija`, `fk_id_grupe`, `fk_id_vartotojas`, `tipas`, `aprasymas`, `sukurta`, `metadata`) VALUES
(1, 18, 8, 'group_created', 'Grupė \"testinis\" sukurta.', '2025-12-11 02:05:04', '{\"ownerId\":8}');

-- --------------------------------------------------------

--
-- Table structure for table `grupes_nariai`
--

CREATE TABLE `grupes_nariai` (
  `id_grupes_narys` int(11) NOT NULL,
  `fk_id_grupe` int(11) NOT NULL,
  `fk_id_sistemos_istorija` int(11) DEFAULT NULL,
  `fk_id_vartotojas` int(11) NOT NULL,
  `prisijungimo_data` date NOT NULL,
  `role` int(11) NOT NULL,
  `nario_busena` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `grupes_nariai`
--

INSERT INTO `grupes_nariai` (`id_grupes_narys`, `fk_id_grupe`, `fk_id_sistemos_istorija`, `fk_id_vartotojas`, `prisijungimo_data`, `role`, `nario_busena`) VALUES
(14, 18, NULL, 8, '0000-00-00', 3, 1);

-- --------------------------------------------------------

--
-- Table structure for table `grupes_zinutes`
--

CREATE TABLE `grupes_zinutes` (
  `id_grupes_zinute` int(11) NOT NULL,
  `fk_id_grupes_narys` int(11) NOT NULL,
  `fk_id_grupe` int(11) NOT NULL,
  `turinys` varchar(255) NOT NULL,
  `siuntimo_data` datetime NOT NULL,
  `redaguota` tinyint(1) NOT NULL,
  `redagavimo_data` datetime NOT NULL,
  `istrinta` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kategorijos`
--

CREATE TABLE `kategorijos` (
  `id_kategorija` int(11) NOT NULL,
  `name` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kategorijos`
--

INSERT INTO `kategorijos` (`id_kategorija`, `name`) VALUES
(1, 'Maistas'),
(2, 'Transportas'),
(3, 'Apgyvendinimas'),
(4, 'Veiklos ir pramogos'),
(5, 'Dekoracijos ir reikmenys'),
(6, 'Dovanos'),
(7, 'Įranga'),
(8, 'Bendros išlaidos'),
(9, 'Mokesčiai'),
(10, 'Neplanuotos išlaidos'),
(11, 'Išlyginimas');

-- --------------------------------------------------------

--
-- Table structure for table `kvietimai`
--

CREATE TABLE `kvietimai` (
  `id_kvietimas` int(11) NOT NULL,
  `tokenas` varchar(10) NOT NULL,
  `sukurimo_data` date NOT NULL,
  `galiojimo_trukme` date NOT NULL,
  `kvietimo_busena` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `kvietimo_busenos`
--

CREATE TABLE `kvietimo_busenos` (
  `id_kvietimo_busena` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `kvietimo_busenos`
--

INSERT INTO `kvietimo_busenos` (`id_kvietimo_busena`, `name`) VALUES
(1, 'aktyvus'),
(2, 'pasibaiges'),
(3, 'panaudotas');

-- --------------------------------------------------------

--
-- Table structure for table `mokejimai`
--

CREATE TABLE `mokejimai` (
  `id_mokejimas` int(11) NOT NULL,
  `fk_id_skolos_dalis` int(11) NOT NULL,
  `fk_id_vartotojas` int(11) NOT NULL,
  `data` date NOT NULL,
  `suma` decimal(10,2) NOT NULL,
  `kursas_eurui` decimal(10,4) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `nariu_busenos`
--

CREATE TABLE `nariu_busenos` (
  `id_nario_busena` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `nariu_busenos`
--

INSERT INTO `nariu_busenos` (`id_nario_busena`, `name`) VALUES
(1, 'aktyvus'),
(2, 'paliko'),
(3, 'pasalintas');

-- --------------------------------------------------------

--
-- Table structure for table `pranesimai`
--

CREATE TABLE `pranesimai` (
  `id_pranesimas` int(11) NOT NULL,
  `fk_id_vartotojas` int(11) NOT NULL,
  `tipas` enum('group_invite','friend_request','payment_received','payment_reminder','new_expense','group_message','personal_message','system') NOT NULL,
  `pavadinimas` varchar(255) NOT NULL,
  `tekstas` text NOT NULL,
  `nuskaityta` tinyint(1) NOT NULL DEFAULT 0,
  `sukurta` datetime NOT NULL DEFAULT current_timestamp(),
  `action_url` varchar(255) DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pranesimai`
--

INSERT INTO `pranesimai` (`id_pranesimas`, `fk_id_vartotojas`, `tipas`, `pavadinimas`, `tekstas`, `nuskaityta`, `sukurta`, `action_url`, `metadata`) VALUES
(19, 10, 'group_message', 'Nauja žinutė grupėje \"testine\"', 'test1 test1: sw', 0, '2025-12-11 00:49:54', '/groups/15', '{\"type\":\"group_message\",\"groupId\":15,\"messageId\":46,\"senderId\":9}'),
(21, 10, 'group_message', 'Nauja žinutė grupėje \"testine\"', 'test1 test1: aa', 0, '2025-12-11 00:50:19', '/groups/15', '{\"type\":\"group_message\",\"groupId\":15,\"messageId\":47,\"senderId\":9}'),
(23, 10, 'group_message', 'Nauja žinutė grupėje \"testine\"', 'test1 test1: aa', 0, '2025-12-11 01:09:16', '/groups/15?tab=chat', '{\"type\":\"group_message\",\"groupId\":15,\"messageId\":48,\"senderId\":9}'),
(25, 10, 'group_message', 'Nauja žinutė grupėje \"testine\"', 'test1 test1: aa', 0, '2025-12-11 01:09:48', '/groups/15?tab=chat', '{\"type\":\"group_message\",\"groupId\":15,\"messageId\":49,\"senderId\":9}'),
(27, 10, 'group_message', 'Nauja žinutė grupėje \"testine\"', 'test1 test1: aa', 0, '2025-12-11 01:09:54', '/groups/15?tab=chat', '{\"type\":\"group_message\",\"groupId\":15,\"messageId\":50,\"senderId\":9}'),
(29, 10, 'group_message', 'Nauja žinutė grupėje \"testine\"', 'test1 test1: aa', 0, '2025-12-11 01:10:46', '/groups/15?tab=chat', '{\"type\":\"group_message\",\"groupId\":15,\"messageId\":51,\"senderId\":9}'),
(31, 10, 'group_message', 'Nauja žinutė grupėje \"testine\"', 'test1 test1: aa', 0, '2025-12-11 01:13:35', '/groups/15?tab=chat', '{\"type\":\"group_message\",\"groupId\":15,\"messageId\":52,\"senderId\":9}'),
(33, 10, 'group_message', 'Nauja žinutė grupėje \"testine\"', 'test1 test1: aa', 0, '2025-12-11 01:17:02', '/groups/15?tab=chat', '{\"type\":\"group_message\",\"groupId\":15,\"messageId\":53,\"senderId\":9}');

-- --------------------------------------------------------

--
-- Table structure for table `pranesimo_busenos`
--

CREATE TABLE `pranesimo_busenos` (
  `id_pranesimo_busena` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pranesimo_busenos`
--

INSERT INTO `pranesimo_busenos` (`id_pranesimo_busena`, `name`) VALUES
(0, 'neperskaitytas'),
(1, 'perskaitytas');

-- --------------------------------------------------------

--
-- Table structure for table `pranesimu_nustatymai`
--

CREATE TABLE `pranesimu_nustatymai` (
  `id_pranesimu_nustatymai` int(11) NOT NULL,
  `fk_id_vartotojas` int(11) NOT NULL,
  `el_pastas_aktyvus` tinyint(1) NOT NULL DEFAULT 1,
  `push_pranesimai` tinyint(1) NOT NULL DEFAULT 1,
  `draugu_kvietimai` tinyint(1) NOT NULL DEFAULT 1,
  `grupes_kvietimai` tinyint(1) NOT NULL DEFAULT 1,
  `naujos_islaidos` tinyint(1) NOT NULL DEFAULT 1,
  `mokejimo_priminimai` tinyint(1) NOT NULL DEFAULT 1,
  `zinutes` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `pranesimu_nustatymai`
--

INSERT INTO `pranesimu_nustatymai` (`id_pranesimu_nustatymai`, `fk_id_vartotojas`, `el_pastas_aktyvus`, `push_pranesimai`, `draugu_kvietimai`, `grupes_kvietimai`, `naujos_islaidos`, `mokejimo_priminimai`, `zinutes`) VALUES
(1, 8, 1, 1, 1, 1, 1, 1, 1),
(2, 9, 1, 1, 1, 1, 1, 1, 1);

-- --------------------------------------------------------

--
-- Table structure for table `roles`
--

CREATE TABLE `roles` (
  `id_role` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `roles`
--

INSERT INTO `roles` (`id_role`, `name`) VALUES
(1, 'svecias'),
(2, 'grupes narys'),
(3, 'grupes sukurejas');

-- --------------------------------------------------------

--
-- Table structure for table `skolos`
--

CREATE TABLE `skolos` (
  `id_skola` int(11) NOT NULL,
  `fk_id_grupe` int(11) NOT NULL,
  `fk_id_vartotojas` int(11) NOT NULL,
  `pavadinimas` varchar(50) NOT NULL,
  `aprasymas` varchar(255) DEFAULT NULL,
  `suma` decimal(10,2) NOT NULL,
  `kursas_eurui` decimal(10,4) NOT NULL,
  `sukurimo_data` date NOT NULL,
  `paskutinio_keitimo_data` date NOT NULL,
  `terminas` date NOT NULL,
  `valiutos_kodas` int(11) NOT NULL,
  `skolos_statusas` int(11) NOT NULL,
  `kategorija` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `skolos_dalys`
--

CREATE TABLE `skolos_dalys` (
  `id_skolos_dalis` int(11) NOT NULL,
  `fk_id_skola` int(11) NOT NULL,
  `fk_id_vartotojas` int(11) NOT NULL,
  `suma` decimal(10,2) NOT NULL,
  `procentas` decimal(5,2) NOT NULL,
  `apmoketa` tinyint(1) NOT NULL,
  `delspinigiai` tinyint(1) NOT NULL,
  `vaidmuo` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `skolu_statusai`
--

CREATE TABLE `skolu_statusai` (
  `id_skolos_statusas` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `skolu_statusai`
--

INSERT INTO `skolu_statusai` (`id_skolos_statusas`, `name`) VALUES
(1, 'aktyvi'),
(2, 'islyginta'),
(3, 'istrinta');

-- --------------------------------------------------------

--
-- Table structure for table `slaptazodzio_atkurimas`
--

CREATE TABLE `slaptazodzio_atkurimas` (
  `id_slaptazodzio_atkurimas` int(11) NOT NULL,
  `fk_id_vartotojas` int(11) NOT NULL,
  `tokenas` varchar(10) NOT NULL,
  `sukurimo_data` datetime NOT NULL,
  `galiojimo_trukme` datetime NOT NULL,
  `panaudotas` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `slaptazodzio_atkurimas`
--

INSERT INTO `slaptazodzio_atkurimas` (`id_slaptazodzio_atkurimas`, `fk_id_vartotojas`, `tokenas`, `sukurimo_data`, `galiojimo_trukme`, `panaudotas`) VALUES
(5, 8, '16c9fbc45e', '2025-12-10 01:29:13', '2025-12-10 02:29:13', 1),
(6, 8, '1d71ab2901', '2025-12-10 13:26:26', '2025-12-10 14:26:26', 1),
(7, 8, '159b57b363', '2025-12-10 21:49:41', '2025-12-10 22:49:41', 1);

-- --------------------------------------------------------

--
-- Table structure for table `sukuria`
--

CREATE TABLE `sukuria` (
  `fk_id_kvietimas` int(11) NOT NULL,
  `fk_id_grupes_narys` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- --------------------------------------------------------

--
-- Table structure for table `vaidmenys`
--

CREATE TABLE `vaidmenys` (
  `id_vaidmuo` int(11) NOT NULL,
  `name` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vaidmenys`
--

INSERT INTO `vaidmenys` (`id_vaidmuo`, `name`) VALUES
(1, 'skolininkas'),
(2, 'kreditorius');

-- --------------------------------------------------------

--
-- Table structure for table `valiutos`
--

CREATE TABLE `valiutos` (
  `id_valiuta` int(11) NOT NULL,
  `name` varchar(50) NOT NULL,
  `santykis` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `valiutos`
--

INSERT INTO `valiutos` (`id_valiuta`, `name`, `santykis`) VALUES
(1, 'EUR', 1),
(2, 'USD', 1.1634),
(3, 'PLN', 4.2248);

-- --------------------------------------------------------

--
-- Table structure for table `vartotojai`
--

CREATE TABLE `vartotojai` (
  `id_vartotojas` int(11) NOT NULL,
  `vardas` varchar(30) NOT NULL,
  `pavarde` varchar(30) NOT NULL,
  `el_pastas` varchar(50) NOT NULL,
  `slaptazodis_hash` varchar(64) NOT NULL,
  `sukurimo_data` datetime NOT NULL,
  `paskutinis_prisijungimas` datetime NOT NULL,
  `valiutos_kodas` int(11) NOT NULL,
  `avatar_url` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vartotojai`
--

INSERT INTO `vartotojai` (`id_vartotojas`, `vardas`, `pavarde`, `el_pastas`, `slaptazodis_hash`, `sukurimo_data`, `paskutinis_prisijungimas`, `valiutos_kodas`, `avatar_url`) VALUES
(8, 'Kazkas', 'Kazkas', 'kazkas@example.com', '6c428ba340fd91d746f5df7c2731118679e307bcf6617f9176adeb59ba20b8c6', '2025-12-03 15:40:21', '2025-12-10 21:51:15', 1, '/uploads/avatars/1765318585169-8471192.png'),
(9, 'test1', 'test1', 'test1@example.com', '744ea9ec6fa0a83e9764b4e323d5be6b55a5accfc7fe4c08eab6a8de1fca4855', '2025-12-03 18:39:07', '2025-12-10 21:59:32', 1, '/uploads/avatars/1765318616988-507908848.png'),
(10, 'test2', 'test2', 'test2@example.com', '759cfde265aaddb6f728ed08d97862bbd9b56fd39de97a049c640b4c5b70aac9', '2025-12-03 19:16:25', '2025-12-10 19:04:40', 1, '/uploads/avatars/1765319419696-742828989.png');

-- --------------------------------------------------------

--
-- Table structure for table `vartotoju_draugystes`
--

CREATE TABLE `vartotoju_draugystes` (
  `id_draugyste` int(11) NOT NULL,
  `fk_requester_id` int(11) NOT NULL,
  `fk_addressee_id` int(11) NOT NULL,
  `status` enum('pending','accepted','blocked') NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  `updated_at` datetime NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `vartotoju_draugystes`
--

INSERT INTO `vartotoju_draugystes` (`id_draugyste`, `fk_requester_id`, `fk_addressee_id`, `status`, `created_at`, `updated_at`) VALUES
(3, 10, 9, 'accepted', '2025-12-03 19:16:43', '2025-12-07 20:08:11'),
(4, 10, 8, 'accepted', '2025-12-03 19:16:53', '2025-12-03 19:17:01'),
(13, 9, 8, 'accepted', '2025-12-11 01:20:43', '2025-12-11 01:20:50');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `asmeniniai_pranesimai`
--
ALTER TABLE `asmeniniai_pranesimai`
  ADD PRIMARY KEY (`id_asmeninis_pranesimas`),
  ADD KEY `pranesimo_busena` (`pranesimo_busena`),
  ADD KEY `fk_id_vartotojas_siuntejas` (`fk_id_vartotojas_siuntejas`),
  ADD KEY `fk_id_vartotojas_gavejas` (`fk_id_vartotojas_gavejas`);

--
-- Indexes for table `ataskaitos`
--
ALTER TABLE `ataskaitos`
  ADD PRIMARY KEY (`id_ataskaita`),
  ADD KEY `fk_id_vartotojas` (`fk_id_vartotojas`);

--
-- Indexes for table `ataskaitos_tipas`
--
ALTER TABLE `ataskaitos_tipas`
  ADD PRIMARY KEY (`id_ataskaitos_tipas`);

--
-- Indexes for table `delspinigiai`
--
ALTER TABLE `delspinigiai`
  ADD PRIMARY KEY (`id_delspinigiai`),
  ADD UNIQUE KEY `uq_delspinigiai_skolos_dalis` (`fk_id_skolos_dalis`);

--
-- Indexes for table `grupes`
--
ALTER TABLE `grupes`
  ADD PRIMARY KEY (`id_grupe`),
  ADD KEY `fk_id_vartotojas` (`fk_id_vartotojas`);

--
-- Indexes for table `grupes_istorija`
--
ALTER TABLE `grupes_istorija`
  ADD PRIMARY KEY (`id_istorija`),
  ADD KEY `idx_gi_grupe` (`fk_id_grupe`),
  ADD KEY `idx_gi_user` (`fk_id_vartotojas`),
  ADD KEY `idx_gi_time` (`sukurta`);

--
-- Indexes for table `grupes_nariai`
--
ALTER TABLE `grupes_nariai`
  ADD PRIMARY KEY (`id_grupes_narys`),
  ADD KEY `fk_id_grupe` (`fk_id_grupe`),
  ADD KEY `fk_id_sistemos_istorija` (`fk_id_sistemos_istorija`),
  ADD KEY `fk_id_vartotojas` (`fk_id_vartotojas`),
  ADD KEY `role` (`role`),
  ADD KEY `nario_busena` (`nario_busena`);

--
-- Indexes for table `grupes_zinutes`
--
ALTER TABLE `grupes_zinutes`
  ADD PRIMARY KEY (`id_grupes_zinute`),
  ADD KEY `fk_id_grupes_narys` (`fk_id_grupes_narys`),
  ADD KEY `fk_id_grupe` (`fk_id_grupe`);

--
-- Indexes for table `kategorijos`
--
ALTER TABLE `kategorijos`
  ADD PRIMARY KEY (`id_kategorija`);

--
-- Indexes for table `kvietimai`
--
ALTER TABLE `kvietimai`
  ADD PRIMARY KEY (`id_kvietimas`),
  ADD KEY `kvietimo_busena` (`kvietimo_busena`);

--
-- Indexes for table `kvietimo_busenos`
--
ALTER TABLE `kvietimo_busenos`
  ADD PRIMARY KEY (`id_kvietimo_busena`);

--
-- Indexes for table `mokejimai`
--
ALTER TABLE `mokejimai`
  ADD PRIMARY KEY (`id_mokejimas`),
  ADD KEY `fk_id_skolos_dalis` (`fk_id_skolos_dalis`),
  ADD KEY `fk_id_vartotojas` (`fk_id_vartotojas`);

--
-- Indexes for table `nariu_busenos`
--
ALTER TABLE `nariu_busenos`
  ADD PRIMARY KEY (`id_nario_busena`);

--
-- Indexes for table `pranesimai`
--
ALTER TABLE `pranesimai`
  ADD PRIMARY KEY (`id_pranesimas`),
  ADD KEY `fk_id_vartotojas` (`fk_id_vartotojas`);

--
-- Indexes for table `pranesimo_busenos`
--
ALTER TABLE `pranesimo_busenos`
  ADD PRIMARY KEY (`id_pranesimo_busena`);

--
-- Indexes for table `pranesimu_nustatymai`
--
ALTER TABLE `pranesimu_nustatymai`
  ADD PRIMARY KEY (`id_pranesimu_nustatymai`),
  ADD KEY `fk_id_vartotojas` (`fk_id_vartotojas`);

--
-- Indexes for table `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id_role`);

--
-- Indexes for table `skolos`
--
ALTER TABLE `skolos`
  ADD PRIMARY KEY (`id_skola`),
  ADD KEY `fk_id_grupe` (`fk_id_grupe`),
  ADD KEY `fk_id_vartotojas` (`fk_id_vartotojas`),
  ADD KEY `valiutos_kodas` (`valiutos_kodas`),
  ADD KEY `skolos_statusas` (`skolos_statusas`),
  ADD KEY `kategorija` (`kategorija`);

--
-- Indexes for table `skolos_dalys`
--
ALTER TABLE `skolos_dalys`
  ADD PRIMARY KEY (`id_skolos_dalis`),
  ADD KEY `fk_id_skola` (`fk_id_skola`),
  ADD KEY `fk_id_vartotojas` (`fk_id_vartotojas`),
  ADD KEY `vaidmuo` (`vaidmuo`);

--
-- Indexes for table `skolu_statusai`
--
ALTER TABLE `skolu_statusai`
  ADD PRIMARY KEY (`id_skolos_statusas`);

--
-- Indexes for table `slaptazodzio_atkurimas`
--
ALTER TABLE `slaptazodzio_atkurimas`
  ADD PRIMARY KEY (`id_slaptazodzio_atkurimas`),
  ADD KEY `fk_id_vartotojas` (`fk_id_vartotojas`);

--
-- Indexes for table `sukuria`
--
ALTER TABLE `sukuria`
  ADD PRIMARY KEY (`fk_id_kvietimas`,`fk_id_grupes_narys`),
  ADD KEY `fk_id_grupes_narys` (`fk_id_grupes_narys`);

--
-- Indexes for table `vaidmenys`
--
ALTER TABLE `vaidmenys`
  ADD PRIMARY KEY (`id_vaidmuo`);

--
-- Indexes for table `valiutos`
--
ALTER TABLE `valiutos`
  ADD PRIMARY KEY (`id_valiuta`);

--
-- Indexes for table `vartotojai`
--
ALTER TABLE `vartotojai`
  ADD PRIMARY KEY (`id_vartotojas`),
  ADD KEY `valiutos_kodas` (`valiutos_kodas`);

--
-- Indexes for table `vartotoju_draugystes`
--
ALTER TABLE `vartotoju_draugystes`
  ADD PRIMARY KEY (`id_draugyste`),
  ADD UNIQUE KEY `uq_friend_pair` (`fk_requester_id`,`fk_addressee_id`),
  ADD KEY `fk_draug_add` (`fk_addressee_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `asmeniniai_pranesimai`
--
ALTER TABLE `asmeniniai_pranesimai`
  MODIFY `id_asmeninis_pranesimas` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=93;

--
-- AUTO_INCREMENT for table `ataskaitos`
--
ALTER TABLE `ataskaitos`
  MODIFY `id_ataskaita` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `ataskaitos_tipas`
--
ALTER TABLE `ataskaitos_tipas`
  MODIFY `id_ataskaitos_tipas` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `delspinigiai`
--
ALTER TABLE `delspinigiai`
  MODIFY `id_delspinigiai` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `grupes`
--
ALTER TABLE `grupes`
  MODIFY `id_grupe` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=19;

--
-- AUTO_INCREMENT for table `grupes_istorija`
--
ALTER TABLE `grupes_istorija`
  MODIFY `id_istorija` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;

--
-- AUTO_INCREMENT for table `grupes_nariai`
--
ALTER TABLE `grupes_nariai`
  MODIFY `id_grupes_narys` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT for table `grupes_zinutes`
--
ALTER TABLE `grupes_zinutes`
  MODIFY `id_grupes_zinute` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=54;

--
-- AUTO_INCREMENT for table `kategorijos`
--
ALTER TABLE `kategorijos`
  MODIFY `id_kategorija` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `kvietimai`
--
ALTER TABLE `kvietimai`
  MODIFY `id_kvietimas` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `kvietimo_busenos`
--
ALTER TABLE `kvietimo_busenos`
  MODIFY `id_kvietimo_busena` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `mokejimai`
--
ALTER TABLE `mokejimai`
  MODIFY `id_mokejimas` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `nariu_busenos`
--
ALTER TABLE `nariu_busenos`
  MODIFY `id_nario_busena` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `pranesimai`
--
ALTER TABLE `pranesimai`
  MODIFY `id_pranesimas` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=35;

--
-- AUTO_INCREMENT for table `pranesimo_busenos`
--
ALTER TABLE `pranesimo_busenos`
  MODIFY `id_pranesimo_busena` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `pranesimu_nustatymai`
--
ALTER TABLE `pranesimu_nustatymai`
  MODIFY `id_pranesimu_nustatymai` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id_role` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `skolos`
--
ALTER TABLE `skolos`
  MODIFY `id_skola` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `skolos_dalys`
--
ALTER TABLE `skolos_dalys`
  MODIFY `id_skolos_dalis` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `skolu_statusai`
--
ALTER TABLE `skolu_statusai`
  MODIFY `id_skolos_statusas` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `slaptazodzio_atkurimas`
--
ALTER TABLE `slaptazodzio_atkurimas`
  MODIFY `id_slaptazodzio_atkurimas` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `vaidmenys`
--
ALTER TABLE `vaidmenys`
  MODIFY `id_vaidmuo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `valiutos`
--
ALTER TABLE `valiutos`
  MODIFY `id_valiuta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `vartotojai`
--
ALTER TABLE `vartotojai`
  MODIFY `id_vartotojas` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `vartotoju_draugystes`
--
ALTER TABLE `vartotoju_draugystes`
  MODIFY `id_draugyste` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `asmeniniai_pranesimai`
--
ALTER TABLE `asmeniniai_pranesimai`
  ADD CONSTRAINT `asmeniniai_pranesimai_ibfk_1` FOREIGN KEY (`pranesimo_busena`) REFERENCES `pranesimo_busenos` (`id_pranesimo_busena`),
  ADD CONSTRAINT `asmeniniai_pranesimai_ibfk_2` FOREIGN KEY (`fk_id_vartotojas_siuntejas`) REFERENCES `vartotojai` (`id_vartotojas`),
  ADD CONSTRAINT `asmeniniai_pranesimai_ibfk_3` FOREIGN KEY (`fk_id_vartotojas_gavejas`) REFERENCES `vartotojai` (`id_vartotojas`);

--
-- Constraints for table `ataskaitos`
--
ALTER TABLE `ataskaitos`
  ADD CONSTRAINT `ataskaitos_ibfk_1` FOREIGN KEY (`fk_id_vartotojas`) REFERENCES `vartotojai` (`id_vartotojas`);

--
-- Constraints for table `delspinigiai`
--
ALTER TABLE `delspinigiai`
  ADD CONSTRAINT `delspinigiai_ibfk_1` FOREIGN KEY (`fk_id_skolos_dalis`) REFERENCES `skolos_dalys` (`id_skolos_dalis`);

--
-- Constraints for table `grupes`
--
ALTER TABLE `grupes`
  ADD CONSTRAINT `grupes_ibfk_2` FOREIGN KEY (`fk_id_vartotojas`) REFERENCES `vartotojai` (`id_vartotojas`);

--
-- Constraints for table `grupes_istorija`
--
ALTER TABLE `grupes_istorija`
  ADD CONSTRAINT `fk_gi_grupe` FOREIGN KEY (`fk_id_grupe`) REFERENCES `grupes` (`id_grupe`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_gi_user` FOREIGN KEY (`fk_id_vartotojas`) REFERENCES `vartotojai` (`id_vartotojas`) ON DELETE SET NULL;

--
-- Constraints for table `grupes_nariai`
--
ALTER TABLE `grupes_nariai`
  ADD CONSTRAINT `grupes_nariai_ibfk_1` FOREIGN KEY (`fk_id_grupe`) REFERENCES `grupes` (`id_grupe`),
  ADD CONSTRAINT `grupes_nariai_ibfk_2` FOREIGN KEY (`fk_id_sistemos_istorija`) REFERENCES `sistemos_istorijos` (`id_sistemos_istorija`),
  ADD CONSTRAINT `grupes_nariai_ibfk_3` FOREIGN KEY (`fk_id_vartotojas`) REFERENCES `vartotojai` (`id_vartotojas`),
  ADD CONSTRAINT `grupes_nariai_ibfk_4` FOREIGN KEY (`role`) REFERENCES `roles` (`id_role`),
  ADD CONSTRAINT `grupes_nariai_ibfk_5` FOREIGN KEY (`nario_busena`) REFERENCES `nariu_busenos` (`id_nario_busena`);

--
-- Constraints for table `grupes_zinutes`
--
ALTER TABLE `grupes_zinutes`
  ADD CONSTRAINT `grupes_zinutes_ibfk_1` FOREIGN KEY (`fk_id_grupes_narys`) REFERENCES `grupes_nariai` (`id_grupes_narys`),
  ADD CONSTRAINT `grupes_zinutes_ibfk_2` FOREIGN KEY (`fk_id_grupe`) REFERENCES `grupes` (`id_grupe`);

--
-- Constraints for table `kvietimai`
--
ALTER TABLE `kvietimai`
  ADD CONSTRAINT `kvietimai_ibfk_1` FOREIGN KEY (`kvietimo_busena`) REFERENCES `kvietimo_busenos` (`id_kvietimo_busena`);

--
-- Constraints for table `mokejimai`
--
ALTER TABLE `mokejimai`
  ADD CONSTRAINT `mokejimai_ibfk_1` FOREIGN KEY (`fk_id_skolos_dalis`) REFERENCES `skolos_dalys` (`id_skolos_dalis`),
  ADD CONSTRAINT `mokejimai_ibfk_2` FOREIGN KEY (`fk_id_vartotojas`) REFERENCES `vartotojai` (`id_vartotojas`);

--
-- Constraints for table `pranesimai`
--
ALTER TABLE `pranesimai`
  ADD CONSTRAINT `pranesimai_ibfk_1` FOREIGN KEY (`fk_id_vartotojas`) REFERENCES `vartotojai` (`id_vartotojas`) ON DELETE CASCADE;

--
-- Constraints for table `pranesimu_nustatymai`
--
ALTER TABLE `pranesimu_nustatymai`
  ADD CONSTRAINT `pranesimu_nustatymai_ibfk_1` FOREIGN KEY (`fk_id_vartotojas`) REFERENCES `vartotojai` (`id_vartotojas`);

--
-- Constraints for table `skolos`
--
ALTER TABLE `skolos`
  ADD CONSTRAINT `skolos_ibfk_1` FOREIGN KEY (`fk_id_grupe`) REFERENCES `grupes` (`id_grupe`),
  ADD CONSTRAINT `skolos_ibfk_2` FOREIGN KEY (`fk_id_vartotojas`) REFERENCES `vartotojai` (`id_vartotojas`),
  ADD CONSTRAINT `skolos_ibfk_3` FOREIGN KEY (`valiutos_kodas`) REFERENCES `valiutos` (`id_valiuta`),
  ADD CONSTRAINT `skolos_ibfk_4` FOREIGN KEY (`skolos_statusas`) REFERENCES `skolu_statusai` (`id_skolos_statusas`),
  ADD CONSTRAINT `skolos_ibfk_5` FOREIGN KEY (`kategorija`) REFERENCES `kategorijos` (`id_kategorija`);

--
-- Constraints for table `skolos_dalys`
--
ALTER TABLE `skolos_dalys`
  ADD CONSTRAINT `skolos_dalys_ibfk_1` FOREIGN KEY (`fk_id_skola`) REFERENCES `skolos` (`id_skola`),
  ADD CONSTRAINT `skolos_dalys_ibfk_2` FOREIGN KEY (`fk_id_vartotojas`) REFERENCES `vartotojai` (`id_vartotojas`),
  ADD CONSTRAINT `skolos_dalys_ibfk_3` FOREIGN KEY (`vaidmuo`) REFERENCES `vaidmenys` (`id_vaidmuo`);

--
-- Constraints for table `slaptazodzio_atkurimas`
--
ALTER TABLE `slaptazodzio_atkurimas`
  ADD CONSTRAINT `slaptazodzio_atkurimas_ibfk_1` FOREIGN KEY (`fk_id_vartotojas`) REFERENCES `vartotojai` (`id_vartotojas`);

--
-- Constraints for table `sukuria`
--
ALTER TABLE `sukuria`
  ADD CONSTRAINT `sukuria_ibfk_1` FOREIGN KEY (`fk_id_kvietimas`) REFERENCES `kvietimai` (`id_kvietimas`),
  ADD CONSTRAINT `sukuria_ibfk_2` FOREIGN KEY (`fk_id_grupes_narys`) REFERENCES `grupes_nariai` (`id_grupes_narys`);

--
-- Constraints for table `vartotojai`
--
ALTER TABLE `vartotojai`
  ADD CONSTRAINT `vartotojai_ibfk_1` FOREIGN KEY (`valiutos_kodas`) REFERENCES `valiutos` (`id_valiuta`);

--
-- Constraints for table `vartotoju_draugystes`
--
ALTER TABLE `vartotoju_draugystes`
  ADD CONSTRAINT `fk_draug_add` FOREIGN KEY (`fk_addressee_id`) REFERENCES `vartotojai` (`id_vartotojas`) ON DELETE CASCADE,
  ADD CONSTRAINT `fk_draug_req` FOREIGN KEY (`fk_requester_id`) REFERENCES `vartotojai` (`id_vartotojas`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
