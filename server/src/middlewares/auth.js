// ============================================================
// server/src/middlewares/auth.js
// Middlewares de autenticación JWT y autorización por rol
// ============================================================
const jwt = require('jsonwebtoken');

/**
 * Verifica que el request tenga un JWT válido en el header.
 * Si es válido, adjunta el payload decodificado en req.usuario.
 */
const verificarToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      ok: false,
      mensaje: 'Acceso denegado. No se proporcionó token de autenticación.',
    });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = payload; // { id, correo, rol, nombre }
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ ok: false, mensaje: 'Token expirado. Por favor inicia sesión nuevamente.' });
    }
    return res.status(403).json({ ok: false, mensaje: 'Token inválido.' });
  }
};

/**
 * Verifica que el usuario autenticado tenga uno de los roles permitidos.
 * Uso: router.get('/ruta', verificarToken, autorizar('admin', 'super_admin'), controller)
 */
const autorizar = (...rolesPermitidos) => {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ ok: false, mensaje: 'No autenticado.' });
    }

    if (!rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        ok: false,
        mensaje: `Acceso denegado. Tu rol (${req.usuario.rol}) no tiene permiso para esta acción.`,
      });
    }

    next();
  };
};

module.exports = { verificarToken, autorizar };
