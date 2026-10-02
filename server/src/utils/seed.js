// ============================================================
// server/src/utils/seed.js
// Datos iniciales para poblar la base de datos (seeder)
// ============================================================
const bcrypt = require('bcryptjs');
const sequelize = require('../config/database');
const Usuario = require('../models/Usuario');
const Juego = require('../models/Juego');
const { Venta, DetalleVenta } = require('../models/Venta');

async function seed() {
  try {
    console.log('🌱 Iniciando seed de la base de datos...');

    // Sincronizar modelos (crear tablas si no existen)
    await sequelize.sync({ force: true });
    console.log('✅ Tablas creadas correctamente.');

    // ── Usuarios de ejemplo ────────────────────────────────
    const passwordHash = await bcrypt.hash('GameZone2026!', 12);

    await Usuario.bulkCreate([
      { nombre: 'Carlos', apellido: 'Ramírez', correo: 'admin@gamezone.com', password_hash: passwordHash, rol: 'super_admin', sucursal: 'Central' },
      { nombre: 'María', apellido: 'González', correo: 'mgonzalez@gamezone.com', password_hash: passwordHash, rol: 'admin', sucursal: 'Central' },
      { nombre: 'Luis', apellido: 'Martínez', correo: 'lmartinez@gamezone.com', password_hash: passwordHash, rol: 'vendedor', sucursal: 'Norte' },
      { nombre: 'Ana', apellido: 'López', correo: 'alopez@gamezone.com', password_hash: passwordHash, rol: 'vendedor', sucursal: 'Sur' },
      { nombre: 'Pedro', apellido: 'Torres', correo: 'ptorres@gamezone.com', password_hash: passwordHash, rol: 'analista', sucursal: 'Central' },
      { nombre: 'Sofía', apellido: 'Hernández', correo: 'shernandez@gamezone.com', password_hash: passwordHash, rol: 'soporte', sucursal: 'Norte' },
    ]);
    console.log('✅ 6 usuarios creados.');

    // ── Juegos de ejemplo (muestra del catálogo) ───────────
    await Juego.bulkCreate([
      { nombre: 'Forza Horizon 5', desarrolladora: 'Turn 10 Studios', categoria: 'carreras', plataforma: 'steam', tags: JSON.stringify(['SIMULACIÓN','MUNDO ABIERTO']), precio_costo: 30.00, precio_venta: 59.99, stock: 150, rating: 92, anio: 2021, tienda_url: 'https://store.steampowered.com/app/1551360/' },
      { nombre: 'Need for Speed Unbound', desarrolladora: 'Criterion Games', categoria: 'carreras', plataforma: 'steam', tags: JSON.stringify(['MUNDO ABIERTO','STREET']), precio_costo: 25.00, precio_venta: 49.99, stock: 80, rating: 79, anio: 2022, tienda_url: 'https://store.steampowered.com/app/1846380/' },
      { nombre: 'DOOM Eternal', desarrolladora: 'id Software', categoria: 'shooters', plataforma: 'steam', tags: JSON.stringify(['FPS','ACCIÓN']), precio_costo: 18.00, precio_venta: 39.99, stock: 200, rating: 88, anio: 2020, tienda_url: 'https://store.steampowered.com/app/782330/' },
      { nombre: 'Helldivers 2', desarrolladora: 'Arrowhead Studios', categoria: 'shooters', plataforma: 'steam', tags: JSON.stringify(['TPS','CO-OP']), precio_costo: 20.00, precio_venta: 39.99, stock: 120, rating: 82, anio: 2024, tienda_url: 'https://store.steampowered.com/app/553850/' },
      { nombre: 'The Witcher 3: Wild Hunt', desarrolladora: 'CD Projekt Red', categoria: 'aventura', plataforma: 'steam', tags: JSON.stringify(['RPG','MUNDO ABIERTO']), precio_costo: 15.00, precio_venta: 39.99, stock: 300, rating: 92, anio: 2015, tienda_url: 'https://store.steampowered.com/app/292030/' },
      { nombre: 'Baldur\'s Gate 3', desarrolladora: 'Larian Studios', categoria: 'aventura', plataforma: 'steam', tags: JSON.stringify(['RPG','CO-OP']), precio_costo: 30.00, precio_venta: 59.99, stock: 90, rating: 96, anio: 2023, tienda_url: 'https://store.steampowered.com/app/1086940/' },
      { nombre: 'Resident Evil 4 Remake', desarrolladora: 'Capcom', categoria: 'terror', plataforma: 'steam', tags: JSON.stringify(['SURVIVAL HORROR','ACCIÓN']), precio_costo: 28.00, precio_venta: 59.99, stock: 110, rating: 93, anio: 2023, tienda_url: 'https://store.steampowered.com/app/2050650/' },
      { nombre: 'Phasmophobia', desarrolladora: 'Kinetic Games', categoria: 'terror', plataforma: 'steam', tags: JSON.stringify(['INVESTIGACIÓN','CO-OP']), precio_costo: 5.00, precio_venta: 13.99, stock: 4, rating: 93, anio: 2020, tienda_url: 'https://store.steampowered.com/app/739630/' },
    ]);
    console.log('✅ 8 juegos de ejemplo creados.');

    // ── Ventas de ejemplo ──────────────────────────────────
    const venta1 = await Venta.create({
      cliente_nombre: 'Juan Pérez', cliente_correo: 'jperez@email.com',
      sucursal: 'Norte', metodo_pago: 'tarjeta', total: 99.98, estado: 'completada', usuario_id: 3,
    });
    await DetalleVenta.bulkCreate([
      { venta_id: venta1.id, juego_id: 1, nombre_juego: 'Forza Horizon 5', cantidad: 1, precio_unitario: 59.99 },
      { venta_id: venta1.id, juego_id: 3, nombre_juego: 'DOOM Eternal', cantidad: 1, precio_unitario: 39.99 },
    ]);

    const venta2 = await Venta.create({
      cliente_nombre: 'Laura Soto', cliente_correo: 'lsoto@email.com',
      sucursal: 'Sur', metodo_pago: 'paypal', total: 59.99, estado: 'completada', usuario_id: 4,
    });
    await DetalleVenta.create({
      venta_id: venta2.id, juego_id: 5, nombre_juego: 'The Witcher 3', cantidad: 1, precio_unitario: 39.99,
    });

    console.log('✅ 2 ventas de ejemplo creadas.');
    console.log('\n🎮 Seed completado exitosamente.');
    console.log('📧 Usuario admin: admin@gamezone.com');
    console.log('🔑 Contraseña: GameZone2026!');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error durante el seed:', error);
    process.exit(1);
  }
}

require('dotenv').config({ path: '../../../.env' });
seed();
