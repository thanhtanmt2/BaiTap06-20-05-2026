const { ShippingRequest, User } = require('../models');

const getMyShipping = async (req, res) => {
  try {
    const shipping = await ShippingRequest.findOne({ where: { user_id: req.user.id } });
    return res.status(200).json({
      success: true,
      data: shipping,
    });
  } catch (error) {
    console.error('Get My Shipping Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Loi server khi lay thong tin van chuyen',
    });
  }
};

const registerShipping = async (req, res) => {
  try {
    const { provider_name, area = null, phone = null } = req.body;

    if (!provider_name) {
      return res.status(400).json({
        success: false,
        message: 'Ten don vi van chuyen la bat buoc',
      });
    }

    let shipping = await ShippingRequest.findOne({ where: { user_id: req.user.id } });

    if (!shipping) {
      shipping = await ShippingRequest.create({
        user_id: req.user.id,
        provider_name,
        area,
        phone,
        status: 'pending',
      });
    } else {
      await shipping.update({
        provider_name,
        area,
        phone,
        status: 'pending',
        updated_at: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Dang ky van chuyen thanh cong, vui long cho duyet',
      data: shipping,
    });
  } catch (error) {
    console.error('Register Shipping Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Loi server khi dang ky van chuyen',
    });
  }
};

const listShipping = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    const shipping = await ShippingRequest.findAll({
      where: { status },
      include: [{ model: User, attributes: ['id', 'email', 'name'] }],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: shipping,
    });
  } catch (error) {
    console.error('List Shipping Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Loi server khi lay danh sach van chuyen',
    });
  }
};

const updateShippingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trang thai khong hop le',
      });
    }

    const shipping = await ShippingRequest.findByPk(id);
    if (!shipping) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay dang ky van chuyen',
      });
    }

    await shipping.update({ status, updated_at: new Date() });

    return res.status(200).json({
      success: true,
      message: 'Cap nhat trang thai van chuyen thanh cong',
      data: shipping,
    });
  } catch (error) {
    console.error('Update Shipping Status Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Loi server khi cap nhat trang thai van chuyen',
    });
  }
};

module.exports = {
  getMyShipping,
  registerShipping,
  listShipping,
  updateShippingStatus,
};
