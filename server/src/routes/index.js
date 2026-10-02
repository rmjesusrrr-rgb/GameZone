// ============================================================
// server/src/routes/index.js
// Router principal — agrupa todas las rutas de la API
// ============================================================
const { Router } = require('express');
const { verificarToken, autorizar } = require('../middlewares/auth');

// Controladores
const authCtrl          = require('../controllers/authController');
const usuariosCtrl      = require('../controllers/usuariosController');
const inventarioCtrl    = require('../controllers/inventarioController');
const ventasCtrl        = require('../controllers/ventasController');
const estadisticasCtrl  = require('../controllers/estadisticasController');

const router = Router();

// ── Rutas de Autenticación ────────────────────────────────────
router.post('/auth/login',   authCtrl.login);
router.post('/auth/logout',  verificarToken, authCtrl.logout);
router.post('/auth/refresh', authCtrl.refresh);

// ── Rutas de Usuarios (Solo Admin+) ──────────────────────────
router.get   ('/usuarios',          verificarToken, autorizar('super_admin','admin'), usuariosCtrl.listar);
router.get   ('/usuarios/:id',      verificarToken, autorizar('super_admin','admin'), usuariosCtrl.obtener);
router.post  ('/usuarios',          verificarToken, autorizar('super_admin','admin'), usuariosCtrl.crear);
router.put   ('/usuarios/:id',      verificarToken, autorizar('super_admin','admin'), usuariosCtrl.actualizar);
router.patch ('/usuarios/:id/estado', verificarToken, autorizar('super_admin','admin'), usuariosCtrl.cambiarEstado);
router.delete('/usuarios/:id',      verificarToken, autorizar('super_admin'), usuariosCtrl.eliminar);

// ── Rutas de Inventario ───────────────────────────────────────
router.get   ('/juegos',              inventarioCtrl.listar);   // Público para la tienda
router.get   ('/juegos/:id',          inventarioCtrl.obtener);  // Público
router.post  ('/juegos',              verificarToken, autorizar('super_admin','admin','vendedor'), inventarioCtrl.crear);
router.put   ('/juegos/:id',          verificarToken, autorizar('super_admin','admin','vendedor'), inventarioCtrl.actualizar);
router.patch ('/juegos/:id/stock',    verificarToken, autorizar('super_admin','admin','vendedor'), inventarioCtrl.actualizarStock);
router.delete('/juegos/:id',          verificarToken, autorizar('super_admin','admin'), inventarioCtrl.eliminar);

// ── Rutas de Ventas ───────────────────────────────────────────
router.get   ('/ventas',              verificarToken, autorizar('super_admin','admin','vendedor','soporte'), ventasCtrl.listar);
router.get   ('/ventas/:id',          verificarToken, autorizar('super_admin','admin','vendedor','soporte'), ventasCtrl.obtener);
router.post  ('/ventas',              verificarToken, autorizar('super_admin','admin','vendedor'), ventasCtrl.registrar);
router.patch ('/ventas/:id/reembolso',verificarToken, autorizar('super_admin','admin'), ventasCtrl.reembolsar);

// ── Rutas de Estadísticas ─────────────────────────────────────
router.get('/estadisticas/resumen',    verificarToken, autorizar('super_admin','admin','analista'), estadisticasCtrl.resumen);
router.get('/estadisticas/ventas',     verificarToken, autorizar('super_admin','admin','analista'), estadisticasCtrl.ventasPorPeriodo);
router.get('/estadisticas/categorias', verificarToken, autorizar('super_admin','admin','analista'), estadisticasCtrl.ventasPorCategoria);
router.get('/estadisticas/top-juegos', verificarToken, autorizar('super_admin','admin','analista'), estadisticasCtrl.topJuegos);

module.exports = router;
