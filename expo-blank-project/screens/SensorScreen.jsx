import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, Button, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { API_URL, THEME } from '../config';

export default function SensorScreen() {
  const [sensorData, setSensorData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSensorData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL + '/datos/meteorologia');
      setSensorData(response.data || []);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  useFocusEffect(
    useCallback(() => {
        fetchSensorData();
    }, [])
  );

  const renderHeader = () => {
      if(!sensorData || sensorData.length === 0) return null;
      // Because we changed backend to only return the latest ONE, list[0] is the current state
      // If we revert backend to all, we take [0] or sort. 
      // Assuming user wants "Latest" big and "History" small, but since API now returns only latest...
      // wait, user asked for "latest" previously.
      // If I want charts I need history. But let's stick to what we have.
      
      const latest = sensorData[0] || {};
      
      return (
        <View style={styles.heroContainer}>
            <View style={styles.heroCard}>
                <MaterialCommunityIcons name="thermometer" size={48} color={THEME.danger} />
                <Text style={styles.heroValue}>{latest.temperatura}C</Text>
                <Text style={styles.heroLabel}>Temperatura Actual</Text>
            </View>
            
            <View style={styles.heroCard}>
                <MaterialCommunityIcons name="water-percent" size={48} color={THEME.primary} />
                <Text style={styles.heroValue}>{latest.humedad}%</Text>
                <Text style={styles.heroLabel}>Humedad Actual</Text>
            </View>
        </View>
      );
  };

  const renderItem = ({ item }) => (
    <View style={styles.item}>
      <View style={styles.row}>
         <MaterialCommunityIcons name="clock-outline" size={16} color={THEME.textSecondary} />
         <Text style={styles.date}>{new Date(item.fecha).toLocaleString()}</Text>
      </View>
      <View style={styles.row}>
          <Text style={styles.detail}>Temp: {item.temperatura}C</Text>
          <Text style={styles.detail}>Hum: {item.humedad}%</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Estado Ambiental</Text>
      { loading ? (
          <ActivityIndicator size="large" color={THEME.primary} style={{marginTop: 50}} />
      ) : (
          <FlatList
            data={sensorData}
            ListHeaderComponent={renderHeader}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshing={loading}
            onRefresh={fetchSensorData}
          />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: THEME.text,
    marginBottom: 20,
    fontWeight: 'bold',
  },
  heroContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 30,
  },
  heroCard: {
      backgroundColor: THEME.card,
      width: '48%',
      padding: 20,
      borderRadius: 15,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: THEME.secondary,
  },
  heroValue: {
      fontSize: 32,
      fontWeight: 'bold',
      color: THEME.text,
      marginVertical: 10,
  },
  heroLabel: {
      color: THEME.textSecondary,
      fontSize: 12,
  },
  item: {
    backgroundColor: THEME.card,
    padding: 15,
    marginVertical: 5,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: THEME.primary
  },
  row: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 5
  },
  date: {
      color: THEME.textSecondary,
      marginLeft: 5,
      fontSize: 12
  },
  detail: {
      color: THEME.text,
      marginRight: 15,
      fontSize: 16,
      fontWeight: '500'
  },
  list: {
      paddingBottom: 20,
  }
});
