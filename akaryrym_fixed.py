#!/usr/bin/env python3
"""
Serwer BLE (BlueZ GATT) do konfiguracji WiFi na Raspberry Pi
POPRAWIONA, DZIAŁAJĄCA WERSJA

Wymagania:
- BlueZ >= 5.50
- python3-dbus, python3-gi
- uruchamiane jako root

Funkcje:
- Advertising BLE
- GATT Service + Characteristic
- JSON API przez BLE
- Bezpieczniejsza konfiguracja WiFi (wpa_cli)
- Automatyczne przesyłanie danych z UART na serwer po połączeniu z WiFi

================================================================================
INSTRUKCJA URUCHOMIENIA NA RASPBERRY PI PRZEZ DESKTOP (GUI):
================================================================================

1. INSTALACJA WYMAGANYCH PAKIETÓW:
   Otwórz Terminal i wykonaj:
   
   sudo apt update
   sudo apt install -y python3-dbus python3-gi bluez python3-serial python3-requests
   
   LUB jeśli python3-requests nie jest dostępny:
   pip3 install requests
   
   Sprawdź wersję BlueZ (musi być >= 5.50):
   bluetoothctl --version

2. PRZYGOTOWANIE PLIKU:
   - Skopiuj ten plik na Raspberry Pi (np. przez SSH, pendrive, lub edytor)
   - Zapisz jako: /home/pi/akaryrym.py
   - Nadaj uprawnienia wykonywania:
     chmod +x /home/pi/akaryrym.py

3. URUCHOMIENIE PRZEZ DESKTOP (GUI):
   
   METODA A - Przez Terminal w Desktop:
   -------------------------------------
   a) Otwórz Terminal (Menu > Accessories > Terminal lub Ctrl+Alt+T)
   b) Wpisz:
      sudo python3 /home/pi/akaryrym.py
   c) Wprowadź hasło użytkownika pi
   d) Program uruchomi się i wyświetli: "BLE WiFi Config Server uruchomiony"
   e) Zostaw terminal otwarty - program działa w tle
   
   METODA B - Przez skrót na pulpicie (launcher):
   -----------------------------------------------
   a) Otwórz File Manager (Pliki)
   b) Przejdź do katalogu: /home/pi/Desktop
   c) Kliknij prawym przyciskiem > Create New > Blank File
   d) Nazwij plik: "BLE WiFi Server.desktop"
   e) Kliknij prawym > Open With > Text Editor
   f) Wklej następującą zawartość:
   
      [Desktop Entry]
      Version=1.0
      Type=Application
      Name=BLE WiFi Server
      Comment=Serwer BLE do konfiguracji WiFi
      Exec=lxterminal -e "sudo python3 /home/pi/akaryrym.py"
      Icon=network-wireless
      Terminal=false
      Categories=Network;System;
      StartupNotify=true
      
   g) Zapisz plik (Ctrl+S)
   h) Kliknij prawym na plik > Properties > Permissions
   i) Zaznacz "Allow executing file as program" (lub chmod +x przez terminal)
   j) Kliknij dwukrotnie na ikonę aby uruchomić
   k) Wprowadź hasło użytkownika pi gdy zostaniesz poproszony
   l) Otworzy się okno terminala z działającym serwerem
   
   UWAGA: Jeśli nie masz lxterminal, użyj:
   - Exec=x-terminal-emulator -e "sudo python3 /home/pi/akaryrym.py"
   - lub Exec=gnome-terminal -e "sudo python3 /home/pi/akaryrym.py"
   
   METODA C - Przez autostart (uruchamia się przy starcie systemu):
   ------------------------------------------------------------------
   a) Otwórz Terminal
   b) Utwórz plik autostart:
      sudo nano /etc/systemd/system/ble-wifi.service
   c) Wklej:
      
      [Unit]
      Description=BLE WiFi Configuration Server
      After=bluetooth.service
      Requires=bluetooth.service
      
      [Service]
      Type=simple
      User=root
      ExecStart=/usr/bin/python3 /home/pi/akaryrym.py
      Restart=always
      RestartSec=10
      
      [Install]
      WantedBy=multi-user.target
      
   d) Zapisz (Ctrl+O, Enter, Ctrl+X)
   e) Włącz serwis:
      sudo systemctl enable ble-wifi.service
      sudo systemctl start ble-wifi.service
   f) Sprawdź status:
      sudo systemctl status ble-wifi.service

4. SPRAWDZENIE CZY DZIAŁA:
   - W Terminalu powinieneś zobaczyć: "BLE WiFi Config Server uruchomiony"
   - Sprawdź czy Bluetooth jest włączony:
     sudo systemctl status bluetooth
   - Sprawdź czy urządzenie jest widoczne:
     sudo hciconfig hci0
     (powinno pokazać "UP RUNNING")
   
5. URUCHOMIENIE Z WIDOCZNYM OKNEM TERMINALA (dla debugowania):
   -----------------------------------------------------------
   a) Otwórz Terminal
   b) Wpisz:
      sudo python3 /home/pi/akaryrym.py
   c) Zobaczysz logi w czasie rzeczywistym
   d) Aby zatrzymać: naciśnij Ctrl+C
   
6. URUCHOMIENIE W TLE (bez okna terminala):
   ------------------------------------------
   a) Otwórz Terminal
   b) Wpisz:
      sudo nohup python3 /home/pi/akaryrym.py > /tmp/ble-wifi.log 2>&1 &
   c) Program działa w tle
   d) Logi są zapisywane w: /tmp/ble-wifi.log
   e) Aby zobaczyć logi:
      tail -f /tmp/ble-wifi.log
   f) Aby zatrzymać:
      sudo pkill -f akaryrym.py
   
7. TROUBLESHOOTING:
   ----------------
   - Jeśli "Permission denied": uruchom jako root (sudo)
   - Jeśli "No such file or directory": sprawdź ścieżkę do pliku
   - Jeśli Bluetooth nie działa: sudo systemctl restart bluetooth
   - Jeśli WiFi nie skanuje: sprawdź czy wlan0 istnieje (ip link show wlan0)
   - Jeśli nie łączy się z WiFi: sprawdź logi w konsoli
   
8. UŻYCIE Z APLIKACJĄ HTML:
   -------------------------
   a) Otwórz plik akaryrym.html w przeglądarce Chrome/Edge
   b) Kliknij "Połącz z urządzeniem"
   c) Wybierz "RPi-WiFi-Setup" z listy
   d) Skanuj sieci WiFi i konfiguruj połączenie
   
UWAGA: Program MUSI być uruchomiony jako root (sudo) aby móc:
- Konfigurować WiFi
- Używać interfejsu Bluetooth
- Dostępować do wpa_supplicant
   - Sprawdź czy Bluetooth jest włączony:
     sudo systemctl status bluetooth
   - Sprawdź czy urządzenie jest widoczne:
     sudo hciconfig hci0 up
     sudo hciconfig hci0

5. UŻYCIE Z APLIKACJĄ HTML:
   - Otwórz plik akaryrym.html w przeglądarce Chrome/Edge
   - Kliknij "Połącz z urządzeniem"
   - Wybierz "RPi-WiFi-Setup" z listy
   - Skanuj sieci WiFi i konfiguruj

6. ZATRZYMANIE PROGRAMU:
   - Jeśli uruchomiony przez Terminal: naciśnij Ctrl+C
   - Jeśli przez systemd: sudo systemctl stop ble-wifi.service

7. ROZWIĄZYWANIE PROBLEMÓW:
   - Jeśli błąd "Permission denied": uruchom jako root (sudo)
   - Jeśli błąd "No adapter found": sprawdź czy Bluetooth jest włączony
   - Jeśli nie skanuje sieci: sprawdź czy WiFi jest odblokowane:
     sudo rfkill unblock wifi
     sudo ip link set wlan0 up
   - Sprawdź logi błędów w Terminalu

================================================================================
"""

import dbus
import dbus.exceptions
import dbus.mainloop.glib
import dbus.service
import json
import subprocess
import sys
import time
import threading
from gi.repository import GLib

# Import dla UART (Serial)
try:
    import serial
    import serial.tools.list_ports
    UART_AVAILABLE = True
except ImportError:
    UART_AVAILABLE = False
    print("UWAGA: Moduł 'pyserial' nie jest zainstalowany. UART nie będzie dostępny.")
    print("Zainstaluj: sudo apt install python3-serial lub pip3 install pyserial")

# Import dla HTTP requests
try:
    import requests
    REQUESTS_AVAILABLE = True
except ImportError:
    REQUESTS_AVAILABLE = False
    print("UWAGA: Moduł 'requests' nie jest zainstalowany. Wysyłanie danych na serwer nie będzie dostępne.")
    print("Zainstaluj: pip3 install requests")

# ===================== UUID =====================
SERVICE_UUID = "12345678-1234-1234-1234-123456789abc"
CHAR_UUID    = "12345678-1234-1234-1234-123456789abd"
ADV_UUID     = SERVICE_UUID

# ===================== GLOBAL STATE =====================
current_status = {"status": "ready"}

# ===================== SERVER CONFIG =====================
SERVER_URL = "http://www.aqua-filter.pl/api.php"
UART_DATA_THREAD = None
UART_DATA_RUNNING = False

# ===================== UART =====================
uart_port = None
uart_connection = None

def init_uart(port="/dev/ttyAMA0", baudrate=9600):
    """Inicjalizuje połączenie UART"""
    global uart_connection, uart_port
    
    if not UART_AVAILABLE:
        return {"error": "Moduł pyserial nie jest zainstalowany"}
    
    try:
        if uart_connection and uart_connection.is_open:
            uart_connection.close()
        
        uart_connection = serial.Serial(port, baudrate, timeout=1)
        uart_port = port
        print(f"UART otwarty: {port} @ {baudrate} baud")
        return {"status": "success", "message": f"UART otwarty: {port} @ {baudrate} baud"}
    except serial.SerialException as e:
        return {"error": f"Nie można otworzyć UART {port}: {str(e)}"}
    except Exception as e:
        return {"error": f"Błąd inicjalizacji UART: {str(e)}"}

def close_uart():
    """Zamyka połączenie UART"""
    global uart_connection, uart_port
    
    if uart_connection and uart_connection.is_open:
        uart_connection.close()
        uart_connection = None
        uart_port = None
        print("UART zamknięty")
        return {"status": "success", "message": "UART zamknięty"}
    return {"status": "info", "message": "UART nie był otwarty"}

def send_uart(data):
    """Wysyła dane przez UART"""
    global uart_connection
    
    if not uart_connection or not uart_connection.is_open:
        return {"error": "UART nie jest otwarty. Najpierw zainicjalizuj połączenie."}
    
    try:
        # Jeśli data to string, konwertuj na bytes
        if isinstance(data, str):
            data_bytes = data.encode('utf-8')
        else:
            data_bytes = data
        
        # Wyślij dane
        bytes_written = uart_connection.write(data_bytes)
        uart_connection.flush()  # Upewnij się, że dane zostały wysłane
        
        print(f"Wysłano przez UART ({bytes_written} bajtów): {data_bytes}")
        return {"status": "success", "message": f"Wysłano {bytes_written} bajtów", "data": data}
    except Exception as e:
        return {"error": f"Błąd wysyłania przez UART: {str(e)}"}

def read_uart(timeout=1.0):
    """Czyta dane z UART"""
    global uart_connection
    
    if not uart_connection or not uart_connection.is_open:
        return {"error": "UART nie jest otwarty"}
    
    try:
        uart_connection.timeout = timeout
        data = uart_connection.read(uart_connection.in_waiting or 1)
        
        if data:
            data_str = data.decode('utf-8', errors='ignore')
            print(f"Odczytano z UART: {data_str}")
            return {"status": "success", "data": data_str, "bytes": len(data)}
        else:
            return {"status": "info", "message": "Brak danych do odczytu"}
    except Exception as e:
        return {"error": f"Błąd odczytu z UART: {str(e)}"}

def list_uart_ports():
    """Lista dostępnych portów UART/Serial"""
    if not UART_AVAILABLE:
        return {"error": "Moduł pyserial nie jest zainstalowany"}
    
    try:
        ports = serial.tools.list_ports.comports()
        port_list = [{"device": port.device, "description": port.description} for port in ports]
        return {"ports": port_list}
    except Exception as e:
        return {"error": f"Błąd listowania portów: {str(e)}"}

def parse_line(line):
    """Parsuje linię z UART w formacie 'key:value,key2:value2'"""
    data = {}
    for p in line.split(","):
        if ":" not in p:
            continue
        k, v = p.split(":", 1)
        try:
            data[k.strip()] = float(v)
        except ValueError:
            pass
    return data

def send_to_server(data):
    """Wysyła dane na serwer przez HTTP POST (aktualizuje tylko przekazane wartości)"""
    if not REQUESTS_AVAILABLE:
        print("UWAGA: Moduł 'requests' nie jest zainstalowany. Nie można wysłać danych.")
        return False
    
    try:
        # Używamy POST aby zaktualizować tylko dane z czujników (D1-D6, T, V)
        # bez nadpisywania ustawień podawania (S1-S6) z aplikacji mobilnej
        r = requests.post(SERVER_URL, json=data, timeout=5, headers={'Content-Type': 'application/json'})
        print(f"HTTP POST: {r.status_code}")
        if r.status_code == 200:
            try:
                result = r.json()
                print(f"Odpowiedź serwera: {result}")
            except:
                pass
        return r.status_code == 200
    except Exception as e:
        print(f"Błąd wysyłania na serwer: {e}")
        return False

def uart_data_loop():
    """Główna pętla do czytania z UART i wysyłania danych na serwer"""
    global uart_connection, UART_DATA_RUNNING
    
    # Domyślne ustawienia UART (zgodne z domena.py)
    default_port = "/dev/serial0"  # lub /dev/ttyAMA0 na Raspberry Pi
    default_baud = 9600
    
    # Inicjalizuj UART jeśli nie jest otwarty
    if not uart_connection or not uart_connection.is_open:
        try:
            uart_connection = serial.Serial(default_port, default_baud, timeout=1)
            print(f"UART otwarty automatycznie: {default_port} @ {default_baud} baud")
        except Exception as e:
            print(f"Nie można otworzyć UART automatycznie: {e}")
            print("Użyj komendy 'uart_init' przez BLE aby skonfigurować UART")
            UART_DATA_RUNNING = False
            return
    
    print("Rozpoczęto pętlę odczytu UART i wysyłania danych na serwer...")
    
    while UART_DATA_RUNNING:
        try:
            if not uart_connection or not uart_connection.is_open:
                print("UART zamknięty, zatrzymuję pętlę...")
                break
            
            line = uart_connection.readline().decode("utf-8", errors="ignore").strip()
            if not line:
                time.sleep(0.1)  # Krótka przerwa jeśli brak danych
                continue
            
            print(f"UART: {line}")
            data = parse_line(line)
            
            if data:
                # Sprawdź czy WiFi jest połączone przed wysłaniem
                wifi_status = get_wifi_status()
                if wifi_status.get("status") == "success" and wifi_status.get("wifi", {}).get("connected"):
                    success = send_to_server(data)
                    if success:
                        print(f"Dane wysłane na serwer: {data}")
                    else:
                        print(f"Nie udało się wysłać danych na serwer: {data}")
                else:
                    print("WiFi nie jest połączone, pomijam wysyłanie danych")
            
        except Exception as e:
            print(f"Błąd w pętli UART: {e}")
            time.sleep(1)
        
        time.sleep(0.1)  # Krótka przerwa między odczytami
    
    print("Zatrzymano pętlę odczytu UART")

def start_uart_data_thread():
    """Uruchamia wątek do czytania z UART i wysyłania danych"""
    global UART_DATA_THREAD, UART_DATA_RUNNING
    
    if UART_DATA_THREAD and UART_DATA_THREAD.is_alive():
        print("Wątek UART już działa")
        return
    
    UART_DATA_RUNNING = True
    UART_DATA_THREAD = threading.Thread(target=uart_data_loop, daemon=True)
    UART_DATA_THREAD.start()
    print("Uruchomiono wątek do przesyłania danych z UART na serwer")

def stop_uart_data_thread():
    """Zatrzymuje wątek do czytania z UART"""
    global UART_DATA_THREAD, UART_DATA_RUNNING
    
    if UART_DATA_THREAD and UART_DATA_THREAD.is_alive():
        UART_DATA_RUNNING = False
        print("Zatrzymywanie wątku UART...")
        UART_DATA_THREAD.join(timeout=2)
        print("Wątek UART zatrzymany")
    else:
        print("Wątek UART nie działa")

# ===================== WIFI =====================
def scan_wifi():
    networks = []
    seen_ssids = set()
    
    # Najpierw sprawdź i upewnij się, że interfejs jest włączony
    try:
        # Sprawdź status interfejsu
        ip_result = subprocess.run(
            ["ip", "link", "show", "wlan0"],
            capture_output=True, text=True, timeout=5
        )
        if ip_result.returncode == 0:
            if "state DOWN" in ip_result.stdout:
                print("Interfejs wlan0 jest DOWN, próbuję włączyć...")
                subprocess.run(["ip", "link", "set", "wlan0", "up"], timeout=5)
                time.sleep(1)
        else:
            print("BŁĄD: Interfejs wlan0 nie istnieje!")
            return {"error": "Interfejs wlan0 nie istnieje. Sprawdź czy WiFi adapter jest podłączony."}
    except Exception as e:
        print(f"Błąd sprawdzania interfejsu: {e}")
    
    # Próbuj najpierw nmcli (najbardziej niezawodne)
    try:
        # Najpierw wymuś ponowne skanowanie
        rescan_result = subprocess.run(
            ["nmcli", "device", "wifi", "rescan"],
            capture_output=True, text=True, timeout=10
        )
        print(f"nmcli rescan returncode: {rescan_result.returncode}")
        
        # Poczekaj chwilę na zakończenie skanowania
        time.sleep(2)
        
        # Teraz pobierz listę sieci
        result = subprocess.run(
            ["nmcli", "-t", "-f", "SSID,SIGNAL", "device", "wifi", "list"],
            capture_output=True, text=True, timeout=15
        )
        
        print(f"nmcli list returncode: {result.returncode}")
        print(f"nmcli stdout: {result.stdout[:200]}...")  # Pierwsze 200 znaków
        
        if result.returncode == 0:
            for line in result.stdout.splitlines():
                if not line.strip():
                    continue
                parts = line.split(":")
                if len(parts) >= 1:
                    ssid = parts[0].strip()
                    if ssid and ssid != "--" and ssid != "" and ssid not in seen_ssids:
                        seen_ssids.add(ssid)
                        networks.append({"ssid": ssid})
                        print(f"  nmcli: Znaleziono SSID: {ssid}")
            
            if networks:
                print(f"Znaleziono {len(networks)} sieci przez nmcli")
                return networks
            else:
                print("nmcli nie znalazł sieci (stdout był pusty lub nie zawierał SSID)")
    except FileNotFoundError:
        print("nmcli nie jest dostępne")
    except Exception as e:
        print(f"nmcli scan error: {e}")
        import traceback
        traceback.print_exc()
    
    # Alternatywa: iw (nowsza metoda)
    try:
        # Sprawdź czy interfejs istnieje
        check_result = subprocess.run(
            ["ip", "link", "show", "wlan0"],
            capture_output=True, text=True, timeout=5
        )
        if check_result.returncode != 0:
            print("Interfejs wlan0 nie istnieje!")
        else:
            print("Interfejs wlan0 istnieje")
        
        result = subprocess.run(
            ["iw", "dev", "wlan0", "scan"],
            capture_output=True, text=True, timeout=20
        )
        
        print(f"iw scan returncode: {result.returncode}")
        print(f"iw scan stdout length: {len(result.stdout)}")
        print(f"iw scan stderr: {result.stderr[:200] if result.stderr else 'brak'}")
        
        if result.returncode == 0 and result.stdout:
            current_bss = None
            in_bss = False
            for line in result.stdout.splitlines():
                line = line.strip()
                
                # Nowy BSS zaczyna się od "BSS"
                if line.startswith("BSS "):
                    in_bss = True
                    current_bss = {}
                
                # SSID może być w formacie "SSID: nazwa" 
                if line.startswith("SSID:"):
                    ssid = line[5:].strip()
                    if ssid and ssid not in seen_ssids:
                        seen_ssids.add(ssid)
                        networks.append({"ssid": ssid})
                        print(f"  iw: Znaleziono SSID: '{ssid}'")
            
            if networks:
                print(f"Znaleziono {len(networks)} sieci przez iw")
                return networks
            else:
                print("iw nie znalazł sieci. Próbuję iwlist...")
                # Debug: pokaż pierwsze 30 linii wyjścia
                lines = result.stdout.splitlines()[:30]
                print("Pierwsze linie wyjścia iw:")
                for i, l in enumerate(lines):
                    print(f"  [{i}] {l}")
    except FileNotFoundError:
        print("iw nie jest dostępne")
    except Exception as e:
        print(f"iw scan error: {e}")
        import traceback
        traceback.print_exc()
    
    # Alternatywa: iwlist (starsza metoda, ale bardzo niezawodna)
    try:
        result = subprocess.run(
            ["iwlist", "wlan0", "scan"],
            capture_output=True, text=True, timeout=15
        )
        
        if result.returncode == 0:
            for line in result.stdout.splitlines():
                line = line.strip()
                if "ESSID:" in line:
                    # Format: "ESSID:"nazwa_sieci"" lub "ESSID:nazwa_sieci"
                    essid_part = line.split("ESSID:")[1].strip()
                    # Usuń cudzysłowy
                    ssid = essid_part.strip('"').strip("'")
                    if ssid and ssid != "" and ssid not in seen_ssids:
                        seen_ssids.add(ssid)
                        networks.append({"ssid": ssid})
                        print(f"  Znaleziono SSID przez iwlist: {ssid}")
            
            if networks:
                print(f"Znaleziono {len(networks)} sieci przez iwlist")
                return networks
    except FileNotFoundError:
        print("iwlist nie jest dostępne")
    except Exception as e:
        print(f"iwlist scan error: {e}")
    
    if not networks:
        # Sprawdź status WiFi
        try:
            rfkill_result = subprocess.run(
                ["rfkill", "list"],
                capture_output=True, text=True, timeout=5
            )
            print(f"rfkill status:\n{rfkill_result.stdout}")
        except:
            pass
        
        try:
            ip_result = subprocess.run(
                ["ip", "link", "show", "wlan0"],
                capture_output=True, text=True, timeout=5
            )
            print(f"wlan0 status:\n{ip_result.stdout}")
        except:
            pass
        
        error_msg = "Nie znaleziono żadnych sieci. Sprawdź:\n"
        error_msg += "1. Czy WiFi jest włączone (rfkill unblock wifi)\n"
        error_msg += "2. Czy adapter wlan0 istnieje i jest UP (ip link set wlan0 up)\n"
        error_msg += "3. Czy masz uprawnienia do skanowania (uruchom jako root)\n"
        error_msg += "4. Spróbuj ręcznie: iw dev wlan0 scan lub nmcli device wifi list"
        print(error_msg)
        return {"error": error_msg}
    
    return networks


def check_wpa_cli_result(result, operation_name):
    """Sprawdza czy wynik wpa_cli jest sukcesem"""
    stdout_upper = result.stdout.upper().strip()
    if result.returncode != 0:
        return False, f"returncode={result.returncode}"
    if "FAIL" in stdout_upper:
        return False, f"FAIL w stdout: {result.stdout.strip()}"
    if "OK" in stdout_upper:
        return True, "OK"
    # Jeśli nie ma ani OK ani FAIL, sprawdź czy stdout jest pusty lub zawiera błąd
    if not result.stdout.strip():
        return False, "pusty stdout"
    # Jeśli nie ma FAIL, traktuj jako sukces
    return True, result.stdout.strip()


def configure_wifi(ssid, password):
    try:
        print(f"Konfiguruję WiFi: SSID='{ssid}', hasło={'*' * len(password) if password else 'brak'}")
        
        # Sprawdź czy wpa_cli działa
        test_result = subprocess.run(
            ["wpa_cli", "-i", "wlan0", "ping"],
            capture_output=True, text=True, timeout=5
        )
        
        if test_result.returncode != 0 or "PONG" not in test_result.stdout:
            return {"status": "error", "message": f"wpa_cli nie odpowiada: {test_result.stderr or test_result.stdout}"}
        
        print("wpa_cli odpowiada")
        
        # Dodaj nową sieć
        add_result = subprocess.run(
            ["wpa_cli", "-i", "wlan0", "add_network"],
            capture_output=True, text=True, timeout=5
        )
        
        print(f"add_network: returncode={add_result.returncode}, stdout='{add_result.stdout.strip()}', stderr='{add_result.stderr}'")
        
        if add_result.returncode != 0:
            return {"status": "error", "message": f"Nie można dodać sieci: {add_result.stderr or add_result.stdout}"}
        
        network_id = add_result.stdout.strip()
        if not network_id.isdigit():
            return {"status": "error", "message": f"Nieprawidłowe ID sieci: '{network_id}'"}
        
        print(f"Utworzono sieć z ID: {network_id}")
        
        # Ustaw SSID - wpa_cli wymaga SSID w formacie hex string dla niezawodności
        # Konwertuj SSID na hex string (bez prefiksu 0x)
        ssid_bytes = ssid.encode('utf-8')
        ssid_hex = ''.join(f'{b:02x}' for b in ssid_bytes)
        
        ssid_result = subprocess.run(
            ["wpa_cli", "-i", "wlan0", "set_network", network_id, "ssid", ssid_hex],
            capture_output=True, text=True, timeout=5
        )
        
        print(f"set_network ssid (hex={ssid_hex[:20]}...): returncode={ssid_result.returncode}, stdout='{ssid_result.stdout.strip()}', stderr='{ssid_result.stderr}'")
        
        # Sprawdź czy nie zwróciło FAIL (wpa_cli może zwrócić FAIL nawet przy returncode=0)
        success, msg = check_wpa_cli_result(ssid_result, "set_network ssid")
        if not success:
            return {"status": "error", "message": f"Nie można ustawić SSID: {msg}. SSID='{ssid}', hex='{ssid_hex[:50]}...'"}
        
        # Ustaw hasło (jeśli podane)
        if password:
            # Użyj wpa_passphrase do wygenerowania PSK (64-znakowy hex string)
            # To jest bardziej niezawodne niż przekazywanie hasła bezpośrednio
            try:
                passphrase_result = subprocess.run(
                    ["wpa_passphrase", ssid, password],
                    capture_output=True, text=True, timeout=5
                )
                
                if passphrase_result.returncode == 0:
                    # Wyciągnij PSK z wyjścia wpa_passphrase
                    for line in passphrase_result.stdout.splitlines():
                        if line.strip().startswith("psk="):
                            psk_value = line.split("=", 1)[1].strip()
                            # Jeśli to hex (64 znaki), użyj bezpośrednio
                            if len(psk_value) == 64 and all(c in '0123456789abcdef' for c in psk_value.lower()):
                                psk_to_use = psk_value
                            else:
                                # Jeśli to hasło w cudzysłowach, użyj hasła bezpośrednio
                                psk_to_use = password
                            break
                    else:
                        psk_to_use = password
                else:
                    psk_to_use = password
            except:
                psk_to_use = password
            
            # Spróbuj najpierw z PSK (64-znakowy hex)
            if len(psk_to_use) == 64 and all(c in '0123456789abcdef' for c in psk_to_use.lower()):
                psk_result = subprocess.run(
                    ["wpa_cli", "-i", "wlan0", "set_network", network_id, "psk", psk_to_use],
                    capture_output=True, text=True, timeout=5
                )
                print(f"set_network psk (hex): returncode={psk_result.returncode}, stdout='{psk_result.stdout.strip()}'")
            else:
                # Użyj hasła bezpośrednio (wpa_cli automatycznie konwertuje)
                psk_result = subprocess.run(
                    ["wpa_cli", "-i", "wlan0", "set_network", network_id, "psk", password],
                    capture_output=True, text=True, timeout=5
                )
                print(f"set_network psk (password): returncode={psk_result.returncode}, stdout='{psk_result.stdout.strip()}'")
            
            # Sprawdź czy nie zwróciło FAIL
            success, msg = check_wpa_cli_result(psk_result, "set_network psk")
            if not success:
                # Ostatnia próba - użyj wpa_passphrase i dodaj bezpośrednio do konfiguracji
                print(f"Próba alternatywnej metody przez wpa_passphrase (poprzednia: {msg})...")
                try:
                    passphrase_result = subprocess.run(
                        ["wpa_passphrase", ssid, password],
                        capture_output=True, text=True, timeout=5
                    )
                    
                    if passphrase_result.returncode == 0:
                        # Wyciągnij psk z wyjścia
                        psk_hex = None
                        for line in passphrase_result.stdout.splitlines():
                            if line.strip().startswith("psk="):
                                psk_line = line.split("=", 1)[1].strip()
                                if len(psk_line) == 64:
                                    psk_hex = psk_line
                                break
                        
                        if psk_hex:
                            psk_result2 = subprocess.run(
                                ["wpa_cli", "-i", "wlan0", "set_network", network_id, "psk", psk_hex],
                                capture_output=True, text=True, timeout=5
                            )
                            print(f"set_network psk (wpa_passphrase hex): returncode={psk_result2.returncode}, stdout='{psk_result2.stdout.strip()}'")
                            success2, msg2 = check_wpa_cli_result(psk_result2, "set_network psk (wpa_passphrase)")
                            if not success2:
                                return {"status": "error", "message": f"Nie można ustawić hasła (wszystkie metody nie powiodły się): {msg} / {msg2}"}
                        else:
                            return {"status": "error", "message": f"Nie można wygenerować PSK przez wpa_passphrase: {msg}"}
                    else:
                        return {"status": "error", "message": f"Nie można ustawić hasła: {msg}. wpa_passphrase też nie działał."}
                except Exception as e:
                    return {"status": "error", "message": f"Nie można ustawić hasła: {msg}. Błąd alternatywnej metody: {str(e)}"}
        else:
            # Sieć bez hasła (open network)
            key_mgmt_result = subprocess.run(
                ["wpa_cli", "-i", "wlan0", "set_network", network_id, "key_mgmt", "NONE"],
                capture_output=True, text=True, timeout=5
            )
            print(f"set_network key_mgmt NONE: returncode={key_mgmt_result.returncode}")
        
        # Wyłącz wszystkie inne sieci
        list_result = subprocess.run(
            ["wpa_cli", "-i", "wlan0", "list_networks"],
            capture_output=True, text=True, timeout=5
        )
        
        if list_result.returncode == 0:
            for line in list_result.stdout.splitlines()[1:]:  # Pomiń nagłówek
                parts = line.split()
                if len(parts) > 0 and parts[0].isdigit() and parts[0] != network_id:
                    old_id = parts[0]
                    subprocess.run(
                        ["wpa_cli", "-i", "wlan0", "disable_network", old_id],
                        capture_output=True, text=True, timeout=5
                    )
                    print(f"Wyłączono starą sieć: {old_id}")
        
        # Włącz nową sieć
        enable_result = subprocess.run(
            ["wpa_cli", "-i", "wlan0", "enable_network", network_id],
            capture_output=True, text=True, timeout=5
        )
        
        print(f"enable_network: returncode={enable_result.returncode}, stdout='{enable_result.stdout.strip()}', stderr='{enable_result.stderr}'")
        
        # Sprawdź czy nie zwróciło FAIL
        success, msg = check_wpa_cli_result(enable_result, "enable_network")
        if not success:
            return {"status": "error", "message": f"Nie można włączyć sieci: {msg}"}
        
        # Wybierz sieć jako aktywną
        select_result = subprocess.run(
            ["wpa_cli", "-i", "wlan0", "select_network", network_id],
            capture_output=True, text=True, timeout=5
        )
        
        print(f"select_network: returncode={select_result.returncode}, stdout='{select_result.stdout.strip()}'")
        
        # Zapisz konfigurację - jeśli nie działa przez wpa_cli, spróbuj bezpośrednio
        save_result = subprocess.run(
            ["wpa_cli", "-i", "wlan0", "save_config"],
            capture_output=True, text=True, timeout=5
        )
        
        print(f"save_config: returncode={save_result.returncode}, stdout='{save_result.stdout.strip()}'")
        
        # Jeśli save_config zwrócił FAIL, spróbuj zapisać bezpośrednio do pliku
        if "FAIL" in save_result.stdout.upper():
            print("save_config zwrócił FAIL, próbuję zapisać bezpośrednio do pliku...")
            try:
                # Znajdź plik konfiguracyjny wpa_supplicant
                config_files = [
                    "/etc/wpa_supplicant/wpa_supplicant.conf",
                    "/etc/wpa_supplicant/wpa_supplicant-wlan0.conf",
                    f"/var/run/wpa_supplicant/wlan0.conf"
                ]
                
                for config_file in config_files:
                    try:
                        # Sprawdź czy plik istnieje i można go edytować
                        test_result = subprocess.run(
                            ["test", "-w", config_file],
                            timeout=2
                        )
                        if test_result.returncode == 0:
                            # Dodaj konfigurację sieci do pliku
                            network_config = f"\nnetwork={{\n    ssid=\"{ssid}\"\n"
                            if password:
                                # Użyj wpa_passphrase do wygenerowania bezpiecznego hasła
                                passphrase_result = subprocess.run(
                                    ["wpa_passphrase", ssid, password],
                                    capture_output=True, text=True, timeout=5
                                )
                                if passphrase_result.returncode == 0:
                                    for line in passphrase_result.stdout.splitlines():
                                        if "psk=" in line:
                                            network_config += f"    {line.strip()}\n"
                                            break
                            else:
                                network_config += "    key_mgmt=NONE\n"
                            network_config += "}\n"
                            
                            # Dodaj do pliku
                            with open(config_file, "a") as f:
                                f.write(network_config)
                            print(f"Zapisano konfigurację do {config_file}")
                            break
                    except Exception as e:
                        print(f"Nie można zapisać do {config_file}: {e}")
                        continue
            except Exception as e:
                print(f"Błąd zapisu bezpośredniego: {e}")
        
        # Przeładuj konfigurację - jeśli nie działa, zrestartuj wpa_supplicant
        reconfigure_result = subprocess.run(
            ["wpa_cli", "-i", "wlan0", "reconfigure"],
            capture_output=True, text=True, timeout=5
        )
        
        print(f"reconfigure: returncode={reconfigure_result.returncode}, stdout='{reconfigure_result.stdout.strip()}'")
        
        # Jeśli reconfigure zwrócił FAIL, spróbuj zrestartować wpa_supplicant
        if "FAIL" in reconfigure_result.stdout.upper():
            print("reconfigure zwrócił FAIL, próbuję zrestartować wpa_supplicant...")
            try:
                subprocess.run(["systemctl", "restart", "wpa_supplicant@wlan0"], timeout=10)
                time.sleep(3)
                print("wpa_supplicant zrestartowany")
            except Exception as e:
                print(f"Nie można zrestartować wpa_supplicant: {e}")
        
        # Poczekaj chwilę i sprawdź status
        time.sleep(3)
        status_result = subprocess.run(
            ["wpa_cli", "-i", "wlan0", "status"],
            capture_output=True, text=True, timeout=5
        )
        
        print(f"Status po konfiguracji:\n{status_result.stdout}")
        
        # Sprawdź czy wpa_state=COMPLETED i czy jest IP
        wpa_state = None
        ip_address = None
        ssid_connected = None
        for line in status_result.stdout.splitlines():
            if line.startswith("wpa_state="):
                wpa_state = line.split("=", 1)[1].strip()
            elif line.startswith("ip_address="):
                ip_address = line.split("=", 1)[1].strip()
            elif line.startswith("ssid="):
                ssid_connected = line.split("=", 1)[1].strip()
        
        print(f"wpa_state: {wpa_state}, ip_address: {ip_address}, ssid: {ssid_connected}")
        
        # Sprawdź również przez ip addr show
        ip_check_result = subprocess.run(
            ["ip", "addr", "show", "wlan0"],
            capture_output=True, text=True, timeout=5
        )
        
        if ip_check_result.returncode == 0:
            # Szukaj adresu IP w wyjściu
            for line in ip_check_result.stdout.splitlines():
                if "inet " in line and "127.0.0.1" not in line:
                    parts = line.strip().split()
                    if len(parts) >= 2:
                        ip_from_ip = parts[1].split("/")[0]
                        if ip_from_ip:
                            ip_address = ip_from_ip
                            print(f"Znaleziono IP przez 'ip addr': {ip_address}")
                            break
        
        # Jeśli wpa_state=COMPLETED ale nie ma IP, spróbuj uzyskać IP przez DHCP
        if wpa_state == "COMPLETED" and not ip_address:
            print("wpa_state=COMPLETED ale brak IP, próbuję uzyskać IP przez DHCP...")
            
            # Najpierw zrestartuj interfejs sieciowy
            try:
                print("Restartuję interfejs wlan0...")
                subprocess.run(["ip", "link", "set", "wlan0", "down"], timeout=3)
                time.sleep(1)
                subprocess.run(["ip", "link", "set", "wlan0", "up"], timeout=3)
                time.sleep(2)
                
                # Ponownie wybierz sieć
                subprocess.run(
                    ["wpa_cli", "-i", "wlan0", "select_network", network_id],
                    capture_output=True, text=True, timeout=5
                )
                time.sleep(2)
            except Exception as e:
                print(f"Błąd restartu interfejsu: {e}")
            
            # Spróbuj użyć dhcpcd (najczęściej używany na Raspberry Pi)
            dhcp_success = False
            try:
                # Uruchom dhcpcd w tle jeśli nie działa w trybie jednorazowym
                dhcp_result = subprocess.run(
                    ["dhcpcd", "-4", "-q", "-t", "30", "wlan0"],
                    capture_output=True, text=True, timeout=20
                )
                print(f"dhcpcd: returncode={dhcp_result.returncode}, stdout={dhcp_result.stdout[:200]}")
                if dhcp_result.returncode == 0:
                    dhcp_success = True
            except Exception as e:
                print(f"dhcpcd nie dostępne lub błąd: {e}")
                # Spróbuj uruchomić dhcpcd jako daemon
                try:
                    subprocess.Popen(["dhcpcd", "wlan0"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    print("Uruchomiono dhcpcd jako daemon")
                    time.sleep(3)
                except:
                    pass
            
            # Alternatywnie spróbuj dhclient
            if not dhcp_success:
                try:
                    dhclient_result = subprocess.run(
                        ["dhclient", "-v", "-1", "wlan0"],
                        capture_output=True, text=True, timeout=20
                    )
                    print(f"dhclient: returncode={dhclient_result.returncode}, stdout={dhclient_result.stdout[:200]}")
                    if dhclient_result.returncode == 0:
                        dhcp_success = True
                except Exception as e:
                    print(f"dhclient nie dostępne: {e}")
            
            # Spróbuj przez systemd-networkd jeśli dostępne
            if not dhcp_success:
                try:
                    networkd_result = subprocess.run(
                        ["networkctl", "renew", "wlan0"],
                        capture_output=True, text=True, timeout=10
                    )
                    print(f"networkctl renew: returncode={networkd_result.returncode}, stdout={networkd_result.stdout[:200]}")
                except:
                    pass
            
            # Spróbuj przez NetworkManager jeśli dostępne
            if not dhcp_success:
                try:
                    nm_result = subprocess.run(
                        ["nmcli", "device", "wifi", "connect", ssid, "password", password],
                        capture_output=True, text=True, timeout=15
                    )
                    print(f"nmcli connect: returncode={nm_result.returncode}, stdout={nm_result.stdout[:200]}")
                except:
                    pass
            
            # Spróbuj przez udhcpc (często używany w embedded systems)
            if not dhcp_success:
                try:
                    udhcpc_result = subprocess.run(
                        ["udhcpc", "-i", "wlan0", "-t", "5", "-T", "3"],
                        capture_output=True, text=True, timeout=15
                    )
                    print(f"udhcpc: returncode={udhcpc_result.returncode}")
                except:
                    pass
            
            # Poczekaj chwilę i sprawdź ponownie
            time.sleep(5)
            
            # Sprawdź adres IP przez ip addr show
            ip_result = subprocess.run(
                ["ip", "addr", "show", "wlan0"],
                capture_output=True, text=True, timeout=5
            )
            
            if ip_result.returncode == 0:
                # Szukaj adresu IP w wyjściu
                for line in ip_result.stdout.splitlines():
                    if "inet " in line and not "127.0.0.1" in line:
                        parts = line.strip().split()
                        if len(parts) >= 2:
                            ip_address = parts[1].split("/")[0]
                            print(f"Znaleziono IP: {ip_address}")
                            break
        
        # Sprawdź połączenie jeszcze raz
        final_status = subprocess.run(
            ["wpa_cli", "-i", "wlan0", "status"],
            capture_output=True, text=True, timeout=5
        )
        
        final_wpa_state = None
        final_ip = None
        for line in final_status.stdout.splitlines():
            if line.startswith("wpa_state="):
                final_wpa_state = line.split("=", 1)[1].strip()
            elif line.startswith("ip_address="):
                final_ip = line.split("=", 1)[1].strip()
        
        # Jeśli nadal nie ma IP, sprawdź przez ip addr
        if not final_ip:
            ip_check = subprocess.run(
                ["ip", "addr", "show", "wlan0"],
                capture_output=True, text=True, timeout=5
            )
            if ip_check.returncode == 0:
                for line in ip_check.stdout.splitlines():
                    if "inet " in line and not "127.0.0.1" in line:
                        parts = line.strip().split()
                        if len(parts) >= 2:
                            final_ip = parts[1].split("/")[0]
                            break
        
        if final_wpa_state == "COMPLETED":
            if final_ip:
                # Sprawdź czy można pingować router (sprawdzenie połączenia)
                try:
                    # Wyciągnij adres bramy z ip route
                    route_result = subprocess.run(
                        ["ip", "route", "show", "default"],
                        capture_output=True, text=True, timeout=5
                    )
                    gateway = None
                    if route_result.returncode == 0:
                        for line in route_result.stdout.splitlines():
                            if "default via" in line:
                                parts = line.split()
                                if "via" in parts:
                                    idx = parts.index("via")
                                    if idx + 1 < len(parts):
                                        gateway = parts[idx + 1]
                                        break
                    
                    if gateway:
                        ping_result = subprocess.run(
                            ["ping", "-c", "2", "-W", "2", gateway],
                            capture_output=True, text=True, timeout=5
                        )
                        if ping_result.returncode == 0:
                            # Uruchom wątek do przesyłania danych z UART po udanym połączeniu
                            start_uart_data_thread()
                            return {"status": "success", "message": f"Sieć {ssid} połączona! Adres IP: {final_ip}, brama: {gateway}. Rozpoczęto przesyłanie danych z UART."}
                        else:
                            return {"status": "warning", "message": f"Sieć {ssid} ma IP ({final_ip}), ale nie można pingować bramy. Sprawdź połączenie."}
                    else:
                        # Uruchom wątek do przesyłania danych z UART po udanym połączeniu
                        start_uart_data_thread()
                        return {"status": "success", "message": f"Sieć {ssid} połączona! Adres IP: {final_ip}. Rozpoczęto przesyłanie danych z UART."}
                except:
                    # Uruchom wątek do przesyłania danych z UART po udanym połączeniu
                    start_uart_data_thread()
                    return {"status": "success", "message": f"Sieć {ssid} połączona! Adres IP: {final_ip}. Rozpoczęto przesyłanie danych z UART."}
            else:
                return {"status": "warning", "message": f"Sieć {ssid} połączona (wpa_state=COMPLETED), ale brak adresu IP. Może być potrzebny restart interfejsu lub sprawdź konfigurację DHCP. Spróbuj: sudo dhcpcd wlan0 lub sudo systemctl restart networking"}
        else:
            return {"status": "error", "message": f"Sieć {ssid} skonfigurowana, ale wpa_state={final_wpa_state} (oczekiwano COMPLETED). Sprawdź hasło i zasięg sieci."}
        
    except subprocess.TimeoutExpired:
        return {"status": "error", "message": "Timeout podczas konfiguracji WiFi"}
    except FileNotFoundError:
        return {"status": "error", "message": "wpa_cli nie został znaleziony"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": f"Błąd konfiguracji: {str(e)}"}

def disconnect_wifi():
    """Rozłącza z aktualnie połączoną siecią WiFi"""
    try:
        print("Rozłączam z aktualną siecią WiFi...")
        
        # Sprawdź czy wpa_cli działa
        test_result = subprocess.run(
            ["wpa_cli", "-i", "wlan0", "ping"],
            capture_output=True, text=True, timeout=5
        )
        
        if test_result.returncode != 0 or "PONG" not in test_result.stdout:
            return {"status": "error", "message": f"wpa_cli nie odpowiada: {test_result.stderr or test_result.stdout}"}
        
        # Pobierz listę aktywnych sieci
        list_result = subprocess.run(
            ["wpa_cli", "-i", "wlan0", "list_networks"],
            capture_output=True, text=True, timeout=5
        )
        
        if list_result.returncode == 0:
            # Wyłącz wszystkie sieci
            for line in list_result.stdout.splitlines()[1:]:  # Pomiń nagłówek
                parts = line.split()
                if len(parts) > 0 and parts[0].isdigit():
                    network_id = parts[0]
                    # Sprawdź czy sieć jest aktywna (flaga [CURRENT] lub [DISCONNECTED])
                    if "[CURRENT]" in line or len(parts) > 3:
                        disable_result = subprocess.run(
                            ["wpa_cli", "-i", "wlan0", "disable_network", network_id],
                            capture_output=True, text=True, timeout=5
                        )
                        print(f"Wyłączono sieć ID {network_id}: {disable_result.stdout.strip()}")
            
            # Rozłącz się z aktualną siecią
            disconnect_result = subprocess.run(
                ["wpa_cli", "-i", "wlan0", "disconnect"],
                capture_output=True, text=True, timeout=5
            )
            
            print(f"disconnect: returncode={disconnect_result.returncode}, stdout='{disconnect_result.stdout.strip()}'")
            
            # Poczekaj chwilę
            time.sleep(2)
            
            # Sprawdź status
            status_result = subprocess.run(
                ["wpa_cli", "-i", "wlan0", "status"],
                capture_output=True, text=True, timeout=5
            )
            
            wpa_state = None
            for line in status_result.stdout.splitlines():
                if line.startswith("wpa_state="):
                    wpa_state = line.split("=", 1)[1].strip()
                    break
            
            if wpa_state in ["DISCONNECTED", "INACTIVE"]:
                # Zatrzymaj wątek przesyłania danych gdy WiFi jest rozłączone
                stop_uart_data_thread()
                return {"status": "success", "message": "Rozłączono z siecią WiFi. Zatrzymano przesyłanie danych z UART."}
            else:
                return {"status": "warning", "message": f"Komenda rozłączenia wykonana, ale wpa_state={wpa_state}"}
        else:
            return {"status": "error", "message": f"Nie można pobrać listy sieci: {list_result.stderr or list_result.stdout}"}
            
    except subprocess.TimeoutExpired:
        return {"status": "error", "message": "Timeout podczas rozłączania z WiFi"}
    except FileNotFoundError:
        return {"status": "error", "message": "wpa_cli nie został znaleziony"}
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": f"Błąd rozłączania: {str(e)}"}

def get_wifi_status():
    """Pobiera aktualny stan połączenia WiFi, w tym siłę sygnału"""
    try:
        status_info = {
            "connected": False,
            "ssid": None,
            "ip_address": None,
            "signal_strength": None,
            "wpa_state": None,
            "freq": None,
            "bssid": None
        }
        
        # Sprawdź status przez wpa_cli
        try:
            status_result = subprocess.run(
                ["wpa_cli", "-i", "wlan0", "status"],
                capture_output=True, text=True, timeout=5
            )
            
            if status_result.returncode == 0:
                for line in status_result.stdout.splitlines():
                    if line.startswith("wpa_state="):
                        status_info["wpa_state"] = line.split("=", 1)[1].strip()
                        status_info["connected"] = (status_info["wpa_state"] == "COMPLETED")
                    elif line.startswith("ssid="):
                        status_info["ssid"] = line.split("=", 1)[1].strip()
                    elif line.startswith("ip_address="):
                        status_info["ip_address"] = line.split("=", 1)[1].strip()
                    elif line.startswith("freq="):
                        status_info["freq"] = line.split("=", 1)[1].strip()
                    elif line.startswith("bssid="):
                        status_info["bssid"] = line.split("=", 1)[1].strip()
        except:
            pass
        
        # Jeśli nie ma IP z wpa_cli, sprawdź przez ip addr
        if not status_info["ip_address"]:
            try:
                ip_result = subprocess.run(
                    ["ip", "addr", "show", "wlan0"],
                    capture_output=True, text=True, timeout=5
                )
                if ip_result.returncode == 0:
                    for line in ip_result.stdout.splitlines():
                        if "inet " in line and "127.0.0.1" not in line:
                            parts = line.strip().split()
                            if len(parts) >= 2:
                                status_info["ip_address"] = parts[1].split("/")[0]
                                break
            except:
                pass
        
        # Pobierz siłę sygnału - spróbuj kilka metod
        signal_found = False
        
        # Metoda 1: przez iw (najbardziej niezawodna)
        if status_info["ssid"] and not signal_found:
            try:
                iw_result = subprocess.run(
                    ["iw", "dev", "wlan0", "link"],
                    capture_output=True, text=True, timeout=5
                )
                if iw_result.returncode == 0:
                    for line in iw_result.stdout.splitlines():
                        if "signal:" in line.lower():
                            # Format: "signal: -45 dBm" lub "Signal: -45 dBm"
                            parts = line.split()
                            for i, part in enumerate(parts):
                                if part.lower() == "signal:" and i + 1 < len(parts):
                                    signal_str = parts[i + 1]
                                    try:
                                        # Usuń "dBm" jeśli jest
                                        signal_value = int(signal_str.replace("dBm", "").strip())
                                        status_info["signal_strength"] = signal_value
                                        signal_found = True
                                        break
                                    except:
                                        pass
            except:
                pass
        
        # Metoda 2: przez iwlist
        if status_info["ssid"] and not signal_found:
            try:
                iwlist_result = subprocess.run(
                    ["iwlist", "wlan0", "scan"],
                    capture_output=True, text=True, timeout=10
                )
                if iwlist_result.returncode == 0:
                    current_essid = None
                    for line in iwlist_result.stdout.splitlines():
                        line = line.strip()
                        if "ESSID:" in line:
                            essid_part = line.split("ESSID:")[1].strip().strip('"').strip("'")
                            if essid_part == status_info["ssid"]:
                                current_essid = essid_part
                        elif current_essid and "Signal level=" in line:
                            # Format: "Signal level=-45 dBm" lub "Quality=70/70  Signal level=-40 dBm"
                            try:
                                signal_part = line.split("Signal level=")[1].split()[0]
                                signal_value = int(signal_part)
                                status_info["signal_strength"] = signal_value
                                signal_found = True
                                break
                            except:
                                pass
            except:
                pass
        
        # Metoda 3: przez nmcli (jeśli dostępne)
        if status_info["ssid"] and not signal_found:
            try:
                nmcli_result = subprocess.run(
                    ["nmcli", "-t", "-f", "SIGNAL", "device", "wifi", "list"],
                    capture_output=True, text=True, timeout=10
                )
                if nmcli_result.returncode == 0:
                    # nmcli zwraca listę sieci, znajdź tę która jest połączona
                    nmcli_status = subprocess.run(
                        ["nmcli", "-t", "-f", "NAME,SSID,SIGNAL", "device", "wifi"],
                        capture_output=True, text=True, timeout=10
                    )
                    if nmcli_status.returncode == 0:
                        for line in nmcli_status.stdout.splitlines():
                            parts = line.split(":")
                            if len(parts) >= 3 and parts[1] == status_info["ssid"]:
                                try:
                                    signal_value = int(parts[2])
                                    status_info["signal_strength"] = signal_value
                                    signal_found = True
                                    break
                                except:
                                    pass
            except:
                pass
        
        return {
            "status": "success",
            "wifi": status_info
        }
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"status": "error", "message": f"Błąd pobierania statusu WiFi: {str(e)}"}

# ===================== DBUS EXCEPTIONS =====================
class InvalidArgsException(dbus.exceptions.DBusException):
    _dbus_error_name = "org.freedesktop.DBus.Error.InvalidArgs"

# ===================== APPLICATION =====================
class Application(dbus.service.Object):
    def __init__(self, bus):
        self.path = "/org/bluez/example/app"
        self.services = []
        super().__init__(bus, self.path)

    def get_path(self):
        return dbus.ObjectPath(self.path)

    def add_service(self, service):
        self.services.append(service)

    @dbus.service.method("org.freedesktop.DBus.ObjectManager",
                         out_signature="a{oa{sa{sv}}}")
    def GetManagedObjects(self):
        response = {}
        for service in self.services:
            response[service.get_path()] = service.get_properties()
            for ch in service.characteristics:
                response[ch.get_path()] = ch.get_properties()
        return response

# ===================== SERVICE =====================
class Service(dbus.service.Object):
    def __init__(self, bus, index):
        self.path = f"/org/bluez/example/service{index}"
        self.uuid = SERVICE_UUID
        self.primary = True
        self.characteristics = []
        super().__init__(bus, self.path)

    def add_characteristic(self, ch):
        self.characteristics.append(ch)

    def get_path(self):
        return dbus.ObjectPath(self.path)

    def get_properties(self):
        return {
            "org.bluez.GattService1": {
                "UUID": self.uuid,
                "Primary": self.primary,
                "Characteristics": dbus.Array(
                    [c.get_path() for c in self.characteristics], signature='o'
                )
            }
        }

    @dbus.service.method("org.freedesktop.DBus.Properties",
                         in_signature="s",
                         out_signature="a{sv}")
    def GetAll(self, interface):
        if interface != "org.bluez.GattService1":
            raise InvalidArgsException()
        return self.get_properties()[interface]

# ===================== CHARACTERISTIC =====================
class Characteristic(dbus.service.Object):
    def __init__(self, bus, index, service):
        self.path = f"{service.path}/char{index}"
        self.uuid = CHAR_UUID
        self.service = service
        self.flags = ["read", "write", "notify"]
        self.notifying = False
        super().__init__(bus, self.path)

    def get_path(self):
        return dbus.ObjectPath(self.path)

    def get_properties(self):
        return {
            "org.bluez.GattCharacteristic1": {
                "UUID": self.uuid,
                "Service": self.service.get_path(),
                "Flags": self.flags
            }
        }

    @dbus.service.method("org.freedesktop.DBus.Properties",
                         in_signature="s",
                         out_signature="a{sv}")
    def GetAll(self, interface):
        if interface != "org.bluez.GattCharacteristic1":
            raise InvalidArgsException()
        return self.get_properties()[interface]

    @dbus.service.method("org.bluez.GattCharacteristic1",
                         in_signature="a{sv}", out_signature="ay")
    def ReadValue(self, options):
        data = json.dumps(current_status).encode()
        return dbus.Array([dbus.Byte(b) for b in data], signature='y')

    @dbus.service.method("org.bluez.GattCharacteristic1",
                         in_signature="", out_signature="")
    def StartNotify(self):
        if self.notifying:
            print("Już notyfikuję")
            return
        self.notifying = True
        print("Rozpoczęto notyfikacje")

    @dbus.service.method("org.bluez.GattCharacteristic1",
                         in_signature="", out_signature="")
    def StopNotify(self):
        if not self.notifying:
            return
        self.notifying = False
        print("Zatrzymano notyfikacje")

    @dbus.service.signal("org.freedesktop.DBus.Properties",
                         signature="sa{sv}as")
    def PropertiesChanged(self, interface, changed, invalidated):
        pass

    def _notify_status_change(self):
        """Wysyła notyfikację o zmianie statusu jeśli notifications są włączone"""
        if self.notifying:
            try:
                data = json.dumps(current_status).encode()
                # Emituj sygnał PropertiesChanged dla BlueZ
                self.PropertiesChanged(
                    "org.bluez.GattCharacteristic1",
                    {"Value": dbus.Array([dbus.Byte(b) for b in data], signature='y')},
                    []
                )
            except Exception as e:
                print(f"Błąd wysyłania notyfikacji: {e}")

    @dbus.service.method("org.bluez.GattCharacteristic1",
                         in_signature="aya{sv}", out_signature="")
    def WriteValue(self, value, options):
        global current_status
        try:
            data = bytes(value).decode()
            cmd = json.loads(data)
            print(f"Otrzymano komendę: {cmd}")
            
            if cmd["type"] == "scan":
                print("=" * 50)
                print("Rozpoczynam skanowanie WiFi...")
                print("=" * 50)
                result = scan_wifi()
                print(f"Wynik skanowania (typ: {type(result)}): {result}")
                
                # Jeśli wynik zawiera błąd, zwróć go bezpośrednio
                if isinstance(result, dict) and "error" in result:
                    current_status = result
                    print(f"Błąd skanowania: {result['error']}")
                elif isinstance(result, list):
                    # Jeśli to lista sieci, zwróć ją w odpowiednim formacie
                    if len(result) == 0:
                        # Pusta lista - może być problem z uprawnieniami lub WiFi
                        current_status = {
                            "error": "Skanowanie zakończone, ale nie znaleziono sieci. Sprawdź:\n"
                                    "1. Czy WiFi jest włączone (rfkill unblock wifi)\n"
                                    "2. Czy adapter jest UP (ip link set wlan0 up)\n"
                                    "3. Czy uruchomiono jako root\n"
                                    "4. Sprawdź logi powyżej"
                        }
                        print("UWAGA: Skanowanie zwróciło pustą listę!")
                    else:
                        current_status = {"networks": result}
                        print(f"Znaleziono {len(result)} sieci")
                        if len(result) > 0:
                            print("Sieci:")
                            for net in result:
                                print(f"  - {net.get('ssid', 'N/A')}")
                else:
                    current_status = {"error": f"Nieoczekiwany typ wyniku: {type(result)}"}
                    print(f"Nieoczekiwany typ wyniku: {type(result)}")
                print("=" * 50)
                # Wyślij notyfikację o zmianie statusu
                self._notify_status_change()
                    
            elif cmd["type"] == "configure":
                print(f"Konfiguruję WiFi: SSID={cmd.get('ssid')}, hasło={'*' * len(cmd.get('password', ''))}")
                current_status = configure_wifi(cmd.get("ssid", ""), cmd.get("password", ""))
                print(f"Wynik konfiguracji: {current_status}")
                # Zaktualizuj status WiFi po konfiguracji
                time.sleep(2)  # Poczekaj chwilę na stabilizację
                wifi_status = get_wifi_status()
                if wifi_status.get("status") == "success":
                    current_status["wifi_status"] = wifi_status.get("wifi", {})
                # Wyślij notyfikację o zmianie statusu
                self._notify_status_change()
            elif cmd["type"] == "disconnect":
                print("Rozłączam z WiFi...")
                current_status = disconnect_wifi()
                print(f"Wynik rozłączenia: {current_status}")
                # Zaktualizuj status WiFi po rozłączeniu
                time.sleep(1)
                wifi_status = get_wifi_status()
                if wifi_status.get("status") == "success":
                    current_status["wifi_status"] = wifi_status.get("wifi", {})
                # Wyślij notyfikację o zmianie statusu
                self._notify_status_change()
            elif cmd["type"] == "status":
                print("Sprawdzam status WiFi...")
                current_status = get_wifi_status()
                print(f"Status WiFi: {current_status}")
                # Wyślij notyfikację o zmianie statusu
                self._notify_status_change()
            elif cmd["type"] == "uart_init":
                # Inicjalizuj UART
                port = cmd.get("port", "/dev/ttyAMA0")
                baudrate = cmd.get("baudrate", 9600)
                print(f"Inicjalizuję UART: {port} @ {baudrate} baud")
                current_status = init_uart(port, baudrate)
                self._notify_status_change()
            elif cmd["type"] == "uart_send":
                # Wyślij dane przez UART
                data = cmd.get("data", "")
                print(f"Wysyłanie przez UART: {data}")
                current_status = send_uart(data)
                self._notify_status_change()
            elif cmd["type"] == "uart_read":
                # Odczytaj dane z UART
                timeout = cmd.get("timeout", 1.0)
                print(f"Odczyt z UART (timeout={timeout}s)")
                current_status = read_uart(timeout)
                self._notify_status_change()
            elif cmd["type"] == "uart_close":
                # Zamknij UART
                print("Zamykanie UART")
                current_status = close_uart()
                self._notify_status_change()
            elif cmd["type"] == "uart_list":
                # Lista dostępnych portów UART
                print("Listowanie portów UART")
                current_status = list_uart_ports()
                self._notify_status_change()
            else:
                current_status = {"error": f"Nieznany typ komendy: {cmd.get('type')}"}
                print(f"Nieznana komenda: {cmd.get('type')}")
                self._notify_status_change()
        except json.JSONDecodeError as e:
            current_status = {"error": f"Błąd parsowania JSON: {str(e)}"}
            print(f"Błąd JSON: {e}")
            self._notify_status_change()
        except KeyError as e:
            current_status = {"error": f"Brakujące pole w komendzie: {str(e)}"}
            print(f"Brakujące pole: {e}")
            self._notify_status_change()
        except Exception as e:
            current_status = {"error": f"Błąd: {str(e)}"}
            print(f"Błąd ogólny: {e}")
            import traceback
            traceback.print_exc()
            self._notify_status_change()

# ===================== ADVERTISEMENT =====================
class Advertisement(dbus.service.Object):
    PATH = "/org/bluez/example/advertisement"

    def __init__(self, bus):
        self.bus = bus
        super().__init__(bus, self.PATH)

    def get_properties(self):
        return {
            "org.bluez.LEAdvertisement1": {
                "Type": "peripheral",
                "ServiceUUIDs": dbus.Array([ADV_UUID], signature='s'),
                "LocalName": "RPi-WiFi-Setup",
                "IncludeTxPower": True
            }
        }

    @dbus.service.method("org.freedesktop.DBus.Properties",
                         in_signature="s",
                         out_signature="a{sv}")
    def GetAll(self, interface):
        return self.get_properties()[interface]

    @dbus.service.method("org.bluez.LEAdvertisement1")
    def Release(self):
        pass

# ===================== MAIN =====================
def main():
    dbus.mainloop.glib.DBusGMainLoop(set_as_default=True)
    bus = dbus.SystemBus()

    adapter = bus.get_object("org.bluez", "/org/bluez/hci0")
    props = dbus.Interface(adapter, "org.freedesktop.DBus.Properties")

    # Ustaw nazwę adaptera Bluetooth (widoczna w standardowym Bluetooth)
    try:
        props.Set("org.bluez.Adapter1", "Alias", "RPi-WiFi-Setup")
        print("Ustawiono nazwę adaptera Bluetooth: RPi-WiFi-Setup")
    except Exception as e:
        print(f"Nie można ustawić nazwy adaptera (może być już ustawiona): {e}")

    props.Set("org.bluez.Adapter1", "Powered", dbus.Boolean(1))
    props.Set("org.bluez.Adapter1", "Discoverable", dbus.Boolean(1))
    props.Set("org.bluez.Adapter1", "DiscoverableTimeout", dbus.UInt32(0))

    app = Application(bus)
    service = Service(bus, 0)
    ch = Characteristic(bus, 0, service)
    service.add_characteristic(ch)
    app.add_service(service)

    gatt = dbus.Interface(adapter, "org.bluez.GattManager1")
    adv_mgr = dbus.Interface(adapter, "org.bluez.LEAdvertisingManager1")

    adv = Advertisement(bus)

    gatt.RegisterApplication(app.get_path(), {}, reply_handler=lambda: None, error_handler=print)
    adv_mgr.RegisterAdvertisement(adv.PATH, {}, reply_handler=lambda: None, error_handler=print)

    print("BLE WiFi Config Server uruchomiony")
    GLib.MainLoop().run()


if __name__ == '__main__':
    main()
