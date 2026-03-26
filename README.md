# Aqua – filter (akwrium)

Aplikacja mobilna **Expo / React Native** do obsługi systemu filtracji akwarium: konfiguracja sieci przez Bluetooth oraz podgląd i edycja danych z serwera.

## Działanie aplikacji

1. **Ekran główny** — wybór ścieżki: **Połączenie** albo **Urządzenie**.
2. **Połączenie** (`ConnectionScreen`) — skanowanie i połączenie BLE z urządzeniem (np. Raspberry Pi w trybie konfiguracji Wi‑Fi, nazwa `RPi-WiFi-Setup`). Przez charakterystykę GATT przekazywane są m.in. lista sieci Wi‑Fi, hasło i status połączenia — użytkownik konfiguruje dostęp urządzenia do sieci.
3. **Urządzenie** (`DeviceScreen`) — odczyt danych z `data.json` na skonfigurowanym serwerze (`http://www.aqua-filter.pl`) oraz zapis zmian przez `api.php`. Interfejs pokazuje m.in. parametry dozowania (D1–D7), opisy (S1–S7), temperaturę, napięcie, parametry wody itd.; część ustawień jest w osobnym panelu **Zawartość akwarium** (`AquariumContentScreen`) — zdjęcia baneru, typ zbiornika, przypomnienia, konfiguracja wyświetlania (m.in. `expo-image-picker` do zdjęć z galerii).

Backend po stronie WWW to prosty **PHP** (`api.php`): odczyt/zapis `data.json`, dozwolone klucze pól zgodne z walidacją w API. W repozytorium jest też kopia pod `strona/public_html/` do wdrożenia na hosting.

## Biblioteki (npm)

| Pakiet | Rola |
|--------|------|
| **expo** | SDK i narzędzia (start, build, moduły Expo) |
| **react** / **react-native** | UI mobilna |
| **expo-font**, **expo-splash-screen**, **expo-status-bar** | Czcionka Electrolize, ekran startowy, pasek stanu |
| **nativewind** + **tailwindcss** | Style w klasach (`global.css`, `className`) |
| **react-native-ble-plx** | Bluetooth Low Energy (konfiguracja Wi‑Fi) |
| **@react-native-async-storage/async-storage** | Trwałe dane lokalne (np. ustawienia w ekranach urządzenia / akwarium) |
| **@react-native-community/slider** | Suwaki w panelu urządzenia |
| **expo-image-picker** | Wybór zdjęć z galerii w panelu zawartości akwarium |
| **react-native-reanimated** / **react-native-worklets** | Wymagane przez preset Expo / NativeWind (Babel) |
| **react-native-safe-area-context** | Bezpieczne obszary ekranu (notch, paski) |
| **expo-dev-client** | Development build z natywnymi modułami (np. BLE) |
| **expo-notifications**, **expo-calendar** | W zależnościach projektu (np. pod przyszłe przypomnienia / kalendarz) |

Dodatkowo używane są moduły **@expo/vector-icons** (ikony w UI).

## Uruchomienie

```bash
npm install
npm start
```

Do pełnego BLE na urządzeniu fizycznym zwykle potrzebny jest build z **expo-dev-client** / EAS — plugin `react-native-ble-plx` jest wpisany w `app.json`.

## Inne elementy repozytorium

- **`strona/public_html/`** — pliki PHP i `data.json` pod hosting.
- **`esp32/`** — szkice Arduino (np. testy RGB); nie są częścią samej aplikacji Expo.
