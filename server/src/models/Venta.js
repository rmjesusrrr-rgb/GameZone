// ============================================================
// server/src/models/Venta.js + DetalleVenta.js
// Modelos de ventas y líneas de detalle
// ============================================================
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ── Tabla: ventas ────────────────────────────────────────────
const Venta = sequelize.define('Venta', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  orden_id: {
    type: DataTypes.STRING(40),
    allowNull: false,
    unique: true,
    defaultValue: () => `GZ-${Date.now()}-${Math.random().toString(36).substring(2,7).toUpperCase()}`,
  },
  cliente_nombre: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  cliente_correo: {
    type: DataTypes.STRING(120),
    allowNull: false,
    validate: { isEmail: true },
  },
  sucursal: {
    type: DataTypes.STRING(80),
    defaultValue: 'Online',
  },
  total: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
  },
  metodo_pago: {
    type: DataTypes.ENUM('tarjeta', 'paypal', 'transferencia', 'efectivo'),
    defaultValue: 'tarjeta',
  },
  estado: {
    type: DataTypes.ENUM('completada', 'pendiente', 'reembolsada', 'cancelada'),
    defaultValue: 'pendiente',
  },
  stripe_payment_id: {
    type: DataTypes.STRING(120),
    allowNull: true,
  },
  usuario_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true, // null = compra desde la tienda pública
  },
}, {
  tableName: 'ventas',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// ── Tabla: detalle_ventas ────────────────────────────────────
const DetalleVenta = sequelize.define('DetalleVenta', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  venta_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  juego_id: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
  },
  nombre_juego: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  cantidad: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 1,
  },
  precio_unitario: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
  },
}, {
  tableName: 'detalle_ventas',
  timestamps: false,
});

// Relaciones
Venta.hasMany(DetalleVenta, { foreignKey: 'venta_id', as: 'detalles' });
DetalleVenta.belongsTo(Venta, { foreignKey: 'venta_id' });

module.exports = { Venta, DetalleVenta };
