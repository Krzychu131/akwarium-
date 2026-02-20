import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Animated, Image, Alert, Switch } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import FontAwesome5 from '@expo/vector-icons/FontAwesome5';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import '../global.css';

interface AquariumContentScreenProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AquariumContentScreen({ isOpen, onClose }: AquariumContentScreenProps) {
  // Animacja okna zawartości akwarium - scale i opacity
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  // Animacja okna informacji
  const infoScaleAnim = useRef(new Animated.Value(0)).current;
  const infoOpacityAnim = useRef(new Animated.Value(0)).current;
  
  // Animacja okna konfiguracji
  const configScaleAnim = useRef(new Animated.Value(0)).current;
  const configOpacityAnim = useRef(new Animated.Value(0)).current;
  
  // Stan przechowujący URI zdjęcia
  const [bannerImage, setBannerImage] = useState<string | null>(null);
  
  // Stan widoczności okna informacji
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  
  // Stan widoczności okna konfiguracji
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  
  // Stan objętości akwarium
  const [volume, setVolume] = useState<string>('');
  
  // Stan rodzaju akwarium
  const [aquariumType, setAquariumType] = useState<string>('');
  const [showTypeDropdown, setShowTypeDropdown] = useState<boolean>(false);
  
  const aquariumTypes = ['słonowodne', 'słodkowodne', 'brakiczne'];
  
  // Stan przełącznika konserwacji
  const [maintenanceEnabled, setMaintenanceEnabled] = useState<boolean>(false);
  
  // Stan nazwy akwarium
  const [aquariumName, setAquariumName] = useState<string>('');
  
  // Stan oznaczenia
  const [designation, setDesignation] = useState<string>('');
  const [showDesignationDropdown, setShowDesignationDropdown] = useState<boolean>(false);
  const [designationImage, setDesignationImage] = useState<string | null>(null);
  
  const designationTypes = ['proste', 'zdjęcie'];
  
  // Stan wielkości okna
  const [sizeConfig, setSizeConfig] = useState<string>('średnie');
  const [showSizeConfigDropdown, setShowSizeConfigDropdown] = useState<boolean>(false);
  const sizeConfigTypes = ['małe', 'średnie', 'duże'];
  
  // Funkcja do wyboru/robienia zdjęcia dla oznaczenia
  const pickDesignationImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Brak uprawnień', 'Potrzebujemy uprawnień do dostępu do galerii.');
      return;
    }

    Alert.alert(
      'Wybierz zdjęcie',
      'Skąd chcesz wybrać zdjęcie?',
      [
        {
          text: 'Anuluj',
          style: 'cancel',
        },
        {
          text: 'Galeria',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [16, 9],
              quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
              setDesignationImage(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Aparat',
          onPress: async () => {
            const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
            if (cameraStatus.status !== 'granted') {
              Alert.alert('Brak uprawnień', 'Potrzebujemy uprawnień do aparatu.');
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [16, 9],
              quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
              setDesignationImage(result.assets[0].uri);
            }
          },
        },
      ]
    );
  };
  
  // Stan rodzaju zawartości
  const [contentType, setContentType] = useState<string>('');
  const [showContentTypeDropdown, setShowContentTypeDropdown] = useState<boolean>(false);
  
  const contentTypes = ['zwierzę', 'roślina'];
  
  // Bazy danych
  const fishDatabase = [
    'Bojownik syjamski',
    'Gupik',
    'Mieczyk',
    'Molinezja',
    'Zbrojnik niebieski',
    'Kirysek pstry',
    'Brzanka sumatrzańska',
    'Danio pręgowany',
    'Razbora klinowa',
    'Neon innesa'
  ];
  
  const plantDatabase = [
    'Anubias nana',
    'Cryptocoryne wendtii',
    'Hygrophila polysperma',
    'Vallisneria spiralis',
    'Echinodorus amazonicus',
    'Microsorum pteropus',
    'Cabomba caroliniana',
    'Ludwigia repens',
    'Rotala rotundifolia',
    'Ceratophyllum demersum'
  ];
  
  // Stan gatunku
  const [species, setSpecies] = useState<string>('');
  const [searchResults, setSearchResults] = useState<string[]>([]);
  const [showSearchResults, setShowSearchResults] = useState<boolean>(false);
  
  // Stan ilości
  const [quantity, setQuantity] = useState<string>('');
  const [quantityType, setQuantityType] = useState<string>('');
  const [showQuantityTypeDropdown, setShowQuantityTypeDropdown] = useState<boolean>(false);
  
  const quantityTypes = ['ilość', 'objętość', 'wielkość', 'waga'];
  
  // Stan wielkości
  const [size, setSize] = useState<string>('');
  const [showSizeDropdown, setShowSizeDropdown] = useState<boolean>(false);
  
  const sizes = ['duża', 'średnia', 'mała'];
  
  // Stan zapisanych konfiguracji
  const [savedConfigurations, setSavedConfigurations] = useState<any[]>([]);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);
  
  // Funkcja wyszukiwania gatunku
  const handleSpeciesSearch = (text: string) => {
    setSpecies(text);
    
    if (!contentType) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    const database = contentType === 'zwierzę' ? fishDatabase : contentType === 'roślina' ? plantDatabase : [];
    
    if (text.length > 0) {
      const filtered = database.filter(item => 
        item.toLowerCase().includes(text.toLowerCase())
      );
      setSearchResults(filtered);
      setShowSearchResults(filtered.length > 0);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
  };
  
  // Aktualizuj wyniki gdy zmienia się rodzaj
  useEffect(() => {
    if (!contentType) {
      setSearchResults([]);
      setShowSearchResults(false);
      setSpecies('');
      return;
    }
    
    const database = contentType === 'zwierzę' ? fishDatabase : contentType === 'roślina' ? plantDatabase : [];
    
    if (species.length > 0) {
      const filtered = database.filter(item => 
        item.toLowerCase().includes(species.toLowerCase())
      );
      setSearchResults(filtered);
      setShowSearchResults(filtered.length > 0);
    } else {
      setSearchResults([]);
      setShowSearchResults(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contentType]);
  
  // Funkcje do zapisywania i ładowania zdjęcia
  const saveBannerImage = useCallback(async (uri: string) => {
    try {
      await AsyncStorage.setItem('aquariumBannerImage', uri);
    } catch (error) {
      console.error('Błąd zapisywania zdjęcia banera:', error);
    }
  }, []);

  const loadBannerImage = useCallback(async () => {
    try {
      const savedImage = await AsyncStorage.getItem('aquariumBannerImage');
      if (savedImage) {
        setBannerImage(savedImage);
      }
    } catch (error) {
      console.error('Błąd ładowania zdjęcia banera:', error);
    }
  }, []);

  // Funkcje do zapisywania i ładowania podstawowych informacji
  const saveBasicInfo = useCallback(async () => {
    try {
      await AsyncStorage.multiSet([
        ['aquariumVolume', volume],
        ['aquariumType', aquariumType],
        ['maintenanceEnabled', JSON.stringify(maintenanceEnabled)],
      ]);
    } catch (error) {
      console.error('Błąd zapisywania podstawowych informacji:', error);
    }
  }, [volume, aquariumType, maintenanceEnabled]);

  const loadBasicInfo = useCallback(async () => {
    try {
      const [savedVolume, savedType, savedMaintenance] = await AsyncStorage.multiGet([
        'aquariumVolume',
        'aquariumType',
        'maintenanceEnabled',
      ]);
      
      if (savedVolume[1]) {
        setVolume(savedVolume[1]);
      }
      if (savedType[1]) {
        setAquariumType(savedType[1]);
      }
      if (savedMaintenance[1]) {
        setMaintenanceEnabled(JSON.parse(savedMaintenance[1]));
      }
    } catch (error) {
      console.error('Błąd ładowania podstawowych informacji:', error);
    }
  }, []);

  // Załaduj zapisane zdjęcie przy otwarciu okna
  useEffect(() => {
    if (isOpen) {
      loadBannerImage();
    }
  }, [isOpen, loadBannerImage]);

  // Załaduj zapisane podstawowe informacje przy otwarciu modala
  useEffect(() => {
    if (showInfoModal) {
      loadBasicInfo();
    }
  }, [showInfoModal, loadBasicInfo]);

  // Zapisz podstawowe informacje przy zmianie wartości
  useEffect(() => {
    if (showInfoModal) {
      saveBasicInfo();
    }
  }, [volume, aquariumType, maintenanceEnabled, showInfoModal, saveBasicInfo]);

  // Funkcje do zapisywania i ładowania konfiguracji
  const saveConfigurations = useCallback(async (configs: any[]) => {
    try {
      await AsyncStorage.setItem('aquariumConfigurations', JSON.stringify(configs));
    } catch (error) {
      console.error('Błąd zapisywania konfiguracji:', error);
    }
  }, []);

  const loadConfigurations = useCallback(async () => {
    try {
      const savedConfigs = await AsyncStorage.getItem('aquariumConfigurations');
      if (savedConfigs) {
        setSavedConfigurations(JSON.parse(savedConfigs));
      }
    } catch (error) {
      console.error('Błąd ładowania konfiguracji:', error);
    }
  }, []);

  // Załaduj konfiguracje przy otwarciu ekranu
  useEffect(() => {
    if (isOpen) {
      loadConfigurations();
    }
  }, [isOpen, loadConfigurations]);

  // Funkcja do otwierania konfiguracji z danymi
  const handleOpenConfiguration = (config: any) => {
    setAquariumName(config.name || '');
    setDesignation(config.designation || '');
    setDesignationImage(config.designationImage || null);
    setSizeConfig(config.sizeConfig || 'średnie');
    setContentType(config.contentType || '');
    setSpecies(config.species || '');
    setQuantityType(config.quantityType || '');
    setQuantity(config.quantity || '');
    setSize(config.size || '');
    setEditingConfigId(config.id);
    setShowConfigModal(true);
  };

  // Funkcja obsługująca kliknięcie "dodaj" lub "gotowe"
  const handleSaveConfiguration = async () => {
    if (!aquariumName.trim()) {
      Alert.alert('Błąd', 'Proszę podać nazwę');
      return;
    }

    const configData = {
      id: editingConfigId || Date.now().toString(),
      name: aquariumName,
      designation: designation,
      designationImage: designationImage,
      sizeConfig: sizeConfig,
      contentType: contentType,
      species: species,
      quantityType: quantityType,
      quantity: quantity,
      size: size,
    };

    let updatedConfigs;
    if (editingConfigId) {
      // Aktualizuj istniejącą konfigurację
      updatedConfigs = savedConfigurations.map(config => 
        config.id === editingConfigId ? configData : config
      );
    } else {
      // Dodaj nową konfigurację
      updatedConfigs = [...savedConfigurations, configData];
    }

    setSavedConfigurations(updatedConfigs);
    await saveConfigurations(updatedConfigs);

    // Resetuj pola formularza
    setAquariumName('');
    setDesignation('');
    setDesignationImage(null);
    setSizeConfig('średnie');
    setContentType('');
    setSpecies('');
    setQuantityType('');
    setQuantity('');
    setSize('');
    setEditingConfigId(null);
    setShowConfigModal(false);

    // Zamknij modal
    setShowConfigModal(false);
  };
  
  // Animacja okna zawartości akwarium
  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: isOpen ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.spring(opacityAnim, {
        toValue: isOpen ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
    ]).start();
  }, [isOpen, scaleAnim, opacityAnim]);

  // Animacja okna informacji
  useEffect(() => {
    Animated.parallel([
      Animated.spring(infoScaleAnim, {
        toValue: showInfoModal ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.spring(infoOpacityAnim, {
        toValue: showInfoModal ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
    ]).start();
  }, [showInfoModal, infoScaleAnim, infoOpacityAnim]);

  // Animacja okna konfiguracji
  useEffect(() => {
    Animated.parallel([
      Animated.spring(configScaleAnim, {
        toValue: showConfigModal ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.spring(configOpacityAnim, {
        toValue: showConfigModal ? 1 : 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
    ]).start();
  }, [showConfigModal, configScaleAnim, configOpacityAnim]);

  // Funkcja do wyboru/robienia zdjęcia
  const pickImage = async () => {
    // Prośba o uprawnienia
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Brak uprawnień', 'Potrzebujemy uprawnień do dostępu do galerii.');
      return;
    }

    Alert.alert(
      'Wybierz zdjęcie',
      'Skąd chcesz wybrać zdjęcie?',
      [
        {
          text: 'Anuluj',
          style: 'cancel',
        },
        {
          text: 'Galeria',
          onPress: async () => {
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [16, 9],
              quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
              setBannerImage(result.assets[0].uri);
              await saveBannerImage(result.assets[0].uri);
            }
          },
        },
        {
          text: 'Aparat',
          onPress: async () => {
            const cameraStatus = await ImagePicker.requestCameraPermissionsAsync();
            if (cameraStatus.status !== 'granted') {
              Alert.alert('Brak uprawnień', 'Potrzebujemy uprawnień do aparatu.');
              return;
            }

            const result = await ImagePicker.launchCameraAsync({
              allowsEditing: true,
              aspect: [16, 9],
              quality: 1,
            });

            if (!result.canceled && result.assets[0]) {
              setBannerImage(result.assets[0].uri);
              await saveBannerImage(result.assets[0].uri);
            }
          },
        },
      ]
    );
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      {/* Ciemne tło overlay */}
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
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
      
      {/* Okno zawartości akwarium */}
      <Animated.View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: '#0891b2',
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
          zIndex: 1000,
        }}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        {/* Baner ze zdjęciem na samej górze - pozycjonowany absolutnie */}
        {bannerImage && (
          <View style={{ 
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 200,
            zIndex: 1
          }}>
            <Image
              source={{ uri: bannerImage }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        )}
        
        {/* Przycisk powrotu - pozycjonowany absolutnie, zawsze w tym samym miejscu */}
        <TouchableOpacity
          onPress={onClose}
          className="rounded-full bg-white/20"
          style={{ 
            position: 'absolute',
            top: 50,
            left: 16,
            width: 44,
            height: 44,
            zIndex: 3
          }}
        >
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text className="text-white text-2xl" style={{ fontWeight: 'bold', marginTop: -4 }}>←</Text>
          </View>
        </TouchableOpacity>
        
        {/* Ciemniejszy niebieski pasek pod zdjęciem z napisem */}
        <View 
          style={{ 
            position: 'absolute',
            top: bannerImage ? 200 : 0,
            left: 0,
            right: 0,
            height: 40,
            backgroundColor: '#067a94',
            zIndex: 2,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingTop: 6
          }}
        >
          <Text className="text-white text-4xl font-bold text-center">
            Zawartość akwarium
          </Text>
        </View>
        
        <ScrollView 
          className="flex-1" 
          style={{ backgroundColor: '#0891b2' }}
          contentContainerStyle={{ paddingTop: bannerImage ? 230 : 30 }}
        >
          <View className="p-4">
            {/* Zapisane konfiguracje */}
            {savedConfigurations.map((config) => (
              <TouchableOpacity
                key={config.id}
                onPress={() => handleOpenConfiguration(config)}
                className="rounded-3xl mb-3"
                style={{
                  height: config.sizeConfig === 'małe' ? 40 : config.sizeConfig === 'duże' ? 80 : 60,
                  alignItems: 'center',
                  justifyContent: 'center',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                  backgroundColor: config.designationImage ? 'transparent' : 'white',
                  overflow: 'hidden',
                }}
                activeOpacity={0.7}
              >
                {config.designationImage && (
                  <Image
                    source={{ uri: config.designationImage }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      width: '100%',
                      height: '100%',
                    }}
                    resizeMode="cover"
                  />
                )}
                <Text 
                  className="text-lg font-bold text-center"
                  style={{
                    color: config.designationImage ? '#ffffff' : '#1f2937',
                    textShadowColor: config.designationImage ? 'rgba(0, 0, 0, 0.75)' : 'transparent',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                  }}
                >
                  {config.name}
                </Text>
              </TouchableOpacity>
            ))}
            
            {/* Okienko z przyciskiem + */}
            <View 
              className="bg-white rounded-3xl"
              style={{
                height: 60,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: savedConfigurations.length > 0 ? 8 : 6,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 4,
              }}
            >
              <TouchableOpacity
                className="rounded-full bg-gray-300"
                style={{
                  width: '80%',
                  height: 40,
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 20,
                }}
                activeOpacity={0.7}
                onPress={() => {
                  setEditingConfigId(null);
                  setAquariumName('');
                  setDesignation('');
                  setDesignationImage(null);
                  setSizeConfig('średnie');
                  setContentType('');
                  setSpecies('');
                  setQuantityType('');
                  setQuantity('');
                  setSize('');
                  setShowConfigModal(true);
                }}
              >
                <FontAwesome6 name="plus" size={24} color="black" />
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        
        {/* Przycisk z ikoną aparatu w prawym dolnym rogu */}
        <TouchableOpacity
          className="rounded-full bg-white"
          style={{
            position: 'absolute',
            bottom: 60,
            right: 10,
            width: 56,
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
            shadowRadius: 8,
              elevation: 8,
          }}
          activeOpacity={0.7}
          onPress={pickImage}
        >
          <MaterialIcons name="add-a-photo" size={24} color="black" />
        </TouchableOpacity>
        
        {/* Przycisk z ikoną info w lewym dolnym rogu */}
        <TouchableOpacity
          className="rounded-full bg-white"
          style={{
            position: 'absolute',
            bottom: 60,
            left: 10,
            width: 56,
            height: 56,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
          activeOpacity={0.7}
          onPress={() => setShowInfoModal(true)}
        >
          <FontAwesome5 name="info" size={24} color="black" />
        </TouchableOpacity>
      </Animated.View>
      
      {/* Modal z informacjami */}
      {showInfoModal && (
        <>
          {/* Ciemne tło overlay */}
          <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowInfoModal(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 2000,
            }}
          />
          
          {/* Białe okno informacji */}
          <Animated.View
            style={{
              position: 'absolute',
              top: '30%',
              left: '10%',
              right: '10%',
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 20,
              transform: [{ scale: infoScaleAnim }],
              opacity: infoOpacityAnim,
              zIndex: 2001,
              maxHeight: '70%',
            }}
            pointerEvents={showInfoModal ? 'auto' : 'none'}
          >
            <Text className="text-gray-800 text-2xl font-bold mb-4 text-center">
                Podstawowe informacje
              </Text>
              
            {/* Objętość */}
            <View className="flex-row items-center mb-4">
              <FontAwesome6 name="glass-water" size={24} color="black" style={{ marginRight: 8 }} />
              <View className="flex-row items-center flex-1" style={{ justifyContent: 'flex-end', marginRight: 10 }}>
                <Text className="text-gray-700 font-semibold text-lg mr-3">Objętość</Text>
                <View className="flex-row items-center" style={{ marginLeft: 20 }}>
                  <TextInput
                    placeholder="wpisz"
                    placeholderTextColor="#9ca3af"
                    value={volume}
                    onChangeText={setVolume}
                    keyboardType="numeric"
                    className="p-3 rounded-xl border-2 bg-white"
                    style={{ fontSize: 16, width: 80, borderColor: '#000000' }}
                  />
                  <Text className="text-gray-700 text-lg font-semibold" style={{ marginLeft: -20 }}>litrów</Text>
                </View>
              </View>
            </View>
            
            {/* Rodzaj */}
            <View className="mb-4" style={{ position: 'relative' }}>
              <View className="flex-row items-center">
                <MaterialCommunityIcons name="fishbowl-outline" size={30} color="black" style={{ marginRight: 8 }} />
                <View className="flex-row items-center flex-1" style={{ justifyContent: 'flex-end', marginRight: 20 }}>
                  <Text className="text-gray-700 font-semibold text-lg" style={{ marginRight: -16 }}>Rodzaj</Text>
                  <View style={{ position: 'relative', width: 140, zIndex: 1001 }}>
                    <TouchableOpacity
                      onPress={() => setShowTypeDropdown(!showTypeDropdown)}
                      className="flex-row items-center justify-between p-3 rounded-xl border-2 bg-white"
                      style={{ 
                        borderColor: '#000000',
                        minHeight: 48,
                        marginLeft: 40,
                        width: '100%',
                      }}
                    >
                      <Text className="text-gray-700" style={{ fontSize: 16 }} numberOfLines={1} ellipsizeMode="tail">
                        {aquariumType || 'Wybierz...'}
                      </Text>
                      <MaterialIcons 
                        name={showTypeDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                        size={24} 
                        color="black" 
                      />
                    </TouchableOpacity>
                    
                    {showTypeDropdown && (
                      <View
                        style={{
                          position: 'absolute',
                          top: 52,
                          left: 0,
                          right: 0,
                          backgroundColor: 'white',
                          borderRadius: 12,
                          borderWidth: 2,
                          borderColor: '#000000',
                          zIndex: 1002,
                          shadowColor: '#000',
                          shadowOffset: { width: 0, height: 4 },
                          shadowOpacity: 0.3,
                          shadowRadius: 8,
                          elevation: 8,
                          overflow: 'hidden',
                        }}
                      >
                        {aquariumTypes.map((type, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => {
                              setAquariumType(type);
                              setShowTypeDropdown(false);
                            }}
                            style={{
                              padding: 12,
                              borderBottomWidth: index < aquariumTypes.length - 1 ? 1 : 0,
                              borderBottomColor: '#e5e7eb',
                              backgroundColor: aquariumType === type ? '#f3f4f6' : 'white',
                              borderTopLeftRadius: index === 0 ? 10 : 0,
                              borderTopRightRadius: index === 0 ? 10 : 0,
                              borderBottomLeftRadius: index === aquariumTypes.length - 1 ? 10 : 0,
                              borderBottomRightRadius: index === aquariumTypes.length - 1 ? 10 : 0,
                            }}
                          >
                            <Text 
                              style={{ 
                                fontSize: 16, 
                                color: aquariumType === type ? '#0891b2' : '#374151',
                                fontWeight: aquariumType === type ? '600' : '400',
                              }}
                            >
                              {type}
                            </Text>
                          </TouchableOpacity>
                        ))}
          </View>
                    )}
                  </View>
                </View>
              </View>
            </View>
            
            {/* Konserwacja */}
            <View className="flex-row items-center mb-8" style={{ marginTop: 10 }}>
              <MaterialCommunityIcons name="tools" size={30} color="black" style={{ marginRight: 8 }} />
              <View className="flex-row items-center flex-1" style={{ justifyContent: 'flex-end', marginRight: 40 }}>
                <Text className="text-gray-700 font-semibold text-lg" style={{ marginRight: 12 }}>Konserwacja</Text>
                <Switch
                  value={maintenanceEnabled}
                  onValueChange={setMaintenanceEnabled}
                  trackColor={{ false: '#d1d5db', true: '#0891b2' }}
                  thumbColor={maintenanceEnabled ? '#ffffff' : '#f3f4f6'}
                />
              </View>
            </View>
            
            <ScrollView>
              {/* Tutaj można dodać więcej zawartości informacji */}
        </ScrollView>
          </Animated.View>
        </>
      )}
        
      {/* Modal z konfiguracją */}
      {showConfigModal && (
        <>
          {/* Ciemne tło overlay */}
        <TouchableOpacity
            activeOpacity={1}
            onPress={() => setShowConfigModal(false)}
          style={{
            position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 2000,
            }}
          />
          
          {/* Białe okno konfiguracji */}
          <Animated.View
            style={{
              position: 'absolute',
              top: '25%',
              left: '10%',
              right: '10%',
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 20,
              transform: [{ scale: configScaleAnim }],
              opacity: configOpacityAnim,
              zIndex: 2001,
              maxHeight: '70%',
            }}
            pointerEvents={showConfigModal ? 'auto' : 'none'}
          >
            <View className="flex-row items-center justify-center mb-6" style={{ position: 'relative' }}>
              <Text className="text-gray-800 text-2xl font-bold">
                konfiguracja
              </Text>
              {editingConfigId && (
                <TouchableOpacity
                  onPress={async () => {
                    Alert.alert(
                      'Usuń konfigurację',
                      'Czy na pewno chcesz usunąć tę konfigurację?',
                      [
                        {
                          text: 'Anuluj',
                          style: 'cancel',
                        },
                        {
                          text: 'Usuń',
                          style: 'destructive',
                          onPress: async () => {
                            const updatedConfigs = savedConfigurations.filter(
                              config => config.id !== editingConfigId
                            );
                            setSavedConfigurations(updatedConfigs);
                            await saveConfigurations(updatedConfigs);
                            
                            // Resetuj pola formularza
                            setAquariumName('');
                            setDesignation('');
                            setDesignationImage(null);
                            setSizeConfig('średnie');
                            setContentType('');
                            setSpecies('');
                            setQuantityType('');
                            setQuantity('');
                            setSize('');
                            setEditingConfigId(null);
                            setShowConfigModal(false);
                          },
                        },
                      ]
                    );
                  }}
                  style={{
                    position: 'absolute',
                    right: 0,
                    backgroundColor: '#ef4444',
                    borderRadius: 8,
                    padding: 8,
            alignItems: 'center',
            justifyContent: 'center',
                  }}
                  activeOpacity={0.7}
                >
                  <FontAwesome6 name="trash-can" size={20} color="white" />
                </TouchableOpacity>
              )}
            </View>
            
            {/* Nazwa */}
            <View className="flex-row items-center mb-4">
              <Text className="text-gray-800 text-xl font-bold mr-3">Nazwa</Text>
              <TextInput
                placeholder="Wpisz nazwę..."
                placeholderTextColor="#9ca3af"
                value={aquariumName}
                onChangeText={setAquariumName}
                className="flex-1 p-3 rounded-xl border-2 bg-white"
                style={{ fontSize: 16, borderColor: '#000000', marginLeft: 76 }}
              />
            </View>
            
            {/* Oznaczenie */}
            <View className="mb-4" style={{ position: 'relative' }}>
              <View className="flex-row items-center">
                <Text className="text-gray-800 text-xl font-bold mr-3">Oznaczenie</Text>
                <View style={{ position: 'relative', width: 140, zIndex: 1012, flex: 1, marginLeft: 20 }}>
                  <TouchableOpacity
                    onPress={() => setShowDesignationDropdown(!showDesignationDropdown)}
                    className="flex-row items-center justify-between p-3 rounded-xl border-2 bg-white"
                    style={{ 
                      borderColor: '#000000',
                      minHeight: 48,
                      width: '100%',
                    }}
                  >
                    <Text className="text-gray-700" style={{ fontSize: 16 }} numberOfLines={1} ellipsizeMode="tail">
                      {designation || 'Wybierz...'}
                    </Text>
                    <MaterialIcons 
                      name={showDesignationDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                      size={24} 
                      color="black" 
                    />
                  </TouchableOpacity>
                  
                  {showDesignationDropdown && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 52,
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: '#000000',
                        zIndex: 1013,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
                        overflow: 'hidden',
                      }}
                    >
                      {designationTypes.map((type, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => {
                            setDesignation(type);
                            setShowDesignationDropdown(false);
                          }}
                          style={{
                            padding: 12,
                            borderBottomWidth: index < designationTypes.length - 1 ? 1 : 0,
                            borderBottomColor: '#e5e7eb',
                            backgroundColor: designation === type ? '#f3f4f6' : 'white',
                            borderTopLeftRadius: index === 0 ? 10 : 0,
                            borderTopRightRadius: index === 0 ? 10 : 0,
                            borderBottomLeftRadius: index === designationTypes.length - 1 ? 10 : 0,
                            borderBottomRightRadius: index === designationTypes.length - 1 ? 10 : 0,
                          }}
                        >
                          <Text 
                            style={{ 
                              fontSize: 16, 
                              color: designation === type ? '#0891b2' : '#374151',
                              fontWeight: designation === type ? '600' : '400',
                            }}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                
                {/* Przycisk + */}
                {designation === 'zdjęcie' && (
                  <View style={{ marginLeft: 12, alignItems: 'center', justifyContent: 'center' }}>
                    {designationImage ? (
                      <TouchableOpacity
                        onPress={pickDesignationImage}
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: 8,
                          overflow: 'hidden',
                          borderWidth: 2,
                          borderColor: '#000000',
          }}
          activeOpacity={0.7}
                      >
                        <Image
                          source={{ uri: designationImage }}
                          style={{ width: '100%', height: '100%' }}
                          resizeMode="cover"
                        />
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        className="rounded-full"
                        style={{
                          width: 30,
                          height: 30,
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#0891b2',
                        }}
                        activeOpacity={0.7}
                        onPress={pickDesignationImage}
                      >
                        <FontAwesome6 name="plus" size={20} color="white" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
            
            {/* Wielkość */}
            <View className="mb-4" style={{ position: 'relative' }}>
              <View className="flex-row items-center">
                <Text className="text-gray-800 text-xl font-bold mr-3">wielkość</Text>
                <View style={{ position: 'relative', width: 140, zIndex: 1011, flex: 1, marginLeft: 60 }}>
                  <TouchableOpacity
                    onPress={() => setShowSizeConfigDropdown(!showSizeConfigDropdown)}
                    className="flex-row items-center justify-between p-3 rounded-xl border-2 bg-white"
                    style={{ 
                      borderColor: '#000000',
                      minHeight: 48,
                      width: '100%',
                    }}
                  >
                    <Text className="text-gray-700" style={{ fontSize: 16 }} numberOfLines={1} ellipsizeMode="tail">
                      {sizeConfig || 'Wybierz...'}
                    </Text>
                    <MaterialIcons 
                      name={showSizeConfigDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                      size={24} 
                      color="black" 
                    />
                  </TouchableOpacity>
                  
                  {showSizeConfigDropdown && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 52,
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: '#000000',
                        zIndex: 1012,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.1,
                        shadowRadius: 8,
                        elevation: 5,
                      }}
                    >
                      {sizeConfigTypes.map((type, index) => (
                        <TouchableOpacity
                          key={type}
                          onPress={() => {
                            setSizeConfig(type);
                            setShowSizeConfigDropdown(false);
                          }}
                          style={{
                            padding: 12,
                            borderBottomWidth: index < sizeConfigTypes.length - 1 ? 1 : 0,
                            borderBottomColor: '#e5e7eb',
                            backgroundColor: sizeConfig === type ? '#f3f4f6' : 'white',
                            borderTopLeftRadius: index === 0 ? 10 : 0,
                            borderTopRightRadius: index === 0 ? 10 : 0,
                            borderBottomLeftRadius: index === sizeConfigTypes.length - 1 ? 10 : 0,
                            borderBottomRightRadius: index === sizeConfigTypes.length - 1 ? 10 : 0,
                          }}
                        >
                          <Text 
                            style={{ 
                              fontSize: 16, 
                              color: sizeConfig === type ? '#0891b2' : '#374151',
                              fontWeight: sizeConfig === type ? '600' : '400',
                            }}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>
            
           
            <View style={{ height: 1, backgroundColor: '#e5e7eb', marginTop: 4, marginBottom: 16 }} />
            
            {/* Rodzaj */}
            <View className="mb-4" style={{ position: 'relative' }}>
              <View className="flex-row items-center">
                <Text className="text-gray-800 text-xl font-bold mr-3">rodzaj</Text>
                <View style={{ position: 'relative', width: 140, zIndex: 1010, flex: 1, marginLeft: 84 }}>
                  <TouchableOpacity
                    onPress={() => setShowContentTypeDropdown(!showContentTypeDropdown)}
                    className="flex-row items-center justify-between p-3 rounded-xl border-2 bg-white"
                    style={{ 
                      borderColor: '#000000',
                      minHeight: 48,
                      width: '100%',
                    }}
                  >
                    <Text className="text-gray-700" style={{ fontSize: 16 }} numberOfLines={1} ellipsizeMode="tail">
                      {contentType || 'Wybierz...'}
                    </Text>
                    <MaterialIcons 
                      name={showContentTypeDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                      size={24} 
                      color="black" 
                    />
                  </TouchableOpacity>
                  
                  {showContentTypeDropdown && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 52,
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: '#000000',
                        zIndex: 1011,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                        overflow: 'hidden',
                      }}
                    >
                      {contentTypes.map((type, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => {
                            setContentType(type);
                            setShowContentTypeDropdown(false);
                          }}
                          style={{
                            padding: 12,
                            borderBottomWidth: index < contentTypes.length - 1 ? 1 : 0,
                            borderBottomColor: '#e5e7eb',
                            backgroundColor: contentType === type ? '#f3f4f6' : 'white',
                            borderTopLeftRadius: index === 0 ? 10 : 0,
                            borderTopRightRadius: index === 0 ? 10 : 0,
                            borderBottomLeftRadius: index === contentTypes.length - 1 ? 10 : 0,
                            borderBottomRightRadius: index === contentTypes.length - 1 ? 10 : 0,
                          }}
                        >
                          <Text 
                            style={{ 
                              fontSize: 16, 
                              color: contentType === type ? '#0891b2' : '#374151',
                              fontWeight: contentType === type ? '600' : '400',
                            }}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            </View>
            
            {/* Gatunek */}
            <View className="mb-4" style={{ position: 'relative' }}>
              {showSearchResults && (
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => {
                    setShowSearchResults(false);
                    setSearchResults([]);
                  }}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    zIndex: 1001,
                  }}
                />
              )}
              <View className="flex-row items-center">
                <Text className="text-gray-800 text-xl font-bold mr-3">gatunek</Text>
                <View style={{ position: 'relative', flex: 1, marginLeft: 65, zIndex: 1002 }}>
                  <TextInput
                    placeholder="Wpisz gatunek..."
                    placeholderTextColor="#9ca3af"
                    value={species}
                    onChangeText={handleSpeciesSearch}
                    className="p-3 rounded-xl border-2 bg-white"
                    style={{ fontSize: 16, borderColor: '#000000', width: '100%' }}
                    onFocus={() => {
                      if (!contentType) {
                        setShowSearchResults(false);
                        return;
                      }
                      
                      const database = contentType === 'zwierzę' ? fishDatabase : contentType === 'roślina' ? plantDatabase : [];
                      
                      if (species.length > 0) {
                        const filtered = database.filter(item => 
                          item.toLowerCase().includes(species.toLowerCase())
                        );
                        setSearchResults(filtered);
                        setShowSearchResults(filtered.length > 0);
                      } else {
                        // Pokaż wszystkie opcje gdy pole jest puste i jest w focusie
                        setSearchResults(database);
                        setShowSearchResults(database.length > 0);
                      }
                    }}
                    onBlur={() => {
                      // Opóźnij zamknięcie, aby umożliwić kliknięcie w wynik
                      setTimeout(() => {
                        setShowSearchResults(false);
                      }, 200);
                    }}
                  />
                  
                  {showSearchResults && searchResults.length > 0 && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 52,
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: '#000000',
                        zIndex: 1003,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                        overflow: 'hidden',
                        maxHeight: 200,
                      }}
                    >
                      <ScrollView>
                        {searchResults.map((result, index) => (
                          <TouchableOpacity
                            key={index}
                            onPress={() => {
                              setSpecies(result);
                              setShowSearchResults(false);
                              setSearchResults([]);
                            }}
                            style={{
                              padding: 12,
                              borderBottomWidth: index < searchResults.length - 1 ? 1 : 0,
                              borderBottomColor: '#e5e7eb',
                              backgroundColor: species === result ? '#f3f4f6' : 'white',
                              borderTopLeftRadius: index === 0 ? 10 : 0,
                              borderTopRightRadius: index === 0 ? 10 : 0,
                              borderBottomLeftRadius: index === searchResults.length - 1 ? 10 : 0,
                              borderBottomRightRadius: index === searchResults.length - 1 ? 10 : 0,
                            }}
                          >
                            <Text 
                              style={{ 
                                fontSize: 16, 
                                color: species === result ? '#0891b2' : '#374151',
                                fontWeight: species === result ? '600' : '400',
                              }}
                            >
                              {result}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
            </View>
            
            {/* Ilość */}
            <View className="mb-4" style={{ position: 'relative' }}>
              <View className="flex-row items-center">
                <View style={{ position: 'relative', width: 140, zIndex: 1008 }}>
                  <TouchableOpacity
                    onPress={() => setShowQuantityTypeDropdown(!showQuantityTypeDropdown)}
                    className="flex-row items-center justify-between p-3 rounded-xl border-2 bg-white"
                    style={{ 
                      borderColor: '#000000',
                      minHeight: 48,
                      width: '100%',
                    }}
                  >
                    <Text className="text-gray-800 text-xl font-bold" style={{ fontSize: 20 }} numberOfLines={1} ellipsizeMode="tail">
                      {quantityType || 'ilość'}
                    </Text>
                    <MaterialIcons 
                      name={showQuantityTypeDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                      size={24} 
                      color="black" 
                    />
                  </TouchableOpacity>
                  
                  {showQuantityTypeDropdown && (
                    <View
                      style={{
                        position: 'absolute',
                        top: 52,
                        left: 0,
                        right: 0,
                        backgroundColor: 'white',
                        borderRadius: 12,
                        borderWidth: 2,
                        borderColor: '#000000',
                        zIndex: 1009,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 8,
                        overflow: 'hidden',
                      }}
                    >
                      {quantityTypes.map((type, index) => (
                        <TouchableOpacity
                          key={index}
                          onPress={() => {
                            setQuantityType(type);
                            setShowQuantityTypeDropdown(false);
                          }}
                          style={{
                            padding: 12,
                            borderBottomWidth: index < quantityTypes.length - 1 ? 1 : 0,
                            borderBottomColor: '#e5e7eb',
                            backgroundColor: quantityType === type ? '#f3f4f6' : 'white',
                            borderTopLeftRadius: index === 0 ? 10 : 0,
                            borderTopRightRadius: index === 0 ? 10 : 0,
                            borderBottomLeftRadius: index === quantityTypes.length - 1 ? 10 : 0,
                            borderBottomRightRadius: index === quantityTypes.length - 1 ? 10 : 0,
                          }}
                        >
                          <Text 
                            style={{ 
                              fontSize: 16, 
                              color: quantityType === type ? '#0891b2' : '#374151',
                              fontWeight: quantityType === type ? '600' : '400',
                            }}
                          >
                            {type}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                
                {/* Pole tekstowe/dropdown i jednostka */}
                <View className="flex-row items-center flex-1" style={{ marginLeft: -10 }}>
                  {quantityType === 'wielkość' ? (
                    <View style={{ position: 'relative', width: 140, zIndex: 1010, flex: 1 }}>
                      <TouchableOpacity
                        onPress={() => setShowSizeDropdown(!showSizeDropdown)}
                        className="flex-row items-center justify-between p-3 rounded-xl border-2 bg-white"
                        style={{ 
                          borderColor: '#000000',
                          minHeight: 48,
                          width: '100%',
                        }}
                      >
                        <Text className="text-gray-700" style={{ fontSize: 16 }} numberOfLines={1} ellipsizeMode="tail">
                          {size || 'Wybierz...'}
                        </Text>
                        <MaterialIcons 
                          name={showSizeDropdown ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                          size={24} 
                          color="black" 
                        />
                      </TouchableOpacity>
                      
                      {showSizeDropdown && (
                        <View
                          style={{
                            position: 'absolute',
                            top: 52,
                            left: 0,
                            right: 0,
                            backgroundColor: 'white',
                            borderRadius: 12,
                            borderWidth: 2,
                            borderColor: '#000000',
                            zIndex: 1011,
                            shadowColor: '#000',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 8,
                            elevation: 8,
                            overflow: 'hidden',
                          }}
                        >
                          {sizes.map((s, index) => (
                            <TouchableOpacity
                              key={index}
                              onPress={() => {
                                setSize(s);
                                setShowSizeDropdown(false);
                              }}
                              style={{
                                padding: 12,
                                borderBottomWidth: index < sizes.length - 1 ? 1 : 0,
                                borderBottomColor: '#e5e7eb',
                                backgroundColor: size === s ? '#f3f4f6' : 'white',
                                borderTopLeftRadius: index === 0 ? 10 : 0,
                                borderTopRightRadius: index === 0 ? 10 : 0,
                                borderBottomLeftRadius: index === sizes.length - 1 ? 10 : 0,
                                borderBottomRightRadius: index === sizes.length - 1 ? 10 : 0,
                              }}
                            >
                              <Text 
                                style={{ 
                                  fontSize: 16, 
                                  color: size === s ? '#0891b2' : '#374151',
                                  fontWeight: size === s ? '600' : '400',
                                }}
                              >
                                {s}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}
                    </View>
                  ) : (
                    <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', zIndex: 1009 }}>
                      <TextInput
                        placeholder="Wpisz..."
                        placeholderTextColor="#9ca3af"
                        value={quantity}
                        onChangeText={setQuantity}
                        keyboardType={quantityType === 'waga' || quantityType === 'ilość' ? 'numeric' : 'default'}
                        className="flex-1 p-3 rounded-xl border-2 bg-white mr-2"
                        style={{ fontSize: 16, borderColor: '#000000' }}
                      />
                      <Text className="text-gray-800 text-lg font-semibold">
                        {quantityType === 'ilość' ? 'szt.' : quantityType === 'objętość' ? 'L' : quantityType === 'waga' ? 'kg' : ''}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
            
            <ScrollView>
              {/* Tutaj można dodać więcej zawartości konfiguracji */}
            </ScrollView>
            
            {/* Przycisk dodaj/gotowe */}
            <TouchableOpacity
              onPress={handleSaveConfiguration}
              style={{
                backgroundColor: '#0891b2',
                padding: 16,
                alignItems: 'center',
                justifyContent: 'center',
                marginTop: 20,
                width: '100%',
                borderRadius: 20,
              }}
              activeOpacity={0.7}
            >
              <Text className="text-white text-lg font-bold">
                {editingConfigId ? 'gotowe' : 'dodaj'}
              </Text>
        </TouchableOpacity>
      </Animated.View>
        </>
      )}
    </>
  );
}

