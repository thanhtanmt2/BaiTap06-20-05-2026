import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axiosClient from '../../services/axiosClient';
import Alert from '../../components/Alert';

const statusLabels = {
  new: 'Don hang moi',
  confirmed: 'Da xac nhan',
  preparing: 'Shop dang chuan bi hang',
  shipping: 'Dang giao hang',
  delivered: 'Da giao thanh cong',
  cancel_requested: 'Yeu cau huy don',
  cancelled: 'Da huy',
};

const statusSteps = [
  { key: 'new', label: 'Don hang moi' },
  { key: 'confirmed', label: 'Da xac nhan' },
  { key: 'preparing', label: 'Shop dang chuan bi' },
  { key: 'shipping', label: 'Dang giao hang' },
  { key: 'delivered', label: 'Da giao' },
];

const OrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);
  const formatDate = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '-');

  const fetchOrder = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axiosClient.get(`/orders/my/${id}`);
      if (data.success) {
        setOrder(data.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Khong the tai don hang');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancel = async () => {
    setError('');
    setSuccess('');
    try {
      const { data } = await axiosClient.put(`/orders/my/${id}/cancel`);
      if (data.success) {
        setSuccess(data.message || 'Da gui yeu cau huy don');
        fetchOrder();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Khong the huy don hang');
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">Dang tai don hang...</div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-6 lg:p-8 max-w-5xl mx-auto">
        <Alert type="error" message={error || 'Khong tim thay don hang'} />
      </div>
    );
  }

  const statusLabel = statusLabels[order.status] || 'Dang xu ly';
  const isCancelable = ['new', 'confirmed', 'preparing'].includes(order.status);

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-gray-400">Chi tiet don hang</p>
          <h1 className="text-2xl font-extrabold text-gray-800">#DH{order.id}</h1>
          <p className="text-xs text-gray-400 mt-1">Dat luc: {formatDate(order.created_at)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">{statusLabel}</span>
          <button
            type="button"
            onClick={() => navigate('/user/orders')}
            className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            Quay lai
          </button>
        </div>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      {order.status === 'cancel_requested' && (
        <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-sm text-orange-700">
          Don hang dang cho shop xu ly yeu cau huy.
        </div>
      )}

      {order.status === 'cancelled' && (
        <div className="bg-rose-50 border border-rose-100 rounded-2xl p-4 text-sm text-rose-700">
          Don hang da huy luc {formatDate(order.cancelled_at)}.
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-lg font-bold text-gray-800">Tien do don hang</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {statusSteps.map((step, index) => {
            const activeIndex = statusSteps.findIndex((s) => s.key === order.status);
            const isActive = activeIndex >= index;
            return (
              <div
                key={step.key}
                className={`rounded-xl border px-3 py-3 text-xs font-semibold ${
                  isActive ? 'border-indigo-200 bg-indigo-50 text-indigo-700' : 'border-gray-100 text-gray-400'
                }`}
              >
                {step.label}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">San pham</h2>
          <div className="space-y-4">
            {order.OrderItems?.map((item) => (
              <div key={item.id} className="flex gap-4">
                <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden">
                  {item.product_image ? (
                    <img src={item.product_image} alt={item.product_name} className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-800">{item.product_name}</p>
                  <p className="text-xs text-gray-400">{item.product_color} • {item.product_size}</p>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span>So luong: {item.quantity}</span>
                    <span className="font-semibold">{formatPrice(item.price)} Z</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800">Giao hang</h2>
            <div className="mt-3 text-sm text-gray-600 space-y-2">
              <div>
                <p className="text-xs text-gray-400">Nguoi nhan</p>
                <p className="font-semibold text-gray-800">{order.shipping_name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">So dien thoai</p>
                <p className="font-semibold text-gray-800">{order.shipping_phone}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Dia chi</p>
                <p className="font-semibold text-gray-800">{order.shipping_address}</p>
              </div>
              {order.note ? (
                <div>
                  <p className="text-xs text-gray-400">Ghi chu</p>
                  <p className="font-semibold text-gray-800">{order.note}</p>
                </div>
              ) : null}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-800">Thanh toan</h2>
            <div className="mt-3 text-sm text-gray-600 space-y-2">
              <div className="flex items-center justify-between">
                <span>Phuong thuc</span>
                <span className="font-semibold text-gray-800">COD</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Tong tien</span>
                <span className="font-semibold text-gray-800">{formatPrice(order.total_amount)} Z</span>
              </div>
            </div>
          </div>

          {isCancelable && (
            <button
              type="button"
              onClick={handleCancel}
              className="w-full rounded-xl border border-rose-200 text-rose-600 py-2.5 text-sm font-semibold hover:bg-rose-50"
            >
              {order.status === 'preparing' ? 'Gui yeu cau huy don' : 'Huy don hang'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;
