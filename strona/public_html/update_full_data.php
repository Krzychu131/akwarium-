<?php
/**
 * Skrypt do aktualizacji pełnych danych w data.json na serwerze
 * Uruchom raz aby zaktualizować wszystkie pola D1-D6, T, V, S1-S6
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$dataFile = 'data.json';

// Pełne dane z wszystkimi polami - użyj rzeczywistych wartości D1-D6
$fullData = [
    'D1' => 281,  // Rzeczywiste wartości z czujników
    'D2' => 280,
    'D3' => 7,
    'D4' => 309,
    'D5' => 96,
    'D6' => 355,
    'T' => 19.5,
    'V' => 3.412,
    'S1' => '',
    'S2' => '',
    'S3' => '',
    'S4' => '',
    'S5' => '',
    'S6' => ''
];

// Wczytaj istniejące dane i zachowaj wartości S1-S6, T, V jeśli istnieją
if (file_exists($dataFile)) {
    $content = file_get_contents($dataFile);
    $existingData = json_decode($content, true);
    if ($existingData) {
        // Zachowaj istniejące wartości S1-S6, T, V
        foreach (['S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'T', 'V'] as $key) {
            if (isset($existingData[$key]) && $existingData[$key] !== null && $existingData[$key] !== '') {
                $fullData[$key] = $existingData[$key];
            }
        }
    }
}

// Zapisz pełne dane
$result = file_put_contents($dataFile, json_encode($fullData, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));

if ($result !== false) {
    echo json_encode([
        'success' => true,
        'message' => 'Dane D1-D6 zostały zaktualizowane',
        'data' => $fullData
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
} else {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'error' => 'Błąd zapisu danych'
    ]);
}
?>






