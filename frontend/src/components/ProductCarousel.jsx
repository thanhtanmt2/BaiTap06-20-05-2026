import { useState, useRef, useEffect } from 'react';

const ProductCarousel = ({ title, icon, products, loading = false }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [canScroll, setCanScroll] = useState(false);
  const carouselRef = useRef(null);
  const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

  const itemsPerPage = 5;
  const totalPages = Math.ceil(products.length / itemsPerPage);

  useEffect(() => {
    setCanScroll(products.length > itemsPerPage);
  }, [products.length]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? totalPages - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === totalPages - 1 ? 0 : prev + 1));
  };

  const visibleProducts = products.slice(
    currentIndex * itemsPerPage,
    (currentIndex + 1) * itemsPerPage
  );

  if (loading) {
    return (
      <div className="carousel-section">
        <div className="carousel-header">
          <h3>{icon} {title}</h3>
        </div>
        <div className="carousel-loading">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="carousel-section">
      <div className="carousel-header">
        <h3>{icon} {title}</h3>
      </div>

      <div className="carousel-container">
        {canScroll && (
          <button className="carousel-nav prev" onClick={handlePrev}>
            ‹
          </button>
        )}

        <div className="carousel-wrapper" ref={carouselRef}>
          <div className="carousel-track">
            {visibleProducts.map((product) => (
              <div key={product.id} className="carousel-item">
                <div className="carousel-product-card">
                  <div className="carousel-product-image">
                    <img
                      src={product.image_url || '/images/placeholder.jpg'}
                      alt={product.name}
                    />
                    <span className="carousel-product-badge">
                      {product.quantity_sold > 0 ? '🔥 Hot' : 'New'}
                    </span>
                  </div>
                  <div className="carousel-product-info">
                    <h5>{product.name}</h5>
                    <p className="carousel-category">
                      {product.category.toUpperCase()}
                    </p>
                    <div className="carousel-rating">
                      ⭐ {Number(product.rating || 0).toFixed(1)} ({product.rating_count})
                    </div>
                    <div className="carousel-price">
                      {formatPrice(product.price)} Z
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {canScroll && (
          <button className="carousel-nav next" onClick={handleNext}>
            ›
          </button>
        )}
      </div>

      {canScroll && (
        <div className="carousel-pagination">
          {Array.from({ length: totalPages }).map((_, index) => (
            <button
              key={index}
              className={`carousel-dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => setCurrentIndex(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductCarousel;
