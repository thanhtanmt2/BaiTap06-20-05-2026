const express = require('express');
const router = express.Router();
const {
  getMyShipping,
  registerShipping,
  listShipping,
  updateShippingStatus,
} = require('../controllers/shipping.controller');
const { authenticateToken, authorizeAdmin } = require('../middlewares/auth');

// User routes
router.get('/me', authenticateToken, getMyShipping);
router.post('/register', authenticateToken, registerShipping);

// Admin routes
router.get('/admin', authenticateToken, authorizeAdmin, listShipping);
router.put('/admin/:id/status', authenticateToken, authorizeAdmin, updateShippingStatus);

module.exports = router;
