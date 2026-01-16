import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Button } from 'react-native';
import axios from 'axios';

const API_URL = '/api/datos';

export default function SensorScreen() {
  const [sensorData, setSensorData] = useState([]);

  useEffect(() => {
    fetchSensorData();
  }, []);

  const fetchSensorData = async () => {
    console.log('Fetching sensor data');
    try {
      const response = await axios.get(API_URL);
      console.log('Response data:', response.data);
      setSensorData(response.data.metereologia || []);
      console.log('Sensor data set:', response.data.metereologia);
    } catch (error) {
      console.error('Error fetching sensor data:', error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.text}>Temperatura: {item.temperatura}°C</Text>
      <Text style={styles.text}>Humedad: {item.humedad}%</Text>
      <Text style={styles.text}>Fecha: {item.fecha}</Text>
      <Text style={styles.text}>ID: {item.id}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Datos de Sensores</Text>
      <Button title="Actualizar" onPress={fetchSensorData} />
      <FlatList
        data={sensorData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 20,
  },
  item: {
    backgroundColor: '#333',
    padding: 15,
    marginVertical: 5,
    borderRadius: 5,
  },
  text: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#555',
    padding: 10,
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 5,
  },
  buttonText: {
    color: '#fff',
  },
});