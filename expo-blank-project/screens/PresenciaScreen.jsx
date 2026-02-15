import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL, THEME, USE_MOCK } from '../config';

export default function PresenciaScreen() {
  const [presenciaData, setPresenciaData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('ALL'); // ALL, ENTRADA, SALIDA, DENIED

  useEffect(() => {
    fetchPresenciaData();
  }, []);

  useEffect(() => {
    filterData();
  }, [searchQuery, filterType, presenciaData]);

  const filterData = () => {
    let result = presenciaData;

    // Search Query
    if (searchQuery) {
        const lower = searchQuery.toLowerCase();
        result = result.filter(item => 
            (item.usuario && item.usuario.toLowerCase().includes(lower)) || 
            (item.detalles && item.detalles.toLowerCase().includes(lower))
        );
    }

    // Filter Type
    if (filterType !== 'ALL') {
        const isItemDenied = (item) => item.accesoPermitido === false || item.accesoPermitido === 0 || item.accesoPermitido === 'false';

        if (filterType === 'DENIED') {
             result = result.filter(item => isItemDenied(item));
        } else {
             result = result.filter(item => {
                 if (isItemDenied(item)) return false;
                 return item.tipo === filterType;
             });
        }
    }
    setFilteredData(result);
  };

  const fetchPresenciaData = async () => {
    setLoading(true);
    try {
      let data = [];
      if (USE_MOCK) {
          data = [
              { id: 1, usuario: 'admin', fechaHora: new Date().toISOString(), tipo: 'ENTRADA', metodoAuth: 'RFID', accesoPermitido: true },
              { id: 2, usuario: 'juan', fechaHora: new Date(Date.now() - 100000).toISOString(), tipo: 'SALIDA', metodoAuth: 'APP', accesoPermitido: true },
              { id: 3, usuario: 'desconocido', fechaHora: new Date(Date.now() - 200000).toISOString(), tipo: 'ENTRADA', metodoAuth: 'RFID', accesoPermitido: false, detalles: 'Tarjeta no registrada' },
          ];
      } else {
          const response = await axios.get(API_URL + '/datos');
          data = response.data.presencia || [];
      }
      
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
    // Fix: Handle robust boolean checking. item.accesoPermitido might be 1/0, "true"/"false", or boolean.
    // Also handle undefined: If undefined, do NOT assume denied immediately unless we want strict mode. 
    // Given user report "all red", we should only mark denied if explicitly denied or known failure.
    
    const isExplicitlyDenied = item.accesoPermitido === false || item.accesoPermitido === 0 || item.accesoPermitido === 'false';
    
    // If it is NOT explicitly denied, we consider it allowed/entry for coloring purposes if it says 'ENTRADA'
    const isDenied = isExplicitlyDenied; 
    const isEntry = item.tipo === 'ENTRADA' && !isDenied;

    const color = isDenied ? THEME.danger : (isEntry ? THEME.success : THEME.warning);
    const icon = isDenied ? 'alert-circle' : (item.tipo === 'ENTRADA' ? 'login' : 'logout');

    return (
        <View style={[styles.card, { borderLeftColor: color }]}>
          <View style={styles.iconBox}>
              <MaterialCommunityIcons name={icon} size={30} color={color} />
          </View>
          <View style={styles.infoBox}>
             <Text style={styles.user}>{item.usuario}</Text>
             <Text style={styles.action}>
               {isDenied ? 'ACCESO DENEGADO' : (isEntry ? 'ACCESO CORRECTO' : item.tipo)} ({item.metodoAuth})
             </Text>
             <Text style={styles.date}>{new Date(item.fechaHora).toLocaleString()}</Text>
             { item.detalles ? <Text style={[styles.details, { color: isDenied ? THEME.danger : THEME.success }]}>{item.detalles}</Text> : null }
          </View>
        </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bitácora de Accesos</Text>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={24} color="#888" style={styles.searchIcon} />
          <TextInput 
              style={styles.searchInput}
              placeholder="Buscar usuario o detalles..."
              placeholderTextColor="#888"
              value={searchQuery}
              onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <MaterialCommunityIcons name="close-circle" size={20} color="#888" />
              </TouchableOpacity>
          )}
      </View>

      {/* Filter Chips */}
      <View style={styles.filterContainer}>
          {['ALL', 'ENTRADA', 'SALIDA', 'DENIED'].map(type => (
              <TouchableOpacity 
                key={type} 
                style={[styles.filterButton, filterType === type && styles.filterButtonActive]}
                onPress={() => setFilterType(type)}
              >
                  <Text style={[styles.filterText, filterType === type && styles.filterTextActive]}>
                      {type === 'DENIED' ? 'DENEGADO' : (type === 'ALL' ? 'TODOS' : type)}
                  </Text>
              </TouchableOpacity>
          ))}
      </View>

      { loading ? (
          <ActivityIndicator size="large" color={THEME.primary} />
      ) : (
          <FlatList
            data={filteredData}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshing={loading}
            onRefresh={fetchPresenciaData}
            ListEmptyComponent={<Text style={styles.emptyText}>No se encontraron registros.</Text>}
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
    marginBottom: 15,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.card,
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
  },
  searchIcon: {
      marginRight: 10,
  },
  searchInput: {
      flex: 1,
      color: THEME.text,
      fontSize: 16,
  },
  filterContainer: {
      flexDirection: 'row',
      marginBottom: 15,
      justifyContent: 'space-between',
  },
  filterButton: {
      paddingVertical: 8,
      paddingHorizontal: 12,
      borderRadius: 20,
      backgroundColor: THEME.card,
      borderWidth: 1,
      borderColor: 'transparent'
  },
  filterButtonActive: {
      backgroundColor: THEME.primary + '30', // Transparent primary
      borderColor: THEME.primary,
  },
  filterText: {
      color: '#888',
      fontSize: 12,
      fontWeight: '600'
  },
  filterTextActive: {
      color: THEME.primary,
  },
  emptyText: {
      color: '#888',
      textAlign: 'center',
      marginTop: 20,
      fontStyle: 'italic'
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
