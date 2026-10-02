// ============================================================
// server/src/controllers/usuariosController.js
// CRUD completo de usuarios del panel admin
// ============================================================
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');

// ── GET /api/usuarios ─────────────────────────────────────────
const listar = async (req, res) => {
  try {
    const { rol, estado, buscar } = req.query;
    const where = {};

    if (rol) where.rol = rol;
    if (estado) where.estado = estado;

    const { Op } = require('sequelize');
    if (buscar) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { apellido: { [Op.like]: `%${buscar}%` } },
        { correo: { [Op.like]: `%${buscar}%` } },
      ];
    }

    const usuarios = await Usuario.findAll({
      where,
      attributes: { exclude: ['password_hash'] },
      order: [['created_at', 'DESC']],
    });

    return res.json({ ok: true, total: usuarios.length, usuarios });
  } catch (error) {
    console.error('[USUARIOS] Error al listar:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener usuarios.' });
  }
};

// ── GET /api/usuarios/:id ─────────────────────────────────────
const obtener = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id, {
      attributes: { exclude: ['password_hash'] },
    });
    if (!usuario) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });
    return res.json({ ok: true, usuario });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener usuario.' });
  }
};

// ── POST /api/usuarios ────────────────────────────────────────
const crear = async (req, res) => {
  try {
    const { nombre, apellido, correo, password, rol, sucursal } = req.body;

    if (!nombre || !apellido || !correo || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan campos requeridos.' });
    }

    const existe = await Usuario.findOne({ where: { correo: correo.toLowerCase() } });
    if (existe) {
      return res.status(409).json({ ok: false, mensaje: 'Ya existe un usuario con ese correo.' });
    }

    const password_hash = await bcrypt.hash(password, 12);

    const nuevoUsuario = await Usuario.create({
      nombre, apellido,
      correo: correo.toLowerCase().trim(),
      password_hash,
      rol: rol || 'vendedor',
      sucursal: sucursal || 'Central',
    });

    const { password_hash: _, ...datos } = nuevoUsuario.toJSON();
    return res.status(201).json({ ok: true, mensaje: 'Usuario creado correctamente.', usuario: datos });
  } catch (error) {
    console.error('[USUARIOS] Error al crear:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al crear usuario.' });
  }
};

// ── PUT /api/usuarios/:id ─────────────────────────────────────
const actualizar = async (req, res) => {
  try {
    const { nombre, apellido, correo, rol, sucursal, password } = req.body;
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });

    const actualizacion = { nombre, apellido, correo, rol, sucursal };

    if (password) {
      actualizacion.password_hash = await bcrypt.hash(password, 12);
    }

    await usuario.update(actualizacion);
    const { password_hash: _, ...datos } = usuario.toJSON();
    return res.json({ ok: true, mensaje: 'Usuario actualizado.', usuario: datos });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al actualizar usuario.' });
  }
};

// ── PATCH /api/usuarios/:id/estado ────────────────────────────
const cambiarEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    const validos = ['activo', 'inactivo', 'suspendido'];
    if (!validos.includes(estado)) {
      return res.status(400).json({ ok: false, mensaje: `Estado inválido. Use: ${validos.join(', ')}` });
    }
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });

    await usuario.update({ estado });
    return res.json({ ok: true, mensaje: `Usuario ${estado} correctamente.` });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al cambiar estado.' });
  }
};

// ── DELETE /api/usuarios/:id ──────────────────────────────────
const eliminar = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) return res.status(404).json({ ok: false, mensaje: 'Usuario no encontrado.' });

    // No permitir eliminar super_admin
    if (usuario.rol === 'super_admin') {
      return res.status(403).json({ ok: false, mensaje: 'No se puede eliminar un Super Admin.' });
    }

    await usuario.destroy();
    return res.json({ ok: true, mensaje: 'Usuario eliminado correctamente.' });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al eliminar usuario.' });
  }
};

module.exports = { listar, obtener, crear, actualizar, cambiarEstado, eliminar };
