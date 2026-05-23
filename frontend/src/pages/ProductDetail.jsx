import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../services/axiosClient';
import Alert from '../components/Alert';

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [quantity, setQuantity] = useState(1);

  const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      setError('');
      try {
        const { data } = await axiosClient.get(`/products/${id}`);
        if (data.success) {
          setProduct(data.data);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Khong the tai san pham');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = async () => {
    setError('');
    setSuccess('');
    try {
      const { data } = await axiosClient.post('/cart/items', {
        product_id: product.id,
        quantity,
      });
      if (data.success) {
        setSuccess(data.message || 'Da them vao gio hang');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Them vao gio hang that bai');
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">Dang tai san pham...</div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-6 lg:p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">Khong tim thay san pham.</div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="text-sm text-gray-500 hover:text-gray-700"
      >
        ← Quay lai
      </button>

      <div className="mt-4 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="w-full h-80 rounded-2xl overflow-hidden bg-gray-100">
            {product.image_url ? (
              <img src={product.image_url} alt={product.name} className="h-full w-full object-cover" />
            ) : null}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h1 className="text-2xl font-extrabold text-gray-800">{product.name}</h1>
          <p className="text-sm text-gray-500 mt-1">{product.category} • {product.size} • {product.color}</p>
          <p className="text-xl font-semibold text-gray-900 mt-4">{formatPrice(product.price)} Z</p>

          <Alert type="error" message={error} />
          <Alert type="success" message={success} />

          <div className="mt-4">
            <label className="text-sm font-semibold text-gray-600">So luong</label>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                className="w-8 h-8 rounded-lg border border-gray-200 text-sm font-semibold"
              >
                -
              </button>
              <span className="min-w-[32px] text-center text-sm">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((prev) => prev + 1)}
                className="w-8 h-8 rounded-lg border border-gray-200 text-sm font-semibold"
              >
                +
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            className="mt-6 w-full rounded-xl bg-indigo-600 text-white py-2.5 text-sm font-semibold hover:bg-indigo-700"
          >
            Them vao gio hang
          </button>
        </div>
      </div>

      <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800">Mo ta san pham</h2>
        <p className="text-sm text-gray-600 mt-2">
          {product.description || 'Chua co mo ta.'}
        </p>
      </div>
    </div>
  );
};

export default ProductDetail;
