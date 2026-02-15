import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL, THEME, USE_MOCK } from '../config';

export default function LuzScreen() {
  const [luzData, setLuzData] = useState([]);
  const [currentLevel, setCurrentLevel] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLuzData();
  }, []);

  const fetchLuzData = async () => {
    setLoading(true);
    try {
      let data = [];
      if (USE_MOCK) {
          data = [
              { id: 1, nivelLuz: 250, fecha: new Date().toISOString() },
              { id: 2, nivelLuz: 100, fecha: new Date(Date.now() - 3600000).toISOString() }
          ];
      } else {
          const response = await axios.get(API_URL + '/datos');
          data = response.data.luz || [];
      }
      
      // Handle case where API returns a single object instead of array
      if (!Array.isArray(data)) {
          data = [data]; 
      }

      // Sort desc by date
      data.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));

      // User requested only the latest value
      const latestData = data.slice(0, 1);
      
      setLuzData(latestData);
      
      if (latestData.length > 0) {
        setCurrentLevel(latestData[0].nivelLuz);
      }
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const getLightIconAndColor = (level) => {
      if (level < 30) return { icon: 'brightness-2', color: '#555' }; // Very dark
      if (level < 100) return { icon: 'brightness-3', color: '#888' }; // Dim
      if (level < 200) return { icon: 'brightness-4', color: '#ccc' }; // Normal
      if (level < 300) return { icon: 'brightness-5', color: '#FFD700' }; // Bright
      return { icon: 'brightness-7', color: '#FFA500' }; // Very bright
  };

  const currentStatus = getLightIconAndColor(currentLevel);

  const renderItem = ({ item }) => {
    const status = getLightIconAndColor(item.nivelLuz);
    return (
      <View style={styles.item}>
        <MaterialCommunityIcons name={status.icon} size={24} color={status.color} style={{ marginRight: 15 }} />
        <View>
            <Text style={styles.itemText}>Nivel: {item.nivelLuz} lux</Text>
            <Text style={styles.itemDate}>{new Date(item.fecha).toLocaleString()}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <MaterialCommunityIcons name={currentStatus.icon} size={80} color={currentStatus.color} />
        <Text style={styles.heroValue}>{currentLevel}</Text>
        <Text style={styles.heroLabel}>Nivel de Luz Actual (Lux)</Text>
      </View>

      <Text style={styles.subtitle}>Historial</Text>

      { loading ? (
        <ActivityIndicator size="large" color={THEME.primary} />
      ) : (
        <FlatList
            data={luzData}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={styles.list}
            refreshing={loading}
            onRefresh={fetchLuzData}
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
  hero: {
    alignItems: 'center',
    marginVertical: 20,
    backgroundColor: THEME.card,
    padding: 30,
    borderRadius: 20,
    ...Platform.select({
      web: {
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.3)',
      },
      default: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
      },
    }),
  },
  heroValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: THEME.text,
    marginTop: 10,
  },
  heroLabel: {
    fontSize: 16,
    color: THEME.textSecondary,
    marginTop: 5,
  },
  subtitle: {
    fontSize: 20,
    color: THEME.text,
    marginTop: 10,
    marginBottom: 15,
    fontWeight: 'bold',
  },
  list: {
    paddingBottom: 20,
  },
  item: {
    backgroundColor: THEME.card,
    padding: 15,
    borderRadius: 10,
    marginVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemText: {
    color: THEME.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemDate: {
    color: '#666',
    fontSize: 12,
  },
});
