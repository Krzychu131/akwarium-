# Aqua – filter (akwrium)

Aplikacja mobilna **Expo / React Native** do obsługi systemu filtracji akwarium: konfiguracja sieci przez Bluetooth oraz podgląd i edycja danych z serwera.

## Działanie aplikacji

1. **Ekran główny** — wybór ścieżki: **Połączenie** albo **Urządzenie**.
2. **Połączenie** (`ConnectionScreen`) — skanowanie i połączenie BLE z urządzeniem. Przez charakterystykę GATT przekazywane są m.in. lista sieci Wi‑Fi, hasło i status połączenia — użytkownik konfiguruje dostęp urządzenia do sieci.
3. **Urządzenie** (`DeviceScreen`) — odczyt danych z skonfigurowanego serwera oraz wprowadzanie zmian na nim. W razie problemów aplikacja wysyła powiadomienia
4. **konfiguracja** (`AquariumContent`)— konfiguracja urządzenia i wysłanie danych na serwer
Backend po stronie WWW to prosty **PHP** (`api.php`): odczyt/zapis `data.json`

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

