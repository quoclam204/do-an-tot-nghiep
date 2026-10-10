import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { Feather } from '@expo/vector-icons';
import {
  apiGetLogs,
  apiCreateLog,
  apiUpdateLog,
  apiDeleteLog,
  apiGetSeasons,
  apiGetPlots,
  apiGetMaterials,
} from '../services/api';

const ACTIVITIES = [
  'Tất cả',
  'Bón phân',
  'Tưới nước',
  'Phun thuốc BVTV',
  'Cắt tỉa & Làm cỏ',
  'Gieo trồng & Làm đất',
  'Thu hoạch',
  'Kiểm tra sâu bệnh',
];

const FORM_ACTIVITIES = [
  'Bón phân',
  'Tưới nước',
  'Phun thuốc BVTV',
  'Cắt tỉa & Làm cỏ',
  'Gieo trồng & Làm đất',
  'Thu hoạch',
  'Kiểm tra sâu bệnh',
];

export default function FarmingLogsScreen({ navigation }) {
  const [logs, setLogs] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [plots, setPlots] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [filterActivity, setFilterActivity] = useState('Tất cả');
  const [searchText, setSearchText] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Form fields
  const [formActivity, setFormActivity] = useState('Bón phân');
  const [formSeasonId, setFormSeasonId] = useState('');
  const [formPlotName, setFormPlotName] = useState('');
  const [formMaterialId, setFormMaterialId] = useState('');
  const [formMaterialName, setFormMaterialName] = useState('');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('kg');
  const [formCost, setFormCost] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const loadData = async () => {
    try {
      const [logsRes, seasonsRes, plotsRes, matsRes] = await Promise.allSettled([
        apiGetLogs(),
        apiGetSeasons(),
        apiGetPlots(),
        apiGetMaterials(),
      ]);

      if (logsRes.status === 'fulfilled') {
        setLogs(Array.isArray(logsRes.value) ? logsRes.value : []);
      }
      if (seasonsRes.status === 'fulfilled') {
        setSeasons(Array.isArray(seasonsRes.value) ? seasonsRes.value : []);
      }
      if (plotsRes.status === 'fulfilled') {
        setPlots(Array.isArray(plotsRes.value) ? plotsRes.value : []);
      }
      if (matsRes.status === 'fulfilled') {
        setMaterials(Array.isArray(matsRes.value) ? matsRes.value : []);
      }
    } catch (e) {
      console.warn('Lỗi tải dữ liệu nhật ký:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingLogId(null);
    setFormActivity('Bón phân');
    setFormSeasonId(seasons[0]?.id || '');
    setFormPlotName(plots[0]?.name || 'Lô chính');
    setFormMaterialId('');
    setFormMaterialName('');
    setFormQuantity('');
    setFormUnit('kg');
    setFormCost('');
    setFormNotes('');
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditingLogId(item.id);
    setFormActivity(item.activityType || 'Bón phân');
    setFormSeasonId(item.cropCycleId || item.seasonId || '');
    setFormPlotName(item.plot?.name || item.plotName || '');
    setFormMaterialName(item.materialName || '');
    setFormQuantity(item.quantity ? String(item.quantity) : '');
    setFormCost(item.cost ? String(item.cost) : '');
    setFormNotes(item.notes || '');
    setModalVisible(true);
  };

  const handleSelectMaterial = (mat) => {
    if (formMaterialId === mat.id) {
      // Toggle off
      setFormMaterialId('');
      setFormMaterialName('');
      setFormUnit('kg');
    } else {
      setFormMaterialId(mat.id);
      setFormMaterialName(mat.name);
      setFormUnit(mat.unit || 'kg');
      if (mat.price && !formCost) {
        setFormCost(String(mat.price));
      }
    }
  };

  const handleSubmit = async () => {
    if (!formActivity) {
      Alert.alert('Lỗi', 'Vui lòng chọn loại hoạt động');
      return;
    }

    setSubmitting(true);
    const payload = {
      activityType: formActivity,
      cropCycleId: formSeasonId || undefined,
      plotName: formPlotName || undefined,
      materialName: formMaterialName || undefined,
      quantity: formQuantity ? Number(formQuantity) : 0,
      cost: formCost ? Number(formCost) : 0,
      notes: formNotes,
      date: new Date().toISOString(),
    };

    try {
      if (editingLogId) {
        await apiUpdateLog(editingLogId, payload);
        Alert.alert('Thành công', 'Đã cập nhật nhật ký canh tác!');
      } else {
        await apiCreateLog(payload);
        Alert.alert('Thành công', 'Đã ghi nhật ký canh tác mới!');
      }
      setModalVisible(false);
      loadData();
    } catch (err) {
      Alert.alert('Thất bại', err.response?.data?.message || 'Không thể lưu nhật ký');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa bản ghi này không?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDeleteLog(id);
            setLogs((prev) => prev.filter((item) => item.id !== id));
            Alert.alert('Thành công', 'Đã xóa bản ghi nhật ký');
          } catch (e) {
            Alert.alert('Lỗi', 'Không thể xóa nhật ký');
          }
        },
      },
    ]);
  };

  // Filter logs
  const filteredLogs = logs.filter((item) => {
    const act = (item.activityType || '').toLowerCase();
    const notes = (item.notes || '').toLowerCase();
    const plot = (item.plot?.name || item.plotName || '').toLowerCase();
    const mat = (item.materialName || '').toLowerCase();

    const matchesSearch =
      !searchText.trim() ||
      notes.includes(searchText.toLowerCase()) ||
      plot.includes(searchText.toLowerCase()) ||
      mat.includes(searchText.toLowerCase()) ||
      act.includes(searchText.toLowerCase());

    const matchesFilter =
      filterActivity === 'Tất cả' ||
      act.includes(filterActivity.toLowerCase()) ||
      (filterActivity === 'Thu hoạch' && (item.harvestQuantity > 0 || item.revenue > 0));

    return matchesSearch && matchesFilter;
  });

  // Calculate quick metrics
  const totalLogs = filteredLogs.length;
  const totalCost = filteredLogs.reduce((sum, item) => sum + (Number(item.cost) > 0 ? Number(item.cost) : 0), 0);

  const renderLogItem = ({ item }) => {
    const isHarvest = item.activityType === 'Thu hoạch' || item.activityType === 'THU_HOACH' || Number(item.harvestQuantity) > 0;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, isHarvest && styles.badgeHarvest]}>
            <Feather
              name={isHarvest ? 'shopping-bag' : 'check-circle'}
              size={13}
              color={isHarvest ? '#ea580c' : COLORS.primary}
            />
            <Text style={[styles.badgeText, isHarvest && styles.badgeTextHarvest]}>
              {item.activityType || item.name || 'Công việc đồng áng'}
            </Text>
          </View>
          <View style={styles.actionBtns}>
            <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
              <Feather name="edit-2" size={15} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.iconBtn}>
              <Feather name="trash-2" size={15} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.plotText}>
          <Feather name="map-pin" size={13} color={COLORS.textSecondary} />{' '}
          {item.plot?.name || item.plotName || 'Toàn vườn'}
        </Text>

        {item.materialName ? (
          <View style={styles.metaRow}>
            <Feather name="box" size={12} color={COLORS.textMuted} />
            <Text style={styles.metaLabel}>Vật tư:</Text>
            <Text style={styles.metaValue}>
              {item.materialName} ({item.quantity || 1} {item.unit || 'kg'})
            </Text>
          </View>
        ) : null}

        {item.cost && Number(item.cost) > 0 ? (
          <View style={styles.metaRow}>
            <Feather name="dollar-sign" size={12} color={COLORS.danger} />
            <Text style={styles.metaLabel}>Chi phí:</Text>
            <Text style={[styles.metaValue, { color: COLORS.danger, fontWeight: '700' }]}>
              {Number(item.cost).toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>
        ) : null}

        {item.revenue && Number(item.revenue) > 0 ? (
          <View style={styles.metaRow}>
            <Feather name="trending-up" size={12} color={COLORS.primary} />
            <Text style={styles.metaLabel}>Doanh thu thu hoạch:</Text>
            <Text style={[styles.metaValue, { color: COLORS.primary, fontWeight: '700' }]}>
              +{Number(item.revenue).toLocaleString('vi-VN')} VNĐ
            </Text>
          </View>
        ) : null}

        {item.notes ? <Text style={styles.notesText}>"{item.notes}"</Text> : null}

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            <Feather name="calendar" size={11} color={COLORS.textMuted} />{' '}
            {new Date(item.date || item.createdAt).toLocaleDateString('vi-VN')}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Offline Mode Banner */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#f8fafc',
          marginHorizontal: 12,
          marginTop: 10,
          marginBottom: 4,
          padding: 10,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: COLORS.border,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
          <Feather name="wifi-off" size={16} color={COLORS.primary} />
          <Text style={{ fontSize: 12, color: COLORS.text, fontWeight: '600' }}>
            Ra rẫy mất sóng điện thoại?
          </Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: '#e2e8f0',
            paddingHorizontal: 8,
            paddingVertical: 5,
            borderRadius: 6,
          }}
          onPress={() => navigation.navigate('OfflineSync')}
          activeOpacity={0.8}
        >
          <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.primary }}>
            Ghi ngoại tuyến
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Feather name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm nhật ký, vật tư, lô đất..."
          value={searchText}
          onChangeText={setSearchText}
        />
        {searchText.length > 0 && (
          <TouchableOpacity onPress={() => setSearchText('')}>
            <Feather name="x" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* KPI Top Banner */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Tổng hoạt động</Text>
          <Text style={styles.kpiValue}>{totalLogs}</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Tổng chi phí</Text>
          <Text style={[styles.kpiValue, { color: COLORS.danger }]}>
            {totalCost.toLocaleString('vi-VN')} <Text style={styles.kpiUnit}>đ</Text>
          </Text>
        </View>
      </View>

      {/* Filter Horizontal Chips */}
      <View style={styles.chipScrollWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipScroll}>
          {ACTIVITIES.map((act) => (
            <TouchableOpacity
              key={act}
              style={[styles.filterChip, filterActivity === act && styles.filterChipActive]}
              onPress={() => setFilterActivity(act)}
            >
              <Text style={[styles.filterChipText, filterActivity === act && styles.filterChipTextActive]}>
                {act}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải nhật ký canh tác...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredLogs}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderLogItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadData();
              }}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Feather name="book-open" size={44} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Chưa có bản ghi nhật ký phù hợp</Text>
              <Text style={styles.emptySub}>Bấm nút "+" để thêm mới hoạt động canh tác hôm nay.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={openCreateModal} activeOpacity={0.8}>
        <Feather name="plus" size={26} color={COLORS.white} />
      </TouchableOpacity>

      {/* Modal Thêm / Chỉnh Sửa Nhật Ký */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingLogId ? 'Chỉnh sửa nhật ký' : 'Ghi nhật ký canh tác'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Chọn hoạt động */}
              <Text style={styles.formLabel}>Loại hoạt động *</Text>
              <View style={styles.chipGrid}>
                {FORM_ACTIVITIES.map((act) => (
                  <TouchableOpacity
                    key={act}
                    style={[styles.chip, formActivity === act && styles.chipActive]}
                    onPress={() => setFormActivity(act)}
                  >
                    <Text style={[styles.chipText, formActivity === act && styles.chipTextActive]}>
                      {act}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Chọn mùa vụ nếu có */}
              {seasons.length > 0 && (
                <>
                  <Text style={styles.formLabel}>Mùa vụ liên kết</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                    {seasons.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.pickerChip, formSeasonId === s.id && styles.pickerChipActive]}
                        onPress={() => setFormSeasonId(s.id)}
                      >
                        <Text style={[styles.pickerChipText, formSeasonId === s.id && styles.pickerChipTextActive]}>
                          {s.name || s.crop?.name || 'Vụ mùa'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Lô đất */}
              <Text style={styles.formLabel}>Thửa đất / Lô vườn</Text>
              {plots.length > 0 ? (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                  {plots.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={[styles.pickerChip, formPlotName === p.name && styles.pickerChipActive]}
                      onPress={() => setFormPlotName(p.name)}
                    >
                      <Text style={[styles.pickerChipText, formPlotName === p.name && styles.pickerChipTextActive]}>
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                <TextInput
                  style={styles.input}
                  value={formPlotName}
                  onChangeText={setFormPlotName}
                  placeholder="Ví dụ: Lô A - Dâu tây Hana"
                />
              )}

              {/* Vật tư tiêu thụ */}
              <Text style={styles.formLabel}>Vật tư sử dụng (từ kho)</Text>
              {materials.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                  {materials.map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.pickerChip, formMaterialId === m.id && styles.pickerChipActive]}
                      onPress={() => handleSelectMaterial(m)}
                    >
                      <Text style={[styles.pickerChipText, formMaterialId === m.id && styles.pickerChipTextActive]}>
                        {m.name} ({m.quantity || 0} {m.unit || 'kg'})
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <TextInput
                style={[styles.input, { marginTop: 6 }]}
                value={formMaterialName}
                onChangeText={setFormMaterialName}
                placeholder="Hoặc tự nhập tên vật tư / phân thuốc..."
              />

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Số lượng tiêu thụ</Text>
                  <TextInput
                    style={styles.input}
                    value={formQuantity}
                    onChangeText={setFormQuantity}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.formLabel}>Chi phí phát sinh (VNĐ)</Text>
                  <TextInput
                    style={styles.input}
                    value={formCost}
                    onChangeText={setFormCost}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Ghi chú & Chi tiết kỹ thuật</Text>
              <TextInput
                style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
                value={formNotes}
                onChangeText={setFormNotes}
                placeholder="Ví dụ: Liều lượng pha 1:1000, thời tiết mát mẻ..."
                multiline
              />

              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.btnDisabled]}
                onPress={handleSubmit}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editingLogId ? 'Cập nhật bản ghi' : 'Lưu vào nhật ký'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 42,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  kpiContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  kpiCard: {
    flex: 1,
    alignItems: 'center',
  },
  kpiDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
  kpiLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  kpiUnit: {
    fontSize: 12,
    fontWeight: '500',
  },
  chipScrollWrap: {
    marginBottom: 6,
  },
  chipScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 90,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeHarvest: {
    backgroundColor: '#ffedd5',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  badgeTextHarvest: {
    color: '#ea580c',
  },
  actionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    padding: 4,
  },
  plotText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  metaLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  metaValue: {
    fontSize: 12,
    color: COLORS.text,
  },
  notesText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 6,
    backgroundColor: COLORS.background,
    padding: 8,
    borderRadius: 6,
  },
  cardFooter: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  emptySub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 10,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.borderLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  chipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  pickerScroll: {
    marginBottom: 6,
  },
  pickerChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.borderLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  pickerChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  pickerChipText: {
    fontSize: 12,
    color: COLORS.text,
  },
  pickerChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.7,
  },
});
