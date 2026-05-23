import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import Alert from '../../components/Alert';

const Cart = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [orderCreatedId, setOrderCreatedId] = useState(null);
  const [checkoutForm, setCheckoutForm] = useState({
    shipping_name: '',
    shipping_phone: '',
    shipping_address: '',
    note: '',
  });
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const navigate = useNavigate();

  const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

  const fetchCart = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axiosClient.get('/cart');
      if (data.success) {
        setItems(data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Khong the tai gio hang');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const handleQuantityChange = async (itemId, quantity) => {
    if (quantity < 1) return;
    try {
      const { data } = await axiosClient.put(`/cart/items/${itemId}`, { quantity });
      if (data.success) {
        setItems((prev) => prev.map((item) => (item.id === itemId ? data.data : item)));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Cap nhat so luong that bai');
    }
  };

  const handleRemove = async (itemId) => {
    try {
      const { data } = await axiosClient.delete(`/cart/items/${itemId}`);
      if (data.success) {
        setItems((prev) => prev.filter((item) => item.id !== itemId));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Xoa san pham that bai');
    }
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setError('');
    setSuccess('');
    setOrderCreatedId(null);
    if (!checkoutForm.shipping_name || !checkoutForm.shipping_phone || !checkoutForm.shipping_address) {
      setCheckoutLoading(false);
      setError('Vui long nhap day du thong tin giao hang');
      return;
    }
    try {
      const { data } = await axiosClient.post('/orders', {
        ...checkoutForm,
        payment_method: paymentMethod,
      });
      if (data.success) {
        setItems([]);
        setSuccess(data.message || 'Dat hang thanh cong');
        setOrderCreatedId(data.data?.id || null);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Thanh toan that bai');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const handleCheckoutChange = (e) => {
    const { name, value } = e.target;
    setCheckoutForm((prev) => ({ ...prev, [name]: value }));
  };

  const subtotal = items.reduce((sum, item) => sum + (Number(item.Product?.price || 0) * item.quantity), 0);
  const total = subtotal;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-800">Gio hang</h1>
        <p className="text-gray-500 text-sm mt-1">Xem va cap nhat san pham ban muon mua.</p>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">Dang tai gio hang...</div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-gray-500">
          Gio hang trong.
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100">
                  {item.Product?.image_url ? (
                    <img src={item.Product.image_url} alt={item.Product?.name} className="h-full w-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{item.Product?.name}</p>
                      <p className="text-xs text-gray-400">{item.Product?.category} • {item.Product?.size}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemove(item.id)}
                      className="text-xs font-semibold text-red-500 hover:text-red-600"
                    >
                      Xoa
                    </button>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">{formatPrice(item.Product?.price)} Z</p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 text-sm font-semibold"
                      >
                        -
                      </button>
                      <span className="min-w-[28px] text-center text-sm">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                        className="w-7 h-7 rounded-lg border border-gray-200 text-sm font-semibold"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-fit space-y-5">
            <div>
              <h2 className="text-lg font-bold text-gray-800">Thong tin giao hang</h2>
              <p className="text-xs text-gray-400 mt-1">Nhap thong tin nhan hang va thanh toan COD.</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500">Nguoi nhan</label>
                <input
                  name="shipping_name"
                  value={checkoutForm.shipping_name}
                  onChange={handleCheckoutChange}
                  placeholder="Ho va ten"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">So dien thoai</label>
                <input
                  name="shipping_phone"
                  value={checkoutForm.shipping_phone}
                  onChange={handleCheckoutChange}
                  placeholder="So dien thoai"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Dia chi giao hang</label>
                <textarea
                  name="shipping_address"
                  value={checkoutForm.shipping_address}
                  onChange={handleCheckoutChange}
                  placeholder="So nha, duong, quan/huyen, thanh pho"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500">Ghi chu</label>
                <textarea
                  name="note"
                  value={checkoutForm.note}
                  onChange={handleCheckoutChange}
                  placeholder="Ghi chu cho shop (tuy chon)"
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={2}
                />
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs font-semibold text-gray-500 mb-2">Phuong thuc thanh toan</p>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <input
                  type="radio"
                  name="payment_method"
                  value="cod"
                  checked={paymentMethod === 'cod'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                COD - Thanh toan khi nhan hang
              </label>
              <p className="text-[11px] text-gray-400 mt-2">Hien chi ho tro COD, cac vi dien tu se cap nhat sau.</p>
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800">Tong ket</h2>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <div className="flex items-center justify-between">
                  <span>Tam tinh</span>
                  <span>{formatPrice(subtotal)} Z</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Phi van chuyen</span>
                  <span>0 Z</span>
                </div>
                <div className="border-t border-gray-100 pt-3 flex items-center justify-between text-base font-semibold text-gray-800">
                  <span>Tong</span>
                  <span>{formatPrice(total)} Z</span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full rounded-xl bg-indigo-600 text-white py-2.5 text-sm font-semibold hover:bg-indigo-700"
            >
              {checkoutLoading ? 'Dang xu ly...' : 'Dat hang COD'}
            </button>

            {orderCreatedId ? (
              <button
                type="button"
                onClick={() => navigate(`/user/orders/${orderCreatedId}`)}
                className="w-full rounded-xl border border-indigo-200 text-indigo-600 py-2.5 text-sm font-semibold hover:bg-indigo-50"
              >
                Xem don hang vua tao
              </button>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};

export default Cart;
