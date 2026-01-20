import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import { API_URL, THEME } from '../config';

export default function HomeScreen() {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    temp: '--',
    users: 0,
    lastAccess: 'N/A'
  });

  const fetchStats = async () => {
    try {
      // Fetch data concurrently
      const [sensorRes, usersRes, presenciaRes] = await Promise.all([
        axios.get(API_URL + '/datos/meteorologia'),
        axios.get(API_URL + '/usuarios'),
        axios.get(API_URL + '/datos/presencia')
      ]);

      // Process Temp
      let temp = '--';
      if (sensorRes.data && sensorRes.data.length > 0) {
         // Sort by date desc just in case
         // Check if data is array inside array or object? Usually List<Metereologia>
         const sorted = sensorRes.data.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
         if (sorted.length > 0) temp = sorted[0].temperatura;
      }

      // Process Users
      const usersCount = usersRes.data ? usersRes.data.length : 0;

      // Process Last Access
      let lastAccess = 'Sin registros';
      if (presenciaRes.data && presenciaRes.data.length > 0) {
          const sorted = presenciaRes.data.sort((a,b) => new Date(b.fechaHora) - new Date(a.fechaHora));
          if (sorted.length > 0) {
            const last = sorted[0];
            lastAccess = new Date(last.fechaHora).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          }
      }

      setStats({ temp, users: usersCount, lastAccess });

    } catch (error) {
      console.error("Dashboard fetch error:", error);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStats().finally(() => setRefreshing(false));
  }, []);

  useEffect(() => {
    fetchStats();
  }, []);

  const DashboardCard = ({ icon, title, value, color, onPress }) => (
      <TouchableOpacity style={styles.card} onPress={onPress}>
          <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
              <MaterialCommunityIcons name={icon} size={32} color={color} />
          </View>
          <View>
              <Text style={styles.cardTitle}>{title}</Text>
              <Text style={styles.cardValue}>{value}</Text>
          </View>
      </TouchableOpacity>
  );

  return (
    <ScrollView 
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={THEME.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Panel de Control</Text>
        <Text style={styles.subGreeting}>Resumen del Sistema</Text>
      </View>

      <View style={styles.grid}>
          <DashboardCard 
            icon="thermometer" 
            title="Temperatura" 
            value={`${stats.temp}C`} 
            color="#FF6B6B"
            onPress={() => navigation.navigate('Sensor')} 
          />
          <DashboardCard 
            icon="account-group" 
            title="Usuarios" 
            value={stats.users} 
            color="#4ECDC4"
            onPress={() => navigation.navigate('Usuario')} 
          />
          <DashboardCard 
            icon="clock-outline" 
            title="Último Acceso" 
            value={stats.lastAccess} 
            color="#FFE66D"
            onPress={() => navigation.navigate('Presencia')} 
          />
      </View>

      <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acceso Rápido</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Luz')}>
              <MaterialCommunityIcons name="white-balance-sunny" size={24} color={THEME.text} />
              <Text style={styles.actionText}>Monitor de Luz</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color={THEME.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('RFID')}>
              <MaterialCommunityIcons name="smart-card" size={24} color={THEME.text} />
              <Text style={styles.actionText}>Registros RFID</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color={THEME.textSecondary} />
          </TouchableOpacity>
           <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AllData')}>
              <MaterialCommunityIcons name="database-search" size={24} color={THEME.text} />
              <Text style={styles.actionText}>Registro Maestro</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color={THEME.textSecondary} />
          </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
    color: THEME.text,
  },
  subGreeting: {
    fontSize: 16,
    color: THEME.textSecondary,
    marginTop: 5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 15,
    margin: 5,
    width: '47%', // roughly half
    minHeight: 120,
    justifyContent: 'space-between',
  },
  iconContainer: {
      width: 50,
      height: 50,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
  },
  cardTitle: {
      color: THEME.textSecondary,
      fontSize: 12,
      textTransform: 'uppercase',
  },
  cardValue: {
      color: THEME.text,
      fontSize: 22,
      fontWeight: 'bold',
      marginTop: 2,
  },
  section: {
      padding: 20,
  },
  sectionTitle: {
      color: THEME.text,
      fontSize: 20,
      fontWeight: 'bold',
      marginBottom: 15,
  },
  actionBtn: {
      backgroundColor: THEME.card,
      padding: 15,
      borderRadius: 12,
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 10,
  },
  actionText: {
      flex: 1,
      color: THEME.text,
      fontSize: 16,
      marginLeft: 15,
  }
});
