-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Dec 14, 2025 at 01:57 PM
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
(129, 28, 8, 'expense_deleted', 'Išlaida \"papparsta\" panaikinta (5 EUR).', '2025-12-14 13:43:03', '{\"debtId\":68,\"amount\":5,\"currencyCode\":\"EUR\",\"paidByUserId\":8,\"deletedByUserId\":8}'),
(130, 28, 8, 'expense_added', 'Išlaida \"999999\" pridėta (999999 EUR).', '2025-12-14 13:43:38', '{\"debtId\":69,\"amount\":999999,\"currencyCode\":\"EUR\",\"paidByUserId\":8,\"createdByUserId\":8,\"lateFeePercentage\":null,\"lateFeeAfterDays\":null}'),
(131, 28, 8, 'expense_deleted', 'Išlaida \"999999\" panaikinta (999999 EUR).', '2025-12-14 13:43:43', '{\"debtId\":69,\"amount\":999999,\"currencyCode\":\"EUR\",\"paidByUserId\":8,\"deletedByUserId\":8}'),
(132, 28, 8, 'expense_edited', 'Išlaida \"Obuoliai\" atnaujinta (pavadinimas: striptizas → Obuoliai).', '2025-12-14 13:44:25', '{\"debtId\":66,\"editedByUserId\":8,\"changedFields\":[{\"field\":\"title\",\"label\":\"pavadinimas\",\"oldValue\":\"striptizas\",\"newValue\":\"Obuoliai\"}]}'),
(133, 28, 8, 'expense_deleted', 'Išlaida \"su delspinigiais\" panaikinta (45645 EUR).', '2025-12-14 14:08:51', '{\"debtId\":67,\"amount\":45645,\"currencyCode\":\"EUR\",\"paidByUserId\":8,\"deletedByUserId\":8}'),
(134, 28, 14, 'payment_registered', 'Mokėjimas užregistruotas: Arnoldas Skrodenis → Tomas Barisauskas, suma 10 EUR (10.00 EUR).', '2025-12-14 14:09:19', '{\"groupId\":28,\"fromUserId\":14,\"toUserId\":8,\"amount\":10,\"originalAmount\":10,\"currencyCode\":\"EUR\",\"conversionRate\":1,\"note\":null,\"affectedPartsCount\":1}'),
(135, 28, 14, 'payment_registered', 'Mokėjimas užregistruotas: Arnoldas Skrodenis → Zivile Nuobaraite, suma 5 EUR (5.00 EUR).', '2025-12-14 14:11:07', '{\"groupId\":28,\"fromUserId\":14,\"toUserId\":9,\"amount\":5,\"originalAmount\":5,\"currencyCode\":\"EUR\",\"conversionRate\":1,\"note\":null,\"affectedPartsCount\":1}'),
(136, 28, 8, 'member_removed', 'Pašalintas narys \"Arnoldas Skrodenis\".', '2025-12-14 14:11:14', '{\"memberId\":14,\"memberName\":\"Arnoldas Skrodenis\",\"memberEmail\":\"Arnoldas@skrodenis.com\"}'),
(137, 28, 10, 'payment_registered', 'Mokėjimas užregistruotas: Justinas Jankauskas → Zivile Nuobaraite, suma 5 EUR (5.00 EUR).', '2025-12-14 14:13:23', '{\"groupId\":28,\"fromUserId\":10,\"toUserId\":9,\"amount\":5,\"originalAmount\":5,\"currencyCode\":\"EUR\",\"conversionRate\":1,\"note\":null,\"affectedPartsCount\":1}'),
(138, 28, 10, 'payment_registered', 'Mokėjimas užregistruotas: Justinas Jankauskas → Tomas Barisauskas, suma 10 EUR (10.00 EUR).', '2025-12-14 14:13:25', '{\"groupId\":28,\"fromUserId\":10,\"toUserId\":8,\"amount\":10,\"originalAmount\":10,\"currencyCode\":\"EUR\",\"conversionRate\":1,\"note\":null,\"affectedPartsCount\":1}'),
(139, 28, 8, 'expense_added', 'Išlaida \"vbcvb\" pridėta (420 PLN).', '2025-12-14 14:32:49', '{\"debtId\":70,\"amount\":420,\"currencyCode\":\"PLN\",\"paidByUserId\":8,\"createdByUserId\":8,\"lateFeePercentage\":null,\"lateFeeAfterDays\":null}'),
(140, 28, 8, 'expense_added', 'Išlaida \"Modulio skola\" pridėta (410.82 EUR).', '2025-12-14 14:41:38', '{\"debtId\":71,\"amount\":410.82,\"currencyCode\":\"EUR\",\"paidByUserId\":8,\"createdByUserId\":8,\"lateFeePercentage\":null,\"lateFeeAfterDays\":null}'),
(141, 28, 8, 'expense_added', 'Išlaida \"Baidarės\" pridėta (500 PLN).', '2025-12-14 14:42:21', '{\"debtId\":72,\"amount\":500,\"currencyCode\":\"PLN\",\"paidByUserId\":10,\"createdByUserId\":8,\"lateFeePercentage\":null,\"lateFeeAfterDays\":null}');

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
(36, 28, 14, '0000-00-00', 2, 3),
(42, 28, 14, '0000-00-00', 1, 1);

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
(10, 'Neplanuotos išlaidos');

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
(5, 'yHaphPdsCz', '2025-12-14', '2025-12-21', 1),
(8, 'IAMWyAo46j', '2025-12-14', '2025-12-21', 2);

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
(14, 167, 8, '2025-12-14', 29.60, 1.0000),
(15, 165, 10, '2025-12-14', 29.60, 1.0000);

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
(110, 10, 'new_expense', 'Nauja išlaida grupėje \"Teletabiai\"', 'Tomas Barisauskas pridėjo išlaidą „vbcvb“ (420 PLN).', 0, '2025-12-14 14:32:49', '/groups/28', NULL),
(111, 14, 'group_invite', 'Kvietimas į grupę', 'Tomas Barisauskas pakvietė jus prisijungti prie grupės „Teletabiai“', 1, '2025-12-14 14:33:55', '/groups/28/join?token=IAMWyAo46j', '{\"type\":\"group_invite\",\"groupId\":28,\"inviteId\":8,\"token\":\"IAMWyAo46j\",\"inviterId\":8}'),
(112, 9, 'new_expense', 'Nauja išlaida grupėje \"Teletabiai\"', 'Tomas Barisauskas pridėjo išlaidą „Modulio skola“ (410.82 EUR).', 0, '2025-12-14 14:41:38', '/groups/28', NULL),
(113, 10, 'new_expense', 'Nauja išlaida grupėje \"Teletabiai\"', 'Tomas Barisauskas pridėjo išlaidą „Modulio skola“ (410.82 EUR).', 0, '2025-12-14 14:41:38', '/groups/28', NULL),
(114, 14, 'new_expense', 'Nauja išlaida grupėje \"Teletabiai\"', 'Tomas Barisauskas pridėjo išlaidą „Modulio skola“ (410.82 EUR).', 0, '2025-12-14 14:41:38', '/groups/28', NULL),
(115, 14, 'new_expense', 'Nauja išlaida grupėje \"Teletabiai\"', 'Tomas Barisauskas pridėjo išlaidą „Modulio skola“ (410.82 EUR).', 0, '2025-12-14 14:41:38', '/groups/28', NULL),
(116, 9, 'new_expense', 'Nauja išlaida grupėje \"Teletabiai\"', 'Tomas Barisauskas pridėjo išlaidą „Baidarės“ (500 PLN).', 0, '2025-12-14 14:42:21', '/groups/28', NULL),
(117, 10, 'new_expense', 'Nauja išlaida grupėje \"Teletabiai\"', 'Tomas Barisauskas pridėjo išlaidą „Baidarės“ (500 PLN).', 0, '2025-12-14 14:42:21', '/groups/28', NULL),
(118, 14, 'new_expense', 'Nauja išlaida grupėje \"Teletabiai\"', 'Tomas Barisauskas pridėjo išlaidą „Baidarės“ (500 PLN).', 0, '2025-12-14 14:42:21', '/groups/28', NULL),
(119, 14, 'new_expense', 'Nauja išlaida grupėje \"Teletabiai\"', 'Tomas Barisauskas pridėjo išlaidą „Baidarės“ (500 PLN).', 0, '2025-12-14 14:42:21', '/groups/28', NULL);

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
(71, 28, 8, 'Modulio skola', NULL, 410.82, 1.0000, '2025-12-14', '2025-12-14', '2025-12-21', 1, 1, 10),
(72, 28, 10, 'Baidarės', NULL, 500.00, 4.2225, '2025-12-14', '2025-12-14', '2025-12-21', 3, 1, 4);

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
(163, 71, 8, 102.71, 25.00, 1, 102.71, 0, 2),
(164, 71, 9, 102.71, 25.00, 0, 0.00, 1, 1),
(165, 71, 10, 102.71, 25.00, 0, 29.60, 1, 1),
(166, 71, 14, 102.71, 25.00, 0, 0.00, 1, 1),
(167, 72, 8, 29.60, 25.00, 1, 29.60, 1, 1),
(168, 72, 9, 29.60, 25.00, 0, 0.00, 1, 1),
(169, 72, 10, 29.60, 25.00, 1, 29.60, 0, 2),
(170, 72, 14, 29.60, 25.00, 0, 0.00, 1, 1);

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
(5, 33),
(8, 33);

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
(8, 'Tomas', 'Barisauskas', 'tomas@barisauskas.com', '86c496b088a575d69a92159ee06bfb4dec33d649a5b4433d2c8c95f403a67d69', '2025-12-03 15:40:21', '2025-12-14 13:23:26', 1, '/uploads/avatars/1765318585169-8471192.png'),
(9, 'Zivile', 'Nuobaraite', 'Zivile@nuobaraite.com', '8d216ac1e0cf5a2b0a23f69421481120509b1bcf3efe115205710373f7ceab01', '2025-12-03 18:39:07', '2025-12-13 22:15:31', 1, '/uploads/avatars/1765318616988-507908848.png'),
(10, 'Justinas', 'Jankauskas', 'Justinas@jankauskas.com', '6bc7980ed246713f1c92b9b81b380fb02dc016e52d1731e9e4b1b493fa5dc95d', '2025-12-03 19:16:25', '2025-12-14 14:13:17', 1, '/uploads/avatars/1765319419696-742828989.png'),
(14, 'Arnoldas', 'Skrodenis', 'Arnoldas@skrodenis.com', 'b7abe9f463561827c43adc8350dc505a463d39f2e70979460d260ea2c3e05749', '2025-12-13 21:57:15', '2025-12-14 14:34:09', 1, NULL);

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
  MODIFY `id_delspinigiai` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=14;

--
-- AUTO_INCREMENT for table `grupes`
--
ALTER TABLE `grupes`
  MODIFY `id_grupe` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=32;

--
-- AUTO_INCREMENT for table `grupes_istorija`
--
ALTER TABLE `grupes_istorija`
  MODIFY `id_istorija` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=142;

--
-- AUTO_INCREMENT for table `grupes_nariai`
--
ALTER TABLE `grupes_nariai`
  MODIFY `id_grupes_narys` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=43;

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
  MODIFY `id_kvietimas` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `kvietimo_busenos`
--
ALTER TABLE `kvietimo_busenos`
  MODIFY `id_kvietimo_busena` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `mokejimai`
--
ALTER TABLE `mokejimai`
  MODIFY `id_mokejimas` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `nariu_busenos`
--
ALTER TABLE `nariu_busenos`
  MODIFY `id_nario_busena` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `pranesimai`
--
ALTER TABLE `pranesimai`
  MODIFY `id_pranesimas` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=120;

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
  MODIFY `id_skola` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=73;

--
-- AUTO_INCREMENT for table `skolos_dalys`
--
ALTER TABLE `skolos_dalys`
  MODIFY `id_skolos_dalis` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=171;

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
