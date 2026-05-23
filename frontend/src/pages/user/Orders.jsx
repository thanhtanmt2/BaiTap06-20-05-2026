import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

const statusStyles = {
  new: 'bg-sky-100 text-sky-700',
  confirmed: 'bg-emerald-100 text-emerald-700',
  preparing: 'bg-amber-100 text-amber-700',
  shipping: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancel_requested: 'bg-orange-100 text-orange-700',
  cancelled: 'bg-rose-100 text-rose-700',
};

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);
  const formatDate = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '-');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await axiosClient.get('/orders/my');
      if (data.success) {
        setOrders(data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Khong the tai danh sach don hang');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (orderId) => {
    setError('');
    setSuccess('');
    try {
      const { data } = await axiosClient.put(`/orders/my/${orderId}/cancel`);
      if (data.success) {
        setSuccess(data.message || 'Da gui yeu cau huy don');
        fetchOrders();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Khong the huy don hang');
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-800">Don hang cua toi</h1>
        <p className="text-gray-500 text-sm mt-1">Theo doi trang thai va lich su mua hang.</p>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">Dang tai don hang...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-gray-500">
          Ban chua co don hang nao.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusLabel = statusLabels[order.status] || 'Dang xu ly';
            const statusClass = statusStyles[order.status] || statusStyles.new;
            const itemsCount = order.OrderItems?.length || 0;

            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Ma don hang</p>
                    <p className="text-lg font-semibold text-gray-800">#DH{order.id}</p>
                    <p className="text-xs text-gray-400 mt-1">Dat luc: {formatDate(order.created_at)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                    {statusLabel}
                  </span>
                </div>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                  <span>{itemsCount} san pham</span>
                  <span>Tong: {formatPrice(order.total_amount)} Z</span>
                  <span>Thanh toan: COD</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate(`/user/orders/${order.id}`)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700"
                  >
                    Xem chi tiet
                  </button>
                  {['new', 'confirmed', 'preparing'].includes(order.status) && (
                    <button
                      onClick={() => handleCancel(order.id)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold border border-rose-200 text-rose-600 hover:bg-rose-50"
                    >
                      {order.status === 'preparing' ? 'Gui yeu cau huy' : 'Huy don'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Orders;
