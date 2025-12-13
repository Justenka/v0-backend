-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 14, 2025 at 12:51 AM
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
-- Database: `skolu_departamentas5`
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
(97, 8, 10, 'Yo', '2025-12-14 00:49:24', 1),
(98, 8, 10, 'užmesk ant skolos pls', '2025-12-14 00:49:47', 1),
(99, 10, 8, '👌', '2025-12-14 00:49:51', 1),
(103, 8, 10, '🍻', '2025-12-14 01:17:04', 1);

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
  `dienos_proc` decimal(5,2) DEFAULT NULL,
  `pradzios_data` date NOT NULL,
  `pabaigos_data` date DEFAULT NULL,
  `apskaiciuota_suma` decimal(10,2) NOT NULL,
  `aktyvus` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `delspinigiai`
--

INSERT INTO `delspinigiai` (`id_delspinigiai`, `fk_id_skolos_dalis`, `dienos_proc`, `pradzios_data`, `pabaigos_data`, `apskaiciuota_suma`, `aktyvus`) VALUES
(5, 127, 5.00, '2025-12-27', NULL, 0.00, 1),
(6, 128, 5.00, '2025-12-27', NULL, 0.00, 1),
(7, 129, 5.00, '2025-12-27', NULL, 0.00, 1),
(8, 130, NULL, '2025-12-27', NULL, 0.00, 1),
(9, 131, NULL, '2025-12-27', NULL, 0.00, 1),
(10, 133, NULL, '2025-12-27', NULL, 0.00, 1);

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
(28, 8, 'Teletabiai', NULL, '2025-12-12');

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
(91, 28, 8, 'group_created', 'Grupė \"bbz\" sukurta.', '2025-12-12 20:07:38', '{\"ownerId\":8}'),
(92, 28, 8, 'member_added', 'Pridėtas narys \"test1 test1\".', '2025-12-12 20:07:50', '{\"memberId\":9,\"memberName\":\"test1 test1\",\"memberEmail\":\"test1@example.com\"}'),
(93, 28, 8, 'member_added', 'Pridėtas narys \"test2 test2\".', '2025-12-12 20:07:54', '{\"memberId\":10,\"memberName\":\"test2 test2\",\"memberEmail\":\"test2@example.com\"}'),
(94, 28, 8, 'expense_added', 'Išlaida \"nahui\" pridėta (30 EUR).', '2025-12-12 20:08:07', '{\"debtId\":41,\"amount\":30,\"currencyCode\":\"EUR\",\"paidByUserId\":8,\"createdByUserId\":8}'),
(95, 28, 8, 'expense_added', 'Išlaida \"bbz\" pridėta (2344234 JPY).', '2025-12-12 20:09:22', '{\"debtId\":42,\"amount\":2344234,\"currencyCode\":\"JPY\",\"paidByUserId\":8,\"createdByUserId\":8}'),
(96, 28, 8, 'expense_deleted', 'Išlaida \"bbz\" panaikinta (2344234 JPY).', '2025-12-12 20:13:47', '{\"debtId\":42,\"amount\":2344234,\"currencyCode\":\"JPY\",\"paidByUserId\":8,\"deletedByUserId\":8}'),
(97, 28, 8, 'expense_deleted', 'Išlaida \"Išlyginta skola\" panaikinta (4280.24 EUR).', '2025-12-12 20:13:50', '{\"debtId\":44,\"amount\":4280.24,\"currencyCode\":\"EUR\",\"paidByUserId\":8,\"deletedByUserId\":8}'),
(98, 28, 8, 'expense_deleted', 'Išlaida \"Išlyginta skola\" panaikinta (4280.24 EUR).', '2025-12-12 20:13:52', '{\"debtId\":43,\"amount\":4280.24,\"currencyCode\":\"EUR\",\"paidByUserId\":8,\"deletedByUserId\":8}'),
(99, 28, 8, 'expense_deleted', 'Išlaida \"nahui\" panaikinta (30 EUR).', '2025-12-12 20:13:55', '{\"debtId\":41,\"amount\":30,\"currencyCode\":\"EUR\",\"paidByUserId\":8,\"deletedByUserId\":8}'),
(100, 28, 8, 'expense_added', 'Išlaida \"3333\" pridėta (4 USD).', '2025-12-12 20:14:21', '{\"debtId\":45,\"amount\":4,\"currencyCode\":\"USD\",\"paidByUserId\":9,\"createdByUserId\":8}'),
(101, 28, 8, 'payment_registered', 'Mokėjimas užregistruotas: Kazkas Kazkas → test1 test1, suma 0.5688149688149688 EUR (0.57 EUR).', '2025-12-12 20:14:36', '{\"groupId\":28,\"fromUserId\":8,\"toUserId\":9,\"amount\":0.5688149688149688,\"originalAmount\":0.5688149688149688,\"currencyCode\":\"EUR\",\"conversionRate\":1,\"note\":null,\"affectedPartsCount\":1}'),
(102, 28, 8, 'payment_registered', 'Mokėjimas užregistruotas: Kazkas Kazkas → test1 test1, suma 0.57 EUR (0.57 EUR).', '2025-12-12 20:14:53', '{\"groupId\":28,\"fromUserId\":8,\"toUserId\":9,\"amount\":0.57,\"originalAmount\":0.57,\"currencyCode\":\"EUR\",\"conversionRate\":1,\"note\":null,\"affectedPartsCount\":1}'),
(103, 28, 8, 'expense_added', 'Išlaida \"data\" pridėta (234 EUR).', '2025-12-12 21:19:08', '{\"debtId\":46,\"amount\":234,\"currencyCode\":\"EUR\",\"paidByUserId\":8,\"createdByUserId\":8}'),
(104, 28, 8, 'expense_added', 'Išlaida \"fghfhg\" pridėta (45645 EUR).', '2025-12-12 21:34:29', '{\"debtId\":47,\"amount\":45645,\"currencyCode\":\"EUR\",\"paidByUserId\":8,\"createdByUserId\":8}'),
(105, 28, 8, 'expense_added', 'Išlaida \"sdfg\" pridėta (34534 EUR).', '2025-12-12 22:28:05', '{\"debtId\":50,\"amount\":34534,\"currencyCode\":\"EUR\",\"paidByUserId\":9,\"createdByUserId\":8}'),
(106, 28, 8, 'expense_deleted', 'Išlaida \"Išlyginta skola\" panaikinta (15293 EUR).', '2025-12-12 22:42:39', '{\"debtId\":49,\"amount\":15293,\"currencyCode\":\"EUR\",\"paidByUserId\":8,\"deletedByUserId\":8}'),
(107, 28, 8, 'invite_created', 'Sugeneruota kvietimo nuoroda.', '2025-12-13 02:16:46', '{\"inviteId\":1}'),
(108, 28, 8, 'expense_edited', 'Išlaida \"dataaaa\" atnaujinta (pavadinimas: data → dataaaa).', '2025-12-13 03:21:57', '{\"debtId\":46,\"editedByUserId\":8,\"changedFields\":[{\"field\":\"title\",\"label\":\"pavadinimas\",\"oldValue\":\"data\",\"newValue\":\"dataaaa\"}]}'),
(109, 28, 8, 'expense_edited', 'Išlaida \"dataaaaaaa\" atnaujinta (pavadinimas: dataaaa → dataaaaaaa).', '2025-12-13 03:22:04', '{\"debtId\":46,\"editedByUserId\":8,\"changedFields\":[{\"field\":\"title\",\"label\":\"pavadinimas\",\"oldValue\":\"dataaaa\",\"newValue\":\"dataaaaaaa\"}]}'),
(110, 28, 8, 'expense_edited', 'Išlaida \"dataaaaaaa\" atnaujinta (kategorija: Mokesčiai → Dovanos).', '2025-12-13 03:22:09', '{\"debtId\":46,\"editedByUserId\":8,\"changedFields\":[{\"field\":\"categoryId\",\"label\":\"kategorija\",\"oldValue\":\"Mokesčiai\",\"newValue\":\"Dovanos\",\"oldId\":9,\"newId\":6}]}'),
(111, 28, 8, 'expense_added', 'Išlaida \"skoas\" pridėta (10 EUR).', '2025-12-13 03:27:52', '{\"debtId\":56,\"amount\":10,\"currencyCode\":\"EUR\",\"paidByUserId\":8,\"createdByUserId\":8,\"lateFeePercentage\":null,\"lateFeeAfterDays\":null}'),
(112, 28, 8, 'expense_edited', 'Išlaida \"skola\" atnaujinta (pavadinimas: skoas → skola).', '2025-12-13 13:55:47', '{\"debtId\":56,\"editedByUserId\":8,\"changedFields\":[{\"field\":\"title\",\"label\":\"pavadinimas\",\"oldValue\":\"skoas\",\"newValue\":\"skola\"}]}'),
(113, 28, 8, 'expense_added', 'Išlaida \"koksas\" pridėta (42 PLN).', '2025-12-13 15:09:49', '{\"debtId\":57,\"amount\":42,\"currencyCode\":\"PLN\",\"paidByUserId\":9,\"createdByUserId\":8,\"lateFeePercentage\":null,\"lateFeeAfterDays\":null}'),
(114, 28, 8, 'invite_created', 'Sugeneruota kvietimo nuoroda.', '2025-12-13 15:24:07', '{\"inviteId\":2}'),
(115, 28, 8, 'expense_added', 'Išlaida \"Modulio skola\" pridėta (410.82 EUR) su delspinigiais 5% per dieną.', '2025-12-13 23:10:16', '{\"debtId\":60,\"amount\":410.82,\"currencyCode\":\"EUR\",\"paidByUserId\":8,\"createdByUserId\":8,\"lateFeePercentage\":5,\"lateFeeAfterDays\":7}'),
(116, 28, 8, 'expense_added', 'Išlaida \"Baidarės\" pridėta (500 PLN).', '2025-12-13 23:19:16', '{\"debtId\":61,\"amount\":500,\"currencyCode\":\"PLN\",\"paidByUserId\":10,\"createdByUserId\":8,\"lateFeePercentage\":null,\"lateFeeAfterDays\":null}'),
(119, 28, 8, 'invite_created', 'Sugeneruota kvietimo nuoroda.', '2025-12-13 23:59:46', '{\"inviteId\":4}'),
(120, 28, 8, 'invite_created', 'Sugeneruota kvietimo nuoroda.', '2025-12-14 00:00:49', '{\"inviteId\":5}'),
(122, 28, 14, 'payment_registered', 'Mokėjimas užregistruotas: Arnoldas Skrodenis → Tomas Barisauskas, suma 66.16 EUR (66.16 EUR).', '2025-12-14 00:20:46', '{\"groupId\":28,\"fromUserId\":14,\"toUserId\":8,\"amount\":66.16,\"originalAmount\":66.16,\"currencyCode\":\"EUR\",\"conversionRate\":1,\"note\":null,\"affectedPartsCount\":1}');

-- --------------------------------------------------------

--
-- Table structure for table `grupes_nariai`
--

CREATE TABLE `grupes_nariai` (
  `id_grupes_narys` int(11) NOT NULL,
  `fk_id_grupe` int(11) NOT NULL,
  `fk_id_vartotojas` int(11) NOT NULL,
  `prisijungimo_data` date NOT NULL,
  `role` int(11) NOT NULL,
  `nario_busena` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `grupes_nariai`
--

INSERT INTO `grupes_nariai` (`id_grupes_narys`, `fk_id_grupe`, `fk_id_vartotojas`, `prisijungimo_data`, `role`, `nario_busena`) VALUES
(33, 28, 8, '0000-00-00', 3, 1),
(34, 28, 9, '2025-12-12', 2, 1),
(35, 28, 10, '2025-12-12', 2, 1),
(36, 28, 14, '0000-00-00', 2, 1);

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

--
-- Dumping data for table `grupes_zinutes`
--

INSERT INTO `grupes_zinutes` (`id_grupes_zinute`, `fk_id_grupes_narys`, `fk_id_grupe`, `turinys`, `siuntimo_data`, `redaguota`, `redagavimo_data`, `istrinta`) VALUES
(58, 33, 28, 'sveiki', '2025-12-14 01:04:29', 0, '2025-12-14 01:04:29', 0),
(59, 35, 28, 'wassup', '2025-12-14 01:05:05', 0, '2025-12-14 01:05:05', 0);

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

--
-- Dumping data for table `kvietimai`
--

INSERT INTO `kvietimai` (`id_kvietimas`, `tokenas`, `sukurimo_data`, `galiojimo_trukme`, `kvietimo_busena`) VALUES
(1, 'bpV08icZTt', '2025-12-13', '2025-12-20', 1),
(2, 'cJHLhekkH5', '2025-12-13', '2025-12-20', 1),
(3, 'LyhwoBlA3H', '2025-12-13', '2025-12-20', 2),
(4, 'qFrPiMk7WK', '2025-12-13', '2025-12-20', 1),
(5, 'yHaphPdsCz', '2025-12-14', '2025-12-21', 1);

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

--
-- Dumping data for table `mokejimai`
--

INSERT INTO `mokejimai` (`id_mokejimas`, `fk_id_skolos_dalis`, `fk_id_vartotojas`, `data`, `suma`, `kursas_eurui`) VALUES
(7, 136, 14, '2025-12-13', 66.16, 1.0000);

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
(37, 8, 'group_message', 'Nauja žinutė grupėje \"fff\"', 'test1 test1: aa', 1, '2025-12-11 18:37:27', '/groups/25?tab=chat', '{\"type\":\"group_message\",\"groupId\":25,\"messageId\":54,\"senderId\":9}'),
(38, 8, 'group_message', 'Nauja žinutė grupėje \"fff\"', 'test1 test1: aa', 1, '2025-12-11 18:37:47', '/groups/25?tab=chat', '{\"type\":\"group_message\",\"groupId\":25,\"messageId\":55,\"senderId\":9}'),
(39, 8, 'friend_request', 'Naujas draugo kvietimas', 'test1 test1 pakvietė jus draugauti', 1, '2025-12-11 18:38:06', '/friends', NULL),
(40, 8, 'group_message', 'Nauja žinutė grupėje \"fff\"', 'test1 test1: aa', 1, '2025-12-11 18:39:07', '/groups/25?tab=chat', '{\"type\":\"group_message\",\"groupId\":25,\"messageId\":57,\"senderId\":9}'),
(41, 8, 'friend_request', 'Naujas draugo kvietimas', 'test1 test1 pakvietė jus draugauti', 1, '2025-12-11 18:56:24', '/friends', NULL),
(42, 9, 'new_expense', 'Nauja išlaida grupėje \"fff\"', 'Kazkas Kazkas pridėjo išlaidą „123“ (123 EUR).', 0, '2025-12-11 21:01:54', '/groups/25', NULL),
(43, 9, 'new_expense', 'Nauja išlaida grupėje \"fff\"', 'Kazkas Kazkas pridėjo išlaidą „1345“ (123 EUR).', 0, '2025-12-11 21:02:48', '/groups/25', NULL),
(44, 9, 'new_expense', 'Nauja išlaida grupėje \"fff\"', 'Kazkas Kazkas pridėjo išlaidą „testas“ (100 EUR).', 0, '2025-12-11 21:11:34', '/groups/25', NULL),
(45, 9, 'new_expense', 'Nauja išlaida grupėje \"fff\"', 'Kazkas Kazkas pridėjo išlaidą „test“ (100 EUR).', 0, '2025-12-11 21:12:09', '/groups/25', NULL),
(46, 9, 'new_expense', 'Nauja išlaida grupėje \"fff\"', 'Kazkas Kazkas pridėjo išlaidą „kkkkkk“ (15 EUR).', 0, '2025-12-11 21:13:16', '/groups/25', NULL),
(47, 9, 'new_expense', 'Nauja išlaida grupėje \"fff\"', 'Kazkas Kazkas pridėjo išlaidą „ikiiii“ (5 EUR).', 0, '2025-12-11 21:13:49', '/groups/25', NULL),
(48, 9, 'new_expense', 'Nauja išlaida grupėje \"fff\"', 'Kazkas Kazkas pridėjo išlaidą „aaaa“ (15 EUR).', 0, '2025-12-11 21:14:54', '/groups/25', NULL),
(49, 9, 'new_expense', 'Nauja išlaida grupėje \"fff\"', 'Kazkas Kazkas pridėjo išlaidą „aaaaaaaaaa“ (150 EUR).', 0, '2025-12-11 21:15:31', '/groups/25', NULL),
(50, 9, 'new_expense', 'Nauja išlaida grupėje \"fff\"', 'Kazkas Kazkas pridėjo išlaidą „asd“ (100 EUR).', 0, '2025-12-11 21:23:00', '/groups/25', NULL),
(51, 9, 'new_expense', 'Nauja išlaida grupėje \"fff\"', 'Kazkas Kazkas pridėjo išlaidą „aaaa“ (100 EUR).', 0, '2025-12-11 21:23:11', '/groups/25', NULL),
(52, 9, 'new_expense', 'Nauja išlaida grupėje \"fff\"', 'Kazkas Kazkas pridėjo išlaidą „asd“ (15 EUR).', 0, '2025-12-11 21:24:09', '/groups/25', NULL),
(53, 9, 'new_expense', 'Nauja išlaida grupėje \"fff\"', 'Kazkas Kazkas pridėjo išlaidą „fdgh“ (150 EUR).', 0, '2025-12-11 21:24:29', '/groups/25', NULL),
(54, 9, 'new_expense', 'Nauja išlaida grupėje \"fff\"', 'Kazkas Kazkas pridėjo išlaidą „44“ (100 EUR).', 0, '2025-12-11 21:25:01', '/groups/25', NULL),
(55, 9, 'new_expense', 'Nauja išlaida grupėje \"fff\"', 'Kazkas Kazkas pridėjo išlaidą „4444“ (200 EUR).', 0, '2025-12-11 21:25:23', '/groups/25', NULL),
(56, 9, 'new_expense', 'Nauja išlaida grupėje \"bbz\"', 'Kazkas Kazkas pridėjo išlaidą „nahui“ (30 EUR).', 0, '2025-12-12 20:08:07', '/groups/28', NULL),
(57, 10, 'new_expense', 'Nauja išlaida grupėje \"bbz\"', 'Kazkas Kazkas pridėjo išlaidą „nahui“ (30 EUR).', 0, '2025-12-12 20:08:07', '/groups/28', NULL),
(58, 9, 'new_expense', 'Nauja išlaida grupėje \"bbz\"', 'Kazkas Kazkas pridėjo išlaidą „bbz“ (2344234 JPY).', 0, '2025-12-12 20:09:22', '/groups/28', NULL),
(59, 10, 'new_expense', 'Nauja išlaida grupėje \"bbz\"', 'Kazkas Kazkas pridėjo išlaidą „bbz“ (2344234 JPY).', 0, '2025-12-12 20:09:22', '/groups/28', NULL),
(60, 9, 'new_expense', 'Nauja išlaida grupėje \"bbz\"', 'Kazkas Kazkas pridėjo išlaidą „3333“ (4 USD).', 0, '2025-12-12 20:14:21', '/groups/28', NULL),
(61, 10, 'new_expense', 'Nauja išlaida grupėje \"bbz\"', 'Kazkas Kazkas pridėjo išlaidą „3333“ (4 USD).', 0, '2025-12-12 20:14:21', '/groups/28', NULL),
(62, 9, 'new_expense', 'Nauja išlaida grupėje \"bbz\"', 'Kazkas Kazkas pridėjo išlaidą „data“ (234 EUR).', 0, '2025-12-12 21:19:08', '/groups/28', NULL),
(63, 10, 'new_expense', 'Nauja išlaida grupėje \"bbz\"', 'Kazkas Kazkas pridėjo išlaidą „data“ (234 EUR).', 0, '2025-12-12 21:19:08', '/groups/28', NULL),
(64, 9, 'new_expense', 'Nauja išlaida grupėje \"bbz\"', 'Kazkas Kazkas pridėjo išlaidą „fghfhg“ (45645 EUR).', 0, '2025-12-12 21:34:29', '/groups/28', NULL),
(65, 10, 'new_expense', 'Nauja išlaida grupėje \"bbz\"', 'Kazkas Kazkas pridėjo išlaidą „fghfhg“ (45645 EUR).', 0, '2025-12-12 21:34:29', '/groups/28', NULL),
(66, 9, 'new_expense', 'Nauja išlaida grupėje \"bbz\"', 'Kazkas Kazkas pridėjo išlaidą „sdfg“ (34534 EUR).', 0, '2025-12-12 22:28:05', '/groups/28', NULL),
(67, 10, 'new_expense', 'Nauja išlaida grupėje \"bbz\"', 'Kazkas Kazkas pridėjo išlaidą „sdfg“ (34534 EUR).', 0, '2025-12-12 22:28:05', '/groups/28', NULL),
(68, 9, 'new_expense', 'Nauja išlaida grupėje \"bbz\"', 'Kazkas Kazkas pridėjo išlaidą „skoas“ (10 EUR).', 0, '2025-12-13 03:27:52', '/groups/28', NULL),
(69, 10, 'new_expense', 'Nauja išlaida grupėje \"bbz\"', 'Kazkas Kazkas pridėjo išlaidą „skoas“ (10 EUR).', 0, '2025-12-13 03:27:52', '/groups/28', NULL),
(70, 9, 'new_expense', 'Nauja išlaida grupėje \"bbz\"', 'Kazkas Kazkas pridėjo išlaidą „koksas“ (42 PLN).', 0, '2025-12-13 15:09:49', '/groups/28', NULL),
(71, 10, 'new_expense', 'Nauja išlaida grupėje \"bbz\"', 'Kazkas Kazkas pridėjo išlaidą „koksas“ (42 PLN).', 0, '2025-12-13 15:09:49', '/groups/28', NULL),
(72, 9, 'friend_request', 'Naujas draugo kvietimas', 'Tomas Barisauskas pakvietė jus draugauti', 0, '2025-12-13 22:15:14', '/friends', NULL),
(73, 10, 'friend_request', 'Naujas draugo kvietimas', 'Tomas Barisauskas pakvietė jus draugauti', 0, '2025-12-13 22:15:48', '/friends', NULL),
(74, 14, 'friend_request', 'Naujas draugo kvietimas', 'Tomas Barisauskas pakvietė jus draugauti', 0, '2025-12-13 22:16:02', '/friends', NULL),
(75, 14, 'friend_request', 'Naujas draugo kvietimas', 'Zivile Nuobaraite pakvietė jus draugauti', 0, '2025-12-13 22:16:15', '/friends', NULL),
(76, 10, 'friend_request', 'Naujas draugo kvietimas', 'Zivile Nuobaraite pakvietė jus draugauti', 0, '2025-12-13 22:16:23', '/friends', NULL),
(77, 14, 'friend_request', 'Naujas draugo kvietimas', 'Justinas Jankauskas pakvietė jus draugauti', 0, '2025-12-13 22:17:03', '/friends', NULL),
(78, 14, 'group_invite', 'Kvietimas į grupę', 'Tomas Barisauskas pakvietė jus prisijungti prie grupės „Skolininkai“', 1, '2025-12-13 22:30:52', '/groups/28/join?token=LyhwoBlA3H', '{\"type\":\"group_invite\",\"groupId\":28,\"inviteId\":3,\"token\":\"LyhwoBlA3H\",\"inviterId\":8}'),
(79, 9, 'new_expense', 'Nauja išlaida grupėje \"Skolininkai\"', 'Tomas Barisauskas pridėjo išlaidą „Modulio skola“ (410.82 EUR).', 0, '2025-12-13 23:10:16', '/groups/28', NULL),
(80, 14, 'new_expense', 'Nauja išlaida grupėje \"Skolininkai\"', 'Tomas Barisauskas pridėjo išlaidą „Modulio skola“ (410.82 EUR).', 0, '2025-12-13 23:10:16', '/groups/28', NULL),
(81, 10, 'new_expense', 'Nauja išlaida grupėje \"Skolininkai\"', 'Tomas Barisauskas pridėjo išlaidą „Modulio skola“ (410.82 EUR).', 0, '2025-12-13 23:10:16', '/groups/28', NULL),
(82, 9, 'new_expense', 'Nauja išlaida grupėje \"Teletabiai\"', 'Tomas Barisauskas pridėjo išlaidą „Baidarės“ (500 PLN).', 0, '2025-12-13 23:19:16', '/groups/28', NULL),
(83, 14, 'new_expense', 'Nauja išlaida grupėje \"Teletabiai\"', 'Tomas Barisauskas pridėjo išlaidą „Baidarės“ (500 PLN).', 0, '2025-12-13 23:19:16', '/groups/28', NULL),
(84, 10, 'new_expense', 'Nauja išlaida grupėje \"Teletabiai\"', 'Tomas Barisauskas pridėjo išlaidą „Baidarės“ (500 PLN).', 0, '2025-12-13 23:19:16', '/groups/28', NULL),
(85, 9, 'group_message', 'Nauja žinutė grupėje \"Teletabiai\"', 'Tomas Barisauskas: sveiki', 0, '2025-12-14 01:04:29', '/groups/28?tab=chat', '{\"type\":\"group_message\",\"groupId\":28,\"messageId\":58,\"senderId\":8}'),
(86, 14, 'group_message', 'Nauja žinutė grupėje \"Teletabiai\"', 'Tomas Barisauskas: sveiki', 0, '2025-12-14 01:04:29', '/groups/28?tab=chat', '{\"type\":\"group_message\",\"groupId\":28,\"messageId\":58,\"senderId\":8}'),
(87, 10, 'group_message', 'Nauja žinutė grupėje \"Teletabiai\"', 'Tomas Barisauskas: sveiki', 0, '2025-12-14 01:04:29', '/groups/28?tab=chat', '{\"type\":\"group_message\",\"groupId\":28,\"messageId\":58,\"senderId\":8}'),
(88, 8, 'group_message', 'Nauja žinutė grupėje \"Teletabiai\"', 'Justinas Jankauskas: wassup', 0, '2025-12-14 01:05:05', '/groups/28?tab=chat', '{\"type\":\"group_message\",\"groupId\":28,\"messageId\":59,\"senderId\":10}'),
(89, 9, 'group_message', 'Nauja žinutė grupėje \"Teletabiai\"', 'Justinas Jankauskas: wassup', 0, '2025-12-14 01:05:05', '/groups/28?tab=chat', '{\"type\":\"group_message\",\"groupId\":28,\"messageId\":59,\"senderId\":10}'),
(90, 14, 'group_message', 'Nauja žinutė grupėje \"Teletabiai\"', 'Justinas Jankauskas: wassup', 0, '2025-12-14 01:05:05', '/groups/28?tab=chat', '{\"type\":\"group_message\",\"groupId\":28,\"messageId\":59,\"senderId\":10}'),
(91, 8, 'group_invite', 'Kvietimas į grupę', 'Justinas Jankauskas pakvietė jus prisijungti prie grupės „TeIetabiai“', 1, '2025-12-14 01:20:33', '/groups/31/join?token=2jgFgnPxEF', '{\"type\":\"group_invite\",\"groupId\":31,\"inviteId\":6,\"token\":\"2jgFgnPxEF\",\"inviterId\":10}'),
(92, 8, 'group_invite', 'Kvietimas į grupę', 'Justinas Jankauskas pakvietė jus prisijungti prie grupės „TeIetabiai“', 1, '2025-12-14 01:21:32', '/groups/31/join?token=xSjmsMmRl7', '{\"type\":\"group_invite\",\"groupId\":31,\"inviteId\":7,\"token\":\"xSjmsMmRl7\",\"inviterId\":10}');

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
(2, 9, 1, 1, 1, 1, 1, 1, 1),
(3, 14, 1, 1, 1, 1, 1, 1, 1),
(4, 10, 1, 1, 1, 1, 1, 1, 1);

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

--
-- Dumping data for table `skolos`
--

INSERT INTO `skolos` (`id_skola`, `fk_id_grupe`, `fk_id_vartotojas`, `pavadinimas`, `aprasymas`, `suma`, `kursas_eurui`, `sukurimo_data`, `paskutinio_keitimo_data`, `terminas`, `valiutos_kodas`, `skolos_statusas`, `kategorija`) VALUES
(60, 28, 8, 'Modulio skola', NULL, 410.82, 1.0000, '2025-12-13', '2025-12-13', '2025-12-20', 1, 2, 9),
(61, 28, 10, 'Baidarės', NULL, 500.00, 4.2225, '2025-12-13', '2025-12-13', '2025-12-20', 3, 2, 4),
(62, 28, 8, 'Išlyginta skola', 'Automatiškai išlyginta skola', 132.31, 1.0000, '2025-12-13', '2025-12-13', '2026-01-12', 1, 1, 11),
(63, 28, 8, 'Išlyginta skola', 'Automatiškai išlyginta skola', 132.31, 1.0000, '2025-12-13', '2025-12-13', '2026-01-12', 1, 1, 11),
(64, 28, 8, 'Išlyginta skola', 'Automatiškai išlyginta skola', 13.91, 1.0000, '2025-12-13', '2025-12-13', '2026-01-12', 1, 1, 11);

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
  `sumoketa` decimal(10,2) NOT NULL DEFAULT 0.00,
  `delspinigiai` tinyint(1) NOT NULL,
  `vaidmuo` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `skolos_dalys`
--

INSERT INTO `skolos_dalys` (`id_skolos_dalis`, `fk_id_skola`, `fk_id_vartotojas`, `suma`, `procentas`, `apmoketa`, `sumoketa`, `delspinigiai`, `vaidmuo`) VALUES
(126, 60, 8, 102.71, 25.00, 1, 102.71, 0, 2),
(127, 60, 9, 102.71, 25.00, 0, 0.00, 1, 1),
(128, 60, 10, 102.71, 25.00, 0, 0.00, 1, 1),
(129, 60, 14, 102.71, 25.00, 0, 0.00, 1, 1),
(130, 61, 8, 29.60, 25.00, 0, 0.00, 1, 1),
(131, 61, 9, 29.60, 25.00, 0, 0.00, 1, 1),
(132, 61, 10, 29.60, 25.00, 1, 29.60, 0, 2),
(133, 61, 14, 29.60, 25.00, 0, 0.00, 1, 1),
(134, 62, 9, 132.31, 100.00, 0, 0.00, 0, 1),
(135, 62, 8, 132.31, 0.00, 1, 0.00, 0, 2),
(136, 63, 14, 132.31, 100.00, 0, 66.16, 0, 1),
(137, 63, 8, 132.31, 0.00, 1, 0.00, 0, 2),
(138, 64, 10, 13.91, 100.00, 0, 0.00, 0, 1),
(139, 64, 8, 13.91, 0.00, 1, 0.00, 0, 2);

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
(7, 8, '159b57b363', '2025-12-10 21:49:41', '2025-12-10 22:49:41', 1),
(9, 10, '0ef0c9eca1', '2025-12-13 22:00:11', '2025-12-13 23:00:11', 1),
(10, 10, '77e97980f9', '2025-12-13 22:01:20', '2025-12-13 23:01:20', 1),
(11, 10, '8f9672a1ba', '2025-12-13 22:03:37', '2025-12-13 23:03:37', 1),
(12, 10, 'ae866044e3', '2025-12-13 22:04:12', '2025-12-13 23:04:12', 0);

-- --------------------------------------------------------

--
-- Table structure for table `sukuria`
--

CREATE TABLE `sukuria` (
  `fk_id_kvietimas` int(11) NOT NULL,
  `fk_id_grupes_narys` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `sukuria`
--

INSERT INTO `sukuria` (`fk_id_kvietimas`, `fk_id_grupes_narys`) VALUES
(1, 33),
(2, 33),
(3, 33),
(4, 33),
(5, 33);

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
(2, 'USD', 1.1731),
(3, 'PLN', 4.2225),
(4, 'GBP', 0.8767),
(5, 'JPY', 182.99);

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
(8, 'Tomas', 'Barisauskas', 'tomas@barisauskas.com', '86c496b088a575d69a92159ee06bfb4dec33d649a5b4433d2c8c95f403a67d69', '2025-12-03 15:40:21', '2025-12-14 00:21:40', 3, '/uploads/avatars/1765318585169-8471192.png'),
(9, 'Zivile', 'Nuobaraite', 'Zivile@nuobaraite.com', '8d216ac1e0cf5a2b0a23f69421481120509b1bcf3efe115205710373f7ceab01', '2025-12-03 18:39:07', '2025-12-13 22:15:31', 1, '/uploads/avatars/1765318616988-507908848.png'),
(10, 'Justinas', 'Jankauskas', 'Justinas@jankauskas.com', '6bc7980ed246713f1c92b9b81b380fb02dc016e52d1731e9e4b1b493fa5dc95d', '2025-12-03 19:16:25', '2025-12-14 01:37:09', 1, '/uploads/avatars/1765319419696-742828989.png'),
(14, 'Arnoldas', 'Skrodenis', 'Arnoldas@skrodenis.com', 'b7abe9f463561827c43adc8350dc505a463d39f2e70979460d260ea2c3e05749', '2025-12-13 21:57:15', '2025-12-14 00:20:03', 1, NULL);

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
(16, 8, 9, 'accepted', '2025-12-13 22:15:14', '2025-12-13 22:15:35'),
(17, 8, 10, 'accepted', '2025-12-13 22:15:48', '2025-12-13 22:16:55'),
(18, 8, 14, 'accepted', '2025-12-13 22:16:02', '2025-12-13 22:17:31'),
(19, 9, 14, 'accepted', '2025-12-13 22:16:15', '2025-12-13 22:17:30'),
(20, 9, 10, 'accepted', '2025-12-13 22:16:23', '2025-12-13 22:16:54'),
(21, 10, 14, 'accepted', '2025-12-13 22:17:03', '2025-12-13 22:17:30');

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
  MODIFY `id_asmeninis_pranesimas` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=104;

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
  MODIFY `id_delspinigiai` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

--
-- AUTO_INCREMENT for table `grupes`
--
ALTER TABLE `grupes`
  MODIFY `id_grupe` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `grupes_istorija`
--
ALTER TABLE `grupes_istorija`
  MODIFY `id_istorija` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=125;

--
-- AUTO_INCREMENT for table `grupes_nariai`
--
ALTER TABLE `grupes_nariai`
  MODIFY `id_grupes_narys` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=42;

--
-- AUTO_INCREMENT for table `grupes_zinutes`
--
ALTER TABLE `grupes_zinutes`
  MODIFY `id_grupes_zinute` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=60;

--
-- AUTO_INCREMENT for table `kategorijos`
--
ALTER TABLE `kategorijos`
  MODIFY `id_kategorija` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- AUTO_INCREMENT for table `kvietimai`
--
ALTER TABLE `kvietimai`
  MODIFY `id_kvietimas` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `kvietimo_busenos`
--
ALTER TABLE `kvietimo_busenos`
  MODIFY `id_kvietimo_busena` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `mokejimai`
--
ALTER TABLE `mokejimai`
  MODIFY `id_mokejimas` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `nariu_busenos`
--
ALTER TABLE `nariu_busenos`
  MODIFY `id_nario_busena` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `pranesimai`
--
ALTER TABLE `pranesimai`
  MODIFY `id_pranesimas` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=93;

--
-- AUTO_INCREMENT for table `pranesimo_busenos`
--
ALTER TABLE `pranesimo_busenos`
  MODIFY `id_pranesimo_busena` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `pranesimu_nustatymai`
--
ALTER TABLE `pranesimu_nustatymai`
  MODIFY `id_pranesimu_nustatymai` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT for table `roles`
--
ALTER TABLE `roles`
  MODIFY `id_role` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `skolos`
--
ALTER TABLE `skolos`
  MODIFY `id_skola` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=65;

--
-- AUTO_INCREMENT for table `skolos_dalys`
--
ALTER TABLE `skolos_dalys`
  MODIFY `id_skolos_dalis` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=140;

--
-- AUTO_INCREMENT for table `skolu_statusai`
--
ALTER TABLE `skolu_statusai`
  MODIFY `id_skolos_statusas` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `slaptazodzio_atkurimas`
--
ALTER TABLE `slaptazodzio_atkurimas`
  MODIFY `id_slaptazodzio_atkurimas` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=13;

--
-- AUTO_INCREMENT for table `vaidmenys`
--
ALTER TABLE `vaidmenys`
  MODIFY `id_vaidmuo` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT for table `valiutos`
--
ALTER TABLE `valiutos`
  MODIFY `id_valiuta` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT for table `vartotojai`
--
ALTER TABLE `vartotojai`
  MODIFY `id_vartotojas` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT for table `vartotoju_draugystes`
--
ALTER TABLE `vartotoju_draugystes`
  MODIFY `id_draugyste` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=22;

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
