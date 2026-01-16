import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Button } from 'react-native';
import axios from 'axios';

const API_URL = 'http://10.245.113.62:8080/api/datos';

export default function LuzScreen() {
  const [luzData, setLuzData] = useState([]);

  useEffect(() => {
    fetchLuzData();
  }, []);

  const fetchLuzData = async () => {
    console.log('Fetching luz data');
    try {
      const response = await axios.get(API_URL);
      console.log('Response data:', response.data);
      setLuzData(response.data.luz || []);
      console.log('Luz data set:', response.data.luz);
    } catch (error) {
      console.error('Error fetching luz data:', error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.text}>Iluminación: {item.iluminadad ? 'Encendida' : 'Apagada'}</Text>
      <Text style={styles.text}>Fecha: {item.fecha}</Text>
      <Text style={styles.text}>ID: {item.id}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Datos de Luz</Text>
      <Button title="Actualizar" onPress={fetchLuzData} />
      <FlatList
        data={luzData}
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