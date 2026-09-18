import React, { useState, useEffect } from 'react';
import './SalesPage.css';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { useAuth } from '../../context/AuthContext';
import {
  IconPackage,
  IconReceipt,
  IconHistory,
  IconPlus,
  IconPenLine,
  IconTrash,
  IconPrinter,
  IconXCircle,
  IconCheckCircle,
  IconAlertTriangle,
  IconBanknote,
} from '../../components/icons';
import {
  apiGetMyFarms, apiGetProducts, apiCreateProduct, apiUpdateProduct, apiDeleteProduct,
  apiGetInvoices, apiCreateInvoice, apiCancelInvoice, apiGetSalesStats,
} from '../../services/api';

const fmt = (v) => new Intl.NumberFormat('vi-VN').format(v || 0);

const formatVNDWords = (num) => {
  if (!num || isNaN(num) || num <= 0) return '';
  if (num >= 1e9) {
    const b = (num / 1e9).toFixed(2).replace(/\.?0+$/, '');
    return `${b} tỷ đồng`;
  }
  if (num >= 1e6) {
    const m = (num / 1e6).toFixed(2).replace(/\.?0+$/, '');
    return `${m} triệu đồng`;
  }
  if (num >= 1e3) {
    const k = (num / 1e3).toFixed(1).replace(/\.?0+$/, '');
    return `${k} nghìn đồng`;
  }
  return `${Number(num).toLocaleString('vi-VN')} đồng`;
};

export default function SalesPage() {
  const { user } = useAuth();
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [tab, setTab] = useState('products');
  const [products, setProducts] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Product form
  const [showProductForm, setShowProductForm] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: '', unit: 'kg', price: '', stockQuantity: '', description: '' });

  // Invoice form
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    customerName: '', customerPhone: '', customerAddress: '', discount: 0, notes: '',
    items: [{ productId: '', quantity: '', unitPrice: '' }],
  });

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Invoice detail view
  const [viewInvoice, setViewInvoice] = useState(null);

  useEffect(() => {
    apiGetMyFarms().then(f => {
      setFarms(f || []);
      if (f?.length > 0) setSelectedFarmId(f[0].id);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectedFarmId) loadData();
  }, [selectedFarmId, tab]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      if (tab === 'products') {
        setProducts(await apiGetProducts(selectedFarmId));
      } else if (tab === 'invoices' || tab === 'history') {
        setInvoices(await apiGetInvoices(selectedFarmId));
        setStats(await apiGetSalesStats(selectedFarmId).catch(() => null));
      }
    } catch (e) { setError(e?.response?.data?.message || 'Lỗi tải dữ liệu'); }
    setLoading(false);
  };

  const flash = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 3000); };

  // ── Product CRUD ──
  const handleProductSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editProduct) {
        await apiUpdateProduct(editProduct.id, productForm);
        flash('Đã cập nhật sản phẩm');
      } else {
        await apiCreateProduct({ ...productForm, farmId: selectedFarmId });
        flash('Đã thêm sản phẩm');
      }
      setShowProductForm(false);
      setEditProduct(null);
      setProductForm({ name: '', unit: 'kg', price: '', stockQuantity: '', description: '' });
      loadData();
    } catch (e) { setError(e?.response?.data?.message || 'Lỗi xử lý sản phẩm'); }
  };

  const startEditProduct = (p) => {
    setEditProduct(p);
    setProductForm({ name: p.name, unit: p.unit, price: p.price, stockQuantity: p.stockQuantity, description: p.description || '' });
    setShowProductForm(true);
  };

  const handleDeleteProduct = async () => {
    if (!deleteConfirm) return;
    try {
      await apiDeleteProduct(deleteConfirm.id);
      flash('Đã xóa sản phẩm');
      setDeleteConfirm(null);
      loadData();
    } catch (e) { setError(e?.response?.data?.message || 'Lỗi xóa sản phẩm'); }
  };

  // ── Invoice ──
  const addInvoiceItem = () => {
    setInvoiceForm(f => ({ ...f, items: [...f.items, { productId: '', quantity: '', unitPrice: '' }] }));
  };

  const removeInvoiceItem = (idx) => {
    setInvoiceForm(f => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  };

  const updateInvoiceItem = (idx, field, value) => {
    setInvoiceForm(f => ({
      ...f,
      items: f.items.map((item, i) => {
        if (i !== idx) return item;
        const updated = { ...item, [field]: value };
        if (field === 'productId') {
          const prod = products.find(p => p.id === value);
          if (prod) updated.unitPrice = prod.price;
        }
        return updated;
      }),
    }));
  };

  const invoiceTotal = invoiceForm.items.reduce((sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);

  const handleInvoiceSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = {
        farmId: selectedFarmId,
        customerName: invoiceForm.customerName,
        customerPhone: invoiceForm.customerPhone,
        customerAddress: invoiceForm.customerAddress,
        discount: Number(invoiceForm.discount) || 0,
        notes: invoiceForm.notes,
        items: invoiceForm.items.filter(it => it.productId && it.quantity).map(it => ({
          productId: it.productId,
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
        })),
      };
      await apiCreateInvoice(data);
      flash('Đã tạo hóa đơn thành công!');
      setShowInvoiceForm(false);
      setInvoiceForm({ customerName: '', customerPhone: '', customerAddress: '', discount: 0, notes: '', items: [{ productId: '', quantity: '', unitPrice: '' }] });
      setTab('history');
      loadData();
    } catch (e) { setError(e?.response?.data?.message || 'Lỗi tạo hóa đơn'); }
  };

  const handleCancelInvoice = async (id) => {
    if (!window.confirm('Bạn có chắc muốn hủy hóa đơn này? Tồn kho sẽ được hoàn lại.')) return;
    try {
      await apiCancelInvoice(id);
      flash('Đã hủy hóa đơn');
      loadData();
    } catch (e) { setError(e?.response?.data?.message || 'Lỗi hủy hóa đơn'); }
  };

  const printInvoice = (inv) => {
    setViewInvoice(inv);
    setTimeout(() => window.print(), 300);
  };

  const statusLabel = (s) => ({ COMPLETED: 'Hoàn thành', CANCELLED: 'Đã hủy', DRAFT: 'Nháp' }[s] || s);
  const statusClass = (s) => ({ COMPLETED: 'status-completed', CANCELLED: 'status-cancelled', DRAFT: 'status-draft' }[s] || '');

  return (
    <div className="app">
      <Header />
      <main className="sales-page">
        <div className="sales-container">
          <div className="sales-header">
            <div>
              <p className="eyebrow">BÁN HÀNG & HÓA ĐƠN</p>
              <h1>Quản lý bán hàng</h1>
            </div>
            <select className="farm-select" value={selectedFarmId} onChange={e => setSelectedFarmId(e.target.value)}>
              {farms.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
          </div>

          {error && <div className="alert alert-error">{error} <button onClick={() => setError('')}>×</button></div>}
          {success && <div className="alert alert-success">{success}</div>}

          <div className="sales-tabs">
            <button className={tab === 'products' ? 'active' : ''} onClick={() => setTab('products')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <IconPackage size={17} /> <span>Sản phẩm</span>
            </button>
            <button className={tab === 'invoices' ? 'active' : ''} onClick={() => setTab('invoices')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <IconReceipt size={17} /> <span>Tạo hóa đơn</span>
            </button>
            <button className={tab === 'history' ? 'active' : ''} onClick={() => setTab('history')} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <IconHistory size={17} /> <span>Lịch sử hóa đơn</span>
            </button>
          </div>

          {/* ── PRODUCTS TAB ── */}
          {tab === 'products' && (
            <section className="sales-section">
              <div className="section-header">
                <h2>Sản phẩm ({products.length})</h2>
                <button className="btn-primary" onClick={() => { setShowProductForm(true); setEditProduct(null); setProductForm({ name: '', unit: 'kg', price: '', stockQuantity: '', description: '' }); }}>
                  <IconPlus size={16} /> <span>Thêm sản phẩm</span>
                </button>
              </div>

              {showProductForm && (
                <form className="inline-form" onSubmit={handleProductSubmit}>
                  <h3>{editProduct ? 'Sửa sản phẩm' : 'Thêm sản phẩm mới'}</h3>
                  <div className="form-grid">
                    <label>Tên sản phẩm <input required value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} placeholder="VD: Cà phê nhân sống" /></label>
                    <label>Đơn vị <input required value={productForm.unit} onChange={e => setProductForm(f => ({ ...f, unit: e.target.value }))} placeholder="kg" /></label>
                    <label>
                      Giá bán (VNĐ)
                      <input required type="number" min="0" value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} placeholder="VD: 15000" />
                      {Boolean(productForm.price && Number(productForm.price) > 0) && (
                        <span style={{ color: '#16a34a', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '0.84rem' }}>
                          <IconBanknote size={15} strokeWidth={2.2} /> {fmt(productForm.price)} VNĐ / {productForm.unit || 'đv'} ({formatVNDWords(Number(productForm.price))})
                        </span>
                      )}
                    </label>
                    <label>Tồn kho <input type="number" min="0" value={productForm.stockQuantity} onChange={e => setProductForm(f => ({ ...f, stockQuantity: e.target.value }))} placeholder="VD: 100" /></label>
                  </div>
                  <label>Mô tả <textarea value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} rows="2" /></label>
                  <div className="form-actions">
                    <button type="submit" className="btn-primary">{editProduct ? 'Cập nhật' : 'Thêm'}</button>
                    <button type="button" className="btn-secondary" onClick={() => { setShowProductForm(false); setEditProduct(null); }}>Hủy</button>
                  </div>
                </form>
              )}

              {loading ? <div className="loading">Đang tải...</div> : (
                <div className="products-grid">
                  {products.length === 0 ? <div className="empty-state">Chưa có sản phẩm. Hãy thêm sản phẩm đầu tiên!</div> : products.map(p => (
                    <div className="product-card" key={p.id}>
                      <div className="product-info">
                        <h3>{p.name}</h3>
                        <p className="product-price">{fmt(p.price)} đ/{p.unit}</p>
                        <p className={`product-stock ${p.stockQuantity <= 0 ? 'out-of-stock' : ''}`}>
                          Tồn kho: <strong>{fmt(p.stockQuantity)}</strong> {p.unit}
                        </p>
                        {p.description && <p className="product-desc">{p.description}</p>}
                      </div>
                      <div className="product-actions">
                        <button className="btn-edit" onClick={() => startEditProduct(p)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <IconPenLine size={14} /> Sửa
                        </button>
                        <button className="btn-delete" onClick={() => setDeleteConfirm(p)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <IconTrash size={14} /> Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}

          {/* ── CREATE INVOICE TAB ── */}
          {tab === 'invoices' && (
            <section className="sales-section">
              <h2>Tạo hóa đơn mới</h2>
              <form className="invoice-form" onSubmit={handleInvoiceSubmit}>
                <div className="form-grid">
                  <label>Tên khách hàng <input value={invoiceForm.customerName} onChange={e => setInvoiceForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Nguyễn Văn A" /></label>
                  <label>SĐT khách <input value={invoiceForm.customerPhone} onChange={e => setInvoiceForm(f => ({ ...f, customerPhone: e.target.value }))} placeholder="0901234567" /></label>
                  <label>Địa chỉ <input value={invoiceForm.customerAddress} onChange={e => setInvoiceForm(f => ({ ...f, customerAddress: e.target.value }))} /></label>
                </div>

                <h3>Chi tiết đơn hàng</h3>
                <div className="invoice-items">
                  {invoiceForm.items.map((item, idx) => {
                    const prod = products.find(p => p.id === item.productId);
                    return (
                      <div className="invoice-item-row" key={idx}>
                        <select value={item.productId} onChange={e => updateInvoiceItem(idx, 'productId', e.target.value)} required>
                          <option value="">-- Chọn sản phẩm --</option>
                          {products.filter(p => p.stockQuantity > 0).map(p => (
                            <option key={p.id} value={p.id}>{p.name} (Kho: {fmt(p.stockQuantity)} {p.unit})</option>
                          ))}
                        </select>
                        <input type="number" min="0.1" step="0.1" placeholder="Số lượng" value={item.quantity} onChange={e => updateInvoiceItem(idx, 'quantity', e.target.value)} required />
                        <input type="number" min="0" placeholder="Đơn giá" value={item.unitPrice} onChange={e => updateInvoiceItem(idx, 'unitPrice', e.target.value)} />
                        <span className="item-subtotal">{fmt((Number(item.quantity) || 0) * (Number(item.unitPrice) || 0))} đ</span>
                        {invoiceForm.items.length > 1 && <button type="button" className="btn-remove" onClick={() => removeInvoiceItem(idx)}>×</button>}
                        {prod && Number(item.quantity) > prod.stockQuantity && (
                          <span className="stock-warning">⚠️ Vượt kho ({fmt(prod.stockQuantity)} {prod.unit})</span>
                        )}
                      </div>
                    );
                  })}
                  <button type="button" className="btn-add-item" onClick={addInvoiceItem} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                    <IconPlus size={15} /> Thêm sản phẩm
                  </button>
                </div>

                <div className="invoice-summary">
                  <div className="summary-row"><span>Tổng tiền:</span><strong>{fmt(invoiceTotal)} đ</strong></div>
                  <div className="summary-row">
                    <span>Giảm giá:</span>
                    <input type="number" min="0" value={invoiceForm.discount} onChange={e => setInvoiceForm(f => ({ ...f, discount: e.target.value }))} style={{ width: 120 }} /> đ
                  </div>
                  <div className="summary-row total"><span>Thành tiền:</span><strong>{fmt(invoiceTotal - (Number(invoiceForm.discount) || 0))} đ</strong></div>
                </div>

                <label>Ghi chú <textarea value={invoiceForm.notes} onChange={e => setInvoiceForm(f => ({ ...f, notes: e.target.value }))} rows="2" /></label>

                <div className="form-actions">
                  <button type="submit" className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <IconReceipt size={16} /> Tạo hóa đơn & xuất kho
                  </button>
                </div>
              </form>
            </section>
          )}

          {/* ── INVOICE HISTORY TAB ── */}
          {tab === 'history' && (
            <section className="sales-section">
              {stats && (
                <div className="stats-grid">
                  <div className="stat-card"><span>Tổng hóa đơn</span><strong>{stats.totalInvoices}</strong></div>
                  <div className="stat-card accent"><span>Tổng doanh thu</span><strong>{fmt(stats.totalRevenue)} đ</strong></div>
                  <div className="stat-card"><span>Tổng giảm giá</span><strong>{fmt(stats.totalDiscount)} đ</strong></div>
                </div>
              )}

              <h2>Lịch sử hóa đơn ({invoices.length})</h2>
              {loading ? <div className="loading">Đang tải...</div> : invoices.length === 0 ? (
                <div className="empty-state">Chưa có hóa đơn nào.</div>
              ) : (
                <div className="invoices-list">
                  {invoices.map(inv => (
                    <div className="invoice-card" key={inv.id}>
                      <div className="invoice-header-row">
                        <div>
                          <strong>{inv.invoiceNumber}</strong>
                          <span className={`invoice-status ${statusClass(inv.status)}`}>{statusLabel(inv.status)}</span>
                        </div>
                        <span className="invoice-date">{new Date(inv.createdAt).toLocaleDateString('vi-VN')}</span>
                      </div>
                      {inv.customerName && <p>Khách: {inv.customerName} {inv.customerPhone && `- ${inv.customerPhone}`}</p>}
                      <div className="invoice-items-preview">
                        {inv.items?.map((it, i) => (
                          <span key={i}>{it.productName} x{fmt(it.quantity)} = {fmt(it.subtotal)}đ</span>
                        ))}
                      </div>
                      <div className="invoice-footer">
                        <strong className="invoice-total">Thành tiền: {fmt(inv.finalAmount)} đ</strong>
                        <div className="invoice-actions">
                          <button className="btn-print" onClick={() => printInvoice(inv)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <IconPrinter size={14} /> In
                          </button>
                          {inv.status === 'COMPLETED' && (
                            <button className="btn-cancel" onClick={() => handleCancelInvoice(inv.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <IconXCircle size={14} /> Hủy
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Delete Confirm Modal */}
        {deleteConfirm && (
          <div className="modal-backdrop" onClick={() => setDeleteConfirm(null)}>
            <div className="modal-content confirm-modal" onClick={e => e.stopPropagation()}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <IconAlertTriangle size={18} color="#dc2626" /> Xác nhận xóa
              </h3>
              <p>Bạn có chắc chắn muốn xóa sản phẩm <strong>"{deleteConfirm.name}"</strong>?</p>
              <div className="modal-actions">
                <button className="btn-danger" onClick={handleDeleteProduct}>Xóa</button>
                <button className="btn-secondary" onClick={() => setDeleteConfirm(null)}>Hủy</button>
              </div>
            </div>
          </div>
        )}

        {/* Invoice Print View */}
        {viewInvoice && (
          <div className="modal-backdrop" onClick={() => setViewInvoice(null)}>
            <div className="modal-content invoice-print-view" onClick={e => e.stopPropagation()}>
              <div className="print-content" id="printable-invoice">
                <div className="print-header">
                  <h2>HÓA ĐƠN BÁN HÀNG</h2>
                  <p>Mã: <strong>{viewInvoice.invoiceNumber}</strong></p>
                  <p>Ngày: {new Date(viewInvoice.createdAt).toLocaleDateString('vi-VN')}</p>
                  {viewInvoice.farm && <p>Nông hộ: {viewInvoice.farm.name}</p>}
                </div>
                {viewInvoice.customerName && (
                  <div className="print-customer">
                    <p>Khách hàng: <strong>{viewInvoice.customerName}</strong></p>
                    {viewInvoice.customerPhone && <p>SĐT: {viewInvoice.customerPhone}</p>}
                    {viewInvoice.customerAddress && <p>Địa chỉ: {viewInvoice.customerAddress}</p>}
                  </div>
                )}
                <table className="print-table">
                  <thead><tr><th>STT</th><th>Sản phẩm</th><th>SL</th><th>Đơn giá</th><th>Thành tiền</th></tr></thead>
                  <tbody>
                    {viewInvoice.items?.map((it, i) => (
                      <tr key={i}>
                        <td>{i + 1}</td>
                        <td>{it.productName}</td>
                        <td>{fmt(it.quantity)}</td>
                        <td>{fmt(it.unitPrice)} đ</td>
                        <td>{fmt(it.subtotal)} đ</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="print-total">
                  <p>Tổng tiền: {fmt(viewInvoice.totalAmount)} đ</p>
                  {viewInvoice.discount > 0 && <p>Giảm giá: -{fmt(viewInvoice.discount)} đ</p>}
                  <p className="grand-total">Thành tiền: <strong>{fmt(viewInvoice.finalAmount)} đ</strong></p>
                </div>
                {viewInvoice.notes && <p className="print-notes">Ghi chú: {viewInvoice.notes}</p>}
              </div>
              <div className="no-print modal-actions">
                <button className="btn-primary" onClick={() => window.print()} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <IconPrinter size={16} /> In hóa đơn
                </button>
                <button className="btn-secondary" onClick={() => setViewInvoice(null)}>Đóng</button>
              </div>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
