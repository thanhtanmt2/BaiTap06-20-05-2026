const express = require('express');
const router = express.Router();
const {
  getMyShop,
  registerShop,
  listShops,
  updateShopStatus,
} = require('../controllers/shop.controller');
const { authenticateToken, authorizeAdmin } = require('../middlewares/auth');

// User routes
router.get('/me', authenticateToken, getMyShop);
router.post('/register', authenticateToken, registerShop);

// Admin routes
router.get('/admin', authenticateToken, authorizeAdmin, listShops);
router.put('/admin/:id/status', authenticateToken, authorizeAdmin, updateShopStatus);

module.exports = router;
