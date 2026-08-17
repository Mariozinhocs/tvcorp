<?php
/**
 * TvCorp — Configuração de Conexão PDO e Sessão
 */
session_start();

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

date_default_timezone_set('America/Sao_Paulo');

$sqlitePath = __DIR__ . '/tvcorp.sqlite';

function getDatabaseConnection() {
    global $sqlitePath;
    try {
        $db = new PDO("sqlite:" . $sqlitePath);
        $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        return $db;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(["error" => "Erro na conexão com banco de dados: " . $e->getMessage()]);
        exit;
    }
}
