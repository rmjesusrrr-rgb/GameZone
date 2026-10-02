// ============================================================
// server/app.js
// Servidor principal de GameZone v3.0 — Express + MySQL
// ============================================================
require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const cookieParser = require('cookie-parser');

const sequelize = require('./src/config/database');
const apiRoutes = require('./src/routes/index');

// Importar modelos para que Sequelize los registre
require('./src/models/Usuario');
require('./src/models/Juego');
require('./src/models/Venta');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Seguridad HTTP (Helmet) ───────────────────────────────────
app.use(helmet({ crossOriginEmbedderPolicy: false }));

// ── CORS ──────────────────────────────────────────────────────
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5500',
    'http://127.0.0.1:5500',
    'http://localhost:3000',
  ],
  credentials: true, // Necesario para cookies con JWT
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// ── Rate Limiting (Anti fuerza bruta) ─────────────────────────
const limiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minuto
  max: 100,              // 100 peticiones por IP por minuto
  message: { ok: false, mensaje: 'Demasiadas peticiones. Intenta de nuevo en un minuto.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// ── Parsers ───────────────────────────────────────────────────
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Rutas de la API ───────────────────────────────────────────
app.use('/api', apiRoutes);

// ── Ruta de salud del servidor ────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    servicio: 'GameZone API v3.0',
    estado: 'en línea',
    timestamp: new Date().toISOString(),
    entorno: process.env.NODE_ENV || 'development',
  });
});

// ── Manejo de rutas no encontradas ───────────────────────────
app.use((req, res) => {
  res.status(404).json({ ok: false, mensaje: `Ruta no encontrada: ${req.method} ${req.path}` });
});

// ── Manejo global de errores ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.stack);
  res.status(err.status || 500).json({
    ok: false,
    mensaje: process.env.NODE_ENV === 'production' ? 'Error interno del servidor.' : err.message,
  });
});

// ── Conectar a la base de datos e iniciar el servidor ─────────
const iniciar = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a MySQL establecida correctamente.');

    // Sincronizar modelos (alter: no destruye datos existentes)
    await sequelize.sync({ alter: process.env.NODE_ENV === 'development' });
    console.log('✅ Modelos sincronizados con la base de datos.');

    app.listen(PORT, () => {
      console.log(`\n🎮 GameZone API v3.0 corriendo en http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔒 Entorno: ${process.env.NODE_ENV || 'development'}\n`);
    });
  } catch (error) {
    console.error('❌ No se pudo conectar a la base de datos:', error.message);
    console.error('💡 Verifica que MySQL esté corriendo y las credenciales en .env sean correctas.');
    process.exit(1);
  }
};

iniciar();
