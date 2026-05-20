import { useState, useEffect, useRef } from 'react';
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
            <p className="shop-eyebrow">New season drop</p>
            <h2>Curated essentials for every day</h2>
            <p className="shop-subtitle">Modern staples, soft layers, and standout pieces you can wear on repeat.</p>
          </div>
          <div className="shop-hero-metrics">
            <div className="metric-card">
              <span className="metric-value">120+</span>
              <span className="metric-label">Styles curated</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">4.8★</span>
              <span className="metric-label">Average rating</span>
            </div>
            <div className="metric-card">
              <span className="metric-value">24h</span>
              <span className="metric-label">Fast dispatch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Carousels */}
      <section className="carousels-section">
        <ProductCarousel
          title="Top 10 Best Sellers"
          icon="🔥"
          products={bestSellers}
          loading={loadingBestSellers}
        />
        <ProductCarousel
          title="Top 10 Most Viewed"
          icon="👀"
          products={mostViewed}
          loading={loadingMostViewed}
        />
      </section>

      <div className="shop-content">
        {/* Sidebar Filters */}
        <aside className="shop-sidebar">
          <div className="filter-section">
            <h3>Filters</h3>
            <button className="clear-filters-btn" onClick={clearFilters}>
              Clear All
            </button>
          </div>

          {/* Search */}
          <div className="filter-group">
            <label>Search</label>
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={handleSearchChange}
              className="search-input"
            />
          </div>

          {/* Category Filter */}
          <div className="filter-group">
            <label>Category</label>
            <div className="category-options">
              <button
                className={`category-btn ${selectedCategory === '' ? 'active' : ''}`}
                onClick={() => handleCategoryChange('')}
              >
                All ({categories.reduce((sum, cat) => sum + cat.count, 0)})
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
            <label>Size</label>
            <div className="size-options">
              <button
                className={`size-btn ${selectedSize === '' ? 'active' : ''}`}
                onClick={() => handleSizeChange('')}
              >
                All
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
            <label>Color</label>
            <input
              type="text"
              placeholder="Search color..."
              value={selectedColor}
              onChange={handleColorChange}
              className="color-input"
            />
          </div>

          {/* Price Filter */}
          <div className="filter-group">
            <label>Price Range</label>
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
                placeholder="Min"
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
                placeholder="Max"
              />
            </div>
          </div>

          {/* Sort */}
          <div className="filter-group">
            <label>Sort By</label>
            <select value={sortBy} onChange={handleSortChange} className="sort-select">
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
              <option value="best_seller">Best Sellers</option>
              <option value="trending">Trending</option>
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
              Use Lazy Loading (vs Pagination)
            </label>
          </div>

          {/* Products Grid */}
          <div className="products-section">
            {loading && products.length === 0 ? (
              <div className="loading">Loading products...</div>
            ) : products.length === 0 ? (
              <div className="no-products">No products found</div>
            ) : (
              <div className="products-grid">
                {products.map((product) => (
                  <div key={product.id} className="product-card">
                    <div className="product-image">
                      <img
                        src={product.image_url || '/images/placeholder.jpg'}
                        alt={product.name}
                      />
                      <span className="product-badge">
                        {product.quantity_sold_week > 0 ? `🔥 Hot` : 'New'}
                      </span>
                    </div>
                    <div className="product-info">
                      <h4>{product.name}</h4>
                      <p className="product-category">
                        {product.category.toUpperCase()} • {product.size}
                      </p>
                      <p className="product-color">Color: {product.color}</p>

                      {/* Stats */}
                      <div className="product-stats">
                        <span className="stat">
                          📦 {product.quantity_stock} in stock
                        </span>
                        <span className="stat">
                          ⭐ {Number(product.rating || 0).toFixed(1)} ({product.rating_count})
                        </span>
                      </div>

                      {/* Sales Info */}
                      <div className="product-sales">
                        <small>
                          Sold: {product.quantity_sold} | Week: {product.quantity_sold_week} | Day:{' '}
                          {product.quantity_sold_day}
                        </small>
                      </div>

                      <div className="product-footer">
                        <span className="product-price">{formatPrice(product.price)} Z</span>
                        <button className="add-cart-btn">Add to Cart</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Lazy Load Observer */}
            {useLazyLoad && products.length > 0 && (
              <div ref={observerTarget} className="lazy-load-observer">
                {loading && <div className="loading-more">Loading more products...</div>}
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
                  ← Previous
                </button>

                <div className="page-info">
                  Page {currentPage} of {pagination.totalPages}
                </div>

                <button
                  disabled={!pagination.hasNextPage}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="pagination-btn"
                >
                  Next →
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
