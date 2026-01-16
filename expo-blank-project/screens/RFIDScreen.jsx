import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Button } from 'react-native';
import axios from 'axios';

const API_URL = '/api/datos';

export default function RFIDScreen() {
  const [rfidData, setRfidData] = useState([]);

  useEffect(() => {
    fetchRfidData();
  }, []);

  const fetchRfidData = async () => {
    try {
      const response = await axios.get(API_URL);
      setRfidData(response.data.tarjetaRFID || []);
    } catch (error) {
      console.error(error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.text}>UID: {item.uid}</Text>
      <Text style={styles.text}>Fecha: {item.fecha}</Text>
      <Text style={styles.text}>ID: {item.id}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Datos de RFID</Text>
      <Button title="Actualizar" onPress={fetchRfidData} />
      <FlatList
        data={rfidData}
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