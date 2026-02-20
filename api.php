<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Obsługa preflight request (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$dataFile = 'data.json';

// Funkcja do odczytu danych
function readData($file) {
    if (!file_exists($file)) {
        return [];
    }
    $content = file_get_contents($file);
    $data = json_decode($content, true);
    return $data ? $data : [];
}

// Funkcja do zapisu danych
function saveData($file, $data) {
    return file_put_contents($file, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
}

$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'GET':
            // Pobierz wszystkie dane
            $data = readData($dataFile);
            echo json_encode($data);
            break;

        case 'POST':
            // Aktualizacja pojedynczej wartości lub wielu wartości
            $input = file_get_contents("php://input");
            $postData = json_decode($input, true);
            
            if (!$postData) {
                // Spróbuj z $_POST jeśli JSON nie zadziałał
                $postData = $_POST;
            }
            
            if (empty($postData)) {
                http_response_code(400);
                echo json_encode(['error' => 'Brak danych do aktualizacji']);
                exit;
            }
            
            $currentData = readData($dataFile);
            
            // Aktualizuj tylko przekazane wartości
            foreach ($postData as $key => $value) {
                // Walidacja kluczy (tylko dozwolone klucze)
                $allowedKeys = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'T', 'V'];
                if (in_array($key, $allowedKeys)) {
                    if ($value === '' || $value === null) {
                        unset($currentData[$key]);
                    } else {
                        // Pola S1-S6 są stringami, pozostałe są numeryczne
                        if (strpos($key, 'S') === 0) {
                            $currentData[$key] = strval($value);
                        } else {
                            $numValue = is_numeric($value) ? floatval($value) : $value;
                            $currentData[$key] = $numValue;
                        }
                    }
                }
            }
            
            if (saveData($dataFile, $currentData)) {
                echo json_encode(['success' => true, 'data' => $currentData]);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Błąd zapisu danych']);
            }
            break;

        case 'PUT':
            // Zastąp wszystkie dane (jak oryginalny update.php) - BEZ WALIDACJI
            // Pozwala Raspberry Pi zapisywać dane bezpośrednio, tak jak update.php
            $input = file_get_contents("php://input");
            
            if (!$input) {
                http_response_code(400);
                echo json_encode(['error' => 'Brak danych']);
                exit;
            }
            
            // Waliduj tylko czy to poprawny JSON (jak update.php)
            json_decode($input);
            if (json_last_error() !== JSON_ERROR_NONE) {
                http_response_code(400);
                echo json_encode(['error' => 'INVALID JSON']);
                exit;
            }
            
            // Zapisz surowe dane JSON bezpośrednio (jak update.php) - BEZ WALIDACJI KLUCZY
            // To pozwala Raspberry Pi zapisywać dowolne dane, w tym D1-D6
            if (file_put_contents($dataFile, $input)) {
                http_response_code(200);
                // Zwróć JSON dla aplikacji mobilnej i strony HTML
                echo json_encode(['success' => true, 'message' => 'OK']);
            } else {
                http_response_code(500);
                echo json_encode(['error' => 'Błąd zapisu danych']);
            }
            break;

        default:
            http_response_code(405);
            echo json_encode(['error' => 'Nieobsługiwana metoda HTTP']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Błąd serwera: ' . $e->getMessage()]);
}
?>

