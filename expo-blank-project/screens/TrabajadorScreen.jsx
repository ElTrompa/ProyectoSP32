import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL, THEME } from '../config';

export default function TrabajadorScreen({ route }) {
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState(route.params?.username || '');
  const [isLoggedIn, setIsLoggedIn] = useState(!!route.params?.username);
  const [filterMode, setFilterMode] = useState(7); // 7 = week, 30 = month, 0 = all, 'day' = specific date
  const [selectedDate, setSelectedDate] = useState(new Date()); // For specific day filter
  
  // Data
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    status: 'UNKNOWN', // IN, OUT, UNKNOWN
    lastActionTime: null,
    hoursToday: 0,
    hoursFiltered: 0,
    totalSessions: 0
  });

  useEffect(() => {
    if (route.params?.username) {
        setUsername(route.params.username);
        fetchWorkerData(route.params.username);
    }
  }, [route.params?.username]);

  // Effect to refetch when filter or date changes IF logged in
  useEffect(() => {
      if(isLoggedIn && username) {
          fetchWorkerData(username);
      }
  }, [filterMode, selectedDate]);

  // Helper to change date
  const changeDate = (days) => {
      const newDate = new Date(selectedDate);
      newDate.setDate(selectedDate.getDate() + days);
      setSelectedDate(newDate);
  };

  // Fetch logic
  const fetchWorkerData = async (overrideUser = null) => {
    const targetUser = typeof overrideUser === 'string' ? overrideUser : username;

    if(!targetUser.trim()) {
        Alert.alert('Error', 'Por favor ingresa un nombre de usuario');
        return;
    }
    
    setLoading(true);
    try {
      // If specific day, we fetch ALL history (dias=0) and filter locally
      // Or if the backend supported ?date=..., we would use that. 
      // Assuming backend only supports dias=X (last X days), fetching all is safer for specific past dates.
      const queryDays = (filterMode === 'day') ? 0 : filterMode;
      
      const filteredReqPromise = axios.get(`${API_URL}/sesiones/usuario/${targetUser}?dias=${queryDays}`);
      const logsReqPromise = axios.get(`${API_URL}/datos`); 

      const [filteredRes, logsRes] = await Promise.all([filteredReqPromise, logsReqPromise]);
      
      let filteredSessions = filteredRes.data || [];
      const rawLogs = logsRes.data.presencia || [];

      // Calculate Hours Filtered
      if (filterMode === 'day') {
          // Client-side filter for the specific date
          const targetDateStr = selectedDate.toDateString();
          filteredSessions = filteredSessions.filter(s => new Date(s.inicio).toDateString() === targetDateStr);
      }
      
      const totalMinutesFiltered = filteredSessions.reduce((sum, s) => sum + (s.duracionMinutos || 0), 0);
      
      // Calculate Logs (Filtrados por usuario y fecha si aplica)
      let userLogs = rawLogs.filter(log => 
          log.usuario && log.usuario.toLowerCase() === targetUser.toLowerCase()
      );
      
      // If 'day' mode, also filter logs by date
      if (filterMode === 'day') {
           const targetDateStr = selectedDate.toDateString();
           userLogs = userLogs.filter(log => new Date(log.fechaHora).toDateString() === targetDateStr);
      }
      
      userLogs.sort((a,b) => new Date(b.fechaHora) - new Date(a.fechaHora));
      setLogs(userLogs);

      // Determine Status (ALWAYS based on current live state, regardless of filter)
      // We need the LATEST log of the user overall, so we go back to rawLogs/totalLogs for that
      // But we can extract it from the 'rawLogs' response if we filter only by user
      const allUserLogs = rawLogs.filter(log => log.usuario && log.usuario.toLowerCase() === targetUser.toLowerCase())
                                 .sort((a,b) => new Date(b.fechaHora) - new Date(a.fechaHora));

      let status = 'UNKNOWN';
      let lastTime = null;

      if (allUserLogs.length > 0) {
          const lastLog = allUserLogs[0];
          const denied = lastLog.accesoPermitido === false || lastLog.accesoPermitido === 0 || lastLog.accesoPermitido === 'false';
          if (!denied) {
              if (lastLog.tipo === 'ENTRADA') status = 'IN';
              else if (lastLog.tipo === 'SALIDA') status = 'OUT';
          }
          lastTime = lastLog.fechaHora;
      }

      setStats({
          status,
          lastActionTime: lastTime,
          hoursToday: 0, // Placeholder
          hoursFiltered: totalMinutesFiltered / 60,
          totalSessions: filteredSessions.length
      });

      setIsLoggedIn(true);
      if (targetUser !== username) setUsername(targetUser);
      
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar los datos.');
    }
    setLoading(false);
  };
  

  const formatTime = (hours) => {
      const h = Math.floor(hours || 0);
      const m = Math.round(((hours || 0) - h) * 60);
      return `${h}h ${m}m`;
  };

  const FilterButton = ({ label, mode }) => (
      <TouchableOpacity 
          style={[styles.filterBtn, filterMode === mode && styles.activeFilterBtn]} 
          onPress={() => {
              // If switching TO day mode, ensure we reset selectedDate to today or keep previous? 
              // keeping previous is fine.
              setFilterMode(mode);
          }}
      >
          <Text style={[styles.filterText, filterMode === mode && styles.activeFilterText]}>{label}</Text>
      </TouchableOpacity>
  );

  if (!isLoggedIn) {
      return (
          <View style={styles.loginContainer}>
              <MaterialCommunityIcons name="account-hard-hat" size={80} color={THEME.primary} />
              <Text style={styles.loginTitle}>Perfil del Trabajador</Text>
               <TextInput 
                  style={styles.input}
                  placeholder="Nombre de Usuario"
                  placeholderTextColor={THEME.textSecondary}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
              />
              <TouchableOpacity style={styles.loginButton} onPress={() => fetchWorkerData()}>
                  {loading ? <ActivityIndicator color="#FFF" /> : <Text style={styles.buttonText}>Consultar</Text>}
              </TouchableOpacity>
          </View>
      );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
          <TouchableOpacity onPress={() => setIsLoggedIn(false)} style={styles.backButton}>
             <MaterialCommunityIcons name="arrow-left" size={24} color={THEME.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Hola, {username}</Text>
          <TouchableOpacity onPress={() => fetchWorkerData()}>
             <MaterialCommunityIcons name="refresh" size={24} color={THEME.primary} />
          </TouchableOpacity>
      </View>

      <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Estado Actual</Text>
          <View style={[styles.statusBadge, { backgroundColor: stats.status === 'IN' ? THEME.success : THEME.secondary }]}>
              <MaterialCommunityIcons name={stats.status === 'IN' ? 'office-building-marker' : 'home-outline'} size={24} color="#FFF" />
              <Text style={styles.statusText}>{stats.status === 'IN' ? 'EN JORNADA' : 'NO TRABAJANDO'}</Text>
          </View>
          {stats.lastActionTime && (
              <Text style={styles.lastActionText}>
                  Último: {new Date(stats.lastActionTime).toLocaleString()}
              </Text>
          )}
      </View>

      {/* Main Filters */}
      <View style={styles.filterContainer}>
          <FilterButton label="Semana" mode={7} />
          <FilterButton label="Mes" mode={30} />
          <FilterButton label="Total" mode={0} />
          <FilterButton label="Día" mode={'day'} />
      </View>

      {/* Date Navigator (Only visible in 'day' mode) */}
      {filterMode === 'day' && (
          <View style={styles.dateNavContainer}>
              <TouchableOpacity onPress={() => changeDate(-1)} style={styles.dateNavButton}>
                  <MaterialCommunityIcons name="chevron-left" size={30} color={THEME.text} />
              </TouchableOpacity>
              
              <View style={styles.dateDisplay}>
                  <Text style={styles.dateDisplayText}>
                      {selectedDate.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                  </Text>
              </View>

              <TouchableOpacity onPress={() => changeDate(1)} style={styles.dateNavButton}>
                  <MaterialCommunityIcons name="chevron-right" size={30} color={THEME.text} />
              </TouchableOpacity>
          </View>
      )}

      <View style={styles.statsGrid}>
          <View style={styles.statBox}>
              <Text style={styles.statValue}>{formatTime(stats.hoursFiltered)}</Text>
              <Text style={styles.statLabel}>
                  {filterMode === 7 ? 'Horas Semana' : (filterMode === 30 ? 'Horas Mes' : (filterMode === 'day' ? 'Horas Día' : 'Horas Total'))}
              </Text>
          </View>
          <View style={styles.statBox}>
              <Text style={styles.statValue}>{stats.totalSessions}</Text>
              <Text style={styles.statLabel}>{filterMode === 'day' ? 'Sesiones Día' : 'Jornadas'}</Text>
          </View>
      </View>

      <Text style={styles.sectionTitle}>
          Historial {filterMode === 'day' ? 'del Día' : (filterMode === 0 ? 'Completo' : `(${filterMode} días)`)}
      </Text>

      <FlatList
          data={logs}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => {
              const denied = item.accesoPermitido === false || item.accesoPermitido === 0 || item.accesoPermitido === 'false';
              const isEntry = item.tipo === 'ENTRADA' && !denied;
              
              return (
                  <View style={[styles.logItem, { borderLeftColor: denied ? THEME.danger : (isEntry ? THEME.success : THEME.warning) }]}>
                      <View>
                          <Text style={styles.logType}>{denied ? 'DENEGADO' : item.tipo}</Text>
                          <Text style={styles.logDate}>{new Date(item.fechaHora).toLocaleString()}</Text>
                      </View>
                       <MaterialCommunityIcons 
                          name={denied ? 'alert' : (isEntry ? 'login' : 'logout')} 
                          size={24} 
                          color={denied ? THEME.danger : (isEntry ? THEME.success : THEME.warning)} 
                      />
                  </View>
              );
          }}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
                {filterMode === 'day' 
                    ? `No hay registros el ${selectedDate.toLocaleDateString()}.` 
                    : 'No hay registros recientes.'}
            </Text>
          }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: THEME.background, padding: 16 },
  loginContainer: { flex: 1, backgroundColor: THEME.background, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loginTitle: { fontSize: 24, fontWeight: 'bold', color: THEME.text, marginTop: 20, marginBottom: 10 },
  loginSubtitle: { fontSize: 16, color: THEME.textSecondary, marginBottom: 40, textAlign: 'center' },
  input: { width: '100%', backgroundColor: THEME.card, padding: 15, borderRadius: 12, color: THEME.text, fontSize: 16, borderWidth: 1, borderColor: THEME.secondary, marginBottom: 20 },
  loginButton: { width: '100%', backgroundColor: THEME.primary, padding: 15, borderRadius: 12, alignItems: 'center' },
  buttonText: { fontWeight: 'bold', color: '#000', fontSize: 16 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: THEME.text },
  backButton: { padding: 5 },
  statusCard: { backgroundColor: THEME.card, padding: 20, borderRadius: 16, marginBottom: 15, alignItems: 'center' },
  statusLabel: { color: THEME.textSecondary, marginBottom: 10, textTransform: 'uppercase', fontSize: 12, letterSpacing: 1 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 50, gap: 10, marginBottom: 10 },
  statusText: { color: '#FFF', fontWeight: 'bold', fontSize: 16 },
  lastActionText: { color: THEME.textSecondary, fontSize: 12 },
  
  filterContainer: { flexDirection: 'row', backgroundColor: THEME.card, borderRadius: 12, padding: 5, marginBottom: 10 },
  filterBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  activeFilterBtn: { backgroundColor: THEME.primary },
  filterText: { color: THEME.textSecondary, fontWeight: 'bold' },
  activeFilterText: { color: '#000' },

  dateNavContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: THEME.card, borderRadius: 12, padding: 10, marginBottom: 20, borderWidth: 1, borderColor: THEME.secondary },
  dateNavButton: { padding: 5 },
  dateDisplay: { flex: 1, alignItems: 'center' },
  dateDisplayText: { fontSize: 16, fontWeight: 'bold', color: THEME.text },

  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25, gap: 10 },
  statBox: { flex: 1, backgroundColor: THEME.card, padding: 15, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: THEME.secondary },
  statValue: { fontSize: 18, fontWeight: 'bold', color: THEME.primary, marginBottom: 5 },
  statLabel: { fontSize: 12, color: THEME.textSecondary },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: THEME.text, marginBottom: 15 },
  logItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: THEME.card, padding: 15, borderRadius: 12, marginBottom: 10, borderLeftWidth: 4 },
  logType: { fontSize: 16, fontWeight: 'bold', color: THEME.text, marginBottom: 4 },
  logDate: { fontSize: 12, color: THEME.textSecondary },
  emptyText: { color: THEME.textSecondary, textAlign: 'center', marginTop: 20 }
});
