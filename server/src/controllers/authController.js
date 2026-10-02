// ============================================================
// server/src/controllers/authController.js
// Controlador de autenticación: login, logout, refresh
// ============================================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');

// ── Generar tokens ────────────────────────────────────────────
const generarAccessToken = (usuario) =>
  jwt.sign(
    { id: usuario.id, correo: usuario.correo, rol: usuario.rol, nombre: usuario.nombre },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

const generarRefreshToken = (usuario) =>
  jwt.sign(
    { id: usuario.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );

// ── POST /api/auth/login ──────────────────────────────────────
const login = async (req, res) => {
  try {
    const { correo, password } = req.body;

    if (!correo || !password) {
      return res.status(400).json({ ok: false, mensaje: 'Correo y contraseña son requeridos.' });
    }

    // Buscar usuario
    const usuario = await Usuario.findOne({ where: { correo: correo.toLowerCase().trim() } });

    if (!usuario) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas.' });
    }

    if (usuario.estado !== 'activo') {
      return res.status(403).json({ ok: false, mensaje: 'Tu cuenta está suspendida. Contacta al administrador.' });
    }

    // Verificar contraseña
    const passwordValida = await bcrypt.compare(password, usuario.password_hash);
    if (!passwordValida) {
      return res.status(401).json({ ok: false, mensaje: 'Credenciales inválidas.' });
    }

    // Actualizar último login
    await usuario.update({ ultimo_login: new Date() });

    // Generar tokens
    const accessToken = generarAccessToken(usuario);
    const refreshToken = generarRefreshToken(usuario);

    // Guardar refresh token en cookie HttpOnly segura
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 días en ms
    });

    return res.json({
      ok: true,
      mensaje: 'Inicio de sesión exitoso.',
      accessToken,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        correo: usuario.correo,
        rol: usuario.rol,
        sucursal: usuario.sucursal,
      },
    });
  } catch (error) {
    console.error('[AUTH] Error en login:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor.' });
  }
};

// ── POST /api/auth/logout ─────────────────────────────────────
const logout = (req, res) => {
  res.clearCookie('refreshToken');
  return res.json({ ok: true, mensaje: 'Sesión cerrada correctamente.' });
};

// ── POST /api/auth/refresh ────────────────────────────────────
const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.cookies;
    if (!refreshToken) {
      return res.status(401).json({ ok: false, mensaje: 'No se encontró refresh token.' });
    }

    const payload = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const usuario = await Usuario.findByPk(payload.id);

    if (!usuario || usuario.estado !== 'activo') {
      return res.status(401).json({ ok: false, mensaje: 'Usuario no válido.' });
    }

    const newAccessToken = generarAccessToken(usuario);
    return res.json({ ok: true, accessToken: newAccessToken });
  } catch (error) {
    return res.status(401).json({ ok: false, mensaje: 'Refresh token inválido o expirado.' });
  }
};

module.exports = { login, logout, refresh };
