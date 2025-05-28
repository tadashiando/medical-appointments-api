# 🏥 API RESTful de Citas Médicas

Sistema completo para gestión de citas médicas con validaciones, pagos sandbox y horarios automatizados.

## 📋 Características

- ✅ **Gestión de usuarios** - Pacientes y médicos con roles específicos
- ✅ **Sistema de citas** - Crear, confirmar, cancelar citas médicas
- ✅ **Pagos sandbox** - Simulación de gateway de pago para confirmar citas
- ✅ **Horarios inteligentes** - Validación automática de disponibilidad
- ✅ **Validaciones robustas** - Esquemas Zod para todos los endpoints
- ✅ **Arquitectura SOLID** - Servicios separados y código limpio

## 🛠️ Tecnologías

- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **MongoDB** + **Mongoose** - Base de datos
- **Zod** - Validación de esquemas
- **JWT** - Autenticación
- **bcryptjs** - Hash de contraseñas
- **date-fns** - Manejo de fechas

## 🚀 Instalación

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
Crear archivo `.env` en la raíz:
```env
PORT=3000
MONGO_URI=mongodb+srv://<URL del banco de datos>
DB_NAME=medical_db
JWT_SECRET=tu_jwt_secret_super_seguro
EXPIRES_IN=6h
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

La API estará disponible en `http://localhost:3000`

## 📚 Documentación de Endpoints

### 🔐 Autenticación

#### Login
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "doctor@ejemplo.com",
  "password": "123456"
}
```

**Respuesta:**
```json
{
  "user": { "id": "...", "name": "Dr. Juan", "role": "doctor" },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### 🏥 Citas Médicas

#### Crear Cita (Pacientes)
```http
POST /api/v1/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "doctorId": "507f1f77bcf86cd799439011",
  "date": "2024-03-15",
  "time": "09:30",
  "reason": "Consulta general",
  "notes": "Dolor de cabeza frecuente"
}
```

#### Confirmar Cita (Médicos)
```http
PUT /api/v1/appointments/{appointmentId}/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Cita confirmada, traer estudios previos"
}
```

#### Mis Citas del Día (Médicos)
```http
GET /api/v1/appointments/today
Authorization: Bearer <token>
```

#### Mis Citas (Pacientes)
```http
GET /api/v1/appointments/my-appointments
Authorization: Bearer <token>
```

#### Cancelar Cita
```http
PUT /api/v1/appointments/{appointmentId}/cancel
Authorization: Bearer <token>
```

### 💳 Pagos

#### Procesar Pago
```http
POST /api/v1/payments/process
Authorization: Bearer <token>
Content-Type: application/json

{
  "appointmentId": "507f1f77bcf86cd799439011",
  "amount": 150.00,
  "paymentMethod": "credit_card",
  "cardNumber": "1234567890123456",
  "cardHolder": "Juan Pérez",
  "expiryDate": "12/25",
  "cvv": "123"
}
```

**Sistema Sandbox:**
- Tarjetas terminadas en **0**: Siempre fallan
- Otras tarjetas: 90% de éxito

#### Historial de Pagos
```http
GET /api/v1/payments/my-payments
Authorization: Bearer <token>
```

### 📅 Horarios

#### Horarios Disponibles
```http
GET /api/v1/schedule/available/{doctorId}?date=2024-03-15
```

#### Próximos Horarios Disponibles
```http
GET /api/v1/schedule/next-available/{doctorId}?limit=5
```

#### Verificar Disponibilidad
```http
GET /api/v1/schedule/check-availability/{doctorId}?date=2024-03-15&time=09:30
```

#### Horarios de Trabajo
```http
GET /api/v1/schedule/working-hours
```

## 🔧 Reglas de Negocio

### Horarios de Atención
- **Mañana:** 7:00 - 12:00
- **Tarde:** 14:00 - 18:00  
- **Duración:** 30 minutos por cita
- **Días:** Lunes a Viernes (no fines de semana)

### Validaciones
- ❌ No se pueden agendar citas en el pasado
- ❌ No se pueden agendar citas en horarios ocupados
- ❌ No se pueden agendar citas fuera del horario de trabajo
- ❌ Solo se pueden confirmar citas que estén pagadas
- ❌ No se pueden pagar citas ya pagadas o canceladas

### Roles y Permisos
- **Pacientes:** Crear citas, pagar, ver sus citas, cancelar
- **Médicos:** Confirmar citas, ver citas del día, cancelar, ver estadísticas

## 🧪 Testing con Postman

### 📋 Collection Completa:
**🔗 [Collection de Postman](https://www.postman.com/team-relay/pronto-paga/collection/7epi7qi/medical-appointments-api)**

### Headers necesarios:
```
Authorization: Bearer <tu_jwt_token>
Content-Type: application/json
```

### Variables automáticas:
- `jwt_token` - Se guarda automáticamente al hacer login
- `doctor_id`, `patient_id` - Se extraen del login
- `appointment_id` - Se guarda al crear citas

### Flujo típico:
1. **Login** como paciente o médico
2. **Crear cita** (paciente)
3. **Pagar cita** (paciente)
4. **Confirmar cita** (médico)
5. **Ver citas del día** (médico)

## 📁 Estructura del Proyecto

```
src/
├── controllers/           # Lógica de controladores
│   ├── appointmentController.ts
│   ├── paymentController.ts
│   └── scheduleController.ts
├── middleware/           # Middlewares personalizados
│   ├── authentication.ts
│   ├── authorization.ts
│   └── validation.ts
├── models/              # Modelos de Mongoose
│   ├── User.ts
│   ├── Appointment.ts
│   └── Payment.ts
├── services/            # Lógica de negocio
│   ├── AppointmentService.ts
│   ├── PaymentService.ts
│   └── ScheduleService.ts
├── interfaces/          # Interfaces TypeScript
│   ├── IUser.ts
│   ├── IAppointment.ts
│   ├── IPayment.ts
│   └── ...
├── routes/             # Definición de rutas
│   ├── index.ts
│   ├── auth.ts
│   ├── appointmentRoutes.ts
│   ├── paymentRoutes.ts
│   └── scheduleRoutes.ts
├── utils/              # Utilities
│   ├── validationSchemas.ts
│   └── constants.ts
└── server.ts           # Servidor principal
```

## 🐛 Códigos de Estado HTTP

- **200** - Operación exitosa
- **201** - Recurso creado exitosamente
- **400** - Error de validación o datos incorrectos
- **401** - No autenticado
- **403** - Sin permisos suficientes
- **404** - Recurso no encontrado
- **500** - Error interno del servidor

## ✨ Ejemplos de Respuesta

### Éxito
```json
{
  "success": true,
  "message": "Cita creada exitosamente",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "date": "2024-03-15",
    "time": "09:30",
    "status": "pending",
    "paymentStatus": "pending"
  }
}
```

### Error
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "date: Cannot schedule appointments in the past",
    "time: Time must be in HH:MM format"
  ]
}
```

## 🔒 Seguridad

- **JWT** para autenticación de usuarios
- **bcrypt** para hash de contraseñas
- **Validación Zod** en todos los endpoints
- **Autorización por roles** en rutas protegidas
- **Sanitización** de datos de entrada

## 📝 Notas Importantes

- Las contraseñas se hashean automáticamente al crear usuarios
- Los pagos son simulados (ambiente sandbox)
- Las fechas deben enviarse en formato ISO (YYYY-MM-DD)
- Los horarios en formato 24h (HH:MM)
- Los tokens JWT expiran según configuración

## 🚧 Desarrollo

### Scripts disponibles:
```bash
npm run dev     # Desarrollo con hot reload
npm run build   # Compilar TypeScript
npm run start   # Ejecutar versión compilada
```

### Variables de entorno requeridas:
- `PORT` - Puerto del servidor
- `MONGO_URI` - URI de conexión a MongoDB
- `DB_NAME` - Nombre de la base de datos
- `JWT_SECRET` - Secreto para firmar JWT
- `EXPIRES_IN` - Tiempo de expiración del token

---

## 📞 Contacto

Para dudas o sugerencias sobre la implementación de esta API RESTful de citas médicas.

**Estado del proyecto:** ✅ Completado y funcional