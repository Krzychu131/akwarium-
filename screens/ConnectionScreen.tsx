import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import '../global.css';

// UUID zgodne z serwerem Python
const SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';
const CHAR_UUID = '12345678-1234-1234-1234-123456789abd';
const DEVICE_NAME = 'RPi-WiFi-Setup';

interface WiFiNetwork {
  ssid: string;
  signal_strength?: number;
}

interface WiFiStatus {
  connected: boolean;
  ssid?: string;
  ip_address?: string;
  signal_strength?: number;
  freq?: number;
  wpa_state?: string;
}

interface LogEntry {
  id: string;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  timestamp: string;
}

interface ConnectionScreenProps {
  onBack: () => void;
}

export default function ConnectionScreen({ onBack }: ConnectionScreenProps) {
  const [bleManager] = useState(() => new BleManager());
  const [device, setDevice] = useState<Device | null>(null);
  const [characteristic, setCharacteristic] = useState<Characteristic | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [networks, setNetworks] = useState<WiFiNetwork[]>([]);
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [ssid, setSsid] = useState('');
  const [password, setPassword] = useState('');
  const [wifiStatus, setWifiStatus] = useState<WiFiStatus | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);

  useEffect(() => {
    addLog('Aplikacja gotowa. Kliknij "Połącz z urządzeniem" aby rozpocząć.', 'info');
    
    const subscription = bleManager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        addLog('Bluetooth włączony', 'success');
      } else {
        addLog('Bluetooth wyłączony', 'warning');
      }
    }, true);

    return () => {
      subscription.remove();
      bleManager.destroy();
    };
  }, [bleManager]);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    const entry: LogEntry = {
      id: Date.now().toString() + Math.random().toString(),
      message,
      type,
      timestamp: new Date().toLocaleTimeString(),
    };
    setLogs((prev) => [...prev, entry]);
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const showAlert = (title: string, message: string) => {
    Alert.alert(title, message);
  };

  const connectDevice = async () => {
    try {
      if (isScanning || isConnected) {
        addLog('Skanowanie już trwa lub jesteś już połączony', 'warning');
        return;
      }

      addLog('Rozpoczynam połączenie z urządzeniem BLE...', 'info');
      
      const state = await bleManager.state();
      if (state !== 'PoweredOn') {
        showAlert('Błąd', 'Włącz Bluetooth w ustawieniach urządzenia');
        addLog('Bluetooth nie jest włączony', 'error');
        return;
      }

      addLog('Skanowanie urządzeń BLE...', 'info');
      setIsScanning(true);
      let deviceFound = false;
      let timeoutId: NodeJS.Timeout | null = null;
      
      bleManager.startDeviceScan(
        [SERVICE_UUID],
        { allowDuplicates: false },
        async (error, scannedDevice) => {
          if (error) {
            addLog(`Błąd skanowania: ${error.message}`, 'error');
            bleManager.stopDeviceScan();
            setIsScanning(false);
            if (timeoutId) clearTimeout(timeoutId);
            return;
          }

          if (scannedDevice && !deviceFound && (scannedDevice.name === DEVICE_NAME || scannedDevice.name?.startsWith('RPi'))) {
            deviceFound = true;
            bleManager.stopDeviceScan();
            setIsScanning(false);
            
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
            
            addLog(`Znaleziono urządzenie: ${scannedDevice.name}`, 'success');
            addLog('Próba połączenia z urządzeniem...', 'info');

            try {
              addLog('Łączenie z urządzeniem...', 'info');
              const connectedDevice = await scannedDevice.connect();
              setDevice(connectedDevice);
              addLog('Połączono z urządzeniem', 'success');

              addLog('Odkrywanie serwisów i charakterystyk...', 'info');
              const discoveredDevice = await connectedDevice.discoverAllServicesAndCharacteristics();
              addLog('Odkryto serwisy i charakterystyki', 'success');

              const services = await discoveredDevice.services();
              addLog(`Znaleziono ${services.length} serwisów`, 'info');
              const service = services.find((s) => s.uuid.toLowerCase() === SERVICE_UUID.toLowerCase());
              
              if (!service) {
                addLog(`Dostępne serwisy: ${services.map(s => s.uuid).join(', ')}`, 'error');
                throw new Error('Nie znaleziono serwisu BLE');
              }
              addLog('Znaleziono serwis BLE', 'success');

              const characteristics = await service.characteristics();
              addLog(`Znaleziono ${characteristics.length} charakterystyk`, 'info');
              const char = characteristics.find((c) => c.uuid.toLowerCase() === CHAR_UUID.toLowerCase());
              
              if (!char) {
                addLog(`Dostępne charakterystyki: ${characteristics.map(c => c.uuid).join(', ')}`, 'error');
                throw new Error('Nie znaleziono charakterystyki BLE');
              }
              addLog('Znaleziono charakterystykę BLE', 'success');

              setCharacteristic(char);
              setIsConnected(true);

              try {
                await char.monitor((error, char) => {
                  if (error) {
                    addLog(`Błąd powiadomienia: ${error.message}`, 'error');
                    return;
                  }
                  if (char?.value) {
                    const data = base64ToUtf8(char.value);
                    try {
                      const response = JSON.parse(data);
                      addLog('Otrzymano powiadomienie: ' + JSON.stringify(response), 'info');
                      handleResponse(response);
                    } catch (e: any) {
                      addLog('Błąd parsowania powiadomienia: ' + e.message, 'error');
                    }
                  }
                });
                addLog('Włączono powiadomienia BLE', 'success');
              } catch (e: any) {
                addLog('Nie można włączyć powiadomień: ' + e.message, 'warning');
              }

              addLog('Połączenie zakończone sukcesem!', 'success');
            } catch (error: any) {
              addLog('Błąd połączenia: ' + error.message, 'error');
              addLog('Szczegóły błędu: ' + JSON.stringify(error), 'error');
              showAlert('Błąd', 'Błąd połączenia: ' + error.message);
              setIsScanning(false);
              setIsConnected(false);
              setDevice(null);
              setCharacteristic(null);
            }
          }
        }
      );

      timeoutId = setTimeout(() => {
        bleManager.stopDeviceScan();
        setIsScanning(false);
        if (!deviceFound) {
          addLog('Timeout - nie znaleziono urządzenia', 'warning');
          showAlert('Timeout', 'Nie znaleziono urządzenia. Upewnij się, że Raspberry Pi jest włączone i działa serwer BLE.');
        }
      }, 15000);
    } catch (error: any) {
      addLog('Błąd: ' + error.message, 'error');
      showAlert('Błąd', 'Błąd: ' + error.message);
      setIsScanning(false);
    }
  };

  const disconnectDevice = async () => {
    if (device) {
      try {
        await device.cancelConnection();
        addLog('Rozłączono z urządzeniem', 'warning');
        setDevice(null);
        setCharacteristic(null);
        setIsConnected(false);
        setNetworks([]);
        setWifiStatus(null);
      } catch (error: any) {
        addLog('Błąd rozłączania: ' + error.message, 'error');
      }
    }
  };

  const base64ToUtf8 = (base64: string): string => {
    try {
      const binaryString = atob(base64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      return new TextDecoder('utf-8').decode(bytes);
    } catch {
      return '';
    }
  };

  const utf8ToBase64 = (str: string): string => {
    try {
      const bytes = new TextEncoder().encode(str);
      const binaryString = String.fromCharCode(...bytes);
      return btoa(binaryString);
    } catch {
      return '';
    }
  };

  const sendCommand = async (command: any): Promise<any> => {
    if (!characteristic) {
      throw new Error('Nie połączono z urządzeniem');
    }

    const data = JSON.stringify(command);
    addLog('Wysyłanie komendy: ' + data, 'info');
    
    const base64Data = utf8ToBase64(data);
    await characteristic.writeWithResponse(base64Data);

    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const value = await characteristic.read();
      if (value?.value) {
        const responseText = base64ToUtf8(value.value);
        const response = JSON.parse(responseText);
        addLog('Otrzymano odpowiedź: ' + JSON.stringify(response), 'info');
        return response;
      }
    } catch (e: any) {
      addLog('Błąd odczytu odpowiedzi: ' + e.message, 'error');
    }
    return null;
  };

  const handleResponse = (response: any) => {
    if (response.networks) {
      setNetworks(response.networks);
      addLog(`Znaleziono ${response.networks.length} sieci`, 'success');
    } else if (response.status) {
      if (response.status === 'success') {
        addLog(response.message || 'Operacja zakończona sukcesem!', 'success');
        showAlert('Sukces', response.message || 'Operacja zakończona sukcesem!');
      } else if (response.status === 'error') {
        addLog(response.message || 'Wystąpił błąd', 'error');
        showAlert('Błąd', response.message || 'Wystąpił błąd');
      } else if (response.status === 'warning') {
        addLog(response.message || 'Ostrzeżenie', 'warning');
      }
    } else if (response.error) {
      addLog(response.error, 'error');
      showAlert('Błąd', response.error);
    }

    if (response.wifi_status || response.wifi) {
      displayWiFiStatus(response.wifi_status || response.wifi);
    }
  };

  const scanWiFi = async () => {
    try {
      setIsScanning(true);
      addLog('Rozpoczynam skanowanie sieci WiFi...', 'info');
      const response = await sendCommand({ type: 'scan' });
      
      if (response && response.networks) {
        setNetworks(response.networks);
        addLog(`Znaleziono ${response.networks.length} sieci`, 'success');
      } else if (response && response.error) {
        showAlert('Błąd', response.error);
      }
    } catch (error: any) {
      addLog('Błąd skanowania: ' + error.message, 'error');
      showAlert('Błąd', 'Błąd skanowania: ' + error.message);
    } finally {
      setIsScanning(false);
    }
  };

  const configureWiFi = async () => {
    if (!ssid.trim()) {
      showAlert('Błąd', 'Podaj nazwę sieci (SSID)');
      return;
    }

    try {
      setIsConfiguring(true);
      addLog(`Konfiguruję WiFi: SSID=${ssid}`, 'info');
      const response = await sendCommand({
        type: 'configure',
        ssid: ssid.trim(),
        password: password.trim() || undefined,
      });

      if (response) {
        handleResponse(response);
        if (response.status === 'success') {
          setPassword('');
          setTimeout(() => {
            getWiFiStatus();
          }, 5000);
        }
      }
    } catch (error: any) {
      addLog('Błąd konfiguracji: ' + error.message, 'error');
      showAlert('Błąd', 'Błąd konfiguracji: ' + error.message);
    } finally {
      setIsConfiguring(false);
    }
  };

  const disconnectWiFi = async () => {
    try {
      addLog('Rozłączam z WiFi...', 'info');
      const response = await sendCommand({ type: 'disconnect' });
      if (response) {
        handleResponse(response);
      }
    } catch (error: any) {
      addLog('Błąd rozłączania: ' + error.message, 'error');
      showAlert('Błąd', 'Błąd rozłączania: ' + error.message);
    }
  };

  const getWiFiStatus = async () => {
    try {
      setIsCheckingStatus(true);
      addLog('Sprawdzam status WiFi...', 'info');
      const response = await sendCommand({ type: 'status' });
      
      if (response && (response.wifi || response.wifi_status)) {
        displayWiFiStatus(response.wifi || response.wifi_status);
      } else if (response && response.error) {
        showAlert('Błąd', response.error);
      }
    } catch (error: any) {
      addLog('Błąd sprawdzania statusu: ' + error.message, 'error');
      showAlert('Błąd', 'Błąd sprawdzania statusu: ' + error.message);
    } finally {
      setIsCheckingStatus(false);
    }
  };

  const displayWiFiStatus = (wifi: WiFiStatus) => {
    setWifiStatus(wifi);
  };

  const selectNetwork = (networkSsid: string) => {
    setSelectedNetwork(networkSsid);
    setSsid(networkSsid);
  };

  const getSignalIcon = (strength?: number) => {
    if (!strength) return '📶';
    if (strength > -50) return '📶';
    if (strength > -70) return '📶';
    return '📶';
  };

  const getSignalColor = (strength?: number) => {
    if (!strength) return 'text-gray-400';
    if (strength > -50) return 'text-green-500';
    if (strength > -70) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <>
      <StatusBar style="light" />
      <ScrollView className="flex-1" style={{ backgroundColor: '#0891b2' }}>
        <View className="flex-1 p-4 pt-12">
          {/* Header z przyciskiem powrotu */}
          <View className="flex-row items-center mb-6">
            <TouchableOpacity
              onPress={onBack}
              className="mr-4 p-2 rounded-full bg-white/20"
            >
              <Text className="text-white text-2xl">←</Text>
            </TouchableOpacity>
            <View className="flex-1 items-center">
              <View className="bg-white/20 rounded-full p-4 mb-3">
                <Text className="text-4xl">📡</Text>
              </View>
              <Text className="text-white text-3xl font-bold text-center mb-2">
                WiFi Config
              </Text>
              <Text className="text-white/90 text-sm text-center">
                Konfiguracja WiFi przez Bluetooth Low Energy
              </Text>
            </View>
            <View className="w-12" />
          </View>

          {/* Status połączenia */}
          <TouchableOpacity
            onPress={!isConnected ? connectDevice : disconnectDevice}
            disabled={isScanning && !isConnected}
            className="mb-6 shadow-xl"
            style={{
              shadowColor: '#0891b2',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <View className="bg-white rounded-3xl p-6 shadow-lg">
              <View className="flex-row items-center">
                <View className={`rounded-full p-4 mr-4 ${isConnected ? 'bg-green-100' : 'bg-red-100'}`}>
                  <Text className="text-3xl">{isConnected ? '✓' : '🔌'}</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 text-2xl font-bold mb-1">
                    {isConnected ? 'Połączono' : 'Połączenie BLE'}
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    {isScanning ? 'Skanowanie...' : isConnected ? device?.name || 'Urządzenie BLE' : 'Kliknij aby połączyć'}
                  </Text>
                </View>
                {isScanning && !isConnected ? (
                  <ActivityIndicator color="#0891b2" size="small" />
                ) : (
                  <View className="ml-4">
                    <Text className="text-gray-400 text-2xl">→</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {/* Skanowanie WiFi */}
          <TouchableOpacity
            onPress={scanWiFi}
            disabled={!isConnected || isScanning}
            className="mb-6 shadow-xl"
            style={{
              shadowColor: '#0891b2',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <View className="bg-white rounded-3xl p-6 shadow-lg">
              <View className="flex-row items-center">
                <View className="bg-purple-100 rounded-full p-4 mr-4">
                  <Text className="text-3xl">📶</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 text-2xl font-bold mb-1">
                    Skanuj WiFi
                  </Text>
                  <Text className="text-gray-600 text-sm">
                    {isScanning ? 'Skanowanie...' : networks.length > 0 ? `Znaleziono ${networks.length} sieci` : 'Znajdź dostępne sieci'}
                  </Text>
                </View>
                {isScanning ? (
                  <ActivityIndicator color="#9333ea" size="small" />
                ) : (
                  <View className="ml-4">
                    <Text className="text-gray-400 text-2xl">→</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {networks.length > 0 && (
            <View className="mb-6 bg-white rounded-3xl p-6 shadow-xl" style={{
              shadowColor: '#0891b2',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 8,
            }}>
              <Text className="text-gray-800 text-xl font-bold mb-4">Wybierz sieć ({networks.length})</Text>
              <ScrollView className="max-h-64">
                {networks.map((network, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => selectNetwork(network.ssid)}
                    className={`p-4 mb-2 rounded-xl border-2 ${
                      selectedNetwork === network.ssid
                        ? 'border-cyan-500 shadow-md'
                        : 'border-gray-200 bg-gray-50'
                    }`}
                    style={selectedNetwork === network.ssid ? {
                      backgroundColor: '#ecfeff',
                      shadowColor: '#06b6d4',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.2,
                      shadowRadius: 4,
                      elevation: 3,
                    } : { backgroundColor: '#f9fafb' }}
                  >
                    <View className="flex-row items-center justify-between">
                      <View className="flex-1">
                        <Text className="text-gray-900 font-bold text-base mb-1">
                          {network.ssid || 'Bez nazwy'}
                        </Text>
                        {network.signal_strength && (
                          <View className="flex-row items-center">
                            <Text className={`text-sm ${getSignalColor(network.signal_strength)}`}>
                              {getSignalIcon(network.signal_strength)}
                            </Text>
                            <Text className="text-gray-500 text-xs ml-1">
                              {network.signal_strength} dBm
                            </Text>
                          </View>
                        )}
                      </View>
                      {selectedNetwork === network.ssid && (
                        <View className="w-8 h-8 rounded-full bg-cyan-500 items-center justify-center">
                          <Text className="text-white font-bold">✓</Text>
                        </View>
                      )}
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Konfiguracja WiFi */}
          <View className="mb-6 bg-white rounded-3xl p-6 shadow-xl" style={{
            shadowColor: '#0891b2',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 8,
          }}>
            <View className="flex-row items-center mb-4">
              <View className="bg-teal-100 rounded-full p-4 mr-4">
                <Text className="text-3xl">⚙️</Text>
              </View>
              <Text className="text-gray-800 text-2xl font-bold">Konfiguracja WiFi</Text>
            </View>
            
            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2 text-sm">Nazwa sieci (SSID)</Text>
              <TextInput
                placeholder="Wprowadź nazwę sieci"
                placeholderTextColor="#9ca3af"
                value={ssid}
                onChangeText={setSsid}
                editable={isConnected}
                className={`w-full p-4 rounded-xl border-2 ${isConnected ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-100'}`}
                style={{ fontSize: 16 }}
              />
            </View>

            <View className="mb-4">
              <Text className="text-gray-700 font-semibold mb-2 text-sm">Hasło</Text>
              <TextInput
                placeholder="Wprowadź hasło (opcjonalne)"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                editable={isConnected}
                className={`w-full p-4 rounded-xl border-2 ${isConnected ? 'border-gray-300 bg-white' : 'border-gray-200 bg-gray-100'}`}
                style={{ fontSize: 16 }}
              />
            </View>

            <TouchableOpacity
              onPress={configureWiFi}
              disabled={!isConnected || isConfiguring}
              className="p-4 rounded-xl mb-3 shadow-lg"
              style={{
                backgroundColor: !isConnected || isConfiguring ? '#d1d5db' : '#0d9488',
                shadowColor: !isConnected || isConfiguring ? '#9ca3af' : '#14b8a6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 6,
              }}
            >
              {isConfiguring ? (
                <View className="flex-row items-center justify-center">
                  <ActivityIndicator color="white" size="small" />
                  <Text className="text-white ml-2 font-bold text-lg">Konfigurowanie...</Text>
                </View>
              ) : (
                <View className="flex-row items-center justify-center">
                  <Text className="text-2xl mr-2">💾</Text>
                  <Text className="text-white font-bold text-lg">Zapisz konfigurację</Text>
                </View>
              )}
            </TouchableOpacity>

            {isConnected && (
              <TouchableOpacity
                onPress={disconnectWiFi}
                className="p-3 rounded-xl shadow-md"
                style={{
                  backgroundColor: '#f97316',
                  shadowColor: '#f97316',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.2,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <View className="flex-row items-center justify-center">
                  <Text className="text-xl mr-2">🔓</Text>
                  <Text className="text-white font-semibold">Rozłącz z WiFi</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* Status WiFi */}
          <TouchableOpacity
            onPress={getWiFiStatus}
            disabled={!isConnected || isCheckingStatus}
            className="mb-6 shadow-xl"
            style={{
              shadowColor: '#0891b2',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 8,
            }}
          >
            <View className="bg-white rounded-3xl p-6 shadow-lg">
              <View className="flex-row items-center">
                <View className="bg-indigo-100 rounded-full p-4 mr-4">
                  <Text className="text-3xl">📊</Text>
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 text-2xl font-bold mb-1">
                    Status WiFi
                  </Text>
                  {wifiStatus ? (
                    <Text className={`text-sm ${wifiStatus.connected ? 'text-green-600' : 'text-yellow-600'}`}>
                      {wifiStatus.connected ? `Połączono: ${wifiStatus.ssid || 'N/A'}` : 'Nie połączono'}
                    </Text>
                  ) : (
                    <Text className="text-gray-600 text-sm">
                      {isCheckingStatus ? 'Sprawdzanie...' : 'Kliknij aby sprawdzić'}
                    </Text>
                  )}
                </View>
                {isCheckingStatus ? (
                  <ActivityIndicator color="#4f46e5" size="small" />
                ) : (
                  <View className="ml-4">
                    <Text className="text-gray-400 text-2xl">→</Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>

          {wifiStatus && (
            <View className="mb-6 bg-white rounded-3xl p-6 shadow-xl" style={{
              shadowColor: '#0891b2',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 8,
            }}>
              <View className={`p-5 rounded-xl border-2 ${
                wifiStatus.connected 
                  ? 'bg-green-50 border-green-300' 
                  : 'bg-yellow-50 border-yellow-300'
              }`}>
                {wifiStatus.connected ? (
                  <>
                    <View className="flex-row items-center mb-3">
                      <View className="w-10 h-10 rounded-full bg-green-500 items-center justify-center mr-3">
                        <Text className="text-white text-xl font-bold">✓</Text>
                      </View>
                      <Text className="text-green-800 font-bold text-lg">Połączono z WiFi</Text>
                    </View>
                    <View style={{ marginLeft: 52 }}>
                      <View className="mb-2">
                        <Text className="text-gray-600 text-xs font-semibold">SSID</Text>
                        <Text className="text-green-800 font-bold text-base">{wifiStatus.ssid || 'N/A'}</Text>
                      </View>
                      <View className="mb-2">
                        <Text className="text-gray-600 text-xs font-semibold">Adres IP</Text>
                        <Text className="text-green-800 font-bold text-base">{wifiStatus.ip_address || 'Brak'}</Text>
                      </View>
                      {wifiStatus.signal_strength && (
                        <View className="mb-2">
                          <Text className="text-gray-600 text-xs font-semibold">Siła sygnału</Text>
                          <View className="flex-row items-center">
                            <Text className={`text-lg mr-1 ${getSignalColor(wifiStatus.signal_strength)}`}>
                              {getSignalIcon(wifiStatus.signal_strength)}
                            </Text>
                            <Text className="text-green-800 font-bold text-base">{wifiStatus.signal_strength} dBm</Text>
                          </View>
                        </View>
                      )}
                      {wifiStatus.freq && (
                        <View>
                          <Text className="text-gray-600 text-xs font-semibold">Częstotliwość</Text>
                          <Text className="text-green-800 font-bold text-base">{wifiStatus.freq} MHz</Text>
                        </View>
                      )}
                    </View>
                  </>
                ) : (
                  <>
                    <View className="flex-row items-center mb-2">
                      <View className="w-10 h-10 rounded-full bg-yellow-500 items-center justify-center mr-3">
                        <Text className="text-white text-xl font-bold">⚠</Text>
                      </View>
                      <Text className="text-yellow-800 font-bold text-lg">Nie połączono</Text>
                    </View>
                    <Text className="text-yellow-700" style={{ marginLeft: 52 }}>
                      Status: {wifiStatus.wpa_state || 'N/A'}
                    </Text>
                  </>
                )}
              </View>
            </View>
          )}

          {/* Logi */}
          <View className="mb-6 bg-white rounded-3xl p-6 shadow-xl" style={{
            shadowColor: '#0891b2',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.3,
            shadowRadius: 10,
            elevation: 8,
          }}>
            <View className="flex-row justify-between items-center mb-4">
              <View className="flex-row items-center">
                <View className="bg-gray-100 rounded-full p-4 mr-4">
                  <Text className="text-3xl">📝</Text>
                </View>
                <Text className="text-gray-800 text-2xl font-bold">Logi systemowe</Text>
              </View>
              <TouchableOpacity 
                onPress={clearLogs}
                className="px-4 py-2 rounded-lg bg-gray-100"
              >
                <Text className="text-gray-700 font-semibold">Wyczyść</Text>
              </TouchableOpacity>
            </View>
            <View className="bg-gray-900 rounded-xl p-4 border-2 border-gray-800" style={{ maxHeight: 200 }}>
              <ScrollView>
                {logs.length === 0 ? (
                  <Text className="text-gray-500 text-sm font-mono text-center py-4">
                    Brak logów...
                  </Text>
                ) : (
                  logs.map((log) => (
                    <View key={log.id} className="mb-1">
                      <Text
                        className={`text-xs font-mono ${
                          log.type === 'error'
                            ? 'text-red-400'
                            : log.type === 'success'
                            ? 'text-green-400'
                            : log.type === 'warning'
                            ? 'text-yellow-400'
                            : 'text-cyan-400'
                        }`}
                      >
                        <Text className="text-gray-500">[{log.timestamp}]</Text>{' '}
                        <Text className={`font-bold ${
                          log.type === 'error'
                            ? 'text-red-300'
                            : log.type === 'success'
                            ? 'text-green-300'
                            : log.type === 'warning'
                            ? 'text-yellow-300'
                            : 'text-cyan-300'
                        }`}>
                          [{log.type.toUpperCase()}]
                        </Text>{' '}
                        {log.message}
                      </Text>
                    </View>
                  ))
                )}
              </ScrollView>
            </View>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

