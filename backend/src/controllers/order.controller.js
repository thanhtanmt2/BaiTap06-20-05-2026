const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Order, OrderItem, CartItem, Product } = require('../models');

const AUTO_CONFIRM_MINUTES = 30;

const getElapsedMinutes = (date) => {
  const diffMs = Date.now() - new Date(date).getTime();
  return diffMs / (60 * 1000);
};

const shouldAutoConfirm = (order) => (
  order.status === 'new' && getElapsedMinutes(order.created_at) >= AUTO_CONFIRM_MINUTES
);

const applyAutoConfirm = async (orders) => {
  const now = new Date();
  const idsToConfirm = orders.filter(shouldAutoConfirm).map((order) => order.id);
  if (idsToConfirm.length) {
    await Order.update(
      { status: 'confirmed', confirmed_at: now, updated_at: now },
      { where: { id: { [Op.in]: idsToConfirm } } }
    );
  }

  return orders.map((order) => {
    const plain = order.get({ plain: true });
    if (!idsToConfirm.includes(order.id)) return plain;
    return { ...plain, status: 'confirmed', confirmed_at: now };
  });
};

const buildOrderInclude = () => ([
  {
    model: OrderItem,
    include: [{ model: Product, attributes: ['id', 'name', 'image_url'] }],
  },
]);

const restoreStockForOrder = async (orderId, transaction) => {
  const items = await OrderItem.findAll({
    where: { order_id: orderId },
    include: [{ model: Product }],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  for (const item of items) {
    if (!item.Product) continue;
    const nextSold = Math.max(0, item.Product.quantity_sold - item.quantity);
    await item.Product.update(
      {
        quantity_stock: item.Product.quantity_stock + item.quantity,
        quantity_sold: nextSold,
      },
      { transaction }
    );
  }
};

const createOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const {
      shipping_name,
      shipping_phone,
      shipping_address,
      note = null,
      payment_method = 'cod',
    } = req.body;

    if (!shipping_name || !shipping_phone || !shipping_address) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Vui long nhap day du thong tin giao hang',
      });
    }

    if (payment_method !== 'cod') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Hien chi ho tro thanh toan COD',
      });
    }

    const cartItems = await CartItem.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Product }],
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!cartItems.length) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Gio hang trong, khong the dat hang',
      });
    }

    for (const item of cartItems) {
      if (!item.Product) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'San pham trong gio hang khong ton tai',
        });
      }

      if (!item.Product.is_active) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: 'San pham hien khong con kinh doanh',
        });
      }

      if (item.Product.quantity_stock < item.quantity) {
        await transaction.rollback();
        return res.status(400).json({
          success: false,
          message: `San pham ${item.Product.name} khong du so luong`,
        });
      }
    }

    const totalAmount = cartItems.reduce((sum, item) => (
      sum + (Number(item.Product.price) * item.quantity)
    ), 0);

    const order = await Order.create(
      {
        user_id: req.user.id,
        status: 'new',
        payment_method: 'cod',
        payment_status: 'unpaid',
        total_amount: totalAmount,
        shipping_name,
        shipping_phone,
        shipping_address,
        note,
      },
      { transaction }
    );

    const orderItemsPayload = cartItems.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      price: Number(item.Product.price),
      product_name: item.Product.name,
      product_image: item.Product.image_url || null,
      product_size: item.Product.size || null,
      product_color: item.Product.color || null,
    }));

    await OrderItem.bulkCreate(orderItemsPayload, { transaction });

    for (const item of cartItems) {
      await item.Product.update(
        {
          quantity_stock: item.Product.quantity_stock - item.quantity,
          quantity_sold: item.Product.quantity_sold + item.quantity,
        },
        { transaction }
      );
    }

    await CartItem.destroy({ where: { user_id: req.user.id }, transaction });

    await transaction.commit();

    const created = await Order.findByPk(order.id, { include: buildOrderInclude() });
    return res.status(201).json({
      success: true,
      message: 'Dat hang thanh cong',
      data: created,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    return res.status(500).json({
      success: false,
      message: 'Loi server khi dat hang',
      error: error.message,
    });
  }
};

const listMyOrders = async (req, res) => {
  try {
    const orders = await Order.findAll({
      where: { user_id: req.user.id },
      include: buildOrderInclude(),
      order: [['created_at', 'DESC']],
    });

    const normalized = await applyAutoConfirm(orders);

    return res.status(200).json({
      success: true,
      data: Array.isArray(normalized) ? normalized : orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Loi server khi lay don hang',
      error: error.message,
    });
  }
};

const getMyOrder = async (req, res) => {
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      include: buildOrderInclude(),
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay don hang',
      });
    }

    if (shouldAutoConfirm(order)) {
      const now = new Date();
      await order.update({ status: 'confirmed', confirmed_at: now, updated_at: now });
      order.status = 'confirmed';
      order.confirmed_at = now;
    }

    return res.status(200).json({
      success: true,
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Loi server khi lay don hang',
      error: error.message,
    });
  }
};

const cancelMyOrder = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const order = await Order.findOne({
      where: { id: req.params.id, user_id: req.user.id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!order) {
      await transaction.rollback();
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay don hang',
      });
    }

    if (shouldAutoConfirm(order)) {
      const now = new Date();
      await order.update({ status: 'confirmed', confirmed_at: now, updated_at: now }, { transaction });
    }

    if (['cancelled', 'delivered', 'shipping'].includes(order.status)) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Don hang khong the huy o trang thai hien tai',
      });
    }

    if (order.status === 'preparing') {
      await order.update({ status: 'cancel_requested', updated_at: new Date() }, { transaction });
      await transaction.commit();
      return res.status(200).json({
        success: true,
        message: 'Da gui yeu cau huy don den shop',
        data: order,
      });
    }

    if (order.status === 'cancel_requested') {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Don hang dang cho xu ly huy',
      });
    }

    const elapsedMinutes = getElapsedMinutes(order.created_at);
    if (elapsedMinutes > AUTO_CONFIRM_MINUTES) {
      await transaction.rollback();
      return res.status(400).json({
        success: false,
        message: 'Qua thoi gian huy don (30 phut sau khi dat)',
      });
    }

    await restoreStockForOrder(order.id, transaction);
    await order.update({ status: 'cancelled', cancelled_at: new Date(), updated_at: new Date() }, { transaction });
    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: 'Huy don hang thanh cong',
      data: order,
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    return res.status(500).json({
      success: false,
      message: 'Loi server khi huy don',
      error: error.message,
    });
  }
};

const listOrdersAdmin = async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};

    const orders = await Order.findAll({
      where,
      include: buildOrderInclude(),
      order: [['created_at', 'DESC']],
    });

    const normalized = await applyAutoConfirm(orders);

    return res.status(200).json({
      success: true,
      data: Array.isArray(normalized) ? normalized : orders,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Loi server khi lay danh sach don hang',
      error: error.message,
    });
  }
};

const updateOrderStatusAdmin = async (req, res) => {
  try {
    const { status } = req.body;
    const order = await Order.findByPk(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay don hang',
      });
    }

    const allowedStatuses = [
      'new',
      'confirmed',
      'preparing',
      'shipping',
      'delivered',
      'cancel_requested',
      'cancelled',
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trang thai khong hop le',
      });
    }

    const transitions = {
      new: ['confirmed', 'cancelled'],
      confirmed: ['preparing', 'cancelled'],
      preparing: ['shipping', 'cancel_requested', 'cancelled'],
      shipping: ['delivered'],
      delivered: [],
      cancel_requested: ['cancelled', 'preparing'],
      cancelled: [],
    };

    if (!transitions[order.status].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Khong the chuyen trang thai nay',
      });
    }

    if (status === 'cancelled') {
      const transaction = await sequelize.transaction();
      try {
        await restoreStockForOrder(order.id, transaction);
        const updates = { status, updated_at: new Date(), cancelled_at: new Date() };
        await order.update(updates, { transaction });
        await transaction.commit();
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    } else {
      const updates = { status, updated_at: new Date() };
      if (status === 'confirmed') updates.confirmed_at = new Date();
      await order.update(updates);
    }

    return res.status(200).json({
      success: true,
      message: 'Cap nhat trang thai don hang thanh cong',
      data: order,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Loi server khi cap nhat don hang',
      error: error.message,
    });
  }
};

module.exports = {
  createOrder,
  listMyOrders,
  getMyOrder,
  cancelMyOrder,
  listOrdersAdmin,
  updateOrderStatusAdmin,
};
