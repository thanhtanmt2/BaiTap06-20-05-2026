const express = require('express');
const router = express.Router();
const { Product, Shop } = require('../models');
const { Op } = require('sequelize');
const { authenticateToken } = require('../middlewares/auth');
const productUpload = require('../middlewares/productUpload');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

const isCloudinaryReady = () => (
  !!process.env.CLOUDINARY_CLOUD_NAME
  && !!process.env.CLOUDINARY_API_KEY
  && !!process.env.CLOUDINARY_API_SECRET
);

const uploadFromBuffer = (buffer) => new Promise((resolve, reject) => {
  const uploadStream = cloudinary.uploader.upload_stream(
    { folder: 'shop_products' },
    (error, result) => {
      if (error) return reject(error);
      return resolve(result);
    }
  );

  Readable.from(buffer).pipe(uploadStream);
});

/**
 * @route   POST /api/products/upload-image
 * @desc    Upload product image to Cloudinary
 * @access  Private (User)
 */
router.post('/upload-image', authenticateToken, productUpload.single('image'), async (req, res) => {
  try {
    if (!isCloudinaryReady()) {
      return res.status(500).json({
        success: false,
        message: 'Cloudinary chua duoc cau hinh',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui long chon file anh',
      });
    }

    const shop = await Shop.findOne({ where: { user_id: req.user.id } });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Ban chua dang ky shop',
      });
    }

    if (shop.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Shop chua duoc duyet',
      });
    }

    const result = await uploadFromBuffer(req.file.buffer);

    return res.status(200).json({
      success: true,
      data: {
        url: result.secure_url,
        public_id: result.public_id,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Loi server khi upload anh',
      error: error.message,
    });
  }
});

/**
 * @route   POST /api/products
 * @desc    Create product for approved shop
 * @access  Private (User)
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      category,
      description = null,
      price,
      color,
      size,
      quantity_stock = 0,
      image_url = null,
    } = req.body;

    if (!name || !category || !price || !color || !size) {
      return res.status(400).json({
        success: false,
        message: 'Vui long nhap day du thong tin san pham',
      });
    }

    const parsedPrice = Number(price);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Gia san pham khong hop le',
      });
    }

    const shop = await Shop.findOne({ where: { user_id: req.user.id } });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Ban chua dang ky shop',
      });
    }

    if (shop.status !== 'approved') {
      return res.status(403).json({
        success: false,
        message: 'Shop chua duoc duyet',
      });
    }

    const product = await Product.create({
      name,
      category,
      description,
      price: parsedPrice,
      color,
      size,
      quantity_stock: Number(quantity_stock) || 0,
      image_url,
      shop_id: shop.id,
      is_active: true,
    });

    return res.status(201).json({
      success: true,
      message: 'Dang san pham thanh cong',
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Loi server khi dang san pham',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/products/my
 * @desc    Get products for current shop
 * @access  Private (User)
 */
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const shop = await Shop.findOne({ where: { user_id: req.user.id } });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Ban chua dang ky shop',
      });
    }

    const products = await Product.findAll({
      where: { shop_id: shop.id },
      order: [['created_at', 'DESC']],
    });

    return res.status(200).json({
      success: true,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Loi server khi lay san pham',
      error: error.message,
    });
  }
});

/**
 * @route   PATCH /api/products/:id/status
 * @desc    Update product active status for current shop
 * @access  Private (User)
 */
router.patch('/:id/status', authenticateToken, async (req, res) => {
  try {
    const { is_active } = req.body;
    const normalizedStatus = typeof is_active === 'string'
      ? is_active === 'true'
      : is_active;

    if (typeof normalizedStatus !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Trang thai khong hop le',
      });
    }

    const shop = await Shop.findOne({ where: { user_id: req.user.id } });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Ban chua dang ky shop',
      });
    }

    const product = await Product.findOne({
      where: { id: req.params.id, shop_id: shop.id },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay san pham',
      });
    }

    await product.update({ is_active: normalizedStatus });

    return res.status(200).json({
      success: true,
      message: 'Cap nhat trang thai san pham thanh cong',
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Loi server khi cap nhat san pham',
      error: error.message,
    });
  }
});

/**
 * @route   PUT /api/products/:id
 * @desc    Update product for current shop
 * @access  Private (User)
 */
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const {
      name,
      category,
      description = null,
      price,
      color,
      size,
      quantity_stock = 0,
      image_url = null,
    } = req.body;

    if (!name || !category || !price || !color || !size) {
      return res.status(400).json({
        success: false,
        message: 'Vui long nhap day du thong tin san pham',
      });
    }

    const parsedPrice = Number(price);
    if (Number.isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Gia san pham khong hop le',
      });
    }

    const shop = await Shop.findOne({ where: { user_id: req.user.id } });
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: 'Ban chua dang ky shop',
      });
    }

    const product = await Product.findOne({
      where: { id: req.params.id, shop_id: shop.id },
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Khong tim thay san pham',
      });
    }

    await product.update({
      name,
      category,
      description,
      price: parsedPrice,
      color,
      size,
      quantity_stock: Number(quantity_stock) || 0,
      image_url,
    });

    return res.status(200).json({
      success: true,
      message: 'Cap nhat san pham thanh cong',
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Loi server khi cap nhat san pham',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/products
 * @desc    Get all products with search, filter and pagination
 * @access  Public
 * @query   search, category, size, color, priceMin, priceMax, sort, page, limit
 */
router.get('/', async (req, res) => {
  try {
    const {
      search = '',
      category = '',
      size = '',
      color = '',
      priceMin = 0,
      priceMax = 999999,
      sort = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    const offset = (page - 1) * limit;
    let where = { is_active: true };
    let order = [['created_at', 'DESC']];

    // Search by name
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    // Filter by category
    if (category) {
      where.category = category;
    }

    // Filter by size
    if (size) {
      where.size = size;
    }

    // Filter by color
    if (color) {
      where.color = { [Op.like]: `%${color}%` };
    }

    // Filter by price range
    if (priceMin || priceMax) {
      where.price = {
        [Op.between]: [priceMin, priceMax]
      };
    }

    // Sort options
    switch (sort) {
      case 'price_low':
        order = [['price', 'ASC']];
        break;
      case 'price_high':
        order = [['price', 'DESC']];
        break;
      case 'rating':
        order = [['rating', 'DESC']];
        break;
      case 'best_seller':
        order = [['quantity_sold', 'DESC']];
        break;
      case 'trending':
        order = [['quantity_sold_week', 'DESC']];
        break;
      default:
        order = [['created_at', 'DESC']];
    }

    const { count, rows } = await Product.findAndCountAll({
      where,
      order,
      limit: parseInt(limit),
      offset: parseInt(offset),
      attributes: {
        exclude: ['description']
      }
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching products',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/products/categories/list
 * @desc    Get all available categories
 * @access  Public
 */
router.get('/categories/list', async (req, res) => {
  try {
    const categories = [
      'shirt', 'pants', 'dress', 'jacket', 'skirt',
      'shorts', 'hoodie', 'sweater', 'coat', 'accessories'
    ];

    const productsCount = await Promise.all(
      categories.map(cat =>
        Product.count({ where: { category: cat, is_active: true } })
      )
    );

    const data = categories.map((cat, idx) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      value: cat,
      count: productsCount[idx]
    }));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching categories',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/products/sizes/list
 * @desc    Get all available sizes
 * @access  Public
 */
router.get('/sizes/list', async (req, res) => {
  try {
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

    const productsCount = await Promise.all(
      sizes.map(size =>
        Product.count({ where: { size, is_active: true } })
      )
    );

    const data = sizes.map((size, idx) => ({
      name: size,
      value: size,
      count: productsCount[idx]
    }));

    res.json({
      success: true,
      data
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching sizes',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/products/trending
 * @desc    Get trending products
 * @access  Public
 */
router.get('/trending', async (req, res) => {
  try {
    const products = await Product.findAll({
      where: { is_active: true },
      order: [['quantity_sold_week', 'DESC']],
      limit: 8,
      attributes: {
        exclude: ['description']
      }
    });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching trending products',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/products/best-sellers
 * @desc    Get best seller products
 * @access  Public
 * @query   limit (default: 10)
 */
router.get('/best-sellers', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const products = await Product.findAll({
      where: { is_active: true },
      order: [['quantity_sold', 'DESC']],
      limit,
      attributes: {
        exclude: ['description']
      }
    });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching best sellers',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/products/most-viewed
 * @desc    Get most viewed products
 * @access  Public
 * @query   limit (default: 10)
 */
router.get('/most-viewed', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    
    const products = await Product.findAll({
      where: { is_active: true },
      order: [['quantity_viewed', 'DESC']],
      limit,
      attributes: {
        exclude: ['description']
      }
    });

    res.json({
      success: true,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching most viewed products',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/products/:id
 * @desc    Get product by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findByPk(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    res.json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching product',
      error: error.message
    });
  }
});

module.exports = router;
