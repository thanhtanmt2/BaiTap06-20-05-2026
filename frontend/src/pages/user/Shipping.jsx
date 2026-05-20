import { useEffect, useState } from 'react';
import axiosClient from '../../services/axiosClient';
import Alert from '../../components/Alert';
import Button from '../../components/Button';

const statusStyles = {
  pending: 'bg-amber-100 text-amber-700',
  approved: 'bg-emerald-100 text-emerald-700',
  rejected: 'bg-rose-100 text-rose-700',
};

const statusLabels = {
  pending: 'Dang cho duyet',
  approved: 'Da duyet',
  rejected: 'Tu choi',
};

const Shipping = () => {
  const [formData, setFormData] = useState({
    provider_name: '',
    area: '',
    phone: '',
  });
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchShipping = async () => {
      try {
        const { data } = await axiosClient.get('/shipping/me');
        if (data.success && data.data) {
          setFormData({
            provider_name: data.data.provider_name || '',
            area: data.data.area || '',
            phone: data.data.phone || '',
          });
          setStatus(data.data.status || 'pending');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Khong the tai thong tin van chuyen');
      } finally {
        setLoading(false);
      }
    };

    fetchShipping();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await axiosClient.post('/shipping/register', formData);
      if (data.success) {
        setSuccess(data.message || 'Dang ky van chuyen thanh cong');
        setStatus(data.data?.status || 'pending');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Dang ky van chuyen that bai');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-extrabold text-gray-800">Dang ky van chuyen</h1>
        <p className="text-gray-500 text-sm mt-1">Cung cap thong tin don vi van chuyen de admin duyet.</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Trang thai</p>
            <p className="text-lg font-semibold text-gray-800">{statusLabels[status] || 'Dang cho duyet'}</p>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || statusStyles.pending}`}>
            {statusLabels[status] || 'Dang cho duyet'}
          </span>
        </div>
        <p className="text-xs text-gray-400 mt-3">Cap nhat thong tin se chuyen ve trang thai cho duyet.</p>
      </div>

      <Alert type="error" message={error} />
      <Alert type="success" message={success} />

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-4">
        <div>
          <label className="text-sm font-semibold text-gray-600">Don vi van chuyen</label>
          <input
            name="provider_name"
            value={formData.provider_name}
            onChange={handleChange}
            placeholder="Vi du: Giao Hang Nhanh"
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-600">Khu vuc hoat dong</label>
          <input
            name="area"
            value={formData.area}
            onChange={handleChange}
            placeholder="Vi du: Ha Noi, TP.HCM"
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
        </div>
        <div>
          <label className="text-sm font-semibold text-gray-600">So dien thoai lien he</label>
          <input
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="So dien thoai"
            className="mt-2 w-full rounded-xl border border-gray-200 px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            disabled={loading}
          />
        </div>

        <div className="flex items-center justify-end">
          <Button type="submit" loading={saving} className="px-6">
            {saving ? 'Dang gui...' : 'Dang ky / Cap nhat'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default Shipping;
