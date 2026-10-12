import React, { useState, useEffect } from 'react';
import {
  IconBell, IconUsers, IconCheckCircle, IconAlertTriangle, IconSend, IconPenLine,
  IconTrash, IconDownload,
} from '../../../components/icons';

const RECIPIENT_GROUPS = [
  { value: 'ALL', label: 'Tất cả người dùng' },
  { value: 'OWNER', label: 'Chỉ Chủ nông hộ (OWNER)' },
  { value: 'WORKER', label: 'Chỉ Công nhân (WORKER)' },
  { value: 'ADMIN', label: 'Chỉ Quản trị viên (ADMIN)' },
];

const NOTICE_TYPES = [
  { value: 'UPDATE', label: 'Cập nhật hệ thống' },
  { value: 'MAINTENANCE', label: 'Bảo trì máy chủ' },
  { value: 'ALERT', label: 'Cảnh báo thời tiết / Sâu bệnh' },
  { value: 'POLICY', label: 'Chính sách & Hướng dẫn' },
];

const INITIAL_NOTICES = [
  {
    id: 'notif-1',
    title: 'Cập nhật ứng dụng DalatAgri v2.1',
    content: 'Phiên bản mới đã hỗ trợ ghi chép nhật ký khi mất sóng (Offline-mode) và tự động đồng bộ khi có kết nối trở lại.',
    date: '2026-09-15',
    target: 'ALL',
    type: 'UPDATE',
    priority: 'NORMAL',
    sentBy: 'Ban Quản trị DalatAgri',
  },
  {
    id: 'notif-2',
    title: 'Lịch bảo trì máy chủ định kỳ',
    content: 'Hệ thống máy chủ sẽ tiến hành bảo trì tối ưu hóa cơ sở dữ liệu vào lúc 00:00 - 02:00 ngày 20/09/2026. Quý nông hộ vui lòng lưu trữ dữ liệu trước thời điểm trên.',
    date: '2026-09-18',
    target: 'ALL',
    type: 'MAINTENANCE',
    priority: 'HIGH',
    sentBy: 'Ban Quản trị DalatAgri',
  },
  {
    id: 'notif-3',
    title: 'Tính năng Báo cáo kinh tế vụ mùa mới',
    content: 'Các chủ nông hộ hiện đã có thể xem bảng phân tích chi phí, doanh thu, lợi nhuận và xuất file CSV trực tiếp.',
    date: '2026-09-20',
    target: 'OWNER',
    type: 'POLICY',
    priority: 'NORMAL',
    sentBy: 'Ban Quản trị DalatAgri',
  },
];

const STORAGE_KEY = 'dalat_admin_notifications';

export default function PanelNotifications() {
  const [tab, setTab] = useState('send');
  const [notices, setNotices] = useState([]);
  const [form, setForm] = useState({
    title: '',
    content: '',
    target: 'ALL',
    type: 'UPDATE',
    priority: 'NORMAL',
  });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [filterTarget, setFilterTarget] = useState('');
  const [viewingNotice, setViewingNotice] = useState(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setNotices(JSON.parse(stored));
      } else {
        setNotices(INITIAL_NOTICES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(INITIAL_NOTICES));
      }
    } catch {
      setNotices(INITIAL_NOTICES);
    }
  }, []);

  const saveNotices = (newList) => {
    setNotices(newList);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newList));
    } catch {}
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) {
      setError('Vui lòng nhập đầy đủ tiêu đề và nội dung thông báo');
      return;
    }
    setError('');

    const newNotice = {
      id: `notif-${Date.now()}`,
      title: form.title.trim(),
      content: form.content.trim(),
      target: form.target,
      type: form.type,
      priority: form.priority,
      date: new Date().toISOString().slice(0, 10),
      sentBy: 'Quản trị viên DalatAgri',
    };

    const updated = [newNotice, ...notices];
    saveNotices(updated);

    setSent(true);
    setTimeout(() => {
      setSent(false);
      setForm({ title: '', content: '', target: 'ALL', type: 'UPDATE', priority: 'NORMAL' });
      setTab('history');
    }, 1500);
  };

  const handleDeleteNotice = (id, title) => {
    if (!window.confirm(`Xóa thông báo "${title}"?`)) return;
    const updated = notices.filter(n => n.id !== id);
    saveNotices(updated);
  };

  const handleExportCSV = () => {
    if (notices.length === 0) return;
    const header = ['Mã', 'Tiêu đề', 'Nội dung', 'Đối tượng', 'Loại', 'Mức độ', 'Ngày gửi', 'Người gửi'];
    const rows = notices.map(n => [
      n.id,
      `"${n.title}"`,
      `"${n.content.replace(/"/g, '""')}"`,
      n.target,
      n.type,
      n.priority,
      n.date,
      `"${n.sentBy}"`,
    ]);
    const csv = '\ufeff' + [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `thong-bao-he-thong-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filteredNotices = filterTarget
    ? notices.filter(n => n.target === filterTarget)
    : notices;

  return (
    <div className="panel-content">
      {/* Sub-tabs */}
      <div className="panel-toolbar">
        <div className="panel-tabs-inline">
          <button className={`panel-tab-btn ${tab === 'send' ? 'active' : ''}`} onClick={() => setTab('send')}>
            <IconSend size={14} /> Gửi thông báo
          </button>
          <button className={`panel-tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            <IconBell size={14} /> Lịch sử thông báo ({notices.length})
          </button>
        </div>
        {tab === 'history' && (
          <div className="toolbar-right">
            <button className="btn-action-secondary" onClick={handleExportCSV}>
              <IconDownload size={14} /> Xuất CSV
            </button>
          </div>
        )}
      </div>

      {tab === 'send' && (
        <div className="panel-two-col notif-layout">
          {/* Form gửi thông báo */}
          <div className="panel-card-surface">
            <div className="panel-card-header">
              <h3><IconPenLine size={16} /> Soạn thông báo hệ thống</h3>
            </div>
            {error && <div className="panel-alert error mx-4"><IconAlertTriangle size={16} /><span>{error}</span><button onClick={() => setError('')}>&times;</button></div>}
            {sent && <div className="panel-alert success mx-4"><IconCheckCircle size={16} /><span>Đã lưu và gửi thông báo thành công!</span></div>}
            <form onSubmit={handleSend} className="modal-form p-4">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-row">
                  <label>Đối tượng nhận</label>
                  <select value={form.target} onChange={e => setForm({...form, target: e.target.value})}>
                    {RECIPIENT_GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
                <div className="form-row">
                  <label>Phân loại thông báo</label>
                  <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                    {NOTICE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-row">
                <label>Mức độ ưu tiên</label>
                <div style={{ display: 'flex', gap: '14px', marginTop: '4px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal' }}>
                    <input type="radio" name="priority" checked={form.priority === 'NORMAL'} onChange={() => setForm({...form, priority: 'NORMAL'})} />
                    <span>Bình thường</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal' }}>
                    <input type="radio" name="priority" checked={form.priority === 'HIGH'} onChange={() => setForm({...form, priority: 'HIGH'})} />
                    <span style={{ color: '#d97706', fontWeight: '700' }}>Quan trọng</span>
                  </label>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontWeight: 'normal' }}>
                    <input type="radio" name="priority" checked={form.priority === 'URGENT'} onChange={() => setForm({...form, priority: 'URGENT'})} />
                    <span style={{ color: '#dc2626', fontWeight: '700' }}>Khẩn cấp</span>
                  </label>
                </div>
              </div>

              <div className="form-row">
                <label>Tiêu đề thông báo <span className="req">*</span></label>
                <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ví dụ: Khuyến cáo phòng trừ bệnh rỉ sắt trên cây Cà phê" />
              </div>

              <div className="form-row">
                <label>Nội dung chi tiết <span className="req">*</span></label>
                <textarea required rows={6} value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Nội dung thông báo cụ thể đến các nông hộ..." style={{ resize: 'vertical' }} />
              </div>

              <div className="modal-footer pt-0">
                <button type="button" className="btn-cancel" onClick={() => setForm({ title: '', content: '', target: 'ALL', type: 'UPDATE', priority: 'NORMAL' })}>Xóa trắng</button>
                <button type="submit" className="btn-primary"><IconSend size={14} /> Gửi thông báo ngay</button>
              </div>
            </form>
          </div>

          {/* Hướng dẫn & Thống kê */}
          <div className="panel-card-surface">
            <div className="panel-card-header"><h3>Phạm vi thông báo & Khuyến nghị</h3></div>
            <div className="p-4">
              <div className="system-alert info mb-4">
                <IconBell size={18} />
                <div className="alert-body">
                  <strong>Thông báo tức thời</strong>
                  <span>Người dùng trong phạm vi chỉ định sẽ nhìn thấy thông báo khi đăng nhập hoặc mở ứng dụng.</span>
                </div>
              </div>
              <ul className="help-list" style={{ listStyle: 'none', padding: 0 }}>
                <li style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}><IconUsers size={14} /> <strong>Tất cả người dùng:</strong> Thích hợp cho thông báo cập nhật ứng dụng, bảo trì hệ thống.</li>
                <li style={{ padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}><IconUsers size={14} /> <strong>Chủ nông hộ (OWNER):</strong> Khuyến cáo mùa vụ, báo cáo tài chính, kỹ thuật chăm sóc cây.</li>
                <li style={{ padding: '8px 0' }}><IconUsers size={14} /> <strong>Công nhân (WORKER):</strong> Hướng dẫn an toàn lao động, quy trình ghi chép nhật ký hiện trường.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="panel-card-surface">
          <div className="panel-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3><IconBell size={16} /> Lịch sử thông báo hệ thống ({filteredNotices.length})</h3>
            <select className="filter-select" style={{ maxWidth: '200px' }} value={filterTarget} onChange={e => setFilterTarget(e.target.value)}>
              <option value="">— Tất cả đối tượng —</option>
              {RECIPIENT_GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          </div>
          <div className="panel-table-container">
            <table className="panel-table">
              <thead><tr>
                <th>Tiêu đề</th><th>Nội dung tóm tắt</th><th>Đối tượng</th><th>Loại</th><th>Mức độ</th><th>Ngày gửi</th><th className="text-center">Thao tác</th>
              </tr></thead>
              <tbody>
                {filteredNotices.length === 0 ? (
                  <tr><td colSpan={7} className="table-empty">Chưa có thông báo nào</td></tr>
                ) : filteredNotices.map(n => (
                  <tr key={n.id}>
                    <td><strong>{n.title}</strong></td>
                    <td className="text-muted" style={{ maxWidth: 260, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.content}</td>
                    <td><span className="role-badge">{n.target}</span></td>
                    <td><code className="code-tag">{n.type}</code></td>
                    <td>
                      <span className={`status-badge ${n.priority === 'URGENT' ? 'rejected' : n.priority === 'HIGH' ? 'pending' : 'active'}`}>
                        {n.priority === 'URGENT' ? 'Khẩn cấp' : n.priority === 'HIGH' ? 'Quan trọng' : 'Bình thường'}
                      </span>
                    </td>
                    <td className="text-muted text-sm">{n.date}</td>
                    <td>
                      <div className="action-btns justify-center">
                        <button className="btn-xs blue" onClick={() => setViewingNotice(n)}>Xem</button>
                        <button className="btn-xs red" onClick={() => handleDeleteNotice(n.id, n.title)}><IconTrash size={12} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Xem chi tiết thông báo */}
      {viewingNotice && (
        <div className="modal-backdrop" onClick={() => setViewingNotice(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><IconBell size={18} className="text-primary-green" /><h3>Chi tiết thông báo</h3></div>
              <button className="modal-close" onClick={() => setViewingNotice(null)}>&times;</button>
            </div>
            <div className="modal-form">
              <div style={{ marginBottom: '14px' }}>
                <h4 style={{ fontSize: '1.1rem', margin: '0 0 6px 0' }}>{viewingNotice.title}</h4>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="text-muted text-xs">Gửi ngày: {viewingNotice.date}</span>
                  <span className="role-badge">{viewingNotice.target}</span>
                  <code className="code-tag">{viewingNotice.type}</code>
                </div>
              </div>
              <div style={{ background: 'var(--surface-sunken)', padding: '12px 14px', borderRadius: '8px', fontSize: '0.9rem', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                {viewingNotice.content}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setViewingNotice(null)}>Đóng</button>
                <button type="button" className="btn-primary" style={{ background: '#dc2626', borderColor: '#dc2626' }} onClick={() => { handleDeleteNotice(viewingNotice.id, viewingNotice.title); setViewingNotice(null); }}>
                  Xóa thông báo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
