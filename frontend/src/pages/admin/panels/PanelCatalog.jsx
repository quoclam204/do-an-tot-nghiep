import React, { useState, useEffect } from 'react';
import {
  apiGetCrops, apiCreateCrop, apiUpdateCrop, apiDeleteCrop,
  apiGetMaterials, apiCreateMaterial, apiUpdateMaterial, apiDeleteMaterial,
  apiGetActivityTypes, apiCreateActivityType, apiUpdateActivityType, apiDeleteActivityType,
  apiGetGrowthCycles,
} from '../../../services/api';
import {
  IconSprout, IconFlask, IconClipboardList, IconLeaf,
  IconPlus, IconTrash, IconCheckCircle, IconAlertTriangle, IconRotateCw, IconPenLine,
} from '../../../components/icons';

const SUBTABS = [
  { key: 'crops', label: 'Cây trồng', icon: IconSprout },
  { key: 'materials', label: 'Vật tư danh mục', icon: IconFlask },
  { key: 'activity-types', label: 'Loại công việc', icon: IconClipboardList },
  { key: 'growth-cycles', label: 'Chu kỳ sinh trưởng', icon: IconLeaf },
];

const MATERIAL_TYPES = [
  { value: 'PHAN_BON', label: 'Phân bón' },
  { value: 'THUOC_BVTV', label: 'Thuốc BVTV' },
  { value: 'GIONG', label: 'Giống cây' },
  { value: 'NHIEN_LIEU', label: 'Nhiên liệu' },
  { value: 'KHAC', label: 'Khác' },
];

export default function PanelCatalog() {
  const [tab, setTab] = useState('crops');
  const [crops, setCrops] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [activityTypes, setActivityTypes] = useState([]);
  const [growthCycles, setGrowthCycles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editItem, setEditItem] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      if (tab === 'crops') { const d = await apiGetCrops(); setCrops(d || []); }
      else if (tab === 'materials') { const d = await apiGetMaterials(); setMaterials(d || []); }
      else if (tab === 'activity-types') { const d = await apiGetActivityTypes(); setActivityTypes(d || []); }
      else if (tab === 'growth-cycles') { const d = await apiGetGrowthCycles(); setGrowthCycles(d || []); }
    } catch (err) { setError(err.response?.data?.message || 'Lỗi tải danh mục'); }
    finally { setLoading(false); }
  };

  const showMsg = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };
  const showErr = (msg) => { setError(msg); setTimeout(() => setError(''), 5000); };

  const openCreate = () => {
    setEditItem(null);
    setFormData(tab === 'crops' ? { name: '', type: '' } :
      tab === 'materials' ? { name: '', type: 'PHAN_BON', unit: 'kg', defaultPrice: 0 } :
      tab === 'activity-types' ? { code: '', name: '', description: '', icon: '' } :
      {});
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setFormData(tab === 'crops' ? { name: item.name, type: item.type } :
      tab === 'materials' ? { name: item.name, type: item.type, unit: item.unit, defaultPrice: item.defaultPrice } :
      tab === 'activity-types' ? { code: item.code, name: item.name, description: item.description, icon: item.icon } :
      {});
    setShowForm(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (tab === 'crops') {
        if (editItem) await apiUpdateCrop(editItem.id, formData); else await apiCreateCrop(formData);
      } else if (tab === 'materials') {
        if (editItem) await apiUpdateMaterial(editItem.id, formData); else await apiCreateMaterial(formData);
      } else if (tab === 'activity-types') {
        if (editItem) await apiUpdateActivityType(editItem.id, formData); else await apiCreateActivityType(formData);
      }
      showMsg(editItem ? 'Đã cập nhật!' : 'Đã tạo mới!');
      setShowForm(false); setEditItem(null);
      await loadData();
    } catch (err) { showErr(err.response?.data?.message || 'Lỗi lưu'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa "${name}"?`)) return;
    try {
      if (tab === 'crops') await apiDeleteCrop(id);
      else if (tab === 'materials') await apiDeleteMaterial(id);
      else if (tab === 'activity-types') await apiDeleteActivityType(id);
      showMsg('Đã xóa!'); await loadData();
    } catch (err) { showErr(err.response?.data?.message || 'Không thể xóa'); }
  };

  const currentList = tab === 'crops' ? crops : tab === 'materials' ? materials : tab === 'activity-types' ? activityTypes : growthCycles;

  return (
    <div className="panel-content">
      {error && <div className="panel-alert error"><IconAlertTriangle size={18} /><span>{error}</span><button onClick={() => setError('')}>&times;</button></div>}
      {success && <div className="panel-alert success"><IconCheckCircle size={18} /><span>{success}</span><button onClick={() => setSuccess('')}>&times;</button></div>}

      {/* Sub-tabs */}
      <div className="panel-toolbar">
        <div className="panel-tabs-inline">
          {SUBTABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.key} className={`panel-tab-btn ${tab === t.key ? 'active' : ''}`} onClick={() => setTab(t.key)}>
                <Icon size={15} /><span>{t.label}</span>
              </button>
            );
          })}
        </div>
        <div className="toolbar-right">
          {tab !== 'growth-cycles' && (
            <button className="btn-action-primary" onClick={openCreate}><IconPlus size={15} /> Thêm mới</button>
          )}
          <button className="btn-action-secondary" onClick={loadData}><IconRotateCw size={14} className={loading ? 'spin-anim' : ''} /></button>
        </div>
      </div>

      {/* Danh sách */}
      <div className="panel-card-surface">
        <div className="panel-table-container">
          <table className="panel-table">
            <thead>
              {tab === 'crops' && <tr><th>#</th><th>Tên cây trồng</th><th>Loại</th><th>Chu kỳ SG</th><th className="text-center">Thao tác</th></tr>}
              {tab === 'materials' && <tr><th>#</th><th>Tên vật tư</th><th>Loại</th><th>Đơn vị</th><th>Đơn giá tham khảo</th><th className="text-center">Thao tác</th></tr>}
              {tab === 'activity-types' && <tr><th>#</th><th>Mã</th><th>Tên công việc</th><th>Mô tả</th><th>Hệ thống?</th><th className="text-center">Thao tác</th></tr>}
              {tab === 'growth-cycles' && <tr><th>#</th><th>Cây trồng</th><th>Tên chu kỳ</th><th>Số giai đoạn</th><th>Thời gian ra hoa (năm)</th></tr>}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} className="table-empty"><IconRotateCw size={20} className="spin-anim text-primary-green" /></td></tr>
              ) : currentList.length === 0 ? (
                <tr><td colSpan={6} className="table-empty">Chưa có dữ liệu</td></tr>
              ) : currentList.map((item, i) => (
                <tr key={item.id}>
                  <td className="text-muted text-sm">{i + 1}</td>
                  {tab === 'crops' && <>
                    <td><strong>{item.name}</strong></td>
                    <td><span className="role-badge">{item.type}</span></td>
                    <td><span className="count-badge">{item.growthCycles?.length || 0} chu kỳ</span></td>
                    <td><div className="action-btns justify-center">
                      <button className="btn-xs blue" onClick={() => openEdit(item)}><IconPenLine size={12} />Sửa</button>
                      <button className="btn-xs red" onClick={() => handleDelete(item.id, item.name)}><IconTrash size={12} />Xóa</button>
                    </div></td>
                  </>}
                  {tab === 'materials' && <>
                    <td><strong>{item.name}</strong></td>
                    <td><span className="role-badge">{MATERIAL_TYPES.find(t => t.value === item.type)?.label || item.type}</span></td>
                    <td>{item.unit}</td>
                    <td><strong>{new Intl.NumberFormat('vi-VN').format(item.defaultPrice)} ₫/{item.unit}</strong></td>
                    <td><div className="action-btns justify-center">
                      <button className="btn-xs blue" onClick={() => openEdit(item)}><IconPenLine size={12} />Sửa</button>
                      <button className="btn-xs red" onClick={() => handleDelete(item.id, item.name)}><IconTrash size={12} />Xóa</button>
                    </div></td>
                  </>}
                  {tab === 'activity-types' && <>
                    <td><code className="code-tag">{item.code}</code></td>
                    <td><strong>{item.name}</strong></td>
                    <td className="text-muted">{item.description || '—'}</td>
                    <td>{item.isSystem ? <span className="status-badge active">Hệ thống</span> : <span className="status-badge">Tùy chỉnh</span>}</td>
                    <td><div className="action-btns justify-center">
                      <button className="btn-xs blue" onClick={() => openEdit(item)}><IconPenLine size={12} />Sửa</button>
                      {!item.isSystem && <button className="btn-xs red" onClick={() => handleDelete(item.id, item.name)}><IconTrash size={12} />Xóa</button>}
                    </div></td>
                  </>}
                  {tab === 'growth-cycles' && <>
                    <td><strong>{item.crop?.name || '—'}</strong></td>
                    <td>{item.name}</td>
                    <td><span className="count-badge">{item.stages?.length || 0} giai đoạn</span></td>
                    <td>{item.yearsToFlower ? `${item.yearsToFlower} năm` : '—'}</td>
                  </>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Form thêm/sửa */}
      {showForm && tab !== 'growth-cycles' && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><IconPlus size={18} className="text-primary-green" /><h3>{editItem ? 'Chỉnh sửa' : 'Thêm mới'} {SUBTABS.find(t => t.key === tab)?.label}</h3></div>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <div className="modal-form">
              {tab === 'crops' && <>
                <div className="form-row"><label>Tên cây trồng <span className="req">*</span></label><input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Cà phê Arabica" /></div>
                <div className="form-row"><label>Loại cây <span className="req">*</span></label><input value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value})} placeholder="VD: CA_PHE, HO_TIEU, SAU_RIENG" /></div>
              </>}
              {tab === 'materials' && <>
                <div className="form-row"><label>Tên vật tư <span className="req">*</span></label><input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Phân NPK 20-20-15" /></div>
                <div className="form-row"><label>Loại</label>
                  <select value={formData.type || 'PHAN_BON'} onChange={e => setFormData({...formData, type: e.target.value})}>
                    {MATERIAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-row"><label>Đơn vị <span className="req">*</span></label><input value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="VD: kg, lít, bao, chai" /></div>
                <div className="form-row"><label>Đơn giá tham khảo (VNĐ)</label><input type="number" min={0} value={formData.defaultPrice || 0} onChange={e => setFormData({...formData, defaultPrice: parseFloat(e.target.value) || 0})} /></div>
              </>}
              {tab === 'activity-types' && <>
                <div className="form-row"><label>Mã công việc <span className="req">*</span></label><input value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="VD: BON_PHAN, PHUN_THUOC" /></div>
                <div className="form-row"><label>Tên hiển thị <span className="req">*</span></label><input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Bón phân, Phun thuốc BVTV" /></div>
                <div className="form-row"><label>Mô tả</label><input value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Mô tả ngắn..." /></div>
              </>}
              <div className="modal-footer">
                <button className="btn-cancel" onClick={() => setShowForm(false)}>Hủy</button>
                <button className="btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
