import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Platform } from 'react-native';
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Buenos Días';
    if (hour < 18) return 'Buenas Tardes';
    return 'Buenas Noches';
  };

  const fetchStats = async () => {
    try {
      // Fetch all data from single endpoint to avoid 404s on individual routes
      const response = await axios.get(API_URL + '/datos');
      const data = response.data || {};

      const meteorologia = data.meteorologia || [];
      const usuarios = data.usuarios || [];
      const presencia = data.presencia || [];

      // Process Temp
      let temp = '--';
      if (meteorologia.length > 0) {
         const sorted = meteorologia.sort((a,b) => new Date(b.fecha) - new Date(a.fecha));
         if (sorted.length > 0) temp = sorted[0].temperatura;
      }

      // Process Users
      const usersCount = usuarios.length;

      // Process Last Access
      let lastAccess = 'Sin registros';
      if (presencia.length > 0) {
          const sorted = presencia.sort((a,b) => new Date(b.fechaHora) - new Date(a.fechaHora));
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
    
    const interval = setInterval(fetchStats, 10000); // Auto-refresh every 10 seconds
    return () => clearInterval(interval);
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
        <View>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.subGreeting}>Sistema de Monitoreo Activo</Text>
        </View>
        <View style={styles.avatarContainer}>
           <MaterialCommunityIcons name="robot" size={30} color={THEME.primary} />
        </View>
      </View>

      <View style={styles.grid}>
          <DashboardCard 
            icon="thermometer" 
            title="Temp. Actual" 
            value={stats.temp !== '--' ? `${parseFloat(stats.temp).toFixed(1)}°C` : '--'} 
            color={THEME.danger}
            onPress={() => navigation.navigate('Sensor')} 
          />
          <DashboardCard 
            icon="account-group" 
            title="Usuarios Reg." 
            value={stats.users} 
            color={THEME.accent}
            onPress={() => navigation.navigate('Usuario')} 
          />
          <DashboardCard 
            icon="clock-outline" 
            title="Último Acceso" 
            value={stats.lastAccess} 
            color={THEME.warning}
            onPress={() => navigation.navigate('Presencia')} 
          />
           <DashboardCard 
            icon="database-eye" 
            title="Estado DB" 
            value={"Online"} 
            color={THEME.success}
            onPress={() => navigation.navigate('AllData')} 
          />
      </View>

      <View style={styles.section}>
          <Text style={styles.sectionTitle}>Acceso Rápido</Text>
          <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('Trabajador')}>
              <MaterialCommunityIcons name="account-hard-hat" size={24} color={THEME.text} />
              <Text style={styles.actionText}>Portal del Trabajador</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color={THEME.textSecondary} />
          </TouchableOpacity>
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
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 28,
    fontWeight: '800', // Bolder
    color: THEME.text,
    letterSpacing: 0.5,
  },
  subGreeting: {
    fontSize: 14,
    color: THEME.textSecondary,
    marginTop: 5,
    fontWeight: '500',
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: THEME.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: THEME.secondary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 20, // More rounded
    padding: 18,
    marginVertical: 8,
    width: '48%', 
    minHeight: 140,
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: THEME.secondary,
    ...Platform.select({
       web: { boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)' },
       default: { elevation: 4, shadowColor: '#000', shadowOffset: {width:0, height:2}, shadowOpacity:0.2, shadowRadius:3 }
    })
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
