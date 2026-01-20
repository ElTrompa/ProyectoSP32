import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, UIButton, TouchableOpacity, Alert, Modal } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import axios from 'axios';
import { API_URL, THEME } from '../config';

export default function UsuarioScreen() {
  const [usuarioData, setUsuarioData] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [newUser, setNewUser] = useState({ username: '', password: '', rfidToken: '' });

  useEffect(() => {
    fetchUsuarioData();
  }, []);

  const fetchUsuarioData = async () => {
    try {
      const response = await axios.get(API_URL + '/datos');
      // The endpoint /datos returns all data, we extract usuarios
      if(response.data && response.data.usuarios) {
          setUsuarioData(response.data.usuarios);
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    }
  };

  const handleRegister = async () => {
      if(!newUser.username || !newUser.password) {
          Alert.alert('Error', 'Usuario y Contraseña son obligatorios');
          return;
      }
      
      try {
          const res = await axios.post(API_URL + '/usuarios/registrar', newUser);
          Alert.alert('Éxito', res.data || 'Usuario registrado');
          setModalVisible(false);
          setNewUser({ username: '', password: '', rfidToken: '' });
          fetchUsuarioData();
      } catch (error) {
          console.error(error);
          Alert.alert('Error', 'Falló el registro: ' + (error.response?.data || error.message));
      }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
          <MaterialCommunityIcons name="account-circle" size={40} color={THEME.primary} />
      </View>
      <View style={styles.infoContainer}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.detail}> PIN/Pass: ***{item.password?.slice(-1)}</Text>
          <Text style={styles.detail}> RFID: {item.rfidToken || 'No asignado'}</Text>
      </View>
      <View style={styles.activeBadge}>
          <MaterialCommunityIcons name="check-circle" size={16} color={THEME.success} />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Usuarios</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <MaterialCommunityIcons name="plus" size={24} color="#FFF" />
            <Text style={styles.addButtonText}>Añadir</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={usuarioData}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalView}>
            <View style={styles.modalContent}>
                <Text style={styles.modalTitle}>Nuevo Usuario</Text>
                
                <Text style={styles.label}>Nombre de Usuario</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Ej. JuanPerez" 
                    placeholderTextColor="#666"
                    value={newUser.username}
                    onChangeText={t => setNewUser({...newUser, username: t})}
                />
                
                <Text style={styles.label}>PIN / Contraseña</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Ej. 1234" 
                    placeholderTextColor="#666"
                    keyboardType="numeric"
                    value={newUser.password}
                    onChangeText={t => setNewUser({...newUser, password: t})}
                />
                
                <Text style={styles.label}>Token RFID (Opcional)</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Ej. A1:B2:C3:D4" 
                    placeholderTextColor="#666"
                    value={newUser.rfidToken}
                    onChangeText={t => setNewUser({...newUser, rfidToken: t})}
                />

                <View style={styles.modalButtons}>
                    <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setModalVisible(false)}>
                        <Text style={styles.btnText}>Cancelar</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtn, styles.saveBtn]} onPress={handleRegister}>
                        <Text style={styles.btnText}>Guardar</Text>
                    </TouchableOpacity>
                </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: THEME.text,
  },
  addButton: {
    backgroundColor: THEME.primary,
    flexDirection: 'row',
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#000',
    fontWeight: 'bold', 
    marginLeft: 5
  },
  list: {
    paddingBottom: 20
  },
  card: {
    backgroundColor: THEME.card,
    borderRadius: 12,
    padding: 15,
    marginVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  username: {
    color: THEME.text,
    fontSize: 18,
    fontWeight: 'bold',
  },
  detail: {
    color: THEME.textSecondary,
    fontSize: 14,
  },
  activeBadge: {
    marginLeft: 10,
  },
  modalView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: THEME.card,
    borderRadius: 20,
    padding: 25,
    borderColor: THEME.primary,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: THEME.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    color: THEME.textSecondary,
    marginBottom: 5,
  },
  input: {
    backgroundColor: THEME.background,
    color: THEME.text,
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  modalBtn: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  cancelBtn: {
    backgroundColor: '#333',
  },
  saveBtn: {
    backgroundColor: THEME.primary,
  },
  btnText: {
    color: '#FFF',
    fontWeight: 'bold',
  },
});
