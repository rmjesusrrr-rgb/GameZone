// ============================================================
// server/src/controllers/inventarioController.js
// CRUD del catálogo de juegos (inventario)
// ============================================================
const { Op } = require('sequelize');
const Juego = require('../models/Juego');

// ── GET /api/juegos ────────────────────────────────────────────
const listar = async (req, res) => {
  try {
    const { categoria, plataforma, estado, buscar, page = 1, limit = 30 } = req.query;
    const where = {};
    const offset = (Number(page) - 1) * Number(limit);

    if (categoria) where.categoria = categoria;
    if (plataforma) where.plataforma = plataforma;
    if (estado) where.estado = estado;
    if (buscar) {
      where[Op.or] = [
        { nombre: { [Op.like]: `%${buscar}%` } },
        { desarrolladora: { [Op.like]: `%${buscar}%` } },
      ];
    }

    const { count, rows } = await Juego.findAndCountAll({
      where,
      order: [['categoria', 'ASC'], ['nombre', 'ASC']],
      limit: Number(limit),
      offset,
    });

    return res.json({
      ok: true,
      total: count,
      pagina: Number(page),
      paginas: Math.ceil(count / Number(limit)),
      juegos: rows,
    });
  } catch (error) {
    console.error('[INVENTARIO] Error al listar:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener catálogo.' });
  }
};

// ── GET /api/juegos/:id ────────────────────────────────────────
const obtener = async (req, res) => {
  try {
    const juego = await Juego.findByPk(req.params.id);
    if (!juego) return res.status(404).json({ ok: false, mensaje: 'Juego no encontrado.' });
    return res.json({ ok: true, juego });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener juego.' });
  }
};

// ── POST /api/juegos ───────────────────────────────────────────
const crear = async (req, res) => {
  try {
    const { nombre, desarrolladora, categoria, plataforma, tags, precio_costo, precio_venta, stock, rating, anio, imagen_url, tienda_url } = req.body;

    if (!nombre || !desarrolladora || !categoria || !plataforma || !precio_venta || !anio || !tienda_url) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan campos requeridos.' });
    }

    const juego = await Juego.create({
      nombre, desarrolladora, categoria, plataforma,
      tags: tags || [],
      precio_costo: precio_costo || 0,
      precio_venta, stock: stock || 0,
      rating: rating || 0, anio,
      imagen_url, tienda_url,
    });

    return res.status(201).json({ ok: true, mensaje: 'Juego agregado al catálogo.', juego });
  } catch (error) {
    console.error('[INVENTARIO] Error al crear:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al agregar juego.' });
  }
};

// ── PUT /api/juegos/:id ────────────────────────────────────────
const actualizar = async (req, res) => {
  try {
    const juego = await Juego.findByPk(req.params.id);
    if (!juego) return res.status(404).json({ ok: false, mensaje: 'Juego no encontrado.' });
    await juego.update(req.body);
    return res.json({ ok: true, mensaje: 'Juego actualizado.', juego });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al actualizar juego.' });
  }
};

// ── PATCH /api/juegos/:id/stock ────────────────────────────────
const actualizarStock = async (req, res) => {
  try {
    const { stock } = req.body;
    if (stock === undefined || stock < 0) {
      return res.status(400).json({ ok: false, mensaje: 'Stock inválido.' });
    }
    const juego = await Juego.findByPk(req.params.id);
    if (!juego) return res.status(404).json({ ok: false, mensaje: 'Juego no encontrado.' });
    await juego.update({ stock: Number(stock) });
    return res.json({ ok: true, mensaje: 'Stock actualizado.', nuevo_estado: juego.estado, stock: juego.stock });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al actualizar stock.' });
  }
};

// ── DELETE /api/juegos/:id ─────────────────────────────────────
const eliminar = async (req, res) => {
  try {
    const juego = await Juego.findByPk(req.params.id);
    if (!juego) return res.status(404).json({ ok: false, mensaje: 'Juego no encontrado.' });
    await juego.destroy();
    return res.json({ ok: true, mensaje: 'Juego eliminado del catálogo.' });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al eliminar juego.' });
  }
};

module.exports = { listar, obtener, crear, actualizar, actualizarStock, eliminar };
