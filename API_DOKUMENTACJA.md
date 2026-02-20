# Dokumentacja API - Aktualizacja danych z zewnątrz

## Endpoint: `api.php`

Ten endpoint pozwala na aktualizację danych w `data.json` z zewnątrz bez edytowania pliku `update.php`.

## Metody HTTP

### GET - Pobierz wszystkie dane

**Przykład użycia:**
```bash
curl http://twoja-domena.pl/api.php
```

**Odpowiedź:**
```json
{"D1": 281.0, "D2": 280.0, "D3": 7.0, "D4": 309.0, "D5": 96.0, "D6": 355.0, "T": 19.5, "V": 3.412}
```

---

### POST - Aktualizuj pojedyncze lub wiele wartości

Aktualizuje tylko przekazane wartości, pozostawiając resztę bez zmian.

**Przykład 1 - Aktualizacja jednej wartości (JSON):**
```bash
curl -X POST http://twoja-domena.pl/api.php \
  -H "Content-Type: application/json" \
  -d '{"D1": 300.0}'
```

**Przykład 2 - Aktualizacja wielu wartości (JSON):**
```bash
curl -X POST http://twoja-domena.pl/api.php \
  -H "Content-Type: application/json" \
  -d '{"D1": 300.0, "T": 20.5, "V": 4.0}'
```

**Przykład 3 - Aktualizacja przez formularz (form-data):**
```bash
curl -X POST http://twoja-domena.pl/api.php \
  -d "D1=300.0" \
  -d "T=20.5"
```

**Odpowiedź:**
```json
{"success": true, "data": {"D1": 300.0, "D2": 280.0, "D3": 7.0, "D4": 309.0, "D5": 96.0, "D6": 355.0, "T": 20.5, "V": 3.412}}
```

**Usuwanie wartości** (ustaw na pusty string lub null):
```bash
curl -X POST http://twoja-domena.pl/api.php \
  -H "Content-Type: application/json" \
  -d '{"D1": ""}'
```

---

### PUT - Zastąp wszystkie dane

Działa jak oryginalny `update.php` - zastępuje cały plik JSON.

**Przykład:**
```bash
curl -X PUT http://twoja-domena.pl/api.php \
  -H "Content-Type: application/json" \
  -d '{"D1": 281.0, "D2": 280.0, "D3": 7.0, "D4": 309.0, "D5": 96.0, "D6": 355.0, "T": 19.5, "V": 3.412}'
```

**Odpowiedź:**
```json
{"success": true, "data": {"D1": 281.0, "D2": 280.0, "D3": 7.0, "D4": 309.0, "D5": 96.0, "D6": 355.0, "T": 19.5, "V": 3.412}}
```

---

## Dozwolone klucze

- `D1` - Czujnik 1 - Odległość (mm)
- `D2` - Czujnik 2 - Odległość (mm)
- `D3` - Czujnik 3 - Odległość (mm)
- `D4` - Czujnik 4 - Odległość (mm)
- `D5` - Czujnik 5 - Odległość (mm)
- `D6` - Czujnik 6 - Odległość (mm)
- `T` - Temperatura
- `V` - Przepływ

---

## Przykłady użycia z różnych języków

### Python
```python
import requests

# Aktualizuj pojedynczą wartość
response = requests.post(
    'http://twoja-domena.pl/api.php',
    json={'D1': 300.0}
)
print(response.json())

# Aktualizuj wiele wartości
response = requests.post(
    'http://twoja-domena.pl/api.php',
    json={'D1': 300.0, 'T': 20.5, 'V': 4.0}
)
print(response.json())

# Pobierz wszystkie dane
response = requests.get('http://twoja-domena.pl/api.php')
print(response.json())
```

### JavaScript/Node.js
```javascript
// Aktualizuj pojedynczą wartość
fetch('http://twoja-domena.pl/api.php', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ D1: 300.0 })
})
.then(response => response.json())
.then(data => console.log(data));

// Pobierz wszystkie dane
fetch('http://twoja-domena.pl/api.php')
.then(response => response.json())
.then(data => console.log(data));
```

### JavaScript (w przeglądarce)
```javascript
// Aktualizuj pojedynczą wartość
async function updateData() {
  const response = await fetch('http://twoja-domena.pl/api.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ D1: 300.0 })
  });
  const data = await response.json();
  console.log(data);
}
```

### PowerShell (Windows)
```powershell
# Aktualizuj pojedynczą wartość
$body = @{D1=300.0} | ConvertTo-Json
Invoke-RestMethod -Uri "http://twoja-domena.pl/api.php" -Method POST -Body $body -ContentType "application/json"

# Pobierz wszystkie dane
Invoke-RestMethod -Uri "http://twoja-domena.pl/api.php" -Method GET
```

---

## Kody odpowiedzi HTTP

- `200` - Sukces
- `400` - Błąd w danych (nieprawidłowy JSON lub brak danych)
- `405` - Nieobsługiwana metoda HTTP
- `500` - Błąd serwera (np. brak uprawnień do zapisu pliku)

---

## Uwagi bezpieczeństwa

1. **Autoryzacja**: Rozważ dodanie autoryzacji (np. token API) przed użyciem w produkcji
2. **HTTPS**: Używaj HTTPS w produkcji
3. **Walidacja**: API waliduje tylko dozwolone klucze (D1-D6, T, V)
4. **Uprawnienia**: Upewnij się, że serwer ma uprawnienia do zapisu w pliku `data.json`

---

## Integracja z istniejącym systemem

Plik `api.php` działa równolegle z `update.php` - oba zapisują do tego samego pliku `data.json`. 
Możesz używać obu jednocześnie bez konfliktów.







