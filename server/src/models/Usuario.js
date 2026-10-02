// ============================================================
// server/src/models/Usuario.js
// Modelo de la tabla usuarios
// ============================================================
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
  },
  nombre: {
    type: DataTypes.STRING(80),
    allowNull: false,
  },
  apellido: {
    type: DataTypes.STRING(80),
    allowNull: false,
  },
  correo: {
    type: DataTypes.STRING(120),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  rol: {
    type: DataTypes.ENUM('super_admin', 'admin', 'vendedor', 'analista', 'soporte'),
    defaultValue: 'vendedor',
  },
  sucursal: {
    type: DataTypes.STRING(80),
    defaultValue: 'Central',
  },
  estado: {
    type: DataTypes.ENUM('activo', 'inactivo', 'suspendido'),
    defaultValue: 'activo',
  },
  ultimo_login: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'usuarios',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

module.exports = Usuario;
