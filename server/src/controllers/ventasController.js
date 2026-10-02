// ============================================================
// server/src/controllers/ventasController.js
// Registro, consulta y gestión de ventas
// ============================================================
const { Op, fn, col, literal } = require('sequelize');
const { Venta, DetalleVenta } = require('../models/Venta');
const Juego = require('../models/Juego');

// ── GET /api/ventas ────────────────────────────────────────────
const listar = async (req, res) => {
  try {
    const { estado, metodo_pago, sucursal, desde, hasta, buscar, page = 1, limit = 20 } = req.query;
    const where = {};
    const offset = (Number(page) - 1) * Number(limit);

    if (estado) where.estado = estado;
    if (metodo_pago) where.metodo_pago = metodo_pago;
    if (sucursal) where.sucursal = sucursal;

    if (desde || hasta) {
      where.created_at = {};
      if (desde) where.created_at[Op.gte] = new Date(desde);
      if (hasta) where.created_at[Op.lte] = new Date(hasta + 'T23:59:59');
    }

    if (buscar) {
      where[Op.or] = [
        { orden_id: { [Op.like]: `%${buscar}%` } },
        { cliente_nombre: { [Op.like]: `%${buscar}%` } },
        { cliente_correo: { [Op.like]: `%${buscar}%` } },
      ];
    }

    const { count, rows } = await Venta.findAndCountAll({
      where,
      include: [{ model: DetalleVenta, as: 'detalles' }],
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset,
    });

    return res.json({
      ok: true, total: count,
      pagina: Number(page),
      paginas: Math.ceil(count / Number(limit)),
      ventas: rows,
    });
  } catch (error) {
    console.error('[VENTAS] Error al listar:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener ventas.' });
  }
};

// ── GET /api/ventas/:id ────────────────────────────────────────
const obtener = async (req, res) => {
  try {
    const venta = await Venta.findByPk(req.params.id, {
      include: [{ model: DetalleVenta, as: 'detalles' }],
    });
    if (!venta) return res.status(404).json({ ok: false, mensaje: 'Venta no encontrada.' });
    return res.json({ ok: true, venta });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener venta.' });
  }
};

// ── POST /api/ventas ───────────────────────────────────────────
const registrar = async (req, res) => {
  try {
    const { cliente_nombre, cliente_correo, sucursal, metodo_pago, items, usuario_id } = req.body;

    if (!cliente_nombre || !cliente_correo || !items || !items.length) {
      return res.status(400).json({ ok: false, mensaje: 'Faltan datos de la venta.' });
    }

    // Calcular total y verificar stock
    let total = 0;
    const detalles = [];

    for (const item of items) {
      const juego = await Juego.findByPk(item.juego_id);
      if (!juego) {
        return res.status(404).json({ ok: false, mensaje: `Juego ID ${item.juego_id} no encontrado.` });
      }
      if (juego.stock < item.cantidad) {
        return res.status(400).json({ ok: false, mensaje: `Stock insuficiente para "${juego.nombre}". Disponible: ${juego.stock}` });
      }
      total += parseFloat(juego.precio_venta) * item.cantidad;
      detalles.push({ juego, cantidad: item.cantidad });
    }

    // Crear la venta
    const venta = await Venta.create({
      cliente_nombre, cliente_correo,
      sucursal: sucursal || 'Online',
      metodo_pago: metodo_pago || 'tarjeta',
      total: total.toFixed(2),
      estado: 'completada',
      usuario_id,
    });

    // Crear detalles y descontar stock
    for (const { juego, cantidad } of detalles) {
      await DetalleVenta.create({
        venta_id: venta.id,
        juego_id: juego.id,
        nombre_juego: juego.nombre,
        cantidad,
        precio_unitario: juego.precio_venta,
      });
      await juego.update({ stock: juego.stock - cantidad });
    }

    return res.status(201).json({ ok: true, mensaje: 'Venta registrada correctamente.', venta });
  } catch (error) {
    console.error('[VENTAS] Error al registrar:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al registrar venta.' });
  }
};

// ── PATCH /api/ventas/:id/reembolso ───────────────────────────
const reembolsar = async (req, res) => {
  try {
    const venta = await Venta.findByPk(req.params.id, {
      include: [{ model: DetalleVenta, as: 'detalles' }],
    });
    if (!venta) return res.status(404).json({ ok: false, mensaje: 'Venta no encontrada.' });
    if (venta.estado === 'reembolsada') {
      return res.status(400).json({ ok: false, mensaje: 'Esta venta ya fue reembolsada.' });
    }

    // Restaurar stock
    for (const detalle of venta.detalles) {
      const juego = await Juego.findByPk(detalle.juego_id);
      if (juego) {
        await juego.update({ stock: juego.stock + detalle.cantidad });
      }
    }

    await venta.update({ estado: 'reembolsada' });
    return res.json({ ok: true, mensaje: 'Reembolso procesado y stock restaurado.' });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al procesar reembolso.' });
  }
};

module.exports = { listar, obtener, registrar, reembolsar };
