import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Button } from 'react-native';
import axios from 'axios';

const API_URL = '/api/datos';

export default function PresenciaScreen() {
  const [presenciaData, setPresenciaData] = useState([]);

  useEffect(() => {
    fetchPresenciaData();
  }, []);

  const fetchPresenciaData = async () => {
    try {
      const response = await axios.get(API_URL);
      setPresenciaData(response.data.controlPresencia || []);
    } catch (error) {
      console.error(error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.text}>Usuario: {item.usuario?.nombre || 'N/A'}</Text>
      <Text style={styles.text}>Entrada: {item.entrada ? 'Sí' : 'No'}</Text>
      <Text style={styles.text}>Fecha: {item.fecha}</Text>
      <Text style={styles.text}>ID: {item.id}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Control de Presencia</Text>
      <Button title="Actualizar" onPress={fetchPresenciaData} />
      <FlatList
        data={presenciaData}
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