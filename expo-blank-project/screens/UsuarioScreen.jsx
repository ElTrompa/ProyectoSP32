import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Switch, TouchableOpacity, Alert, Modal, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL, THEME, MOTIVES, USE_MOCK } from '../config';

const { width } = Dimensions.get('window');

// Motive colors mapping helper
const getMotiveStyle = (type) => {
    const upperType = type?.toUpperCase();
    return MOTIVES[upperType] || { color: '#ccc', icon: 'circle-outline' };
};

const defaultSchedule = {
    "Lunes": "09:00 - 18:00",
    "Martes": "09:00 - 18:00",
    "Miércoles": "09:00 - 18:00",
    "Jueves": "09:00 - 18:00",
    "Viernes": "09:00 - 15:00",
    "Sábado": "Descanso",
    "Domingo": "Descanso"
};

export default function UsuarioScreen() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [attendanceMap, setAttendanceMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentWeekStart, setCurrentWeekStart] = useState(new Date()); 
  
  // Registration/Edit State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null); // If null -> create, else -> edit
  const [newUser, setNewUser] = useState({ username: '', password: '', rfidToken: '', isAdmin: false });

  // Schedule State
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [scheduleModalVisible, setScheduleModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState({...defaultSchedule});

  // Day Detail State
  const [dayDetailVisible, setDayDetailVisible] = useState(false);
  const [dayDetailData, setDayDetailData] = useState({ worker: '', date: '', events: [] });

  useEffect(() => {
    // Set current week start to Monday
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));
    setCurrentWeekStart(monday);

    fetchAllData();
  }, []);

  useEffect(() => {
    if(!searchQuery.trim()) {
        setFilteredUsers(users);
    } else {
        const lower = searchQuery.toLowerCase();
        setFilteredUsers(users.filter(u => u.username && u.username.toLowerCase().includes(lower)));
    }
  }, [searchQuery, users]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      let raw = {};
      if (USE_MOCK) {
         raw = {
             usuarios: [
                 { _id: '1', username: 'admin', rol: 'admin', isAdmin: true, rfidToken: '1234' },
                 { _id: '2', username: 'juan_perez', rol: 'trabajador', isAdmin: false, rfidToken: '5678' }
             ],
             presencia: [
                 { usuario: 'juan_perez', fechaHora: new Date().toISOString(), tipo: 'ENTRADA' }
             ]
         };
      } else {
         const response = await axios.get(API_URL + '/datos');
         raw = response.data;
      }
      
      const userList = raw.usuarios || [];
      const attMap = {};
      
      if (raw.presencia) {
          raw.presencia.forEach(log => {
              if(!log.usuario) return;
              const dateKey = new Date(log.fechaHora).toDateString();
              const userKey = log.usuario.toLowerCase();
              if(!attMap[userKey]) attMap[userKey] = {};
              if(!attMap[userKey][dateKey]) attMap[userKey][dateKey] = [];
              attMap[userKey][dateKey].push(log);
          });
      }

      setUsers(userList);
      setAttendanceMap(attMap);
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    }
    setLoading(false);
  };

  // Helper Functions
  const stringToHex = (str) => {
    let hex = '';
    for (let i = 0; i < str.length; i++) {
        hex += str.charCodeAt(i).toString(16).toUpperCase().padStart(2, '0');
    }
    hex += '00'; 
    return hex;
  };

  const addDays = (date, days) => {
      const result = new Date(date);
      result.setDate(result.getDate() + days);
      return result;
  };

  const getWeekDays = (start) => {
      const days = [];
      for(let i=0; i<7; i++) {
          const d = new Date(start);
          d.setDate(start.getDate() + i);
          days.push(d);
      }
      return days;
  };

  const handlePrevWeek = () => setCurrentWeekStart(addDays(currentWeekStart, -7));
  const handleNextWeek = () => setCurrentWeekStart(addDays(currentWeekStart, 7));
if (USE_MOCK) {
            Alert.alert('Éxito (Mock)', 'Usuario guardado/registrado');
            setModalVisible(false);
            setNewUser({ username: '', password: '', rfidToken: '', isAdmin: false });
            setEditingUser(null);
            fetchAllData(); 
            return;
        }

        
  const handleSaveUser = async () => {
    if(!newUser.username) {
        Alert.alert('Error', 'El nombre de usuario es obligatorio');
        return;
    }
    // For CREATE, password is required. For EDIT, it's optional (if empty, don't update).
    if(!editingUser && !newUser.password) {
        Alert.alert('Error', 'La contraseña es obligatoria para nuevos usuarios');
        return;
    }

    try {
        const payload = {
            username: newUser.username,
            // If editing and password field is empty -> do not send or send empty logic handled by backend?
            // Usually backend ignores if missing. If we send empty string, backend should check.
            // My proposed backend (GUIA_CAMBIOS_BD.md) says: "if (password && password.trim() !== '') updateData.password = ..."
            // So we can send it as is.
            password: newUser.password ? stringToHex(newUser.password) : '', 
            rfidToken: newUser.rfidToken,
            rol: newUser.isAdmin ? 'admin' : 'usuario',
            isAdmin: newUser.isAdmin
        };

        let res;
        if(editingUser) {
            // EDIT / PUT
            // Assuming editingUser has an _id or id
            const userId = editingUser._id || editingUser.id;
            res = await axios.put(`${API_URL}/usuarios/${userId}`, payload);
            Alert.alert('Éxito', 'Usuario actualizado correctamente');
        } else {
            // CREATE / POST
            res = await axios.post(`${API_URL}/usuarios/registrar`, payload);
            Alert.alert('Éxito', typeof res.data === 'string' ? res.data : 'Usuario registrado');
        }

        setModalVisible(false);
        setNewUser({ username: '', password: '', rfidToken: '', isAdmin: false });
        setEditingUser(null);
        fetchAllData();

    } catch (error) {
        console.error(error);
        Alert.alert('Error', 'Falló la operación: ' + (error.response?.data || error.message));
    }
  };

  const openNewUserModal = () => {
      setEditingUser(null);
      setNewUser({ username: '', password: '', rfidToken: '', isAdmin: false });
      setModalVisible(true);
  };

  const openEditUserModal = (user) => {
      setEditingUser(user);
      // Determine isAdmin from existing data
      const isAdmin = (user.rol === 'admin' || user.isAdmin === true);
      
      setNewUser({ 
          username: user.username, 
          password: '', // Leave blank on edit to avoid rehashing issues
          rfidToken: user.rfidToken || '', 
          isAdmin: isAdmin 
      });
      setModalVisible(true);
  };
  
  const handleDelete = (id, username) => {
    if (USE_MOCK) {
        Alert.alert("Eliminado (Mock)", "Usuario eliminado");
        fetchAllData();
        return;
    }
    
    Alert.alert(
      "Confirmar Eliminación",
      `¿Eliminar al usuario ${username}?`,
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${API_URL}/usuarios/${id}`);
              Alert.alert("Eliminado", "Usuario eliminado");
              fetchAllData();
            } catch (error) {
               console.error("Delete error", error);
               Alert.alert("Error", "No se pudo eliminar");
            }
          }
        }
      ]
    );
  };

  const openSchedule = (worker) => {
      setSelectedWorker(worker);
      // Load existing schedule or default. Ensure we have a clone to edit.
      const current = worker.horario || defaultSchedule;
      // In case worker.horario is missing keys
      setEditingSchedule({ ...defaultSchedule, ...current });
      setScheduleModalVisible(true);
  };

  const handleSaveSchedule = async () => {
        if(!selectedWorker) return;

        if (USE_MOCK) {
            Alert.alert('Éxito (Mock)', 'Horario actualizado');
            setScheduleModalVisible(false);
            return;
        }

        try {
            const userId = selectedWorker._id || selectedWorker.id;
            await axios.put(`${API_URL}/usuarios/${userId}`, { horario: editingSchedule });
            Alert.alert('Éxito', 'Horario actualizado');
            setScheduleModalVisible(false);
            fetchAllData(); 
        } catch(e) {
             console.error(e);
            Alert.alert('Error', 'No se pudo guardar horario');
        }
  };
  
  const handleDayPress = (worker, date) => {
      const dateKey = date.toDateString();
      const userKey = worker.username.toLowerCase();
      const events = (attendanceMap[userKey] && attendanceMap[userKey][dateKey]) || [];
      
      if (events.length === 0) return; 

      setDayDetailData({
          worker: worker.username,
          date: date.toLocaleDateString(),
          events: events.sort((a,b) => new Date(a.fechaHora) - new Date(b.fechaHora)) 
      });
      setDayDetailVisible(true);
  };

  // Render Helpers
  const renderDayCell = (worker, dayDate) => {
      const dateKey = dayDate.toDateString();
      const userKey = worker.username.toLowerCase();
      const events = (attendanceMap[userKey] && attendanceMap[userKey][dateKey]) || [];
      const hasActivity = events.length > 0;

      return (
          <TouchableOpacity 
            style={styles.cell} 
            onPress={() => handleDayPress(worker, dayDate)}
            disabled={!hasActivity}
          >
              {hasActivity ? (
                  <MaterialCommunityIcons name="check-circle" size={20} color={THEME.success} /> 
              ) : (
                  <Text style={styles.dash}>-</Text>
              )}
          </TouchableOpacity>
      );
  };

  const renderWorkerRow = ({ item }) => {
      const weekDays = getWeekDays(currentWeekStart);
      return (
          <View style={styles.row}>
              <View style={styles.userColumn}>
                  <Text style={styles.userName}>{item.username}</Text>
                  
                  {/* Action Buttons Row */}
                  <View style={{flexDirection: 'row', gap: 5, marginTop: 4}}>
                    <TouchableOpacity onPress={() => openSchedule(item)} style={styles.btnSmall}>
                        <MaterialCommunityIcons name="calendar-clock" size={14} color={THEME.primary} />
                    </TouchableOpacity>

                    {isEditMode ? (
                        <TouchableOpacity 
                            onPress={() => openEditUserModal(item)} 
                            style={[styles.btnSmall, { backgroundColor: '#3B82F6' }]} // Blue for Edit
                        >
                            <MaterialCommunityIcons name="pencil" size={14} color="#FFF" />
                        </TouchableOpacity>
                    ) : (
                        <TouchableOpacity 
                            onPress={() => handleDelete(item._id || item.id, item.username)} 
                            style={[styles.btnSmall, { backgroundColor: THEME.danger + '80' }]} // Red for Delete
                        >
                            <MaterialCommunityIcons name="trash-can" size={14} color="#FFF" />
                        </TouchableOpacity>
                    )}
                  </View>

              </View>
              {weekDays.map((day, idx) => (
                   <View key={idx} style={styles.dayColumn}>
                       {renderDayCell(item, day)}
                   </View>
              ))}
          </View>
      );
  };

  const weekDays = currentWeekStart ? getWeekDays(currentWeekStart) : [];
  const dayLabels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom'];

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
          <View>
            <Text style={styles.screenTitle}>Panel de Administración</Text>
            <Text style={styles.screenSubtitle}>Gestión de Personal y Asistencia</Text>
          </View>
          <View style={{flexDirection: 'row', gap: 10}}>
              <TouchableOpacity 
                style={[styles.addButton, { backgroundColor: isEditMode ? THEME.warning : THEME.secondary }]} 
                onPress={() => setIsEditMode(!isEditMode)}
              >
                  <MaterialCommunityIcons name={isEditMode ? "pencil-off" : "pencil"} size={20} color={isEditMode ? '#000' : THEME.text} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.addButton} onPress={openNewUserModal}>
                  <MaterialCommunityIcons name="account-plus" size={20} color={'#000'} />
                  <Text style={styles.addButtonText}>Nuevo</Text>
              </TouchableOpacity>
          </View>
      </View>
      
      {/* Search Bar */}
      <View style={styles.searchContainer}>
          <MaterialCommunityIcons name="magnify" size={20} color={THEME.textSecondary} style={{marginRight: 8}} />
          <TextInput 
              style={styles.searchInput}
              placeholder="Buscar trabajador..."
              placeholderTextColor={THEME.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
          />
      </View>

      <View style={styles.weekControl}>
            <TouchableOpacity onPress={handlePrevWeek}>
                <MaterialCommunityIcons name="chevron-left" size={30} color={THEME.text} />
            </TouchableOpacity>
            <Text style={styles.weekTitle}>
                {weekDays.length > 0 ? `Semana ${weekDays[0].getDate()} - ${weekDays[6].getDate()} ${weekDays[0].toLocaleString('default', { month: 'short' })}` : '...'}
            </Text>
            <TouchableOpacity onPress={handleNextWeek}>
                <MaterialCommunityIcons name="chevron-right" size={30} color={THEME.text} />
            </TouchableOpacity>
      </View>

      <View style={styles.legend}>
            {Object.values(MOTIVES).map((m, i) => (
                <View key={i} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: m.color }]} />
                    <Text style={styles.legendText}>{m.label}</Text>
                </View>
            ))}
      </View>

      <View style={styles.tableHeader}>
            <View style={styles.userColumnHeader}><Text style={styles.columnHeaderText}>Trabajador</Text></View>
            {dayLabels.map((d, i) => (
                <View key={i} style={styles.dayColumnHeader}>
                    <Text style={styles.columnHeaderText}>{d}</Text>
                    <Text style={styles.columnDateText}>{weekDays.length > 0 ? weekDays[i].getDate() : ''}</Text>
                </View>
            ))}
      </View>

      {loading ? (
          <ActivityIndicator size="large" color={THEME.primary} style={{ marginTop: 50 }}/>
      ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item._id || item.username}
            renderItem={renderWorkerRow}
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={<Text style={styles.emptyText}>No encontrados</Text>}
          />
      )}

      {/* Register/Edit Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}</Text>

            <Text style={styles.label}>Usuario:</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre"
              placeholderTextColor={THEME.text + '50'}
              value={newUser.username}
              onChangeText={(text) => setNewUser({...newUser, username: text})}
            />

            <Text style={styles.label}>PIN (Contraseña):</Text>
            <TextInput
              style={styles.input}
              placeholder={editingUser ? "Dejar en blanco para mantener" : "8 dígitos máx"}
              placeholderTextColor={THEME.text + '50'}
              value={newUser.password}
              keyboardType="numeric"
              maxLength={8}
              onChangeText={(text) => setNewUser({...newUser, password: text})}
            />

             <Text style={styles.label}>RFID:</Text>
            <TextInput
              style={styles.input}
              placeholder="UID Tarjeta"
              placeholderTextColor={THEME.text + '50'}
              value={newUser.rfidToken}
              onChangeText={(text) => setNewUser({...newUser, rfidToken: text})}
            />

             <View style={styles.switchContainer}>
                <Text style={styles.label}>¿Es Admin?</Text>
                <Switch 
                     trackColor={{ false: "#767577", true: THEME.primary }}
                     thumbColor={newUser.isAdmin ? "#f5dd4b" : "#f4f3f4"}
                     value={newUser.isAdmin}
                     onValueChange={(val) => setNewUser({...newUser, isAdmin: val})}
                />
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: THEME.danger }]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.modalButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: THEME.success }]} 
                onPress={handleSaveUser}
              >
                <Text style={styles.modalButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Schedule Modal */}
        <Modal
            visible={scheduleModalVisible}
            transparent={true}
            animationType="slide"
            onRequestClose={() => setScheduleModalVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { height: 'auto' }]}>
                    <Text style={styles.modalTitle}>Horario: {selectedWorker?.username}</Text>
                    <Text style={styles.modalSubtitle}>Editar Agenda Semanal</Text>
                    
                    <View style={styles.scheduleList}>
                        {Object.keys(defaultSchedule).map(day => (
                            <View key={day} style={styles.scheduleRow}>
                                <Text style={styles.scheduleDay}>{day}</Text>
                                <TextInput
                                    style={styles.scheduleInput}
                                    value={editingSchedule[day]}
                                    onChangeText={(text) => setEditingSchedule(prev => ({...prev, [day]: text}))}
                                    placeholder="09:00 - 18:00"
                                    placeholderTextColor="#555"
                                />
                            </View>
                        ))}
                    </View>

                    <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, gap: 10}}>
                        <TouchableOpacity 
                            style={[styles.closeButton, { backgroundColor: THEME.danger, flex: 1, marginTop: 0 }]}
                            onPress={() => setScheduleModalVisible(false)}
                        >
                            <Text style={styles.closeButtonText}>Cancelar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.closeButton, { backgroundColor: THEME.success, flex: 1, marginTop: 0 }]}
                            onPress={handleSaveSchedule}
                        >
                            <Text style={styles.closeButtonText}>Guardar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>

        {/* Modal: Detalles del Día */}
        <Modal
            animationType="fade"
            transparent={true}
            visible={dayDetailVisible}
            onRequestClose={() => setDayDetailVisible(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                    <Text style={[styles.modalTitle, { textAlign: 'center' }]}>
                        Actividad: {dayDetailData?.worker}
                    </Text>
                    <Text style={{color: THEME.textSecondary, marginBottom: 15, textAlign: 'center'}}>
                        {dayDetailData?.date}
                    </Text>

                    <ScrollView style={{ width: '100%' }}>
                        {dayDetailData?.events.map((event, index) => {
                            const dateObj = new Date(event.fechaHora);
                            const timeTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                            const motiveStyle = getMotiveStyle(event.tipo);
                            
                            return (
                                <View key={index} style={{
                                    flexDirection: 'row', 
                                    alignItems: 'center', 
                                    paddingVertical: 10,
                                    borderBottomWidth: 1,
                                    borderBottomColor: '#333'
                                }}>
                                    <View style={{ width: 60 }}>
                                        <Text style={{ color: THEME.text, fontWeight: 'bold' }}>{timeTime}</Text>
                                    </View>
                                    <View style={{ 
                                        flex: 1, 
                                        flexDirection: 'row', 
                                        alignItems: 'center',
                                        backgroundColor: '#1E1E1E',
                                        padding: 8,
                                        borderRadius: 6
                                    }}>
                                        <View style={{ 
                                            width: 8, 
                                            height: 8, 
                                            borderRadius: 4, 
                                            backgroundColor: motiveStyle.color,
                                            marginRight: 10
                                        }} />
                                        <Text style={{ color: THEME.text }}>{motiveStyle.label}</Text>
                                    </View>
                                </View>
                            );
                        })}
                    </ScrollView>

                    <TouchableOpacity 
                        style={[styles.closeButton, { marginTop: 20 }]}
                        onPress={() => setDayDetailVisible(false)}
                    >
                        <Text style={styles.closeButtonText}>Cerrar</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.background,
    padding: 20,
  },
  topHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 15,
  },
  screenTitle: {
      color: THEME.text,
      fontSize: 20,
      fontWeight: 'bold',
  },
  screenSubtitle: {
      color: THEME.textSecondary,
      fontSize: 12,
  },
  searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: THEME.card,
      borderRadius: 8,
      paddingHorizontal: 10,
      marginBottom: 10,
      height: 40
  },
  searchInput: {
      flex: 1,
      color: THEME.text,
      fontSize: 14
  },
  addButton: {
    backgroundColor: THEME.primary,
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#000',
    fontWeight: 'bold', 
    marginLeft: 5,
    fontSize: 12
  },
  weekControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    backgroundColor: THEME.card,
    borderRadius: 8,
    paddingVertical: 5
  },
  weekTitle: {
    color: THEME.text,
    fontSize: 14,
    fontWeight: 'bold',
  },
  legend: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      marginBottom: 10,
      marginTop: 5,
  },
  legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      marginRight: 10,
      marginBottom: 5,
  },
  legendDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginRight: 4,
  },
  legendText: {
      color: THEME.textSecondary,
      fontSize: 10,
  },
  tableHeader: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: THEME.secondary,
      backgroundColor: THEME.card,
      paddingVertical: 10,
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
  },
  userColumnHeader: {
      width: 100, 
      paddingLeft: 10,
      justifyContent: 'center',
      borderRightWidth: 1,
      borderRightColor: THEME.secondary + '40',
  },
  dayColumnHeader: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRightWidth: 1,
      borderRightColor: THEME.secondary + '40',
  },
  columnHeaderText: {
      color: THEME.primary,
      fontWeight: 'bold',
      fontSize: 11,
      textTransform: 'uppercase'
  },
  columnDateText: {
      color: THEME.textSecondary,
      fontSize: 10,
  },
  listContent: {
      paddingBottom: 20,
  },
  row: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: '#33415550', 
      paddingVertical: 0,
      minHeight: 50,
      backgroundColor: THEME.background
  },
  userColumn: {
      width: 100,
      paddingLeft: 10,
      justifyContent: 'center',
      borderRightWidth: 1,
      borderRightColor: '#33415550',
      paddingVertical: 10
  },
  userName: {
      color: THEME.text,
      fontWeight: '600',
      fontSize: 13,
  },
  btnSmall: {
      backgroundColor: THEME.secondary,
      padding: 4,
      borderRadius: 4,
  },
  dayColumn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRightWidth: 1,
      borderRightColor: '#33415550',
      paddingVertical: 10
  },
  cell: {
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: 20,
  },
  dash: {
      color: THEME.textSecondary,
      fontSize: 16,
  },
  dotContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'center',
      maxWidth: 24,
      gap: 2,
  },
  dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
  },
  emptyText: {
      color: THEME.textSecondary,
      textAlign: 'center',
      marginTop: 20
  },
  // Modal Styles
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    width: '85%',
    backgroundColor: THEME.card,
    borderRadius: 16,
    padding: 20,
    borderColor: THEME.secondary,
    borderWidth: 1,
  },
  modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.7)',
      justifyContent: 'center',
      alignItems: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 15,
    textAlign: 'center',
  },
  modalSubtitle: {
      fontSize: 14,
      color: THEME.primary,
      marginBottom: 20,
      textAlign: 'center',
  },
  label: {
    color: THEME.textSecondary,
    marginBottom: 5,
    fontSize: 12
  },
  input: {
    backgroundColor: THEME.background,
    color: THEME.text,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: THEME.secondary,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    gap: 10
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  switchContainer: {
      flexDirection: 'row', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      marginVertical: 10,
      backgroundColor: THEME.secondary + '40', // transparent secondary
      padding: 10,
      borderRadius: 8
  },
  scheduleList: {
      marginBottom: 20,
  },
  scheduleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#ffffff10',
      paddingBottom: 4,
  },
  scheduleDay: {
      color: THEME.textSecondary,
  },
  scheduleTime: {
      color: THEME.text,
      fontWeight: '500',
  },
  scheduleInput: {
      color: THEME.text,
      fontWeight: '500',
      minWidth: 120,
      textAlign: 'right',
      paddingVertical: 0
  },
  closeButton: {
      marginTop: 5,
      backgroundColor: THEME.danger,
      padding: 10,
      borderRadius: 8,
      alignItems: 'center',
  },
  closeButtonText: {
      color: '#fff',
      fontWeight: 'bold',
  }
});
