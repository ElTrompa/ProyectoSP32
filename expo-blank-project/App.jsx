import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import LuzScreen from './screens/LuzScreen';
import SensorScreen from './screens/SensorScreen';
import RFIDScreen from './screens/RFIDScreen';
import UsuarioScreen from './screens/UsuarioScreen';
import PresenciaScreen from './screens/PresenciaScreen';
import AllDataScreen from './screens/AllDataScreen';
import TrabajadorScreen from './screens/TrabajadorScreen';

const Stack = createStackNavigator();

export default function App() {
  console.log('App is rendering');
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio', headerLeft: null }} />
        <Stack.Screen name="Luz" component={LuzScreen} options={{ title: 'Luz' }} />
        <Stack.Screen name="Sensor" component={SensorScreen} options={{ title: 'Sensores' }} />
        <Stack.Screen name="RFID" component={RFIDScreen} options={{ title: 'RFID' }} />
        <Stack.Screen name="Usuario" component={UsuarioScreen} options={{ title: 'Admin - Usuarios' }} />
        <Stack.Screen name="Trabajador" component={TrabajadorScreen} options={{ title: 'Mi Perfil (Trabajador)', headerShown: false }} />
        <Stack.Screen name="Presencia" component={PresenciaScreen} options={{ title: 'Presencia' }} />
        <Stack.Screen name="AllData" component={AllDataScreen} options={{ title: 'Todos los Datos' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
