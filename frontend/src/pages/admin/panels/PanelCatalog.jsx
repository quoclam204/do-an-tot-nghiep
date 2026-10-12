import React, { useState, useEffect } from 'react';
import {
  apiGetCrops, apiCreateCrop, apiUpdateCrop, apiDeleteCrop,
  apiGetMaterials, apiCreateMaterial, apiUpdateMaterial, apiDeleteMaterial,
  apiGetActivityTypes, apiCreateActivityType, apiUpdateActivityType, apiDeleteActivityType,
  apiGetGrowthCycles, apiCreateGrowthCycle, apiUpdateGrowthCycle, apiDeleteGrowthCycle,
} from '../../../services/api';
import {
  IconSprout, IconFlask, IconClipboardList, IconLeaf,
  IconPlus, IconTrash, IconCheckCircle, IconAlertTriangle, IconRotateCw,
  IconPenLine, IconDownload,
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
  const [viewingCycle, setViewingCycle] = useState(null);

  // Giai đoạn của chu kỳ sinh trưởng khi tạo/sửa
  const [stages, setStages] = useState([]);

  useEffect(() => { loadData(); }, [tab]);

  const loadData = async () => {
    setLoading(true); setError('');
    try {
      if (tab === 'crops') { const d = await apiGetCrops(); setCrops(d || []); }
      else if (tab === 'materials') { const d = await apiGetMaterials(); setMaterials(d || []); }
      else if (tab === 'activity-types') { const d = await apiGetActivityTypes(); setActivityTypes(d || []); }
      else if (tab === 'growth-cycles') {
        const [gc, cr] = await Promise.all([
          apiGetGrowthCycles(),
          apiGetCrops().catch(() => []),
        ]);
        setGrowthCycles(gc || []);
        setCrops(cr || []);
      }
    } catch (err) { setError(err.response?.data?.message || 'Lỗi tải danh mục'); }
    finally { setLoading(false); }
  };

  const showMsg = (msg) => { setSuccess(msg); setTimeout(() => setSuccess(''), 4000); };
  const showErr = (msg) => { setError(msg); setTimeout(() => setError(''), 5000); };

  const openCreate = () => {
    setEditItem(null);
    if (tab === 'crops') {
      setFormData({ name: '', type: '' });
    } else if (tab === 'materials') {
      setFormData({ name: '', type: 'PHAN_BON', unit: 'kg', defaultPrice: 0 });
    } else if (tab === 'activity-types') {
      setFormData({ code: '', name: '', description: '', icon: '' });
    } else if (tab === 'growth-cycles') {
      setFormData({ cropId: crops[0]?.id || '', name: '', description: '', yearsToFlower: '', yearsToHarvest: '' });
      setStages([
        { sequence: 1, name: 'Giai đoạn sinh trưởng', durationDays: 30, suggestedActivities: 'Bón phân, Tưới nước' },
      ]);
    }
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    if (tab === 'crops') {
      setFormData({ name: item.name, type: item.type });
    } else if (tab === 'materials') {
      setFormData({ name: item.name, type: item.type, unit: item.unit, defaultPrice: item.defaultPrice });
    } else if (tab === 'activity-types') {
      setFormData({ code: item.code, name: item.name, description: item.description, icon: item.icon });
    } else if (tab === 'growth-cycles') {
      setFormData({
        cropId: item.cropId,
        name: item.name,
        description: item.description || '',
        yearsToFlower: item.yearsToFlower || '',
        yearsToHarvest: item.yearsToHarvest || '',
      });
      setStages((item.stages || []).map((s, idx) => ({
        sequence: s.sequence || idx + 1,
        name: s.name,
        durationDays: s.durationDays,
        suggestedActivities: s.suggestedActivities || '',
      })));
    }
    setShowForm(true);
  };

  const handleAddStage = () => {
    setStages([
      ...stages,
      { sequence: stages.length + 1, name: '', durationDays: 30, suggestedActivities: '' },
    ]);
  };

  const handleRemoveStage = (index) => {
    if (stages.length <= 1) { showErr('Chu kỳ phải có ít nhất 1 giai đoạn'); return; }
    setStages(stages.filter((_, i) => i !== index).map((s, idx) => ({ ...s, sequence: idx + 1 })));
  };

  const handleStageChange = (index, field, value) => {
    const updated = [...stages];
    updated[index][field] = value;
    setStages(updated);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      if (tab === 'crops') {
        if (editItem) await apiUpdateCrop(editItem.id, formData);
        else await apiCreateCrop(formData);
      } else if (tab === 'materials') {
        if (editItem) await apiUpdateMaterial(editItem.id, formData);
        else await apiCreateMaterial(formData);
      } else if (tab === 'activity-types') {
        if (editItem) await apiUpdateActivityType(editItem.id, formData);
        else await apiCreateActivityType(formData);
      } else if (tab === 'growth-cycles') {
        const payload = {
          ...formData,
          stages: stages.map(s => ({
            sequence: s.sequence,
            name: s.name.trim(),
            durationDays: parseInt(s.durationDays) || 30,
            suggestedActivities: s.suggestedActivities || null,
          })),
        };
        if (!payload.name?.trim()) { showErr('Vui lòng nhập tên chu kỳ sinh trưởng'); setLoading(false); return; }
        if (payload.stages.some(s => !s.name)) { showErr('Vui lòng điền tên cho tất cả các giai đoạn'); setLoading(false); return; }

        if (editItem) await apiUpdateGrowthCycle(editItem.id, payload);
        else await apiCreateGrowthCycle(payload);
      }

      showMsg(editItem ? 'Đã cập nhật thành công!' : 'Đã tạo mới thành công!');
      setShowForm(false);
      setEditItem(null);
      await loadData();
    } catch (err) {
      showErr(err.response?.data?.message || 'Lỗi khi lưu dữ liệu');
    } finally { setLoading(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Xóa "${name}" khỏi danh mục hệ thống?`)) return;
    try {
      if (tab === 'crops') await apiDeleteCrop(id);
      else if (tab === 'materials') await apiDeleteMaterial(id);
      else if (tab === 'activity-types') await apiDeleteActivityType(id);
      else if (tab === 'growth-cycles') await apiDeleteGrowthCycle(id);
      showMsg('Đã xóa thành công!');
      await loadData();
    } catch (err) { showErr(err.response?.data?.message || 'Không thể xóa mục này'); }
  };

  const handleExportCSV = () => {
    if (currentList.length === 0) return;
    let header = [];
    let rows = [];

    if (tab === 'crops') {
      header = ['ID', 'Tên cây trồng', 'Loại cây'];
      rows = crops.map(c => [c.id, `"${c.name}"`, c.type]);
    } else if (tab === 'materials') {
      header = ['ID', 'Tên vật tư', 'Loại vật tư', 'Đơn vị', 'Đơn giá tham khảo'];
      rows = materials.map(m => [m.id, `"${m.name}"`, m.type, m.unit, m.defaultPrice]);
    } else if (tab === 'activity-types') {
      header = ['Mã công việc', 'Tên công việc', 'Mô tả', 'Loại'];
      rows = activityTypes.map(a => [a.code, `"${a.name}"`, `"${a.description || ''}"`, a.isSystem ? 'Hệ thống' : 'Tùy chỉnh']);
    } else if (tab === 'growth-cycles') {
      header = ['ID', 'Cây trồng', 'Tên chu kỳ', 'Tổng số ngày', 'Số giai đoạn', 'Năm ra hoa'];
      rows = growthCycles.map(g => [g.id, `"${g.crop?.name || ''}"`, `"${g.name}"`, g.totalDurationDays || 0, g.stages?.length || 0, g.yearsToFlower || '']);
    }

    const csv = '\ufeff' + [header.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `danh-muc-${tab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const currentList = tab === 'crops' ? crops : tab === 'materials' ? materials : tab === 'activity-types' ? activityTypes : growthCycles;

  return (
    <div className="panel-content">
      {error && <div className="panel-alert error"><IconAlertTriangle size={18} /><span>{error}</span><button onClick={() => setError('')}>&times;</button></div>}
      {success && <div className="panel-alert success"><IconCheckCircle size={18} /><span>{success}</span><button onClick={() => setSuccess('')}>&times;</button></div>}

      {/* Sub-tabs & Toolbar */}
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
          <button className="btn-action-secondary" onClick={handleExportCSV} title="Xuất dữ liệu CSV">
            <IconDownload size={14} /> Xuất CSV
          </button>
          <button className="btn-action-primary" onClick={openCreate}>
            <IconPlus size={15} /> Thêm mới
          </button>
          <button className="btn-action-secondary" onClick={loadData} disabled={loading}>
            <IconRotateCw size={14} className={loading ? 'spin-anim' : ''} />
          </button>
        </div>
      </div>

      {/* Danh sách */}
      <div className="panel-card-surface">
        <div className="panel-table-container">
          <table className="panel-table">
            <thead>
              {tab === 'crops' && <tr><th>#</th><th>Tên cây trồng</th><th>Loại</th><th>Chu kỳ SG</th><th className="text-center">Thao tác</th></tr>}
              {tab === 'materials' && <tr><th>#</th><th>Tên vật tư</th><th>Loại</th><th>Đơn vị</th><th>Đơn giá tham khảo</th><th className="text-center">Thao tác</th></tr>}
              {tab === 'activity-types' && <tr><th>#</th><th>Mã</th><th>Tên công việc</th><th>Mô tả</th><th>Loại</th><th className="text-center">Thao tác</th></tr>}
              {tab === 'growth-cycles' && <tr><th>#</th><th>Cây trồng</th><th>Tên chu kỳ</th><th>Tổng số ngày</th><th>Số giai đoạn</th><th>Năm ra hoa</th><th className="text-center">Thao tác</th></tr>}
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="table-empty"><IconRotateCw size={20} className="spin-anim text-primary-green" /> Đang tải dữ liệu...</td></tr>
              ) : currentList.length === 0 ? (
                <tr><td colSpan={7} className="table-empty">Chưa có dữ liệu danh mục</td></tr>
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
                    <td><strong>{item.name}</strong></td>
                    <td><span className="count-badge">{item.totalDurationDays || 0} ngày</span></td>
                    <td>
                      <button className="btn-xs gray" onClick={() => setViewingCycle(item)}>
                        {item.stages?.length || 0} giai đoạn
                      </button>
                    </td>
                    <td>{item.yearsToFlower ? `${item.yearsToFlower} năm` : '—'}</td>
                    <td><div className="action-btns justify-center">
                      <button className="btn-xs blue" onClick={() => openEdit(item)}><IconPenLine size={12} />Sửa</button>
                      <button className="btn-xs red" onClick={() => handleDelete(item.id, item.name)}><IconTrash size={12} />Xóa</button>
                    </div></td>
                  </>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Thêm / Sửa */}
      {showForm && (
        <div className="modal-backdrop" onClick={() => setShowForm(false)}>
          <div className="modal-dialog" style={{ maxWidth: tab === 'growth-cycles' ? '650px' : '520px' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><IconPlus size={18} className="text-primary-green" /><h3>{editItem ? 'Chỉnh sửa' : 'Thêm mới'} {SUBTABS.find(t => t.key === tab)?.label}</h3></div>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <div className="modal-form">
              {tab === 'crops' && <>
                <div className="form-row"><label>Tên cây trồng <span className="req">*</span></label><input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Cà phê Arabica" /></div>
                <div className="form-row"><label>Mã / Loại cây <span className="req">*</span></label><input required value={formData.type || ''} onChange={e => setFormData({...formData, type: e.target.value.toUpperCase()})} placeholder="VD: CA_PHE, HO_TIEU, SAU_RIENG" /></div>
              </>}
              {tab === 'materials' && <>
                <div className="form-row"><label>Tên vật tư <span className="req">*</span></label><input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Phân NPK 20-20-15" /></div>
                <div className="form-row"><label>Loại vật tư</label>
                  <select value={formData.type || 'PHAN_BON'} onChange={e => setFormData({...formData, type: e.target.value})}>
                    {MATERIAL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div className="form-row"><label>Đơn vị tính <span className="req">*</span></label><input required value={formData.unit || ''} onChange={e => setFormData({...formData, unit: e.target.value})} placeholder="VD: kg, lít, bao, chai" /></div>
                <div className="form-row"><label>Đơn giá tham khảo (VNĐ)</label><input type="number" min={0} value={formData.defaultPrice || 0} onChange={e => setFormData({...formData, defaultPrice: parseFloat(e.target.value) || 0})} /></div>
              </>}
              {tab === 'activity-types' && <>
                <div className="form-row"><label>Mã công việc <span className="req">*</span></label><input required value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} placeholder="VD: BON_PHAN, PHUN_THUOC" /></div>
                <div className="form-row"><label>Tên hiển thị <span className="req">*</span></label><input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Bón phân, Phun thuốc BVTV" /></div>
                <div className="form-row"><label>Mô tả công việc</label><input value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Mô tả tóm tắt..." /></div>
              </>}
              {tab === 'growth-cycles' && <>
                <div className="form-row"><label>Cây trồng áp dụng <span className="req">*</span></label>
                  <select value={formData.cropId || ''} onChange={e => setFormData({...formData, cropId: e.target.value})}>
                    {crops.map(c => <option key={c.id} value={c.id}>{c.name} ({c.type})</option>)}
                  </select>
                </div>
                <div className="form-row"><label>Tên chu kỳ sinh trưởng <span className="req">*</span></label><input required value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="VD: Chu kỳ kinh doanh năm thứ 4" /></div>
                <div className="form-row"><label>Mô tả</label><input value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Mô tả đặc điểm chu kỳ..." /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="form-row"><label>Năm ra hoa (nếu có)</label><input type="number" step="0.5" value={formData.yearsToFlower || ''} onChange={e => setFormData({...formData, yearsToFlower: e.target.value})} placeholder="VD: 3" /></div>
                  <div className="form-row"><label>Năm cho thu hoạch</label><input type="number" step="0.5" value={formData.yearsToHarvest || ''} onChange={e => setFormData({...formData, yearsToHarvest: e.target.value})} placeholder="VD: 4" /></div>
                </div>

                {/* Danh sách giai đoạn */}
                <div style={{ marginTop: '14px', borderTop: '1px solid var(--border-light)', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontWeight: '700', fontSize: '0.9rem' }}>Các giai đoạn của chu kỳ ({stages.length})</label>
                    <button type="button" className="btn-xs green" onClick={handleAddStage}>+ Thêm giai đoạn</button>
                  </div>
                  {stages.map((stg, sIdx) => (
                    <div key={sIdx} style={{ background: 'var(--surface-sunken)', padding: '10px', borderRadius: '8px', marginBottom: '8px', border: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: '700' }}>Giai đoạn #{sIdx + 1}</span>
                        {stages.length > 1 && (
                          <button type="button" className="btn-xs red" onClick={() => handleRemoveStage(sIdx)} style={{ padding: '2px 6px' }}>Xóa</button>
                        )}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '8px', marginBottom: '6px' }}>
                        <input required value={stg.name} onChange={e => handleStageChange(sIdx, 'name', e.target.value)} placeholder="Tên giai đoạn (VD: Phát triển cành)" />
                        <input type="number" min={1} required value={stg.durationDays} onChange={e => handleStageChange(sIdx, 'durationDays', e.target.value)} placeholder="Số ngày (VD: 45)" />
                      </div>
                      <input value={stg.suggestedActivities || ''} onChange={e => handleStageChange(sIdx, 'suggestedActivities', e.target.value)} placeholder="Hoạt động gợi ý (VD: Bón phân NPK, Cắt cành chồi)" style={{ fontSize: '0.85rem' }} />
                    </div>
                  ))}
                </div>
              </>}
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>Hủy</button>
                <button type="button" className="btn-primary" onClick={handleSave} disabled={loading}>{loading ? 'Đang lưu...' : 'Lưu dữ liệu'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Xem chi tiết các giai đoạn */}
      {viewingCycle && (
        <div className="modal-backdrop" onClick={() => setViewingCycle(null)}>
          <div className="modal-dialog" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title"><IconLeaf size={18} className="text-primary-green" /><h3>Giai đoạn: {viewingCycle.name}</h3></div>
              <button className="modal-close" onClick={() => setViewingCycle(null)}>&times;</button>
            </div>
            <div className="modal-form">
              <p className="text-muted text-sm mb-3">
                Cây trồng: <strong>{viewingCycle.crop?.name}</strong> — Tổng thời gian: <strong>{viewingCycle.totalDurationDays || 0} ngày</strong>
              </p>
              <div className="stages-timeline">
                {(viewingCycle.stages || []).map((stg, i) => (
                  <div key={stg.id || i} style={{ padding: '10px 14px', background: 'var(--surface-sunken)', borderRadius: '8px', marginBottom: '8px', borderLeft: '3px solid var(--primary-green)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <strong>{stg.sequence}. {stg.name}</strong>
                      <span className="count-badge">{stg.durationDays} ngày</span>
                    </div>
                    {stg.suggestedActivities && (
                      <p className="text-muted text-xs mt-1">Gợi ý: {stg.suggestedActivities}</p>
                    )}
                  </div>
                ))}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-cancel" onClick={() => setViewingCycle(null)}>Đóng</button>
                <button type="button" className="btn-primary" onClick={() => { openEdit(viewingCycle); setViewingCycle(null); }}>Chỉnh sửa</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
