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
  apiGetHarvests,
  apiCreateHarvest,
  apiDeleteLog,
  apiGetSeasons,
} from '../services/api';

const BATCH_PRESETS = ['Đợt 1 (Đầu vụ)', 'Đợt 2 (Rộ vụ)', 'Đợt 3 (Cuối vụ)', 'Thu hoạch tỉa'];

export default function HarvestScreen() {
  const [harvests, setHarvests] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeasonFilter, setSelectedSeasonFilter] = useState('ALL');

  // Modal states
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [formSeasonId, setFormSeasonId] = useState('');
  const [formCropName, setFormCropName] = useState('Dâu tây Hana');
  const [formBatch, setFormBatch] = useState('Đợt 1 (Đầu vụ)');
  const [formQuantity, setFormQuantity] = useState('');
  const [formUnit, setFormUnit] = useState('kg');
  const [formUnitPrice, setFormUnitPrice] = useState('');
  const [formBuyer, setFormBuyer] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Auto calculate total revenue
  const totalRevenue = (Number(formQuantity) || 0) * (Number(formUnitPrice) || 0);

  const loadData = async () => {
    try {
      const [hRes, sRes] = await Promise.allSettled([
        apiGetHarvests(),
        apiGetSeasons(),
      ]);

      if (hRes.status === 'fulfilled') {
        setHarvests(Array.isArray(hRes.value) ? hRes.value : []);
      }
      if (sRes.status === 'fulfilled') {
        const sList = Array.isArray(sRes.value) ? sRes.value : [];
        setSeasons(sList);
        if (sList.length > 0 && !formSeasonId) {
          setFormSeasonId(sList[0].id);
          setFormCropName(sList[0].crop?.name || sList[0].name || 'Nông sản');
        }
      }
    } catch (e) {
      console.warn('Lỗi tải dữ liệu thu hoạch:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    if (seasons.length > 0) {
      setFormSeasonId(seasons[0].id);
      setFormCropName(seasons[0].crop?.name || seasons[0].name || 'Dâu tây Hana');
    }
    setFormBatch('Đợt 1 (Đầu vụ)');
    setFormQuantity('');
    setFormUnit('kg');
    setFormUnitPrice('');
    setFormBuyer('');
    setFormNotes('');
    setModalVisible(true);
  };

  const handleSelectSeason = (season) => {
    setFormSeasonId(season.id);
    setFormCropName(season.crop?.name || season.name || 'Nông sản');
  };

  const handleCreate = async () => {
    if (!formQuantity || Number(formQuantity) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập sản lượng thu hoạch');
      return;
    }

    setSubmitting(true);
    try {
      await apiCreateHarvest({
        cropCycleId: formSeasonId || undefined,
        cropName: formCropName,
        quantity: Number(formQuantity),
        unit: formUnit,
        unitPrice: Number(formUnitPrice) || 0,
        totalRevenue,
        revenue: totalRevenue,
        harvestQuantity: Number(formQuantity),
        harvestBatch: formBatch,
        buyer: formBuyer.trim(),
        buyerName: formBuyer.trim(),
        notes: `${formBatch ? `[${formBatch}] ` : ''}${formNotes.trim()}`,
        harvestDate: new Date().toISOString(),
      });
      setModalVisible(false);
      Alert.alert('Thành công', 'Đã ghi nhận đợt thu hoạch thành công!');
      loadData();
    } catch (e) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể lưu đợt thu hoạch');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    Alert.alert('Xác nhận xóa', 'Bạn có chắc chắn muốn xóa đợt thu hoạch này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDeleteLog(id);
            setHarvests((prev) => prev.filter((h) => h.id !== id));
            Alert.alert('Thành công', 'Đã xóa bản ghi thu hoạch');
          } catch (e) {
            Alert.alert('Lỗi', 'Không thể xóa');
          }
        },
      },
    ]);
  };

  // Filtered harvest list
  const filteredHarvests = harvests.filter((item) => {
    const crop = (item.crop?.name || item.cropName || '').toLowerCase();
    const notes = (item.notes || '').toLowerCase();
    const buyer = (item.buyer || item.buyerName || '').toLowerCase();

    const matchesSearch =
      !searchTerm.trim() ||
      crop.includes(searchTerm.toLowerCase()) ||
      notes.includes(searchTerm.toLowerCase()) ||
      buyer.includes(searchTerm.toLowerCase());

    const matchesSeason =
      selectedSeasonFilter === 'ALL' ||
      item.cropCycleId === selectedSeasonFilter ||
      item.seasonId === selectedSeasonFilter;

    return matchesSearch && matchesSeason;
  });

  // KPI Calculations
  const totalQuantity = filteredHarvests.reduce((sum, h) => sum + (Number(h.quantity || h.harvestQuantity) || 0), 0);
  const totalRevenueAll = filteredHarvests.reduce(
    (sum, h) => sum + (Number(h.totalRevenue || h.revenue) || Math.abs(Number(h.cost) < 0 ? Number(h.cost) : 0)),
    0
  );
  const avgPrice = totalQuantity > 0 ? Math.round(totalRevenueAll / totalQuantity) : 0;

  const renderHarvest = ({ item }) => {
    const qty = Number(item.quantity || item.harvestQuantity || 0);
    const rev = Number(item.totalRevenue || item.revenue || Math.abs(Number(item.cost) < 0 ? Number(item.cost) : 0));
    const price = Number(item.unitPrice || (qty > 0 && rev > 0 ? Math.round(rev / qty) : 0));

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.badge}>
            <Feather name="shopping-bag" size={13} color={COLORS.primary} />
            <Text style={styles.badgeText}>{item.crop?.name || item.cropName || 'Nông sản Đà Lạt'}</Text>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.dateText}>
              {new Date(item.harvestDate || item.date || item.createdAt).toLocaleDateString('vi-VN')}
            </Text>
            <TouchableOpacity onPress={() => handleDelete(item.id)} style={styles.deleteBtn}>
              <Feather name="trash-2" size={15} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Sản lượng</Text>
            <Text style={styles.statValBig}>
              {qty.toLocaleString('vi-VN')} <Text style={styles.unitText}>{item.unit || 'kg'}</Text>
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Đơn giá</Text>
            <Text style={styles.statValMed}>
              {price > 0 ? `${price.toLocaleString('vi-VN')} đ` : 'Chưa có'}
            </Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCol}>
            <Text style={styles.statLabel}>Thành tiền</Text>
            <Text style={[styles.statValBig, { color: COLORS.primary }]}>
              {rev > 0 ? `${rev.toLocaleString('vi-VN')} đ` : '0 đ'}
            </Text>
          </View>
        </View>

        {(item.buyer || item.buyerName) && (
          <View style={styles.metaRow}>
            <Feather name="user" size={13} color={COLORS.textSecondary} />
            <Text style={styles.metaLabel}>Thương lái / Điểm bán:</Text>
            <Text style={styles.metaVal}>{item.buyer || item.buyerName}</Text>
          </View>
        )}

        {item.notes ? (
          <Text style={styles.notesText}>
            <Feather name="file-text" size={12} color={COLORS.textSecondary} /> {item.notes}
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Feather name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm nông sản, thương lái, chất lượng..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Feather name="x" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* KPI Header Bar */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Tổng sản lượng</Text>
          <Text style={styles.kpiValue}>
            {totalQuantity.toLocaleString('vi-VN')} <Text style={styles.kpiUnit}>kg</Text>
          </Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Tổng doanh thu</Text>
          <Text style={[styles.kpiValue, { color: COLORS.primary }]}>
            {totalRevenueAll.toLocaleString('vi-VN')} <Text style={styles.kpiUnit}>đ</Text>
          </Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Giá TB / kg</Text>
          <Text style={styles.kpiValue}>
            {avgPrice.toLocaleString('vi-VN')} <Text style={styles.kpiUnit}>đ</Text>
          </Text>
        </View>
      </View>

      {/* Season Filter Chips */}
      {seasons.length > 0 && (
        <View style={styles.seasonScrollWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.seasonScroll}>
            <TouchableOpacity
              style={[styles.seasonChip, selectedSeasonFilter === 'ALL' && styles.seasonChipActive]}
              onPress={() => setSelectedSeasonFilter('ALL')}
            >
              <Text style={[styles.seasonChipText, selectedSeasonFilter === 'ALL' && styles.seasonChipTextActive]}>
                Tất cả vụ mùa
              </Text>
            </TouchableOpacity>
            {seasons.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.seasonChip, selectedSeasonFilter === s.id && styles.seasonChipActive]}
                onPress={() => setSelectedSeasonFilter(s.id)}
              >
                <Text style={[styles.seasonChipText, selectedSeasonFilter === s.id && styles.seasonChipTextActive]}>
                  {s.name || s.crop?.name || 'Vụ mùa'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải dữ liệu thu hoạch...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredHarvests}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderHarvest}
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
              <Feather name="shopping-bag" size={44} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Chưa có đợt thu hoạch nào</Text>
              <Text style={styles.emptySub}>Bấm nút "+" để ghi nhận sản lượng và giá bán nông sản.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={openCreateModal} activeOpacity={0.8}>
        <Feather name="plus" size={26} color={COLORS.white} />
      </TouchableOpacity>

      {/* Modal Ghi nhận thu hoạch */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ghi nhận đợt thu hoạch</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Feather name="x" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Chọn mùa vụ */}
              {seasons.length > 0 && (
                <>
                  <Text style={styles.formLabel}>Vụ mùa thu hoạch *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pickerScroll}>
                    {seasons.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.pickerChip, formSeasonId === s.id && styles.pickerChipActive]}
                        onPress={() => handleSelectSeason(s)}
                      >
                        <Text style={[styles.pickerChipText, formSeasonId === s.id && styles.pickerChipTextActive]}>
                          {s.name || s.crop?.name || 'Vụ mùa'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <Text style={styles.formLabel}>Tên nông sản</Text>
              <TextInput
                style={styles.input}
                value={formCropName}
                onChangeText={setFormCropName}
                placeholder="Ví dụ: Dâu tây Hana xuất khẩu"
              />

              <Text style={styles.formLabel}>Đợt thu hoạch</Text>
              <View style={styles.batchGrid}>
                {BATCH_PRESETS.map((b) => (
                  <TouchableOpacity
                    key={b}
                    style={[styles.batchChip, formBatch === b && styles.batchChipActive]}
                    onPress={() => setFormBatch(b)}
                  >
                    <Text style={[styles.batchChipText, formBatch === b && styles.batchChipTextActive]}>
                      {b}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1.5, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Sản lượng *</Text>
                  <TextInput
                    style={styles.input}
                    value={formQuantity}
                    onChangeText={setFormQuantity}
                    keyboardType="numeric"
                    placeholder="Ví dụ: 150"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.formLabel}>Đơn vị</Text>
                  <TextInput
                    style={styles.input}
                    value={formUnit}
                    onChangeText={setFormUnit}
                    placeholder="kg"
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Đơn giá bán (VNĐ / {formUnit || 'kg'})</Text>
              <TextInput
                style={styles.input}
                value={formUnitPrice}
                onChangeText={setFormUnitPrice}
                keyboardType="numeric"
                placeholder="Ví dụ: 180000"
              />

              {/* Tự động tính Thành tiền */}
              <View style={styles.revenuePreviewCard}>
                <Text style={styles.revPreviewLabel}>Ước tính doanh thu:</Text>
                <Text style={styles.revPreviewVal}>
                  {totalRevenue.toLocaleString('vi-VN')} VNĐ
                </Text>
              </View>

              <Text style={styles.formLabel}>Thương lái / Kênh tiêu thụ</Text>
              <TextInput
                style={styles.input}
                value={formBuyer}
                onChangeText={setFormBuyer}
                placeholder="Ví dụ: Siêu thị WinMart Đà Lạt, Khách sỉ..."
              />

              <Text style={styles.formLabel}>Ghi chú phẩm cấp & độ chín</Text>
              <TextInput
                style={[styles.input, { height: 60 }]}
                value={formNotes}
                onChangeText={setFormNotes}
                placeholder="Ví dụ: Loại 1 trái to đều, độ ngọt cao..."
                multiline
              />

              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.btnDisabled]}
                onPress={handleCreate}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Lưu đợt thu hoạch</Text>
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
    marginBottom: 2,
  },
  kpiValue: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  kpiUnit: {
    fontSize: 11,
    fontWeight: '500',
  },
  seasonScrollWrap: {
    marginBottom: 6,
  },
  seasonScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  seasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  seasonChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  seasonChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  seasonChipTextActive: {
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
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateText: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  deleteBtn: {
    padding: 2,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingVertical: 10,
    marginVertical: 8,
    alignItems: 'center',
  },
  statCol: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  statValBig: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  statValMed: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
  },
  unitText: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  metaLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '600',
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
  batchGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  batchChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.borderLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  batchChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  batchChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  batchChipTextActive: {
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
  revenuePreviewCard: {
    backgroundColor: COLORS.primaryLight,
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  revPreviewLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  revPreviewVal: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
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
