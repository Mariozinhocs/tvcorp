<?php
require_once __DIR__ . '/../config.php';
header("Content-Type: application/json; charset=UTF-8");

session_destroy();
echo json_encode(["success" => true]);
