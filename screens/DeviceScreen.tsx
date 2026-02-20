import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import '../global.css';
import AquariumContentScreen from './AquariumContentScreen';

interface DeviceScreenProps {
  onBack: () => void;
}

interface DeviceData {
  D1?: number;
  D2?: number;
  D3?: number;
  D4?: number;
  D5?: number;
  D6?: number;
  S1?: string;
  S2?: string;
  S3?: string;
  S4?: string;
  S5?: string;
  S6?: string;
  T?: number;
  V?: number;
  PH?: number;
  GH?: number;
  KH?: number;
  NO2?: number;
  NO3?: number;
  CL2?: number;
}

const API_URL = 'http://www.aqua-filter.pl';
const DATA_URL = `${API_URL}/data.json`; // Odbieramy dane bezpośrednio z data.json
const UPDATE_URL = `${API_URL}/api.php`; // Zapisujemy przez api.php

export default function DeviceScreen({ onBack }: DeviceScreenProps) {
  const [data, setData] = useState<DeviceData>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modeEnabled, setModeEnabled] = useState(false);
  const switchAnim = useRef(new Animated.Value(modeEnabled ? 1 : 0)).current;
  
  // Lokalne wartości edytowalne - przechowujemy jako stringi dla pól tekstowych
  const [editableData, setEditableData] = useState<DeviceData>({});
  const [editableStrings, setEditableStrings] = useState<Record<string, string>>({});
  const [changedFields, setChangedFields] = useState<Set<string>>(new Set());
  
  // Śledzenie pól które mają focus (są aktualnie edytowane)
  const focusedFields = useRef<Set<string>>(new Set());
  const [isAnyFieldFocused, setIsAnyFieldFocused] = useState(false);
  
  // Stan rozwinięcia wszystkich cieczy (1-6)
  const [expandedLiquids, setExpandedLiquids] = useState<Record<number, boolean>>({});
  
  // Stan rozwinięcia kafelka z trybem
  const [isModeExpanded, setIsModeExpanded] = useState(true);
  
  // Stan okna konfiguracji
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  // Stan okna zawartości akwarium
  const [isAquariumContentOpen, setIsAquariumContentOpen] = useState(false);
  
  // Stan pól konfiguracji X1-X6
  const [configFields, setConfigFields] = useState<Record<string, string>>({
    X1: '',
    X2: '',
    X3: '',
    X4: '',
    X5: '',
    X6: '',
  });
  
  // Czas ostatniej zmiany wartości X1-X6
  const [lastConfigChangeTime, setLastConfigChangeTime] = useState<Date | null>(null);
  
  // Animacja dla obu kafelków (szary i biały przesuwają się razem)
  const slideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
  const modeSlideAnim = useRef(new Animated.Value(Dimensions.get('window').width)).current;
  
  // Animacja okna konfiguracji - scale i opacity
  const configScaleAnim = useRef(new Animated.Value(0)).current;
  const configOpacityAnim = useRef(new Animated.Value(0)).current;
  
  const toggleLiquidExpand = useCallback((index: number) => {
    setExpandedLiquids(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  }, []);
  
  // Animacja wysuwania obu kafelków przy starcie
  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
    
    Animated.spring(modeSlideAnim, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [slideAnim, modeSlideAnim]);

  // Animacja switcha
  useEffect(() => {
    Animated.spring(switchAnim, {
      toValue: modeEnabled ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [modeEnabled, switchAnim]);
  
  // Animacja okna konfiguracji
  useEffect(() => {
    Animated.parallel([
      Animated.spring(configScaleAnim, {
        toValue: isConfigOpen ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.spring(configOpacityAnim, {
        toValue: isConfigOpen ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
    ]).start();
  }, [isConfigOpen, configScaleAnim, configOpacityAnim]);
  
  const toggleConfig = useCallback(() => {
    setIsConfigOpen(prev => !prev);
  }, []);
  
  const toggleAquariumContent = useCallback(() => {
    setIsAquariumContentOpen(prev => !prev);
    setIsConfigOpen(false); // Zamknij okno konfiguracji przy otwieraniu zawartości akwarium
  }, []);
  
  // Funkcja do przełączania widoczności kafelków (oba paski przesuwają się razem)
  const toggleModeVisibility = useCallback(() => {
    const newState = !isModeExpanded;
    setIsModeExpanded(newState);
    
    // Przesuń oba paski tylko o kilkanaście pikseli w prawo (bardziej w lewo)
    const targetValue = newState ? 0 : 72;
    
    Animated.spring(slideAnim, {
      toValue: targetValue,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
    
    Animated.spring(modeSlideAnim, {
      toValue: targetValue,
      useNativeDriver: true,
      tension: 50,
      friction: 8,
    }).start();
  }, [isModeExpanded, slideAnim, modeSlideAnim]);

  // Funkcje do zapisywania i ładowania danych konfiguracji
  const saveConfigData = useCallback(async (fields: Record<string, string>, changeTime: Date | null) => {
    try {
      await AsyncStorage.setItem('configFields', JSON.stringify(fields));
      if (changeTime) {
        await AsyncStorage.setItem('lastConfigChangeTime', changeTime.toISOString());
      }
    } catch (error) {
      console.error('Błąd zapisywania danych konfiguracji:', error);
    }
  }, []);

  const loadConfigData = useCallback(async () => {
    try {
      const savedFields = await AsyncStorage.getItem('configFields');
      const savedTime = await AsyncStorage.getItem('lastConfigChangeTime');
      
      if (savedFields) {
        const parsedFields = JSON.parse(savedFields);
        setConfigFields(parsedFields);
      }
      
      if (savedTime) {
        setLastConfigChangeTime(new Date(savedTime));
      }
    } catch (error) {
      console.error('Błąd ładowania danych konfiguracji:', error);
    }
  }, []);

  useEffect(() => {
    loadData();
    loadConfigData(); // Załaduj zapisane dane konfiguracji
    // Odświeżanie danych co 1 sekundę, ale tylko jeśli żadne pole nie ma focus
    const interval = setInterval(() => {
      if (!isAnyFieldFocused && focusedFields.current.size === 0) {
        loadData();
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnyFieldFocused]);

  const loadData = async () => {
    // Nie odświeżaj jeśli jakiekolwiek pole ma focus
    if (isAnyFieldFocused || focusedFields.current.size > 0) {
      return;
    }
    
    try {
      const response = await fetch(`${DATA_URL}?x=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
      });
      if (!response.ok) {
        throw new Error('Nie można pobrać danych');
      }
      const jsonData = await response.json();
      console.log('Odebrane dane z serwera:', jsonData);
      console.log('Klucze w danych:', Object.keys(jsonData));
      
      // Normalizuj dane - używaj wartości z jsonData bezpośrednio, zachowując wszystkie klucze
      const normalizedData: DeviceData = {};
      
      // Funkcja pomocnicza do konwersji na liczbę (obsługuje również 0)
      const toNumber = (val: any): number | undefined => {
        if (val === undefined || val === null || val === '') return undefined;
        const num = Number(val);
        return isNaN(num) ? undefined : num;
      };
      
      // Funkcja pomocnicza do konwersji na string
      const toString = (val: any): string | undefined => {
        if (val === undefined || val === null || val === '') return undefined;
        return String(val);
      };
      
      // Obsłuż wszystkie pola D1-D6 (obsługuje również wartość 0)
      const d1 = toNumber(jsonData.D1);
      if (d1 !== undefined) normalizedData.D1 = d1;
      const d2 = toNumber(jsonData.D2);
      if (d2 !== undefined) normalizedData.D2 = d2;
      const d3 = toNumber(jsonData.D3);
      if (d3 !== undefined) normalizedData.D3 = d3;
      const d4 = toNumber(jsonData.D4);
      if (d4 !== undefined) normalizedData.D4 = d4;
      const d5 = toNumber(jsonData.D5);
      if (d5 !== undefined) normalizedData.D5 = d5;
      const d6 = toNumber(jsonData.D6);
      if (d6 !== undefined) normalizedData.D6 = d6;
      
      // Obsłuż wszystkie pola S1-S6
      const s1 = toString(jsonData.S1);
      if (s1 !== undefined) normalizedData.S1 = s1;
      const s2 = toString(jsonData.S2);
      if (s2 !== undefined) normalizedData.S2 = s2;
      const s3 = toString(jsonData.S3);
      if (s3 !== undefined) normalizedData.S3 = s3;
      const s4 = toString(jsonData.S4);
      if (s4 !== undefined) normalizedData.S4 = s4;
      const s5 = toString(jsonData.S5);
      if (s5 !== undefined) normalizedData.S5 = s5;
      const s6 = toString(jsonData.S6);
      if (s6 !== undefined) normalizedData.S6 = s6;
      
      // Obsłuż T i V
      const t = toNumber(jsonData.T);
      if (t !== undefined) normalizedData.T = t;
      const v = toNumber(jsonData.V);
      if (v !== undefined) normalizedData.V = v;
      
      // Obsłuż pola kalibracji
      const ph = toNumber(jsonData.PH);
      if (ph !== undefined) normalizedData.PH = ph;
      const gh = toNumber(jsonData.GH);
      if (gh !== undefined) normalizedData.GH = gh;
      const kh = toNumber(jsonData.KH);
      if (kh !== undefined) normalizedData.KH = kh;
      const no2 = toNumber(jsonData.NO2);
      if (no2 !== undefined) normalizedData.NO2 = no2;
      const no3 = toNumber(jsonData.NO3);
      if (no3 !== undefined) normalizedData.NO3 = no3;
      const cl2 = toNumber(jsonData.CL2);
      if (cl2 !== undefined) normalizedData.CL2 = cl2;
      
      console.log('Znormalizowane dane:', normalizedData);
      console.log('Klucze w znormalizowanych danych:', Object.keys(normalizedData));
      setData(normalizedData);
      
      // Aktualizuj edytowalne dane tylko jeśli nie ma niezapisanych zmian
      if (changedFields.size === 0) {
        setEditableData(normalizedData);
        // Aktualizuj też stringi dla pól tekstowych - użyj wszystkich kluczy z jsonData
        const newStrings: Record<string, string> = {};
        const allKeys = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'T', 'V', 'PH', 'GH', 'KH', 'NO2', 'NO3', 'CL2'];
        allKeys.forEach(key => {
          const value = normalizedData[key as keyof DeviceData];
          newStrings[key] = value !== undefined && value !== null ? value.toString() : '';
        });
        console.log('Zaktualizowane stringi:', newStrings);
        setEditableStrings(newStrings);
      } else {
        // Aktualizuj tylko pola które nie zostały zmienione
        setEditableData(prev => {
          const updated: DeviceData = { ...prev };
          const allKeys = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'T', 'V', 'PH', 'GH', 'KH', 'NO2', 'NO3', 'CL2'];
          allKeys.forEach(key => {
            if (!changedFields.has(key)) {
              const value = normalizedData[key as keyof DeviceData];
              if (value !== undefined && value !== null) {
                (updated as Record<string, string | number>)[key] = value;
              }
            }
          });
          return updated;
        });
        // Aktualizuj stringi tylko dla niezapisanych pól
        setEditableStrings(prev => {
          const updated = { ...prev };
          const allKeys = ['D1', 'D2', 'D3', 'D4', 'D5', 'D6', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'T', 'V', 'PH', 'GH', 'KH', 'NO2', 'NO3', 'CL2'];
          allKeys.forEach(key => {
            if (!changedFields.has(key)) {
              const value = normalizedData[key as keyof DeviceData];
              updated[key] = value !== undefined && value !== null ? value.toString() : '';
            }
          });
          return updated;
        });
      }
    } catch (error: any) {
      console.error('Błąd ładowania danych:', error);
      if (loading) {
        Alert.alert('Błąd', 'Nie można połączyć się z serwerem. Sprawdź połączenie internetowe.');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = useCallback((field: string, value: string) => {
    // Aktualizuj string bezpośrednio - bez konwersji na liczbę
    setEditableStrings(prev => {
      const newStrings = { ...prev, [field]: value };
      return newStrings;
    });
    
    // Sprawdź czy to pole numeryczne (D1-D6, T, V) czy tekstowe (S1-S6)
    const isNumericField = field.startsWith('D') || field === 'T' || field === 'V';
    const isStringField = field.startsWith('S');
    
    if (isNumericField) {
      // Konwertuj na liczbę tylko dla porównania i zapisu
      const numValue = value === '' || value === '-' || value === '.' ? undefined : parseFloat(value);
      
      // Aktualizuj dane numeryczne tylko jeśli wartość jest poprawna
      if (numValue !== undefined && !isNaN(numValue)) {
        setEditableData(prev => ({ ...prev, [field]: numValue }));
      }
      
      // Sprawdź czy wartość się zmieniła w porównaniu z oryginalną
      setChangedFields(prev => {
        const newSet = new Set(prev);
        const originalValue = data[field as keyof DeviceData];
        const isChanged = value !== '' && (
          originalValue === undefined || 
          originalValue === null ||
          (numValue !== undefined && !isNaN(numValue) && numValue !== originalValue) ||
          (numValue === undefined && originalValue !== undefined)
        );
        
        if (isChanged) {
          newSet.add(field);
        } else {
          newSet.delete(field);
        }
        return newSet;
      });
    } else if (isStringField) {
      // Dla pól tekstowych (S1-S6) zapisz jako string
      setEditableData(prev => ({ ...prev, [field]: value }));
      
      // Sprawdź czy wartość się zmieniła
      setChangedFields(prev => {
        const newSet = new Set(prev);
        const originalValue = data[field as keyof DeviceData] as string | undefined;
        const isChanged = value !== (originalValue || '');
        
        if (isChanged) {
          newSet.add(field);
        } else {
          newSet.delete(field);
        }
        return newSet;
      });
    }
  }, [data]);

  const saveData = async () => {
    if (changedFields.size === 0) {
      Alert.alert('Info', 'Brak zmian do zapisania');
      return;
    }

    try {
      setSaving(true);
      // Przygotuj tylko zmienione pola do wysłania (POST aktualizuje tylko przekazane wartości)
      const dataToSave: Record<string, string | number> = {};
      
      // Dodaj tylko zmienione pola
      changedFields.forEach(field => {
        const value = editableData[field as keyof DeviceData];
        if (value !== undefined && value !== null) {
          dataToSave[field] = value;
        }
      });

      const response = await fetch(UPDATE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dataToSave),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Błąd zapisu danych: ${errorText}`);
      }

      const result = await response.json();
      if (result.success) {
        // Zaktualizuj lokalne dane tylko dla zmienionych pól
        const updatedData: DeviceData = { ...data };
        changedFields.forEach(field => {
          const value = editableData[field as keyof DeviceData];
          if (value !== undefined && value !== null) {
            (updatedData as Record<string, string | number>)[field] = value;
          }
        });
        setData(updatedData);
        setChangedFields(new Set());
        // Zresetuj stringi edytowalne - użyj zapisanych wartości
        const newStrings: Record<string, string> = {};
        Object.keys(updatedData).forEach(key => {
          const value = updatedData[key as keyof DeviceData];
          newStrings[key] = value !== undefined && value !== null ? value.toString() : '';
        });
        setEditableStrings(newStrings);
        Alert.alert('Sukces', 'Dane zostały zapisane');
        // Odśwież dane po chwili
        setTimeout(loadData, 500);
      } else {
        throw new Error(result.error || 'Błąd zapisu');
      }
    } catch (error: any) {
      console.error('Błąd zapisu:', error);
      Alert.alert('Błąd', `Nie można zapisać danych: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const LiquidCard = React.memo(({ 
    index, 
    sensorStringValue,
    settingValue, 
    onSettingChange,
    isChanged,
    isExpanded,
    onToggleExpand
  }: { 
    index: number; 
    sensorStringValue: string;
    settingValue?: string;
    onSettingChange: (value: string) => void;
    isChanged: boolean;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
  }) => {
    
    const handleSettingFocus = useCallback(() => {
      const settingFieldName = `setting${index}`;
      focusedFields.current.add(settingFieldName);
      setIsAnyFieldFocused(true);
    }, [index]);
    
    const handleSettingBlur = useCallback(() => {
      const settingFieldName = `setting${index}`;
      focusedFields.current.delete(settingFieldName);
      if (focusedFields.current.size === 0) {
        setIsAnyFieldFocused(false);
      }
    }, [index]);
    
    // Wszystkie ciecze - mały płaski kafelek z możliwością rozwinięcia
    if (onToggleExpand !== undefined) {
      return (
        <TouchableOpacity 
          onPress={onToggleExpand}
          className="mb-3 bg-white p-4 shadow-md" 
          style={{
            borderRadius: 24,
            shadowColor: '#0891b2',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
            overflow: 'hidden',
          }}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center flex-1">
              <View className="bg-cyan-100 rounded-full p-2 mr-3">
                <Text className="text-xl">💧</Text>
              </View>
              <View className="flex-1">
                <Text className="text-gray-800 text-lg font-bold">Ciecz {index}</Text>
              </View>
            </View>
            {isChanged && (
              <View className="bg-yellow-100 rounded-full px-2 py-1 mr-2">
                <Text className="text-yellow-800 text-xs font-bold">Zmieniono</Text>
              </View>
            )}
            <Text className="text-gray-400 text-xl">
              {isExpanded ? '▼' : '▶'}
            </Text>
          </View>
          
          {isExpanded && (
            <View className="mt-4 pt-4 border-t border-gray-200">
              <View className="mb-4">
                <Text className="text-gray-700 font-semibold mb-2 text-sm">
                  Czujnik {index} - Odległość (mm)
                </Text>
                <View className="w-full p-4 rounded-xl border-2 border-gray-200 bg-gray-50">
                  <Text className="text-gray-800" style={{ fontSize: 16 }}>
                    {sensorStringValue !== '' ? sensorStringValue : 'Brak danych'}
                  </Text>
                </View>
              </View>

              <View>
                <Text className="text-gray-700 font-semibold mb-2 text-sm">
                  Ustawienie podawania
                </Text>
                <TextInput
                  placeholder="Wpisz ustawienie..."
                  placeholderTextColor="#9ca3af"
                  value={settingValue || ''}
                  onChangeText={onSettingChange}
                  onFocus={handleSettingFocus}
                  onBlur={handleSettingBlur}
                  className="w-full p-4 rounded-xl border-2 border-gray-300 bg-white"
                  style={{ fontSize: 16 }}
                />
              </View>
            </View>
          )}
        </TouchableOpacity>
      );
    }
    
    // Fallback - standardowy widok (nie powinno się zdarzyć)
    return (
      <View className="mb-6 bg-white rounded-3xl p-6 shadow-xl" style={{
        shadowColor: '#0891b2',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 8,
      }}>
        <View className="flex-row items-center mb-4">
          <View className="bg-cyan-100 rounded-full p-4 mr-4">
            <Text className="text-3xl">💧</Text>
          </View>
          <Text className="text-gray-800 text-2xl font-bold">Ciecz {index}</Text>
          {isChanged && (
            <View className="ml-auto bg-yellow-100 rounded-full px-3 py-1">
              <Text className="text-yellow-800 text-xs font-bold">Zmieniono</Text>
            </View>
          )}
        </View>
        
        <View className="mb-4">
          <Text className="text-gray-700 font-semibold mb-2 text-sm">
            Czujnik {index} - Odległość (mm)
          </Text>
          <View className="w-full p-4 rounded-xl border-2 border-gray-200 bg-gray-50">
            <Text className="text-gray-800" style={{ fontSize: 16 }}>
              {sensorStringValue !== '' ? sensorStringValue : 'Brak danych'}
            </Text>
          </View>
        </View>

        <View>
          <Text className="text-gray-700 font-semibold mb-2 text-sm">
            Ustawienie podawania
          </Text>
          <TextInput
            placeholder="Wpisz ustawienie..."
            placeholderTextColor="#9ca3af"
            value={settingValue || ''}
            onChangeText={onSettingChange}
            onFocus={handleSettingFocus}
            onBlur={handleSettingBlur}
            className="w-full p-4 rounded-xl border-2 border-gray-300 bg-white"
            style={{ fontSize: 16 }}
          />
        </View>
      </View>
    );
  });

  return (
    <>
      <StatusBar style="light" />
      <View className="flex-1" style={{ backgroundColor: '#0891b2' }}>
        <ScrollView className="flex-1" style={{ backgroundColor: '#0891b2' }}>
          <View className="flex-1 p-4 pt-20">
          {/* Header z przyciskiem powrotu */}
          <View className="flex-row items-center mb-6" style={{ marginTop: 32 }}>
            <TouchableOpacity
              onPress={onBack}
              className="mr-4 rounded-full bg-white/20"
              style={{ width: 44, height: 44 }}
            >
              <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                <Text className="text-white text-2xl" style={{ fontWeight: 'bold', marginTop: -4 }}>←</Text>
              </View>
            </TouchableOpacity>
            {!modeEnabled && (
              <TouchableOpacity
                onPress={toggleConfig}
                className="mr-4 rounded-full bg-white/20"
                style={{ width: 44, height: 44 }}
              >
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <FontAwesome name="gear" size={24} color="white" />
                </View>
              </TouchableOpacity>
            )}
            <View className="flex-1 items-center mt-24">
              <Text className="text-white text-4xl font-bold text-center mb-2" style={{ marginLeft: -20 }}>
                Urządzenie
              </Text>
            </View>
          </View>

          {/* Szary kafelek tła - przesuwa się po kliknięciu */}
          <Animated.View
            style={{
              position: 'absolute',
              right: -29,
              top: 38,
              transform: [{ translateX: slideAnim }],
            }}
          >
            <TouchableOpacity
              onPress={toggleModeVisibility}
              activeOpacity={0.7}
              style={{
                backgroundColor: '#9ca3af',
                borderTopLeftRadius: 16,
                borderTopRightRadius: 16,
                borderBottomLeftRadius: 16,
                borderBottomRightRadius: 16,
                paddingTop: 8,
                paddingBottom: 62,
                paddingLeft: 10,
                paddingRight: 10,
                shadowColor: '#0891b2',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 5,
                minWidth: 122,
                alignItems: 'flex-start',
              }}
            >
              <View style={{ position: 'absolute', left: 3, top: '50%', transform: [{ translateY: 25 }] }}>
                <FontAwesome5 name="bars" size={18} color="black" />
              </View>
            </TouchableOpacity>
          </Animated.View>
          
          {/* Kafelek z trybem - przesuwa się razem z szarym */}
          <Animated.View
            style={{
              position: 'absolute',
              right: -48,
              top: 38,
              backgroundColor: 'white',
              borderTopLeftRadius: 0,
              borderTopRightRadius: 16,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 16,
              paddingTop: 8,
              paddingBottom: 6,
              paddingLeft: 20,
              paddingRight: 10,
              shadowColor: '#0891b2',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 6,
              minWidth: 120,
              alignItems: 'flex-start',
              transform: [{ translateX: modeSlideAnim }],
            }}
          >
            <Text className="text-gray-800 text-sm font-semibold mb-0">Tryb</Text>
            <View style={{ marginLeft: -10, marginTop: 4 }}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setModeEnabled(!modeEnabled)}
                style={{
                  width: 52,
                  height: 32,
                  borderRadius: 16,
                  backgroundColor: modeEnabled ? '#ef4444' : '#3b82f6',
                  justifyContent: 'center',
                  paddingHorizontal: 2,
                }}
              >
                <Animated.View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: '#ffffff',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transform: [
                      {
                        translateX: switchAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 20],
                        }),
                      },
                    ],
                  }}
                >
                  {modeEnabled ? (
                    <FontAwesome6 name="hand" size={18} color="#ef4444" />
                  ) : (
                    <FontAwesome6 name="gears" size={18} color="#3b82f6" />
                  )}
                </Animated.View>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {loading && Object.keys(data).length === 0 ? (
            <View className="bg-white rounded-3xl p-6 shadow-xl items-center py-10">
              <ActivityIndicator size="large" color="#0891b2" />
              <Text className="text-gray-600 text-lg mt-4">Ładowanie danych...</Text>
            </View>
          ) : (
            <>
              {/* Ciecze 1-6 */}
              {[1, 2, 3, 4, 5, 6].map((index) => {
                const fieldName = `D${index}`;
                const settingFieldName = `S${index}`;
                // Odległości są tylko do odczytu - używamy danych z serwera
                const sensorValue = data[fieldName as keyof DeviceData];
                // Obsłuż wartość 0 poprawnie - 0 jest prawidłową wartością
                // Użyj sprawdzenia które obsługuje również wartość 0 i null
                const hasValue = sensorValue !== undefined && sensorValue !== null && !isNaN(Number(sensorValue));
                const sensorStringValue = hasValue
                  ? sensorValue.toString() 
                  : '';
                // Debug: loguj wartości dla każdego czujnika (tylko w trybie deweloperskim)
                if (__DEV__) {
                  console.log(`Czujnik ${index} (${fieldName}):`, {
                    sensorValue,
                    sensorStringValue,
                    hasValue,
                    type: typeof sensorValue,
                    isUndefined: sensorValue === undefined,
                    isNull: sensorValue === null,
                    isNaN: isNaN(Number(sensorValue)),
                    allDataKeys: Object.keys(data),
                    allData: data
                  });
                }
                // Ustawienie podawania - edytowalne
                const settingStringValue = editableStrings[settingFieldName] !== undefined
                  ? editableStrings[settingFieldName]
                  : (editableData[settingFieldName as keyof DeviceData] !== undefined
                    ? (editableData[settingFieldName as keyof DeviceData] as string) || ''
                    : '');
                const isSettingChanged = changedFields.has(settingFieldName);
                
                return (
                  <LiquidCard
                    key={index}
                    index={index}
                    sensorStringValue={sensorStringValue}
                    settingValue={settingStringValue}
                    onSettingChange={(value) => updateField(settingFieldName, value)}
                    isChanged={isSettingChanged}
                    isExpanded={expandedLiquids[index] || false}
                    onToggleExpand={() => toggleLiquidExpand(index)}
                  />
                );
              })}

              {/* Sekcja ogólna */}
              <View className="mb-6 bg-white rounded-3xl p-6 shadow-xl" style={{
                shadowColor: '#0891b2',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 8,
              }}>
                <View className="flex-row items-center mb-4">
                  <View className="bg-blue-100 rounded-full p-4 mr-4">
                    <Text className="text-3xl">📊</Text>
                  </View>
                  <Text className="text-gray-800 text-2xl font-bold">Ogólne</Text>
                </View>

                <View className="mb-4">
                  <Text className="text-gray-700 font-semibold mb-2 text-sm">Temperatura</Text>
                  <TextInput
                    placeholder="Wpisz temperaturę..."
                    placeholderTextColor="#9ca3af"
                    value={editableStrings['T'] ?? (editableData.T !== undefined ? editableData.T.toString() : '')}
                    onChangeText={(value) => updateField('T', value)}
                    onFocus={() => {
                      focusedFields.current.add('T');
                      setIsAnyFieldFocused(true);
                    }}
                    onBlur={() => {
                      focusedFields.current.delete('T');
                      if (focusedFields.current.size === 0) {
                        setIsAnyFieldFocused(false);
                      }
                    }}
                    keyboardType="numeric"
                    className={`w-full p-4 rounded-xl border-2 ${
                      changedFields.has('T') ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-white'
                    }`}
                    style={{ fontSize: 16 }}
                  />
                  {changedFields.has('T') && (
                    <Text className="text-yellow-600 text-xs mt-1">Zmieniono</Text>
                  )}
                </View>

                <View>
                  <Text className="text-gray-700 font-semibold mb-2 text-sm">Przepływ</Text>
                  <TextInput
                    placeholder="Wpisz przepływ..."
                    placeholderTextColor="#9ca3af"
                    value={editableStrings['V'] ?? (editableData.V !== undefined ? editableData.V.toString() : '')}
                    onChangeText={(value) => updateField('V', value)}
                    onFocus={() => {
                      focusedFields.current.add('V');
                      setIsAnyFieldFocused(true);
                    }}
                    onBlur={() => {
                      focusedFields.current.delete('V');
                      if (focusedFields.current.size === 0) {
                        setIsAnyFieldFocused(false);
                      }
                    }}
                    keyboardType="numeric"
                    className={`w-full p-4 rounded-xl border-2 ${
                      changedFields.has('V') ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-white'
                    }`}
                    style={{ fontSize: 16 }}
                  />
                  {changedFields.has('V') && (
                    <Text className="text-yellow-600 text-xs mt-1">Zmieniono</Text>
                  )}
                </View>
              </View>

              {/* Sekcja kalibracji */}
              <View className="mb-6 bg-white rounded-3xl p-6 shadow-xl" style={{
                shadowColor: '#0891b2',
                shadowOffset: { width: 0, height: 6 },
                shadowOpacity: 0.3,
                shadowRadius: 10,
                elevation: 8,
              }}>
                <View className="flex-row items-center mb-4">
                  <View className="bg-green-100 rounded-full p-4 mr-4">
                    <Text className="text-3xl">🧪</Text>
                  </View>
                  <Text className="text-gray-800 text-2xl font-bold">Kalibracja</Text>
                </View>

                <View className="mb-4">
                  <Text className="text-gray-700 font-semibold mb-2 text-sm">pH (kwasowość wody)</Text>
                  <TextInput
                    placeholder="Wpisz wartość pH..."
                    placeholderTextColor="#9ca3af"
                    value={editableStrings['PH'] ?? (editableData.PH !== undefined ? editableData.PH.toString() : '')}
                    onChangeText={(value) => updateField('PH', value)}
                    onFocus={() => {
                      focusedFields.current.add('PH');
                      setIsAnyFieldFocused(true);
                    }}
                    onBlur={() => {
                      focusedFields.current.delete('PH');
                      if (focusedFields.current.size === 0) {
                        setIsAnyFieldFocused(false);
                      }
                    }}
                    keyboardType="numeric"
                    className={`w-full p-4 rounded-xl border-2 ${
                      changedFields.has('PH') ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-white'
                    }`}
                    style={{ fontSize: 16 }}
                  />
                  {changedFields.has('PH') && (
                    <Text className="text-yellow-600 text-xs mt-1">Zmieniono</Text>
                  )}
                </View>

                <View className="mb-4">
                  <Text className="text-gray-700 font-semibold mb-2 text-sm">GH (twardość całkowita)</Text>
                  <TextInput
                    placeholder="Wpisz wartość GH..."
                    placeholderTextColor="#9ca3af"
                    value={editableStrings['GH'] ?? (editableData.GH !== undefined ? editableData.GH.toString() : '')}
                    onChangeText={(value) => updateField('GH', value)}
                    onFocus={() => {
                      focusedFields.current.add('GH');
                      setIsAnyFieldFocused(true);
                    }}
                    onBlur={() => {
                      focusedFields.current.delete('GH');
                      if (focusedFields.current.size === 0) {
                        setIsAnyFieldFocused(false);
                      }
                    }}
                    keyboardType="numeric"
                    className={`w-full p-4 rounded-xl border-2 ${
                      changedFields.has('GH') ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-white'
                    }`}
                    style={{ fontSize: 16 }}
                  />
                  {changedFields.has('GH') && (
                    <Text className="text-yellow-600 text-xs mt-1">Zmieniono</Text>
                  )}
                </View>

                <View className="mb-4">
                  <Text className="text-gray-700 font-semibold mb-2 text-sm">KH (twardość węglowa)</Text>
                  <TextInput
                    placeholder="Wpisz wartość KH..."
                    placeholderTextColor="#9ca3af"
                    value={editableStrings['KH'] ?? (editableData.KH !== undefined ? editableData.KH.toString() : '')}
                    onChangeText={(value) => updateField('KH', value)}
                    onFocus={() => {
                      focusedFields.current.add('KH');
                      setIsAnyFieldFocused(true);
                    }}
                    onBlur={() => {
                      focusedFields.current.delete('KH');
                      if (focusedFields.current.size === 0) {
                        setIsAnyFieldFocused(false);
                      }
                    }}
                    keyboardType="numeric"
                    className={`w-full p-4 rounded-xl border-2 ${
                      changedFields.has('KH') ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-white'
                    }`}
                    style={{ fontSize: 16 }}
                  />
                  {changedFields.has('KH') && (
                    <Text className="text-yellow-600 text-xs mt-1">Zmieniono</Text>
                  )}
                </View>

                <View className="mb-4">
                  <Text className="text-gray-700 font-semibold mb-2 text-sm">NO2 (azotyny)</Text>
                  <TextInput
                    placeholder="Wpisz wartość NO2..."
                    placeholderTextColor="#9ca3af"
                    value={editableStrings['NO2'] ?? (editableData.NO2 !== undefined ? editableData.NO2.toString() : '')}
                    onChangeText={(value) => updateField('NO2', value)}
                    onFocus={() => {
                      focusedFields.current.add('NO2');
                      setIsAnyFieldFocused(true);
                    }}
                    onBlur={() => {
                      focusedFields.current.delete('NO2');
                      if (focusedFields.current.size === 0) {
                        setIsAnyFieldFocused(false);
                      }
                    }}
                    keyboardType="numeric"
                    className={`w-full p-4 rounded-xl border-2 ${
                      changedFields.has('NO2') ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-white'
                    }`}
                    style={{ fontSize: 16 }}
                  />
                  {changedFields.has('NO2') && (
                    <Text className="text-yellow-600 text-xs mt-1">Zmieniono</Text>
                  )}
                </View>

                <View className="mb-4">
                  <Text className="text-gray-700 font-semibold mb-2 text-sm">NO3 (azotany)</Text>
                  <TextInput
                    placeholder="Wpisz wartość NO3..."
                    placeholderTextColor="#9ca3af"
                    value={editableStrings['NO3'] ?? (editableData.NO3 !== undefined ? editableData.NO3.toString() : '')}
                    onChangeText={(value) => updateField('NO3', value)}
                    onFocus={() => {
                      focusedFields.current.add('NO3');
                      setIsAnyFieldFocused(true);
                    }}
                    onBlur={() => {
                      focusedFields.current.delete('NO3');
                      if (focusedFields.current.size === 0) {
                        setIsAnyFieldFocused(false);
                      }
                    }}
                    keyboardType="numeric"
                    className={`w-full p-4 rounded-xl border-2 ${
                      changedFields.has('NO3') ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-white'
                    }`}
                    style={{ fontSize: 16 }}
                  />
                  {changedFields.has('NO3') && (
                    <Text className="text-yellow-600 text-xs mt-1">Zmieniono</Text>
                  )}
                </View>

                <View>
                  <Text className="text-gray-700 font-semibold mb-2 text-sm">CL2 (chlor)</Text>
                  <TextInput
                    placeholder="Wpisz wartość CL2..."
                    placeholderTextColor="#9ca3af"
                    value={editableStrings['CL2'] ?? (editableData.CL2 !== undefined ? editableData.CL2.toString() : '')}
                    onChangeText={(value) => updateField('CL2', value)}
                    onFocus={() => {
                      focusedFields.current.add('CL2');
                      setIsAnyFieldFocused(true);
                    }}
                    onBlur={() => {
                      focusedFields.current.delete('CL2');
                      if (focusedFields.current.size === 0) {
                        setIsAnyFieldFocused(false);
                      }
                    }}
                    keyboardType="numeric"
                    className={`w-full p-4 rounded-xl border-2 ${
                      changedFields.has('CL2') ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300 bg-white'
                    }`}
                    style={{ fontSize: 16 }}
                  />
                  {changedFields.has('CL2') && (
                    <Text className="text-yellow-600 text-xs mt-1">Zmieniono</Text>
                  )}
                </View>
              </View>

              {/* Przycisk zapisu */}
              {changedFields.size > 0 && (
                <TouchableOpacity
                  onPress={saveData}
                  disabled={saving}
                  className="mb-6 shadow-xl"
                  style={{
                    shadowColor: '#0891b2',
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.3,
                    shadowRadius: 10,
                    elevation: 8,
                  }}
                >
                  <View className={`bg-white rounded-3xl p-6 shadow-lg ${saving ? 'opacity-70' : ''}`}>
                    <View className="flex-row items-center justify-center">
                      {saving ? (
                        <>
                          <ActivityIndicator color="#0d9488" size="small" />
                          <Text className="text-gray-800 text-2xl font-bold ml-3">Zapisywanie...</Text>
                        </>
                      ) : (
                        <>
                          <View className="bg-teal-100 rounded-full p-4 mr-4">
                            <Text className="text-3xl">💾</Text>
                          </View>
                          <Text className="text-gray-800 text-2xl font-bold">
                            Zapisz zmiany ({changedFields.size})
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {/* Przycisk odświeżania */}
              <TouchableOpacity
                onPress={loadData}
                disabled={loading}
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
                  <View className="flex-row items-center justify-center">
                    <View className="bg-blue-100 rounded-full p-4 mr-4">
                      <Text className="text-3xl">🔄</Text>
                    </View>
                    <Text className="text-gray-800 text-2xl font-bold">
                      {loading ? 'Odświeżanie...' : 'Odśwież dane'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            </>
          )}
        </View>
        </ScrollView>
        
        {/* Ciemne tło overlay */}
        {isConfigOpen && (
          <TouchableOpacity
            activeOpacity={1}
            onPress={toggleConfig}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 999,
            }}
          />
        )}
        
        {/* Okno konfiguracji wyśrodkowane */}
        {isConfigOpen && (
          <Animated.View
            style={{
              position: 'absolute',
              top: Dimensions.get('window').height * 0.18,
              left: 20,
              right: 20,
              height: Dimensions.get('window').height * 0.64,
              backgroundColor: 'white',
              borderRadius: 24,
              transform: [{ scale: configScaleAnim }],
              opacity: configOpacityAnim,
              zIndex: 1000,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
              elevation: 10,
            }}
            pointerEvents={isConfigOpen ? 'auto' : 'none'}
          >
          <TouchableOpacity
            className="rounded-full bg-gray-200"
            style={{ 
              position: 'absolute',
              top: 20,
              right: 20,
              width: 44,
              height: 44,
              zIndex: 1001
            }}
            activeOpacity={0.7}
            onPress={toggleAquariumContent}
          >
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <FontAwesome6 name="computer" size={24} color="black" />
            </View>
          </TouchableOpacity>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 20 }}>
            <View style={{ paddingTop: 30, paddingHorizontal: 20 }}>
              <Text className="text-gray-800 text-3xl font-bold text-center mb-2">
                Konfiguracja
              </Text>
              {lastConfigChangeTime && (
                <Text className="text-gray-400 text-sm text-center mb-6">
                  {lastConfigChangeTime.toLocaleString('pl-PL', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </Text>
              )}
              
              {[1, 2, 3, 4, 5, 6].map((index) => (
                <View key={index} className="mb-4">
                  <Text className="text-gray-700 font-semibold mb-2 text-sm">
                    X{index}
                  </Text>
                  <TextInput
                    placeholder={`Wpisz wartość X${index}...`}
                    placeholderTextColor="#9ca3af"
                    value={configFields[`X${index}`] || ''}
                    onChangeText={(value) => {
                      const newFields = { ...configFields, [`X${index}`]: value };
                      const changeTime = new Date();
                      setConfigFields(newFields);
                      setLastConfigChangeTime(changeTime);
                      saveConfigData(newFields, changeTime);
                    }}
                    className="w-full p-4 rounded-xl border-2 border-gray-300 bg-white"
                    style={{ fontSize: 16 }}
                  />
                </View>
              ))}
            </View>
          </ScrollView>
        </Animated.View>
        )}
        
        {/* Okno zawartości akwarium */}
        <AquariumContentScreen 
          isOpen={isAquariumContentOpen} 
          onClose={toggleAquariumContent} 
        />
        </View>
    </>
  );
}
