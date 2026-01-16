import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './screens/HomeScreen';
import LuzScreen from './screens/LuzScreen';
import SensorScreen from './screens/SensorScreen';
import RFIDScreen from './screens/RFIDScreen';
import UsuarioScreen from './screens/UsuarioScreen';
import PresenciaScreen from './screens/PresenciaScreen';

const Stack = createStackNavigator();

export default function App() {
  console.log('App is rendering');
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Inicio' }} />
        <Stack.Screen name="Luz" component={LuzScreen} options={{ title: 'Luz' }} />
        <Stack.Screen name="Sensor" component={SensorScreen} options={{ title: 'Sensores' }} />
        <Stack.Screen name="RFID" component={RFIDScreen} options={{ title: 'RFID' }} />
        <Stack.Screen name="Usuario" component={UsuarioScreen} options={{ title: 'Usuarios' }} />
        <Stack.Screen name="Presencia" component={PresenciaScreen} options={{ title: 'Presencia' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
