import React, { useState } from 'react';
import {
  IconBell, IconUsers, IconCheckCircle, IconAlertTriangle, IconSend, IconPenLine,
} from '../../../components/icons';

const RECIPIENT_GROUPS = [
  { value: 'ALL', label: 'Tất cả người dùng' },
  { value: 'OWNER', label: 'Chỉ Chủ nông hộ (OWNER)' },
  { value: 'WORKER', label: 'Chỉ Công nhân (WORKER)' },
  { value: 'ADMIN', label: 'Chỉ Quản trị viên (ADMIN)' },
];

const SYSTEM_NOTICES = [
  { id: 1, title: 'Cập nhật ứng dụng v2.1', content: 'Phiên bản mới đã hỗ trợ ghi nhật ký offline và đồng bộ tự động.', date: '2026-09-15', target: 'ALL', status: 'sent' },
  { id: 2, title: 'Bảo trì hệ thống định kỳ', content: 'Hệ thống sẽ bảo trì vào 00:00 - 02:00 ngày 20/09/2026. Vui lòng lưu dữ liệu trước.', date: '2026-09-18', target: 'ALL', status: 'sent' },
  { id: 3, title: 'Tính năng Báo cáo tài chính mới', content: 'Nay có thể xuất báo cáo vụ mùa dạng CSV trực tiếp trên ứng dụng.', date: '2026-09-20', target: 'OWNER', status: 'sent' },
];

export default function PanelNotifications() {
  const [tab, setTab] = useState('send');
  const [form, setForm] = useState({ title: '', content: '', target: 'ALL' });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.content.trim()) { setError('Vui lòng nhập tiêu đề và nội dung thông báo'); return; }
    // Demo: Hiển thị thành công (thực tế cần backend push notification)
    setSent(true);
    setTimeout(() => { setSent(false); setForm({ title: '', content: '', target: 'ALL' }); }, 3000);
  };

  return (
    <div className="panel-content">
      {/* Sub-tabs */}
      <div className="panel-toolbar">
        <div className="panel-tabs-inline">
          <button className={`panel-tab-btn ${tab === 'send' ? 'active' : ''}`} onClick={() => setTab('send')}>
            <IconSend size={14} /> Gửi thông báo
          </button>
          <button className={`panel-tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>
            <IconBell size={14} /> Lịch sử thông báo
          </button>
        </div>
      </div>

      {tab === 'send' && (
        <div className="panel-two-col notif-layout">
          {/* Form gửi thông báo */}
          <div className="panel-card-surface">
            <div className="panel-card-header">
              <h3><IconPenLine size={16} /> Soạn thông báo hệ thống</h3>
            </div>
            {error && <div className="panel-alert error mx-4"><IconAlertTriangle size={16} /><span>{error}</span><button onClick={() => setError('')}>&times;</button></div>}
            {sent && <div className="panel-alert success mx-4"><IconCheckCircle size={16} /><span>Đã gửi thông báo thành công!</span></div>}
            <form onSubmit={handleSend} className="modal-form p-4">
              <div className="form-row">
                <label>Đối tượng nhận</label>
                <select value={form.target} onChange={e => setForm({...form, target: e.target.value})}>
                  {RECIPIENT_GROUPS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>
              <div className="form-row">
                <label>Tiêu đề thông báo <span className="req">*</span></label>
                <input value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="Ví dụ: Cập nhật chức năng mới..." />
              </div>
              <div className="form-row">
                <label>Nội dung <span className="req">*</span></label>
                <textarea rows={6} value={form.content} onChange={e => setForm({...form, content: e.target.value})} placeholder="Nội dung thông báo chi tiết..." style={{ resize: 'vertical' }} />
              </div>
              <div className="modal-footer pt-0">
                <button type="button" className="btn-cancel" onClick={() => setForm({ title: '', content: '', target: 'ALL' })}>Xóa trắng</button>
                <button type="submit" className="btn-primary"><IconSend size={14} /> Gửi thông báo</button>
              </div>
            </form>
          </div>

          {/* Hướng dẫn */}
          <div className="panel-card-surface">
            <div className="panel-card-header"><h3>Hướng dẫn sử dụng</h3></div>
            <div className="p-4">
              <div className="system-alert info mb-4">
                <IconBell size={18} />
                <div className="alert-body">
                  <strong>Thông báo nội bộ</strong>
                  <span>Thông báo sẽ được hiển thị cho người dùng khi họ truy cập hệ thống lần tiếp theo.</span>
                </div>
              </div>
              <ul className="help-list">
                <li><IconUsers size={14} /> <strong>Tất cả người dùng</strong> — Gửi cho toàn bộ tài khoản trong hệ thống</li>
                <li><IconUsers size={14} /> <strong>Chủ nông hộ</strong> — Phù hợp cho thông báo về quản lý canh tác</li>
                <li><IconUsers size={14} /> <strong>Công nhân</strong> — Phù hợp cho thông báo quy trình làm việc</li>
              </ul>

              <div className="system-alert warning mt-4">
                <IconAlertTriangle size={18} />
                <div className="alert-body">
                  <strong>Mở rộng trong tương lai</strong>
                  <span>Gửi thông báo Push (PWA) và Email cần cấu hình Firebase/SMTP ở backend.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'history' && (
        <div className="panel-card-surface">
          <div className="panel-card-header">
            <h3><IconBell size={16} /> Thông báo đã gửi ({SYSTEM_NOTICES.length})</h3>
          </div>
          <div className="panel-table-container">
            <table className="panel-table">
              <thead><tr>
                <th>Tiêu đề</th><th>Nội dung</th><th>Đối tượng</th><th>Ngày gửi</th><th>Trạng thái</th>
              </tr></thead>
              <tbody>
                {SYSTEM_NOTICES.map(n => (
                  <tr key={n.id}>
                    <td><strong>{n.title}</strong></td>
                    <td className="text-muted" style={{ maxWidth: 300 }}>{n.content}</td>
                    <td><span className="role-badge">{RECIPIENT_GROUPS.find(g => g.value === n.target)?.label || n.target}</span></td>
                    <td className="text-muted">{n.date}</td>
                    <td><span className="status-badge active"><IconCheckCircle size={11} />Đã gửi</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
