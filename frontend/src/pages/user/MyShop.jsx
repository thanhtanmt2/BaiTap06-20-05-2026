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

const MyShop = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
  });
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'shirt',
    description: '',
    price: '',
    color: '',
    size: 'M',
    quantity_stock: 0,
    image_url: '',
  });
  const [status, setStatus] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [productSaving, setProductSaving] = useState(false);
  const [productImageUploading, setProductImageUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [productSuccess, setProductSuccess] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    category: 'shirt',
    description: '',
    price: '',
    color: '',
    size: 'M',
    quantity_stock: 0,
    image_url: '',
  });
  const [editSaving, setEditSaving] = useState(false);

  const isApproved = status === 'approved';
  const statusText = statusLabels[status] || 'Dang cho duyet';
  const shopName = formData.name || 'Shop cua ban';
  const formatPrice = (value) => new Intl.NumberFormat('vi-VN').format(value || 0);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const { data } = await axiosClient.get('/shops/me');
        if (data.success && data.data) {
          setFormData({
            name: data.data.name || '',
            description: data.data.description || '',
            address: data.data.address || '',
            phone: data.data.phone || '',
          });
          setStatus(data.data.status || 'pending');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Khong the tai thong tin shop');
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, []);

  const fetchProducts = async () => {
    setProductsLoading(true);
    try {
      const { data } = await axiosClient.get('/products/my');
      if (data.success) {
        setProducts(data.data || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Khong the tai san pham');
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    if (isApproved) {
      fetchProducts();
    }
  }, [isApproved]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductChange = (e) => {
    const { name, value } = e.target;
    setProductForm((prev) => ({ ...prev, [name]: value }));
    if (name === 'image_url') {
      setImagePreview(value);
    }
  };

  const handleImageFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setProductImageUploading(true);
    setError('');
    setProductSuccess('');

    try {
      const fd = new FormData();
      fd.append('image', file);
      const { data } = await axiosClient.post('/products/upload-image', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (data.success) {
        setProductForm((prev) => ({ ...prev, image_url: data.data.url }));
        setImagePreview(data.data.url);
        setProductSuccess('Upload anh thanh cong');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Upload anh that bai');
    } finally {
      setProductImageUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const { data } = await axiosClient.post('/shops/register', formData);
      if (data.success) {
        setSuccess(data.message || 'Dang ky shop thanh cong');
        setStatus(data.data?.status || 'pending');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Dang ky shop that bai');
    } finally {
      setSaving(false);
    }
  };

  const handleProductSubmit = async (e) => {
    e.preventDefault();
    setProductSaving(true);
    setError('');
    setProductSuccess('');

    try {
      const payload = {
        ...productForm,
        price: Number(productForm.price),
        quantity_stock: Number(productForm.quantity_stock) || 0,
      };
      const { data } = await axiosClient.post('/products', payload);
      if (data.success) {
        setProductSuccess(data.message || 'Dang san pham thanh cong');
        setProductForm({
          name: '',
          category: 'shirt',
          description: '',
          price: '',
          color: '',
          size: 'M',
          quantity_stock: 0,
          image_url: '',
        });
        setImagePreview('');
        fetchProducts();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Dang san pham that bai');
    } finally {
      setProductSaving(false);
    }
  };

  const handleToggleProduct = async (productId, nextIsActive) => {
    setError('');
    try {
      const { data } = await axiosClient.patch(`/products/${productId}/status`, {
        is_active: nextIsActive,
      });
      if (data.success) {
        setProducts((prev) => prev.map((item) => (
          item.id === productId ? { ...item, is_active: nextIsActive } : item
        )));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Cap nhat san pham that bai');
    }
  };

  const handleEditStart = (product) => {
    setEditingProductId(product.id);
    setEditForm({
      name: product.name || '',
      category: product.category || 'shirt',
      description: product.description || '',
      price: product.price || '',
      color: product.color || '',
      size: product.size || 'M',
      quantity_stock: product.quantity_stock || 0,
      image_url: product.image_url || '',
    });
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleEditCancel = () => {
    setEditingProductId(null);
  };

  const handleEditSave = async (productId) => {
    setEditSaving(true);
    setError('');
    try {
      const payload = {
        ...editForm,
        price: Number(editForm.price),
        quantity_stock: Number(editForm.quantity_stock) || 0,
      };
      const { data } = await axiosClient.put(`/products/${productId}`, payload);
      if (data.success) {
        setProducts((prev) => prev.map((item) => (
          item.id === productId ? data.data : item
        )));
        setEditingProductId(null);
        setProductSuccess(data.message || 'Cap nhat san pham thanh cong');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Cap nhat san pham that bai');
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-gradient-to-br from-amber-50 via-white to-emerald-50"
      style={{ fontFamily: "'Space Grotesk', 'IBM Plex Sans', sans-serif" }}
    >
      <div className="pointer-events-none absolute -top-24 right-[-10%] h-64 w-64 rounded-full bg-emerald-200/40 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-15%] left-[-5%] h-72 w-72 rounded-full bg-amber-200/40 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-10 lg:px-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm">
              My Shop Hub
            </span>
            <h1 className="mt-3 text-3xl font-bold text-slate-900 sm:text-4xl">{shopName}</h1>
            <p className="mt-2 text-sm text-slate-500">
              Quan ly thong tin shop va dang san pham moi trong mot giao dien don gian.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Trang thai</p>
              <p className="text-lg font-semibold text-slate-800">{statusText}</p>
            </div>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyles[status] || statusStyles.pending}`}>
              {statusText}
            </span>
          </div>
        </div>

        <div className="mt-6">
          <Alert type="error" message={error} />
          <Alert type="success" message={success} />
          <Alert type="success" message={productSuccess} />
        </div>

        {loading ? (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="h-96 rounded-3xl bg-white/80 shadow-sm animate-pulse" />
            <div className="h-96 rounded-3xl bg-white/80 shadow-sm animate-pulse" />
          </div>
        ) : isApproved ? (
          <div className="mt-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
              <form onSubmit={handleProductSubmit} className="rounded-3xl border border-white/70 bg-white/90 p-8 shadow-xl shadow-emerald-100">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Dang san pham</h2>
                  <p className="text-sm text-slate-500">Them san pham moi vao shop da duoc duyet.</p>
                </div>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                  Shop da duyet
                </span>
              </div>

              <div className="mt-6 grid gap-5">
                <div>
                  <label className="text-sm font-semibold text-slate-600">Ten san pham</label>
                  <input
                    name="name"
                    value={productForm.name}
                    onChange={handleProductChange}
                    placeholder="Vi du: Ao thun basic"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-600">Danh muc</label>
                    <select
                      name="category"
                      value={productForm.category}
                      onChange={handleProductChange}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                      {['shirt', 'pants', 'dress', 'jacket', 'skirt', 'shorts', 'hoodie', 'sweater', 'coat', 'accessories'].map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600">Gia</label>
                    <input
                      name="price"
                      type="number"
                      min="1"
                      value={productForm.price}
                      onChange={handleProductChange}
                      placeholder="Vi du: 199000"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-600">Mau sac</label>
                    <input
                      name="color"
                      value={productForm.color}
                      onChange={handleProductChange}
                      placeholder="Vi du: Den"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600">Size</label>
                    <select
                      name="size"
                      value={productForm.size}
                      onChange={handleProductChange}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    >
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-600">So luong ton</label>
                    <input
                      name="quantity_stock"
                      type="number"
                      min="0"
                      value={productForm.quantity_stock}
                      onChange={handleProductChange}
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-600">Anh san pham</label>
                    <div className="mt-2 flex items-center gap-3">
                      <label className="inline-flex items-center gap-2 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-600 cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleImageFileChange}
                          disabled={productImageUploading}
                        />
                        {productImageUploading ? 'Dang upload...' : 'Tai anh tu may'}
                      </label>
                      <span className="text-xs text-slate-400">hoac</span>
                    </div>
                    <input
                      name="image_url"
                      value={productForm.image_url}
                      onChange={handleProductChange}
                      placeholder="https://..."
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                </div>
                {imagePreview ? (
                  <div className="rounded-2xl border border-slate-200 bg-white/80 p-4">
                    <p className="text-xs font-semibold text-slate-500">Preview</p>
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="mt-3 h-40 w-full rounded-xl object-cover"
                    />
                  </div>
                ) : null}
                <div>
                  <label className="text-sm font-semibold text-slate-600">Mo ta</label>
                  <textarea
                    name="description"
                    value={productForm.description}
                    onChange={handleProductChange}
                    rows={3}
                    placeholder="Mo ta ngan ve san pham"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end">
                <Button type="submit" className="px-6">
                  {productSaving ? 'Dang gui...' : 'Dang san pham'}
                </Button>
              </div>
              </form>

              <div className="space-y-6">
                <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-amber-100">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Shop snapshot</p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-900">Thong tin hien tai</h3>
                  <div className="mt-4 space-y-3 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Mo ta</span>
                      <span className="text-right text-slate-700">{formData.description || 'Chua cap nhat'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Dia chi</span>
                      <span className="text-right text-slate-700">{formData.address || 'Chua cap nhat'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">So dien thoai</span>
                      <span className="text-right text-slate-700">{formData.phone || 'Chua cap nhat'}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/70 bg-slate-900 p-6 text-slate-100 shadow-xl shadow-slate-200">
                  <h3 className="text-lg font-semibold">Checklist ban hang</h3>
                  <ul className="mt-4 space-y-3 text-sm text-slate-200">
                    <li>• Kiem tra mo ta san pham ro rang va nhat quan.</li>
                    <li>• Cap nhat ton kho de tranh het hang.</li>
                    <li>• Su dung anh san pham do net va thong nhat phong cach.</li>
                  </ul>
                  <div className="mt-5 rounded-2xl bg-white/10 px-4 py-3 text-xs text-slate-200">
                    Ban co the dang nhieu san pham de thuong hieu cua minh noi bat.
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-10 rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-emerald-100">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">Quan ly san pham</h2>
                  <p className="text-sm text-slate-500">Danh sach san pham thuoc shop cua ban.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                  {products.length} san pham
                </span>
              </div>

              {productsLoading ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
                  <div className="h-28 rounded-2xl bg-slate-100 animate-pulse" />
                </div>
              ) : products.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
                  Chua co san pham nao. Hay dang san pham dau tien.
                </div>
              ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {products.map((item) => (
                    <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-4">
                      <div className="flex gap-4">
                        <div className="h-20 w-20 overflow-hidden rounded-xl bg-slate-100">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="flex flex-1 flex-col">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                              <p className="text-xs text-slate-500">{item.category} • {item.size} • {item.color}</p>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                              {item.is_active ? 'Dang ban' : 'Tam an'}
                            </span>
                          </div>
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-slate-800">{formatPrice(item.price)} Z</p>
                            <button
                              type="button"
                              onClick={() => handleToggleProduct(item.id, !item.is_active)}
                              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                            >
                              {item.is_active ? 'Tam an' : 'Hien thi'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditStart(item)}
                              className="rounded-lg border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
                            >
                              Chinh sua
                            </button>
                          </div>
                        </div>
                      </div>

                      {editingProductId === item.id ? (
                        <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                              <label className="text-xs font-semibold text-slate-500">Ten san pham</label>
                              <input
                                name="name"
                                value={editForm.name}
                                onChange={handleEditChange}
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-500">Danh muc</label>
                              <select
                                name="category"
                                value={editForm.category}
                                onChange={handleEditChange}
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                              >
                                {['shirt', 'pants', 'dress', 'jacket', 'skirt', 'shorts', 'hoodie', 'sweater', 'coat', 'accessories'].map((option) => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-500">Gia</label>
                              <input
                                name="price"
                                type="number"
                                value={editForm.price}
                                onChange={handleEditChange}
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-500">So luong ton</label>
                              <input
                                name="quantity_stock"
                                type="number"
                                value={editForm.quantity_stock}
                                onChange={handleEditChange}
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-500">Mau sac</label>
                              <input
                                name="color"
                                value={editForm.color}
                                onChange={handleEditChange}
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                              />
                            </div>
                            <div>
                              <label className="text-xs font-semibold text-slate-500">Size</label>
                              <select
                                name="size"
                                value={editForm.size}
                                onChange={handleEditChange}
                                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                              >
                                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((option) => (
                                  <option key={option} value={option}>{option}</option>
                                ))}
                              </select>
                            </div>
                          </div>
                          <div className="mt-4">
                            <label className="text-xs font-semibold text-slate-500">Mo ta</label>
                            <textarea
                              name="description"
                              value={editForm.description}
                              onChange={handleEditChange}
                              rows={2}
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                            />
                          </div>
                          <div className="mt-4">
                            <label className="text-xs font-semibold text-slate-500">Anh san pham (URL)</label>
                            <input
                              name="image_url"
                              value={editForm.image_url}
                              onChange={handleEditChange}
                              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs"
                            />
                          </div>
                          <div className="mt-4 flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={handleEditCancel}
                              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-slate-500"
                            >
                              Huy
                            </button>
                            <button
                              type="button"
                              onClick={() => handleEditSave(item.id)}
                              className="rounded-lg bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
                            >
                              {editSaving ? 'Dang luu...' : 'Luu'}
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <form onSubmit={handleSubmit} className="rounded-3xl border border-white/70 bg-white/90 p-8 shadow-xl shadow-amber-100">
              <h2 className="text-xl font-semibold text-slate-900">Dang ky thong tin shop</h2>
              <p className="mt-2 text-sm text-slate-500">Hoan tat thong tin de admin duyet hoat dong.</p>
              <div className="mt-6 grid gap-5">
                <div>
                  <label className="text-sm font-semibold text-slate-600">Ten shop</label>
                  <input
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Vi du: Shop Minh Anh"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">Mo ta</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Mo ta ngan ve shop"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">Dia chi</label>
                  <input
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="So nha, duong, quan/huyen"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-600">So dien thoai</label>
                  <input
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="So dien thoai lien he"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-amber-400"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end">
                <Button type="submit" className="px-6">
                  {saving ? 'Dang gui...' : 'Dang ky / Cap nhat'}
                </Button>
              </div>
            </form>

            <div className="space-y-6">
              <div className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-xl shadow-emerald-100">
                <h3 className="text-lg font-semibold text-slate-900">Huong dan nhanh</h3>
                <p className="mt-3 text-sm text-slate-600">Sau khi gui dang ky, admin se duyet trong vong 24h.</p>
                <div className="mt-5 rounded-2xl bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
                  Trang thai hien tai: {statusText}
                </div>
              </div>
              <div className="rounded-3xl border border-amber-100 bg-amber-50 p-6 text-amber-700">
                <h3 className="text-lg font-semibold">Chua duyet</h3>
                <p className="mt-2 text-sm">Shop can duoc admin duyet truoc khi dang san pham.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyShop;
