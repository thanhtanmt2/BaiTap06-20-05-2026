const { Shop, User } = require('../models');

const getMyShop = async (req, res) => {
  try {
    const shop = await Shop.findOne({ where: { user_id: req.user.id } });
    return res.status(200).json({
      success: true,
      data: shop,
    });
  } catch (error) {
    console.error('Get My Shop Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Loi server khi lay thong tin shop',
    });
  }
};

const registerShop = async (req, res) => {
  try {
    const { name, description = null, address = null, phone = null } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Ten shop la bat buoc',
      });
    }

    let shop = await Shop.findOne({ where: { user_id: req.user.id } });

    if (!shop) {
      shop = await Shop.create({
        user_id: req.user.id,
        name,
        description,
        address,
        phone,
        status: 'pending',
      });
    } else {
      await shop.update({
        name,
        description,
        address,
        phone,
        status: 'pending',
        updated_at: new Date(),
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Dang ky shop thanh cong, vui long cho duyet',
      data: shop,
    });
  } catch (error) {
    console.error('Register Shop Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Loi server khi dang ky shop',
    });
  }
};

const listShops = async (req, res) => {
  try {
    const { status = 'pending' } = req.query;

    const shops = await Shop.findAll({
      where: { status },
      include: [{ model: User, attributes: ['id', 'email', 'name'] }],
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: shops,
    });
  } catch (error) {
    console.error('List Shops Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Loi server khi lay danh sach shop',
    });
  }
};

const updateShopStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Trang thai khong hop le',
      });
    }

    const shop = await Shop.findByPk(id);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay shop',
      });
    }

    await shop.update({ status, updated_at: new Date() });

    return res.status(200).json({
      success: true,
      message: 'Cap nhat trang thai shop thanh cong',
      data: shop,
    });
  } catch (error) {
    console.error('Update Shop Status Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Loi server khi cap nhat trang thai shop',
    });
  }
};

module.exports = {
  getMyShop,
  registerShop,
  listShops,
  updateShopStatus,
};
