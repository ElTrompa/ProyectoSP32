import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL, THEME, USE_MOCK } from '../config';

export default function RFIDScreen() {
  const [rfidData, setRfidData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRfidData();
  }, []);

  const fetchRfidData = async () => {
    setLoading(true);
    try {
      let data = [];
      if (USE_MOCK) {
          data = [
              { id: 1, uid: 'E2 45 A1 00', fecha: new Date().toISOString() },
              { id: 2, uid: 'A1 B2 C3 D4', fecha: new Date(Date.now() - 3600000).toISOString() },
          ];
      } else {
          const response = await axios.get(API_URL + '/datos');
          data = response.data.rfid || [];
      }

      // Sort desc
      data.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
      setRfidData(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="smart-card" size={32} color={THEME.primary} />
      </View>
      <View style={styles.infoContainer}>
          <Text style={styles.uid}>UID: {item.uid}</Text>
          <Text style={styles.meta}>Escaneado el: {new Date(item.fecha).toLocaleString()}</Text>
      </View>
      <MaterialCommunityIcons name="check-circle-outline" size={24} color={THEME.success} />
    </View>
  );

  return (
    <View style={styles.container}>
        <View style={styles.header}>
            <Text style={styles.title}>Escaneos RFID</Text>
            <Text style={styles.subtitle}>Registro crudo de tarjetas detectadas</Text>
        </View>

        { loading ? (
             <ActivityIndicator size="large" color={THEME.primary} />
        ) : (
            <FlatList
                data={rfidData}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshing={loading}
                onRefresh={fetchRfidData}
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
  header: {
      marginBottom: 20,
  },
  title: {
    fontSize: 24,
    color: THEME.text,
    fontWeight: 'bold',
  },
  subtitle: {
      color: THEME.textSecondary,
      marginTop: 5,
  },
  list: {
      paddingBottom: 20,
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 15,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333'
  },
  iconContainer: {
      marginRight: 15,
      padding: 10,
      backgroundColor: 'rgba(0, 228, 192, 0.1)', // Light primary color
      borderRadius: 50,
  },
  infoContainer: {
      flex: 1,
  },
  uid: {
      fontSize: 18,
      fontWeight: 'bold',
      color: THEME.text,
      fontFamily: 'monospace', // Looks like a code/ID
  },
  meta: {
      fontSize: 12,
      color: '#666',
      marginTop: 4
  }
});
