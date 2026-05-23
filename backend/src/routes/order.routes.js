const express = require('express');
const router = express.Router();
const {
  createOrder,
  listMyOrders,
  getMyOrder,
  cancelMyOrder,
  listOrdersAdmin,
  updateOrderStatusAdmin,
} = require('../controllers/order.controller');
const { authenticateToken, authorizeAdmin } = require('../middlewares/auth');

// User routes
router.post('/', authenticateToken, createOrder);
router.get('/my', authenticateToken, listMyOrders);
router.get('/my/:id', authenticateToken, getMyOrder);
router.put('/my/:id/cancel', authenticateToken, cancelMyOrder);

// Admin routes
router.get('/admin', authenticateToken, authorizeAdmin, listOrdersAdmin);
router.put('/admin/:id/status', authenticateToken, authorizeAdmin, updateOrderStatusAdmin);

module.exports = router;
