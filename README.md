# Medical Appointments RESTful API

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://github.com)
[![Coverage](https://img.shields.io/badge/coverage-95%25-green)](https://github.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)](https://github.com)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)](https://nodejs.org)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)

Sistema completo para gestión de citas médicas con validaciones robustas, pagos sandbox y horarios automatizados.

## Características

- ✅ **Gestión de usuarios** - Pacientes y médicos con roles específicos
- ✅ **Sistema de citas** - Crear, confirmar, cancelar citas médicas
- ✅ **Pagos sandbox** - Simulación de gateway de pago para confirmar citas
- ✅ **Horarios inteligentes** - Validación automática de disponibilidad
- ✅ **Validaciones robustas** - Esquemas Zod con date-fns integrado
- ✅ **Arquitectura SOLID** - Servicios separados y código limpio
- ✅ **TypeScript type-safe** - Sin errores de compilación
- ✅ **Middleware robusto** - Autenticación JWT y autorización por roles
- ✅ **Testing comprehensivo** - Pruebas unitarias e integración con Jest

## Tecnologías

- **Node.js** + **TypeScript**
- **Express.js** - Framework web
- **MongoDB** + **Mongoose** - Base de datos
- **Zod** - Validación de esquemas
- **JWT** - Autenticación
- **bcryptjs** - Hash de contraseñas
- **date-fns** - Manejo de fechas y validaciones temporales
- **Jest** + **Supertest** - Framework de testing

## Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Crear archivo `.env` en la raíz:

```env
PORT=3000
MONGO_URI=mongodb+srv://<URL_DEL_BANCO_DE_DATOS>
DB_NAME=medical_db
JWT_SECRET=tu_jwt_secret_super_seguro_aqui
EXPIRES_IN=6h
```

### 3. Inicializar base de datos (Seed)

```bash
npm run init-db
```

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

La API estará disponible en `http://localhost:3000`

## Testing

El proyecto incluye cobertura completa de pruebas con Jest y Supertest.

### Ejecutar Pruebas

```bash
# Ejecutar todas las pruebas
npm test

# Ejecutar pruebas en modo watch
npm run test:watch

# Ejecutar pruebas con reporte de cobertura
npm run test:coverage

# Ejecutar pruebas para CI (sin modo watch)
npm run test:ci
```

### Estructura de Pruebas

```
src/__tests__/
├── integration/           # Pruebas de integración para endpoints de la API
│   ├── appointmentRoutes.test.ts
│   ├── authRoutes.test.ts
│   ├── paymentRoutes.test.ts
│   └── scheduleRoutes.test.ts
├── middleware/           # Pruebas unitarias de middleware
│   ├── authentication.test.ts
│   ├── authorization.test.ts
│   └── validation.test.ts
├── services/            # Pruebas unitarias de la capa de servicios
│   ├── AppointmentService.test.ts
│   ├── PaymentService.test.ts
│   └── ScheduleService.test.ts
├── utils/              # Utilidades y helpers para testing
│   └── testHelpers.ts
└── setup.ts            # Configuración global de pruebas y mocks
```

### Cobertura de Pruebas

La suite de pruebas cubre:

- **Endpoints de la API** - Todas las rutas con diferentes escenarios (éxito, errores de validación, autorización)
- **Autenticación** - Validación de tokens JWT y autenticación de usuarios
- **Autorización** - Control de acceso basado en roles
- **Lógica de Negocio** - Servicios con reglas de validación complejas
- **Procesamiento de Pagos** - Simulación de pagos sandbox
- **Gestión de Horarios** - Generación de slots de tiempo y verificación de disponibilidad
- **Validación de Datos** - Esquemas Zod con casos extremos

### Características Clave del Testing

- **Dependencias Mockeadas** - Modelos de base de datos, JWT, bcrypt están mockeados para pruebas aisladas
- **Type Safety** - Soporte completo de TypeScript en las pruebas
- **Test Helpers** - Datos mock reutilizables y utilidades
- **Testing de Integración** - Pruebas del ciclo completo request/response
- **Casos Extremos** - Citas de fin de semana, tarjetas expiradas, acceso no autorizado

## Documentación de Endpoints

### Autenticación

#### Login

```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "doctor@ejemplo.com",
  "password": "123456"
}
```

**Respuesta exitosa:**

```json
{
  "user": {
    "id": "...",
    "name": "Dr. Juan",
    "role": "doctor",
    "email": "doctor@ejemplo.com"
  },
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

### Citas Médicas

#### Crear Cita (Solo Pacientes)

```http
POST /api/v1/appointments
Authorization: Bearer <token>
Content-Type: application/json

{
  "doctorId": "507f1f77bcf86cd799439011",
  "date": "2025-10-15",
  "time": "09:30",
  "reason": "Consulta general de rutina",
  "notes": "Dolor de cabeza frecuente últimas semanas"
}
```

#### Confirmar Cita (Solo Médicos)

```http
PUT /api/v1/appointments/{appointmentId}/confirm
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Cita confirmada, traer estudios previos si los tiene"
}
```

#### Mis Citas del Día (Solo Médicos)

```http
GET /api/v1/appointments/today
Authorization: Bearer <token>
```

#### Mis Citas (Solo Pacientes)

```http
GET /api/v1/appointments/my-appointments
Authorization: Bearer <token>
```

#### Cancelar Cita (Pacientes y Médicos)

```http
PUT /api/v1/appointments/{appointmentId}/cancel
Authorization: Bearer <token>
```

### Pagos

#### Procesar Pago (Solo Pacientes)

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
- Otras tarjetas: 90% de probabilidad de éxito

### Horarios

#### Horarios Disponibles

```http
GET /api/v1/schedule/available/{doctorId}?date=2025-10-15
```

**Respuesta:**

```json
{
  "success": true,
  "message": "Available slots retrieved successfully",
  "data": {
    "doctorId": "507f1f77bcf86cd799439011",
    "doctorName": "Dr. Juan Pérez",
    "date": "2025-10-15",
    "availableSlots": ["07:00", "07:30", "08:00", "14:00", "14:30"],
    "totalSlots": 5
  }
}
```

## Reglas de Negocio

### Horarios de Atención

- **Mañana:** 7:00 - 12:00
- **Tarde:** 14:00 - 18:00
- **Duración:** 30 minutos por cita
- **Días:** Lunes a Viernes (no fines de semana)

### Validaciones Implementadas

- ❌ No se pueden agendar citas en el pasado
- ❌ No se pueden agendar citas en horarios ocupados
- ❌ No se pueden agendar citas fuera del horario de trabajo
- ❌ No se pueden agendar citas en fines de semana
- ❌ Solo se pueden confirmar citas que estén pagadas
- ❌ No se pueden pagar citas ya pagadas o canceladas
- ❌ Validación de formato de fechas y horarios con date-fns

### Roles y Permisos

- **Pacientes:** Crear citas, pagar, ver sus citas, cancelar
- **Médicos:** Confirmar citas, ver citas del día, cancelar

## Testing con Postman

### Collection Completa:

Tenemos una [collection completa de Postman](https://www.postman.com/team-relay/pronto-paga/collection/c7b73lk/medical-appointments-api) con:

- Variables automáticas para tokens y IDs
- Flujo completo de pruebas
- Casos de éxito y error
- Headers pre-configurados

**Flujo típico:**
1. Login → 2. Crear cita → 3. Pagar → 4. Confirmar → 5. Consultar

### Headers necesarios:

```
Authorization: Bearer <tu_jwt_token>
Content-Type: application/json
```

### Variables automáticas:

- `jwt_token` - Se guarda automáticamente al hacer login
- `doctor_id`, `patient_id` - Se extraen del login
- `appointment_id` - Se guarda al crear citas

### Flujo típico de prueba:

1. **Login** como paciente o médico
2. **Crear cita** (paciente)
3. **Pagar cita** (paciente)
4. **Confirmar cita** (médico)
5. **Ver citas del día** (médico)

## Estructura del Proyecto

```
src/
├── __tests__/           # Archivos de pruebas
│   ├── integration/     # Pruebas de integración
│   ├── middleware/      # Pruebas de middleware
│   ├── services/        # Pruebas de servicios
│   ├── utils/          # Utilidades de testing
│   └── setup.ts        # Configuración de pruebas
├── controllers/        # Lógica de controladores
│   ├── appointmentController.ts
│   ├── paymentController.ts
│   └── scheduleController.ts
├── middleware/         # Middlewares personalizados
│   ├── authentication.ts
│   ├── authorization.ts
│   └── validation.ts
├── models/            # Modelos de Mongoose
│   ├── User.ts
│   ├── Appointment.ts
│   └── Payment.ts
├── services/          # Lógica de negocio
│   ├── AppointmentService.ts
│   ├── PaymentService.ts
│   └── ScheduleService.ts
├── interfaces/        # Interfaces TypeScript
│   ├── IUser.ts
│   ├── IAppointment.ts
│   ├── IPayment.ts
│   └── ...
├── routes/           # Definición de rutas
│   ├── index.ts
│   ├── authorizationRoutes.ts
│   ├── appointmentRoutes.ts
│   ├── paymentRoutes.ts
│   └── scheduleRoutes.ts
├── utils/            # Utilidades
│   ├── validationSchemas.ts
│   └── constants.ts
└── server.ts         # Servidor principal
```

## Códigos de Estado HTTP

- **200** - Operación exitosa
- **201** - Recurso creado exitosamente
- **400** - Error de validación o datos incorrectos
- **401** - No autenticado
- **403** - Sin permisos suficientes
- **404** - Recurso no encontrado
- **500** - Error interno del servidor

## Ejemplos de Respuesta

### Éxito

```json
{
  "success": true,
  "message": "Appointment created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "date": "2025-10-15",
    "time": "09:30",
    "status": "pending",
    "paymentStatus": "pending",
    "reason": "Consulta general"
  }
}
```

### Error de Validación

```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    "body.date: Date must be future weekday",
    "body.time: Time must be 7:00-12:00 or 14:00-18:00"
  ]
}
```

## Seguridad

- **JWT** para autenticación de usuarios
- **bcrypt** para hash de contraseñas (salt factor 12)
- **Validación Zod** en todos los endpoints
- **Autorización por roles** en rutas protegidas
- **Sanitización** de datos de entrada
- **Validación temporal** con date-fns

## Notas Técnicas

- Las contraseñas se hashean automáticamente al crear usuarios
- Los pagos son simulados (ambiente sandbox)
- Las fechas deben enviarse en formato ISO (YYYY-MM-DD)
- Los horarios en formato 24h (HH:MM)
- Los tokens JWT expiran según configuración
- Validaciones temporales robustas con date-fns
- TypeScript estricto para mayor seguridad de tipos

## Desarrollo

### Scripts disponibles:

```bash
npm run dev         # Desarrollo con hot reload
npm run build       # Compilar TypeScript
npm run start       # Ejecutar versión compilada
npm run clean       # Limpiar directorio dist
npm run init-db     # Inicializar base de datos con datos de prueba
npm test            # Ejecutar pruebas
npm run test:watch  # Ejecutar pruebas en modo watch
npm run test:coverage # Ejecutar pruebas con cobertura
npm run test:ci     # Ejecutar pruebas para CI
```

### Variables de entorno requeridas:

- `PORT` - Puerto del servidor (default: 3000)
- `MONGO_URI` - URI de conexión a MongoDB
- `DB_NAME` - Nombre de la base de datos
- `JWT_SECRET` - Secreto para firmar JWT (debe ser seguro)
- `EXPIRES_IN` - Tiempo de expiración del token (default: 24h)

## Datos de Prueba

Después de ejecutar `npm run init-db`:

**Médicos:**

- Email: `doctor@ejemplo.com` | Password: `123456`
- Email: `doctora@ejemplo.com` | Password: `123456`

**Pacientes:**

- Email: `paciente@ejemplo.com` | Password: `123456`
- Email: `pedro@ejemplo.com` | Password: `123456`

## Guías de Testing

### Escribiendo Pruebas

1. **Pruebas Unitarias** - Probar funciones y métodos individuales de forma aislada
2. **Pruebas de Integración** - Probar ciclos completos de request/response
3. **Mockear Dependencias Externas** - Base de datos, JWT, bcrypt están mockeados
4. **Probar Casos Extremos** - Datos inválidos, acceso no autorizado, violaciones de reglas de negocio
5. **Mantener Type Safety** - Usar TypeScript en todas las pruebas

### Convención de Nomenclatura de Pruebas

```typescript
describe('NombreDelServicio', () => {
  describe('nombreDelMetodo', () => {
    it('debería hacer algo cuando se cumple condición', () => {
      // Implementación de la prueba
    });
  });
});
```

### Datos Mock

Usa los helpers de prueba en `src/__tests__/utils/testHelpers.ts` para datos mock consistentes entre pruebas.

## Métricas de Calidad

- **Cobertura de Pruebas**: Cobertura exhaustiva de todos los caminos críticos
- **Type Safety**: 100% TypeScript con configuración estricta
- **Calidad de Código**: ESLint y Prettier configurados
- **Seguridad**: Autenticación JWT, hashing bcrypt, validación de entrada
- **Rendimiento**: Consultas de base de datos optimizadas con indexación apropiada