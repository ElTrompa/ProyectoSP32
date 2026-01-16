import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, Button } from 'react-native';
import axios from 'axios';

const API_URL = 'http://10.245.113.62:8080/api/datos';

export default function AllDataScreen() {
  const [allData, setAllData] = useState([]);

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    console.log('Fetching all data');
    try {
      const response = await axios.get(API_URL);
      console.log('Response data:', response.data);
      const data = response.data;
      const formattedData = [];

      if (data.luz) {
        data.luz.forEach(item => formattedData.push({ ...item, type: 'Luz' }));
      }
      if (data.metereologia) {
        data.metereologia.forEach(item => formattedData.push({ ...item, type: 'Sensor' }));
      }
      if (data.tarjetaRFID) {
        data.tarjetaRFID.forEach(item => formattedData.push({ ...item, type: 'RFID' }));
      }
      if (data.usuario) {
        data.usuario.forEach(item => formattedData.push({ ...item, type: 'Usuario' }));
      }
      if (data.controlPresencia) {
        data.controlPresencia.forEach(item => formattedData.push({ ...item, type: 'Presencia' }));
      }

      setAllData(formattedData);
      console.log('All data set:', formattedData);
    } catch (error) {
      console.error('Error fetching all data:', error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <Text style={styles.type}>{item.type}</Text>
      {item.type === 'Luz' && (
        <>
          <Text style={styles.text}>Iluminación: {item.iluminadad ? 'Encendida' : 'Apagada'}</Text>
          <Text style={styles.text}>Fecha: {item.fecha}</Text>
        </>
      )}
      {item.type === 'Sensor' && (
        <>
          <Text style={styles.text}>Temperatura: {item.temperatura}°C</Text>
          <Text style={styles.text}>Humedad: {item.humedad}%</Text>
          <Text style={styles.text}>Fecha: {item.fecha}</Text>
        </>
      )}
      {item.type === 'RFID' && (
        <>
          <Text style={styles.text}>UID: {item.uid}</Text>
          <Text style={styles.text}>Fecha: {item.fecha}</Text>
        </>
      )}
      {item.type === 'Usuario' && (
        <>
          <Text style={styles.text}>Nombre: {item.nombre}</Text>
          <Text style={styles.text}>Email: {item.email}</Text>
        </>
      )}
      {item.type === 'Presencia' && (
        <>
          <Text style={styles.text}>Usuario: {item.usuario?.nombre || 'N/A'}</Text>
          <Text style={styles.text}>Entrada: {item.entrada ? 'Sí' : 'No'}</Text>
          <Text style={styles.text}>Fecha: {item.fecha}</Text>
        </>
      )}
      <Text style={styles.text}>ID: {item.id}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Todos los Datos</Text>
      <Button title="Actualizar" onPress={fetchAllData} />
      <FlatList
        data={allData}
        renderItem={renderItem}
        keyExtractor={(item) => `${item.type}-${item.id}`}
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
  type: {
    fontSize: 18,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 5,
  },
  text: {
    color: '#fff',
  },
});