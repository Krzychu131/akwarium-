import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import Ionicons from '@expo/vector-icons/Ionicons';
import './global.css';
import ConnectionScreen from './screens/ConnectionScreen';
import DeviceScreen from './screens/DeviceScreen';

SplashScreen.preventAutoHideAsync();

type Screen = 'main' | 'connection' | 'device';

export default function App() {
  const [fontsLoaded] = useFonts({
    'Electrolize': require('./assets/fonts/Electrolize-Regular.ttf'),
  });

  const [currentScreen, setCurrentScreen] = useState<Screen>('main');

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  if (currentScreen === 'connection') {
    return <ConnectionScreen onBack={() => setCurrentScreen('main')} />;
  }

  if (currentScreen === 'device') {
    return <DeviceScreen onBack={() => setCurrentScreen('main')} />;
  }

  return (
    <>
      <StatusBar style="light" />
      <ScrollView className="flex-1 bg-cyan-600">
        <View className="flex-1 p-4 pt-52">
          {/* Header */}
          <View className="items-center mb-48">
            <View className="bg-white/20 rounded-full p-6 mb-8">
              <Ionicons name="water" size={48} color="white" />
            </View>
            <Text 
              className="text-white text-4xl text-center mb-3"
              style={{ fontFamily: 'Electrolize' }}
            >
              Aqua - filter
            </Text>
            <Text className="text-white/90 text-base text-center">
              
            </Text>
          </View>

          {/* Opcja 1: Połączenie */}
          <TouchableOpacity
            onPress={() => setCurrentScreen('connection')}
            className="mb-6 mb-6 shadow-xl"
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
                <View className="mr-4">
                  <Ionicons name="globe-outline" size={32} color="#0891b2" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 text-2xl font-bold mb-1">
                    Połączenie
                  </Text>

                </View>
                <View className="ml-4">
                  <Text className="text-gray-400 text-2xl">→</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          {/* Opcja 2: Urządzenie */}
          <TouchableOpacity
            onPress={() => setCurrentScreen('device')}
            className="shadow-xl"
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
                <View className="mr-4">
                  <Ionicons name="hardware-chip-outline" size={32} color="#0891b2" />
                </View>
                <View className="flex-1">
                  <Text className="text-gray-800 text-2xl font-bold mb-1">
                    Urządzenie
                  </Text>

                </View>
                <View className="ml-4">
                  <Text className="text-gray-400 text-2xl">→</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </>
  );
}
