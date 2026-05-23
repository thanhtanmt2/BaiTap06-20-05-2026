import { useEffect, useState } from 'react';
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

const transitions = {
  new: ['confirmed', 'cancelled'],
  confirmed: ['preparing', 'cancelled'],
  preparing: ['shipping', 'cancel_requested', 'cancelled'],
  shipping: ['delivered'],
  delivered: [],
  cancel_requested: ['cancelled', 'preparing'],
  cancelled: [],
};

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);
  const formatDate = (value) => (value ? new Date(value).toLocaleString('vi-VN') : '-');

  const fetchOrders = async (status) => {
    setLoading(true);
    setError('');
    try {
      const query = status ? `?status=${status}` : '';
      const { data } = await axiosClient.get(`/orders/admin${query}`);
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
    fetchOrders(filterStatus);
  }, [filterStatus]);

  const handleUpdateStatus = async (orderId, nextStatus) => {
    setError('');
    setSuccess('');
    try {
      const { data } = await axiosClient.put(`/orders/admin/${orderId}/status`, { status: nextStatus });
      if (data.success) {
        setSuccess('Cap nhat trang thai thanh cong');
        fetchOrders(filterStatus);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Khong the cap nhat don hang');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-800">Quan ly don hang</h1>
          <p className="text-gray-500 text-sm mt-1">Cap nhat trang thai don hang va xu ly huy.</p>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-xl border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">Tat ca trang thai</option>
          {Object.keys(statusLabels).map((status) => (
            <option key={status} value={status}>{statusLabels[status]}</option>
          ))}
        </select>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      {loading ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">Dang tai don hang...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-gray-500">
          Khong co don hang phu hop.
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusLabel = statusLabels[order.status] || 'Dang xu ly';
            const statusClass = statusStyles[order.status] || statusStyles.new;
            const nextOptions = transitions[order.status] || [];

            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Ma don hang</p>
                    <p className="text-lg font-semibold text-gray-800">#DH{order.id}</p>
                    <p className="text-xs text-gray-400 mt-1">Dat luc: {formatDate(order.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusClass}`}>
                      {statusLabel}
                    </span>
                    <span className="text-sm font-semibold text-gray-700">
                      {formatPrice(order.total_amount)} Z
                    </span>
                  </div>
                </div>

                <div className="mt-4 text-sm text-gray-600">
                  <div>Nguoi nhan: <span className="font-semibold text-gray-800">{order.shipping_name}</span></div>
                  <div>SDT: <span className="font-semibold text-gray-800">{order.shipping_phone}</span></div>
                  <div>Dia chi: <span className="font-semibold text-gray-800">{order.shipping_address}</span></div>
                </div>

                {nextOptions.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {nextOptions.map((nextStatus) => (
                      <button
                        key={nextStatus}
                        onClick={() => handleUpdateStatus(order.id, nextStatus)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 hover:bg-gray-50"
                      >
                        {statusLabels[nextStatus]}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
