import { useEffect, useState } from 'react';
import axiosClient from '../../services/axiosClient';
import Alert from '../../components/Alert';

const AdminApprovals = () => {
  const [shops, setShops] = useState([]);
  const [shipping, setShipping] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchApprovals = async () => {
    setLoading(true);
    setError('');
    try {
      const [shopsRes, shippingRes] = await Promise.all([
        axiosClient.get('/shops/admin?status=pending'),
        axiosClient.get('/shipping/admin?status=pending'),
      ]);
      setShops(shopsRes.data.data || []);
      setShipping(shippingRes.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Khong the tai danh sach duyet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleShopStatus = async (id, status) => {
    setError('');
    setSuccess('');
    try {
      const { data } = await axiosClient.put(`/shops/admin/${id}/status`, { status });
      if (data.success) {
        setSuccess('Cap nhat shop thanh cong');
        fetchApprovals();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Cap nhat shop that bai');
    }
  };

  const handleShippingStatus = async (id, status) => {
    setError('');
    setSuccess('');
    try {
      const { data } = await axiosClient.put(`/shipping/admin/${id}/status`, { status });
      if (data.success) {
        setSuccess('Cap nhat van chuyen thanh cong');
        fetchApprovals();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Cap nhat van chuyen that bai');
    }
  };

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-800">Duyet dang ky</h1>
        <p className="text-gray-500 text-sm mt-1">Duyet shop va dang ky van chuyen.</p>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <div className="grid gap-6 xl:grid-cols-2">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Dang ky shop</h2>
            <span className="text-xs text-gray-400">{shops.length} yeu cau</span>
          </div>
          {loading ? (
            <p className="text-gray-400">Dang tai...</p>
          ) : shops.length === 0 ? (
            <p className="text-gray-400">Khong co yeu cau cho duyet.</p>
          ) : (
            <div className="space-y-4">
              {shops.map((shop) => (
                <div key={shop.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{shop.name}</p>
                      <p className="text-xs text-gray-400">{shop.User?.email}</p>
                      <p className="text-xs text-gray-500 mt-2">{shop.description || 'Chua co mo ta'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleShopStatus(shop.id, 'approved')}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700"
                      >
                        Duyet
                      </button>
                      <button
                        onClick={() => handleShopStatus(shop.id, 'rejected')}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-100 text-rose-700"
                      >
                        Tu choi
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-400">
                    <span>Dia chi: {shop.address || 'Chua cap nhat'}</span>
                    <span className="mx-2">•</span>
                    <span>SDT: {shop.phone || 'Chua cap nhat'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Dang ky van chuyen</h2>
            <span className="text-xs text-gray-400">{shipping.length} yeu cau</span>
          </div>
          {loading ? (
            <p className="text-gray-400">Dang tai...</p>
          ) : shipping.length === 0 ? (
            <p className="text-gray-400">Khong co yeu cau cho duyet.</p>
          ) : (
            <div className="space-y-4">
              {shipping.map((request) => (
                <div key={request.id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{request.provider_name}</p>
                      <p className="text-xs text-gray-400">{request.User?.email}</p>
                      <p className="text-xs text-gray-500 mt-2">Khu vuc: {request.area || 'Chua cap nhat'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleShippingStatus(request.id, 'approved')}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-100 text-emerald-700"
                      >
                        Duyet
                      </button>
                      <button
                        onClick={() => handleShippingStatus(request.id, 'rejected')}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-rose-100 text-rose-700"
                      >
                        Tu choi
                      </button>
                    </div>
                  </div>
                  <div className="mt-3 text-xs text-gray-400">
                    <span>SDT: {request.phone || 'Chua cap nhat'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminApprovals;
