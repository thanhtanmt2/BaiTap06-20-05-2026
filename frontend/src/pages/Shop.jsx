import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../services/axiosClient';
import ProductCarousel from '../components/ProductCarousel';
import './Shop.css';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000000]);
  const [sortBy, setSortBy] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [categories, setCategories] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [pagination, setPagination] = useState({});
  
  // New state for carousels and lazy loading
  const [bestSellers, setBestSellers] = useState([]);
  const [mostViewed, setMostViewed] = useState([]);
  const [loadingBestSellers, setLoadingBestSellers] = useState(false);
  const [loadingMostViewed, setLoadingMostViewed] = useState(false);
  const [useLazyLoad, setUseLazyLoad] = useState(false);
  const observerTarget = useRef(null);
  const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);
  const [cartMessage, setCartMessage] = useState('');

  const itemsPerPage = 12;

  // Fetch categories and carousels on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data } = await axiosClient.get('/products/categories/list');
        if (data.success) {
          setCategories(data.data);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    const fetchSizes = async () => {
      try {
        const { data } = await axiosClient.get('/products/sizes/list');
        if (data.success) {
          setSizes(data.data);
        }
      } catch (error) {
        console.error('Error fetching sizes:', error);
      }
    };

    const fetchBestSellers = async () => {
      try {
        setLoadingBestSellers(true);
        const { data } = await axiosClient.get('/products/best-sellers?limit=10');
        if (data.success) {
          setBestSellers(data.data);
        }
      } catch (error) {
        console.error('Error fetching best sellers:', error);
      } finally {
        setLoadingBestSellers(false);
      }
    };

    const fetchMostViewed = async () => {
      try {
        setLoadingMostViewed(true);
        const { data } = await axiosClient.get('/products/most-viewed?limit=10');
        if (data.success) {
          setMostViewed(data.data);
        }
      } catch (error) {
        console.error('Error fetching most viewed:', error);
      } finally {
        setLoadingMostViewed(false);
      }
    };

    fetchCategories();
    fetchSizes();
    fetchBestSellers();
    fetchMostViewed();
  }, []);

  // Fetch products
  useEffect(() => {
    fetchProducts();
  }, [search, selectedCategory, selectedSize, selectedColor, priceRange, sortBy, currentPage]);

  const handleAddToCart = async (productId) => {
    setCartMessage('');
    try {
      const { data } = await axiosClient.post('/cart/items', { product_id: productId, quantity: 1 });
      if (data.success) {
        setCartMessage(data.message || 'Da them vao gio hang');
      }
    } catch (error) {
      setCartMessage(error.response?.data?.message || 'Them vao gio hang that bai');
    }
  };

  // Setup Lazy Loading Observer
  useEffect(() => {
    if (!useLazyLoad || !observerTarget.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && pagination.hasNextPage && !loading) {
          setCurrentPage((prev) => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(observerTarget.current);
    return () => observer.disconnect();
  }, [useLazyLoad, pagination.hasNextPage, loading]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = {
        search,
        category: selectedCategory,
        size: selectedSize,
        color: selectedColor,
        priceMin: priceRange[0],
        priceMax: priceRange[1],
        sort: sortBy,
        page: currentPage,
        limit: itemsPerPage
      };

      const { data } = await axiosClient.get('/products', { params });

      if (data.success) {
        if (useLazyLoad && currentPage > 1) {
          // Lazy load: append products
          setProducts((prev) => [...prev, ...data.data]);
        } else {
          // Normal pagination: replace products
          setProducts(data.data);
        }
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleSizeChange = (size) => {
    setSelectedSize(size);
    setCurrentPage(1);
  };

  const handleColorChange = (e) => {
    setSelectedColor(e.target.value);
    setCurrentPage(1);
  };


  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSelectedSize('');
    setSelectedColor('');
    setPriceRange([0, 1000000]);
    setSortBy('newest');
    setCurrentPage(1);
  };

  return (
    <div className="shop-container">
      <div className="shop-header">
        <div className="shop-hero">
          <div className="shop-hero-text">
            <p className="shop-eyebrow">Bo suu tap moi</p>
            <h2>Tuyen chon do co ban moi ngay</h2>
            <p className="shop-subtitle">Trang phuc toi gian, mem mai va de phoi do cho moi ngay.</p>
          </div>
          <div className="shop-hero-metrics">
            <div className="metric-card">
              <span className="metric-value">120+</span>
              <span className="metric-label">Mau da chon</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">4.8★</span>
              <span className="metric-label">Danh gia trung binh</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">24h</span>
              <span className="metric-label">Giao nhanh</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Carousels */}
      <section className="carousels-section">
        <ProductCarousel
          title="Top 10 ban chay"
          icon="🔥"
          products={bestSellers}
          loading={loadingBestSellers}
          detailBasePath="/user/shop"
        />
        <ProductCarousel
          title="Top 10 xem nhieu"
          icon="👀"
          products={mostViewed}
          loading={loadingMostViewed}
          detailBasePath="/user/shop"
        />
      </section>

      <div className="shop-content">
        {/* Sidebar Filters */}
        <aside className="shop-sidebar">
          <div className="filter-section">
            <h3>Bo loc</h3>
            <button className="clear-filters-btn" onClick={clearFilters}>
              Xoa bo loc
            </button>
          </div>

          {/* Search */}
          <div className="filter-group">
            <label>Tim kiem</label>
            <input
              type="text"
              placeholder="Tim san pham..."
              value={search}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>

          {/* Category Filter */}
          <div className="filter-group">
            <label>Danh muc</label>
            <div className="category-options">
              <button
                className={`category-btn ${selectedCategory === '' ? 'active' : ''}`}
                onClick={() => handleCategoryChange('')}
              >
                Tat ca ({categories.reduce((sum, cat) => sum + cat.count, 0)})
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  className={`category-btn ${selectedCategory === cat.value ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(cat.value)}
                >
                  {cat.name} ({cat.count})
                </button>
              ))}
            </div>
          </div>

          {/* Size Filter */}
          <div className="filter-group">
            <label>Kich co</label>
            <div className="size-options">
              <button
                className={`size-btn ${selectedSize === '' ? 'active' : ''}`}
                onClick={() => handleSizeChange('')}
              >
                Tat ca
              </button>
              {sizes.map((size) => (
                <button
                  key={size.value}
                  className={`size-btn ${selectedSize === size.value ? 'active' : ''}`}
                  onClick={() => handleSizeChange(size.value)}
                >
                  {size.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color Filter */}
          <div className="filter-group">
            <label>Mau sac</label>
            <input
              type="text"
              placeholder="Nhap mau sac..."
              value={selectedColor}
              onChange={handleColorChange}
              className="color-input"
            />
          </div>

          {/* Price Filter */}
          <div className="filter-group">
            <label>Khoang gia</label>
            <div className="price-inputs">
              <input
                type="number"
                min="0"
                value={priceRange[0]}
                onChange={(e) => {
                  const value = Math.max(0, Number(e.target.value) || 0);
                  setPriceRange([value, Math.max(value, priceRange[1])]);
                  setCurrentPage(1);
                }}
                className="price-input"
                placeholder="Tu"
              />
              <span className="price-separator">-</span>
              <input
                type="number"
                min="0"
                value={priceRange[1]}
                onChange={(e) => {
                  const value = Math.max(0, Number(e.target.value) || 0);
                  setPriceRange([Math.min(priceRange[0], value), value]);
                  setCurrentPage(1);
                }}
                className="price-input"
                placeholder="Den"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="filter-group">
            <label>Sap xep</label>
            <select value={sortBy} onChange={handleSortChange} className="sort-select">
              <option value="newest">Moi nhat</option>
              <option value="price_low">Gia: Thap den cao</option>
              <option value="price_high">Gia: Cao den thap</option>
              <option value="rating">Danh gia cao</option>
              <option value="best_seller">Ban chay</option>
              <option value="trending">Xu huong</option>
            </select>
          </div>
        </aside>

        {/* Main Content */}
        <main className="shop-main">
          {/* View Mode Toggle */}
          <div className="view-mode-toggle">
            <label>
              <input
                type="checkbox"
                checked={useLazyLoad}
                onChange={(e) => {
                  setUseLazyLoad(e.target.checked);
                  setCurrentPage(1);
                  setProducts([]);
                }}
              />
              Cuon vo han (thay phan trang)
            </label>
          </div>
          {cartMessage ? (
            <div className="text-sm text-gray-600 bg-white rounded-xl border border-gray-100 px-4 py-2">
              {cartMessage}
            </div>
          ) : null}

          {/* Products Grid */}
          <div className="products-section">
            {loading && products.length === 0 ? (
              <div className="loading">Dang tai san pham...</div>
            ) : products.length === 0 ? (
              <div className="no-products">Khong tim thay san pham</div>
            ) : (
              <div className="products-grid">
                {products.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-image">
                      <Link to={`/user/shop/${product.id}`}>
                        <img
                          src={product.image_url || '/images/placeholder.jpg'}
                          alt={product.name}
                        />
                      </Link>
                      <span className="product-badge">
                        {product.quantity_sold_week > 0 ? '🔥 Noi bat' : 'Moi'}
                      </span>
                    </div>
                    <div className="product-info">
                      <h4>
                        <Link to={`/user/shop/${product.id}`}>
                          {product.name}
                        </Link>
                      </h4>
                      <p className="product-category">
                        {product.category.toUpperCase()} • {product.size}
                      </p>
                      <p className="product-color">Mau sac: {product.color}</p>

                      {/* Stats */}
                      <div className="product-stats">
                        <span className="stat">
                          📦 {product.quantity_stock} ton kho
                        </span>
                        <span className="stat">
                          ⭐ {Number(product.rating || 0).toFixed(1)} ({product.rating_count})
                        </span>
                      </div>

                      {/* Sales Info */}
                      <div className="product-sales">
                        <small>
                          Da ban: {product.quantity_sold} | Tuan: {product.quantity_sold_week} | Hom nay:{' '}
                          {product.quantity_sold_day}
                        </small>
                      </div>

                      <div className="product-footer">
                        <span className="product-price">{formatPrice(product.price)} Z</span>
                        <div className="product-actions">
                          <Link to={`/user/shop/${product.id}`} className="detail-btn">
                            Xem chi tiet
                          </Link>
                          <button className="add-cart-btn" onClick={() => handleAddToCart(product.id)}>
                            Them vao gio
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Lazy Load Observer */}
            {useLazyLoad && products.length > 0 && (
              <div ref={observerTarget} className="lazy-load-observer">
                {loading && <div className="loading-more">Dang tai them san pham...</div>}
              </div>
            )}

            {/* Pagination (only when not using lazy load) */}
            {!useLazyLoad && !loading && products.length > 0 && (
              <div className="pagination">
                <button
                  disabled={!pagination.hasPrevPage}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="pagination-btn"
                >
                  ← Truoc
                </button>

                <div className="page-info">
                  Trang {currentPage} / {pagination.totalPages}
                </div>

                <button
                  disabled={!pagination.hasNextPage}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="pagination-btn"
                >
                  Tiep →
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Shop;
