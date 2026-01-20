import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL, THEME } from '../config';

export default function AllDataScreen() {
  const [dataList, setDataList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL'); // ALL, SENSOR, ACCESS, SYSTEM

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_URL + '/datos');
      const raw = response.data;
      
      // Flatten all data into a single timeline
      let unified = [];

      // Meteorologia
      if (raw.meteorologia) {
          unified = unified.concat(raw.meteorologia.map(i => ({ 
              ...i, type: 'METEO', dateObj: new Date(i.fecha) 
          })));
      }
      // Luz
      if (raw.luz) {
        unified = unified.concat(raw.luz.map(i => ({
            ...i, type: 'LUZ', dateObj: new Date(i.fecha)
        })));
      }
      // RFID
      if (raw.rfid) {
        unified = unified.concat(raw.rfid.map(i => ({
            ...i, type: 'RFID', dateObj: new Date(i.fecha)
        })));
      }
      // Presencia
      if (raw.presencia) {
        unified = unified.concat(raw.presencia.map(i => ({
            ...i, type: 'ACCESS', dateObj: new Date(i.fechaHora)
        })));
      }

      // Sort Global Descending
      unified.sort((a,b) => b.dateObj - a.dateObj);
      setDataList(unified);

    } catch (error) {
      console.error(error);
    }
    setLoading(false);
  };

  const getTypeStyle = (type) => {
      switch(type) {
          case 'METEO': return { icon: 'thermometer', color: '#4facfe', label: 'Clima' };
          case 'LUZ': return { icon: 'brightness-6', color: '#f093fb', label: 'Luz' };
          case 'RFID': return { icon: 'credit-card-scan', color: '#a8edea', label: 'RFID' };
          case 'ACCESS': return { icon: 'shield-account', color: '#f6d365', label: 'Acceso' };
          default: return { icon: 'cube', color: '#ccc', label: 'Otro' };
      }
  };

  const renderItem = ({ item }) => {
      const style = getTypeStyle(item.type);
      
      let detailText = "";
      if (item.type === 'METEO') detailText = `Temp: ${item.temperatura}C | Hum: ${item.humedad}%`;
      else if (item.type === 'LUZ') detailText = `Nivel: ${item.nivelLuz}`;
      else if (item.type === 'RFID') detailText = `UID: ${item.uid}`;
      else if (item.type === 'ACCESS') detailText = `${item.usuario} - ${item.tipo}`;

      return (
          <View style={[styles.card, { borderLeftColor: style.color }]}>
              <View style={styles.headerRow}>
                <View style={[styles.badge, { backgroundColor: style.color + '20' }]}>
                    <MaterialCommunityIcons name={style.icon} size={14} color={style.color} />
                    <Text style={[styles.badgeText, { color: style.color }]}>{style.label}</Text>
                </View>
                <Text style={styles.date}>{item.dateObj.toLocaleString()}</Text>
              </View>
              <Text style={styles.detail}>{detailText}</Text>
          </View>
      );
  };

  return (
    <View style={styles.container}>
        <Text style={styles.title}>Registro Maestro</Text>
        
        { loading ? (
             <ActivityIndicator size="large" color={THEME.primary} />
        ) : (
            <FlatList
                data={dataList}
                keyExtractor={(item, index) => index.toString()}
                renderItem={renderItem}
                contentContainerStyle={styles.list}
                refreshing={loading}
                onRefresh={fetchAllData}
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
      fontWeight: 'bold',
      color: THEME.text,
      marginBottom: 20,
  },
  list: {
      paddingBottom: 20,
  },
  card: {
      backgroundColor: THEME.card,
      padding: 15,
      borderRadius: 10,
      marginBottom: 10,
      borderLeftWidth: 4,
  },
  headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8,
  },
  badge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 4,
  },
  badgeText: {
      marginLeft: 4,
      fontSize: 12,
      fontWeight: 'bold',
  },
  date: {
      color: THEME.textSecondary,
      fontSize: 12,
  },
  detail: {
      color: THEME.text,
      fontSize: 16,
  }
});
