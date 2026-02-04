# Guía de Actualización del Backend (MongoDB)

Como estás utilizando un servidor externo (conectado vía API), no puedo modificar los archivos directamente desde la carpeta del frontend.

Para que los **Roles de Usuario**, **Conteo de Horas** y **Gestión de Horarios** funcionen correctamente, debes aplicar los siguientes cambios en tu código del **Servidor (Backend)** (donde tengas tus modelos de Mongoose/MongoDB).

## 1. Modificar el Modelo de Usuario (`models/Usuario.js` o similar)

Añade los campos `rol`, `isAdmin` y ***`horario`*** a tu esquema de usuario.

```javascript
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    },
    rfidToken: { 
        type: String, 
        default: '' 
    },
    // --- NUEVOS CAMPOS ---
    rol: { 
        type: String, 
        enum: ['admin', 'trabajador', 'usuario'], 
        default: 'trabajador' 
    },
    isAdmin: { 
        type: Boolean, 
        default: false 
    },
    horario: {
        type: Object,
        default: {
            "Lunes": "09:00 - 18:00",
            "Martes": "09:00 - 18:00",
            "Miércoles": "09:00 - 18:00",
            "Jueves": "09:00 - 18:00",
            "Viernes": "09:00 - 15:00",
            "Sábado": "Descanso",
            "Domingo": "Descanso"
        }
    },
    // ---------------------
    createdAt: { 
        type: Date, 
        default: Date.now 
    }
});

module.exports = mongoose.model('Usuario', UserSchema);
```

## 2. Modificar el Endpoint de Registro (`routes/usuarios.js`)

Asegúrate de que cuando recibas el POST en `/registrar`, guardes los nuevos campos.

```javascript
router.post('/registrar', async (req, res) => {
    try {
        const { username, password, rfidToken, rol, isAdmin, horario } = req.body;

        const nuevoUsuario = new Usuario({
            username,
            password, 
            rfidToken,
            rol: rol || 'trabajador',
            isAdmin: isAdmin || false,
            horario: horario // Opcional, usará default si es null
        });

        await nuevoUsuario.save();
        res.status(201).send('Usuario registrado correctamente');
    } catch (error) {
        res.status(500).send('Error al registrar: ' + error.message);
    }
});
```

## 3. Implementar Endpoint de Actualización (PUT)

Para editar usuarios y *guardar el horario*, necesitas habilitar el método PUT.

```javascript
router.put('/:id', async (req, res) => {
    try {
        const updateData = { ...req.body };
        
        // Si la contraseña viene vacía, no la sobreescribimos
        if (updateData.password === '' || updateData.password === null) {
            delete updateData.password;
        }

        const usuarioActualizado = await Usuario.findByIdAndUpdate(
            req.params.id, 
            { $set: updateData }, 
            { new: true }
        );

        res.json(usuarioActualizado);
    } catch (error) {
        res.status(500).send('Error al actualizar: ' + error.message);
    }
});
```

## 4. (Opcional) Mejorar el Modelo de Presencia

```javascript
/* models/Presencia.js */
const PresenciaSchema = new mongoose.Schema({
    usuario: { type: String, required: true },
    fechaHora: { type: Date, default: Date.now },
    tipo: { type: String, enum: ['ENTRADA', 'SALIDA'], required: true },
    metodoAuth: { type: String }
});
```
