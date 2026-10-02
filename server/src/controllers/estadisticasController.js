// ============================================================
// server/src/controllers/estadisticasController.js
// Consultas analíticas: KPIs, tendencias, rankings
// ============================================================
const { Op, fn, col, literal } = require('sequelize');
const sequelize = require('../config/database');
const { Venta, DetalleVenta } = require('../models/Venta');
const Juego = require('../models/Juego');

// Helper: obtener rango de fechas
const getRango = (periodo) => {
  const ahora = new Date();
  const inicio = new Date(ahora);

  switch (periodo) {
    case 'diario':
      inicio.setHours(0, 0, 0, 0);
      break;
    case 'semanal':
      inicio.setDate(ahora.getDate() - 7);
      break;
    case 'mensual':
      inicio.setDate(1); inicio.setHours(0, 0, 0, 0);
      break;
    case 'anual':
      inicio.setMonth(0, 1); inicio.setHours(0, 0, 0, 0);
      break;
    default:
      inicio.setDate(1);
  }
  return { desde: inicio, hasta: ahora };
};

// ── GET /api/estadisticas/resumen ─────────────────────────────
const resumen = async (req, res) => {
  try {
    const { periodo = 'mensual' } = req.query;
    const { desde, hasta } = getRango(periodo);

    const [ingresos, transacciones, totalJuegos, stockBajo] = await Promise.all([
      Venta.sum('total', {
        where: { estado: 'completada', created_at: { [Op.between]: [desde, hasta] } },
      }),
      Venta.count({
        where: { estado: 'completada', created_at: { [Op.between]: [desde, hasta] } },
      }),
      Juego.count(),
      Juego.count({ where: { estado: { [Op.in]: ['stock_bajo', 'agotado'] } } }),
    ]);

    const ticketPromedio = transacciones > 0 ? (ingresos / transacciones).toFixed(2) : 0;

    return res.json({
      ok: true,
      periodo,
      kpis: {
        ingresos_total: ingresos || 0,
        transacciones,
        ticket_promedio: Number(ticketPromedio),
        total_juegos: totalJuegos,
        alertas_stock: stockBajo,
      },
    });
  } catch (error) {
    console.error('[STATS] Error en resumen:', error);
    return res.status(500).json({ ok: false, mensaje: 'Error al calcular estadísticas.' });
  }
};

// ── GET /api/estadisticas/ventas ──────────────────────────────
const ventasPorPeriodo = async (req, res) => {
  try {
    const { periodo = 'mensual', sucursal } = req.query;
    const { desde, hasta } = getRango(periodo);

    const where = {
      estado: 'completada',
      created_at: { [Op.between]: [desde, hasta] },
    };
    if (sucursal) where.sucursal = sucursal;

    let agrupacion;
    switch (periodo) {
      case 'diario': agrupacion = fn('DATE_FORMAT', col('created_at'), '%H:00'); break;
      case 'semanal':
      case 'mensual': agrupacion = fn('DATE', col('created_at')); break;
      case 'anual': agrupacion = fn('DATE_FORMAT', col('created_at'), '%Y-%m'); break;
      default: agrupacion = fn('DATE', col('created_at'));
    }

    const datos = await Venta.findAll({
      attributes: [
        [agrupacion, 'etiqueta'],
        [fn('SUM', col('total')), 'ingresos'],
        [fn('COUNT', col('id')), 'transacciones'],
      ],
      where,
      group: ['etiqueta'],
      order: [[literal('etiqueta'), 'ASC']],
      raw: true,
    });

    return res.json({ ok: true, periodo, datos });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener datos de ventas.' });
  }
};

// ── GET /api/estadisticas/categorias ──────────────────────────
const ventasPorCategoria = async (req, res) => {
  try {
    const { desde, hasta } = getRango(req.query.periodo || 'mensual');

    const datos = await DetalleVenta.findAll({
      attributes: [
        [col('Juego.categoria'), 'categoria'],
        [fn('SUM', col('DetalleVenta.cantidad')), 'unidades'],
        [fn('SUM', literal('DetalleVenta.precio_unitario * DetalleVenta.cantidad')), 'ingresos'],
      ],
      include: [{
        model: Juego,
        attributes: [],
        required: true,
      }],
      group: ['Juego.categoria'],
      raw: true,
    });

    return res.json({ ok: true, datos });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener datos por categoría.' });
  }
};

// ── GET /api/estadisticas/top-juegos ──────────────────────────
const topJuegos = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const datos = await DetalleVenta.findAll({
      attributes: [
        'juego_id',
        'nombre_juego',
        [fn('SUM', col('cantidad')), 'unidades_vendidas'],
        [fn('SUM', literal('precio_unitario * cantidad')), 'ingresos'],
      ],
      group: ['juego_id', 'nombre_juego'],
      order: [[literal('unidades_vendidas'), 'DESC']],
      limit: Number(limit),
      raw: true,
    });

    return res.json({ ok: true, top: datos });
  } catch (error) {
    return res.status(500).json({ ok: false, mensaje: 'Error al obtener ranking.' });
  }
};

module.exports = { resumen, ventasPorPeriodo, ventasPorCategoria, topJuegos };
