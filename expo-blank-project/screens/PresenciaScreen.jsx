import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL, THEME } from '../config';

export default function PresenciaScreen() {
  const [presenciaData, setPresenciaData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPresenciaData();
  }, []);

  const fetchPresenciaData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL + '/datos');
      const data = response.data.presencia || [];
      // Sort desc
      data.sort((a,b) => new Date(b.fechaHora) - new Date(a.fechaHora));
      setPresenciaData(data);
    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const renderItem = ({ item }) => {
    // Determine style based on action type
    const isEntry = item.tipo === 'ENTRADA' && item.accesoPermitido;
    const isDenied = !item.accesoPermitido;
    const color = isDenied ? THEME.danger : (isEntry ? THEME.success : THEME.warning);
    const icon = isDenied ? 'alert-circle' : (item.tipo === 'ENTRADA' ? 'login' : 'logout');

    return (
        <View style={[styles.card, { borderLeftColor: color }]}>
          <View style={styles.iconBox}>
              <MaterialCommunityIcons name={icon} size={30} color={color} />
          </View>
          <View style={styles.infoBox}>
             <Text style={styles.user}>{item.usuario}</Text>
             <Text style={styles.action}>{isDenied ? 'ACCESO DENEGADO' : item.tipo} ({item.metodoAuth})</Text>
             <Text style={styles.date}>{new Date(item.fechaHora).toLocaleString()}</Text>
             { item.detalles ? <Text style={styles.details}>{item.detalles}</Text> : null }
          </View>
        </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bitácora de Accesos</Text>
      { loading ? (
          <ActivityIndicator size="large" color={THEME.primary} />
      ) : (
          <FlatList
            data={presenciaData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshing={loading}
            onRefresh={fetchPresenciaData}
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
  list: {
      paddingBottom: 20
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 15,
    marginVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    borderLeftWidth: 4,
  },
  iconBox: {
      width: 50,
      alignItems: 'center',
      justifyContent: 'center',
  },
  infoBox: {
      flex: 1,
  },
  user: {
      color: THEME.text,
      fontSize: 16,
      fontWeight: 'bold',
  },
  action: {
      color: THEME.textSecondary,
      fontSize: 12,
      textTransform: 'uppercase',
      marginTop: 2,
  },
  date: {
      color: '#666',
      fontSize: 11,
      marginTop: 2
  },
  details: {
      color: THEME.danger,
      fontSize: 11,
      marginTop: 2,
      fontStyle: 'italic'
  }
});
