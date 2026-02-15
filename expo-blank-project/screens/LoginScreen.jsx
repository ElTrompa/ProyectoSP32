import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity,  StyleSheet, Alert, ActivityIndicator, Image } from 'react-native';
import axios from 'axios';
import { useNavigation } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { API_URL, THEME, USE_MOCK } from '../config';

export default function LoginScreen() {
    const navigation = useNavigation();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const stringToHex = (str) => {
        let hex = '';
        for (let i = 0; i < str.length; i++) {
            hex += str.charCodeAt(i).toString(16).toUpperCase().padStart(2, '0');
        }
        hex += '00'; 
        return hex;
    };

    const handleLogin = async () => {
        if (USE_MOCK) {
            console.log('MOCK LOGIN ACTIVE');
            if (username.toLowerCase() === 'admin') {
                navigation.replace('Home');
            } else {
                // Si no se escribe nada, entrar como trabajador por defecto
                const userToUse = username || 'juan_perez'; 
                navigation.replace('Trabajador', { username: userToUse });
            }
            return;
        }

        if (!username || !password) {
            Alert.alert('Error', 'Por favor ingresa usuario y contraseña');
            return;
        }

        setLoading(true);
        try {
            console.log('Fetching users from:', API_URL + '/datos');
            const response = await axios.get(API_URL + '/datos', { timeout: 5000 });
            const users = response.data.usuarios || [];
            
            // Find user
            const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

            if (user) {
                const inputHex = stringToHex(password);
                console.log('User found:', user.username);
                console.log('Stored Password:', user.password);
                console.log('Input Hex:', inputHex);

                if (user.password === inputHex || user.password === password) {
                    // Verificación de ROL: Campo 'rol', campo 'isAdmin', o usuario 'admin' hardcoded
                    const isUserAdmin = (user.rol && user.rol.toLowerCase() === 'admin') || 
                                      user.isAdmin === true || 
                                      username.toLowerCase() === 'admin';

                    if (isUserAdmin) {
                         navigation.replace('Home');
                    } else {
                         navigation.replace('Trabajador', { username: user.username });
                    }
                } else {
                    Alert.alert('Error', 'Contraseña incorrecta');
                }
            } else {
                Alert.alert('Error', 'Usuario no encontrado');
            }

        } catch (error) {
            console.error('Login Error:', error);
            const errorMessage = error.code === 'ECONNABORTED' 
                ? 'Tiempo de espera agotado. Verifica la IP del servidor.' 
                : (error.message || 'Error de conexión con el servidor');
            Alert.alert('Error', errorMessage);
        }
        setLoading(false);
    };

    return (
        <View style={styles.container}>
            <View style={styles.logoContainer}>
                <MaterialCommunityIcons name="shield-lock" size={80} color={THEME.primary} />
                <Text style={styles.title}>Sistema de Control</Text>
                <Text style={styles.subtitle}>Inicia sesión para continuar</Text>
            </View>

            <View style={styles.form}>
                <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="account" size={24} color={THEME.textSecondary} style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Usuario"
                        placeholderTextColor={THEME.textSecondary}
                        value={username}
                        onChangeText={setUsername}
                        autoCapitalize="none"
                    />
                </View>

                <View style={styles.inputContainer}>
                    <MaterialCommunityIcons name="lock" size={24} color={THEME.textSecondary} style={styles.icon} />
                    <TextInput
                        style={styles.input}
                        placeholder="Contraseña"
                        placeholderTextColor={THEME.textSecondary}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />
                </View>

                <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
                    {loading ? (
                        <ActivityIndicator color="#000" />
                    ) : (
                        <Text style={styles.buttonText}>ENTRAR</Text>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: THEME.background,
        justifyContent: 'center',
        padding: 20,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 50,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: THEME.text,
        marginTop: 10,
    },
    subtitle: {
        fontSize: 16,
        color: THEME.textSecondary,
        marginTop: 5,
    },
    form: {
        width: '100%',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: THEME.card,
        borderRadius: 12,
        marginBottom: 15,
        paddingHorizontal: 15,
        borderWidth: 1,
        borderColor: THEME.secondary,
    },
    icon: {
        marginRight: 10,
    },
    input: {
        flex: 1,
        paddingVertical: 15,
        color: THEME.text,
        fontSize: 16,
    },
    button: {
        backgroundColor: THEME.primary,
        borderRadius: 12,
        paddingVertical: 15,
        alignItems: 'center',
        marginTop: 20,
    },
    buttonText: {
        color: '#000',
        fontWeight: 'bold',
        fontSize: 16,
    }
});
