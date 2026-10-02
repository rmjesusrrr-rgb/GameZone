// ============================================================
// server/src/models/Juego.js
// Modelo de la tabla juegos (inventario del catálogo)
// ============================================================
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Juego = sequelize.define('Juego', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(120),
    allowNull: false,
  },
  desarrolladora: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  categoria: {
    type: DataTypes.ENUM('carreras', 'shooters', 'aventura', 'terror'),
    allowNull: false,
  },
  plataforma: {
    type: DataTypes.ENUM('steam', 'playstation', 'xbox', 'epic', 'nintendo', 'battle_net', 'ubisoft'),
    allowNull: false,
  },
  tags: {
    type: DataTypes.STRING(255), // Guardados como JSON string ej: ["FPS","CO-OP"]
    allowNull: true,
    get() {
      const raw = this.getDataValue('tags');
      return raw ? JSON.parse(raw) : [];
    },
    set(val) {
      this.setDataValue('tags', JSON.stringify(val));
    },
  },
  precio_costo: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    defaultValue: 0.00,
  },
  precio_venta: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
  },
  stock: {
    type: DataTypes.INTEGER.UNSIGNED,
    defaultValue: 0,
  },
  rating: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    validate: { min: 0, max: 100 },
  },
  anio: {
    type: DataTypes.SMALLINT.UNSIGNED,
    allowNull: false,
  },
  imagen_url: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  tienda_url: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  estado: {
    type: DataTypes.ENUM('disponible', 'stock_bajo', 'agotado'),
    defaultValue: 'disponible',
  },
}, {
  tableName: 'juegos',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    // Actualizar estado automáticamente según el stock
    beforeSave(juego) {
      if (juego.stock === 0) {
        juego.estado = 'agotado';
      } else if (juego.stock <= 5) {
        juego.estado = 'stock_bajo';
      } else {
        juego.estado = 'disponible';
      }
    },
  },
});

module.exports = Juego;
