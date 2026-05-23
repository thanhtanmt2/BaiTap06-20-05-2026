const express = require('express');
const router = express.Router();
const { CartItem, Product } = require('../models');
const { authenticateToken } = require('../middlewares/auth');

const buildInclude = () => ([
  {
    model: Product,
    attributes: ['id', 'name', 'price', 'image_url', 'quantity_stock', 'is_active', 'category', 'size', 'color']
  }
]);

// GET /api/cart
router.get('/', authenticateToken, async (req, res) => {
  try {
    const items = await CartItem.findAll({
      where: { user_id: req.user.id },
      include: buildInclude(),
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: items,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Loi server khi lay gio hang',
      error: error.message,
    });
  }
});

// POST /api/cart/items
router.post('/items', authenticateToken, async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const parsedQuantity = Number(quantity) || 1;

    if (!product_id) {
      return res.status(400).json({
        success: false,
        message: 'Thieu thong tin san pham',
      });
    }

    if (parsedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'So luong khong hop le',
      });
    }

    const product = await Product.findByPk(product_id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay san pham',
      });
    }

    const existing = await CartItem.findOne({
      where: { user_id: req.user.id, product_id },
    });

    if (existing) {
      await existing.update({
        quantity: existing.quantity + parsedQuantity,
        updated_at: new Date(),
      });
      const updated = await CartItem.findByPk(existing.id, { include: buildInclude() });
      return res.status(200).json({
        success: true,
        message: 'Cap nhat gio hang thanh cong',
        data: updated,
      });
    }

    const item = await CartItem.create({
      user_id: req.user.id,
      product_id,
      quantity: parsedQuantity,
    });

    const created = await CartItem.findByPk(item.id, { include: buildInclude() });

    return res.status(201).json({
      success: true,
      message: 'Them vao gio hang thanh cong',
      data: created,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Loi server khi them vao gio hang',
      error: error.message,
    });
  }
});

// PUT /api/cart/items/:id
router.put('/items/:id', authenticateToken, async (req, res) => {
  try {
    const { quantity } = req.body;
    const parsedQuantity = Number(quantity);

    if (!Number.isFinite(parsedQuantity) || parsedQuantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'So luong khong hop le',
      });
    }

    const item = await CartItem.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay san pham trong gio hang',
      });
    }

    await item.update({ quantity: parsedQuantity, updated_at: new Date() });
    const updated = await CartItem.findByPk(item.id, { include: buildInclude() });

    return res.status(200).json({
      success: true,
      message: 'Cap nhat so luong thanh cong',
      data: updated,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Loi server khi cap nhat gio hang',
      error: error.message,
    });
  }
});

// DELETE /api/cart/items/:id
router.delete('/items/:id', authenticateToken, async (req, res) => {
  try {
    const item = await CartItem.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay san pham trong gio hang',
      });
    }

    await item.destroy();

    return res.status(200).json({
      success: true,
      message: 'Da xoa khoi gio hang',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Loi server khi xoa gio hang',
      error: error.message,
    });
  }
});

// POST /api/cart/checkout
router.post('/checkout', authenticateToken, async (req, res) => {
  try {
    await CartItem.destroy({ where: { user_id: req.user.id } });

    return res.status(200).json({
      success: true,
      message: 'Dat hang thanh cong (gia lap)',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Loi server khi thanh toan',
      error: error.message,
    });
  }
});

module.exports = router;
