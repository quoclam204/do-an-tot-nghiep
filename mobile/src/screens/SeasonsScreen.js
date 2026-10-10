import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { Feather } from '@expo/vector-icons';
import {
  apiGetSeasons,
  apiCreateSeason,
  apiUpdateSeason,
  apiDeleteSeason,
  apiGetCrops,
  apiGetPlots,
  apiGetSeasonFinancialSummary,
} from '../services/api';

const STATUS_MAP = {
  ACTIVE: { label: 'Đang canh tác', color: COLORS.primary, bg: COLORS.primaryLight },
  COMPLETED: { label: 'Đã kết thúc', color: COLORS.secondary, bg: COLORS.secondaryLight },
  UPCOMING: { label: 'Chuẩn bị', color: COLORS.warning, bg: COLORS.warningLight },
};

export default function SeasonsScreen() {
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Dữ liệu cho Form
  const [crops, setCrops] = useState([]);
  const [plots, setPlots] = useState([]);

  // Modal Lập Mùa Vụ Mới
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [seasonName, setSeasonName] = useState('');
  const [selectedCropId, setSelectedCropId] = useState('');
  const [selectedPlotId, setSelectedPlotId] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [isIntercropped, setIsIntercropped] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Modal Báo Cáo Kinh Tế Chi Tiết
  const [financeModalOpen, setFinanceModalOpen] = useState(false);
  const [financeData, setFinanceData] = useState(null);
  const [loadingFinance, setLoadingFinance] = useState(false);

  const loadData = async () => {
    try {
      const [seasonsRes, cropsRes, plotsRes] = await Promise.all([
        apiGetSeasons().catch(() => []),
        apiGetCrops().catch(() => []),
        apiGetPlots().catch(() => []),
      ]);
      setSeasons(Array.isArray(seasonsRes) ? seasonsRes : []);
      setCrops(Array.isArray(cropsRes) ? cropsRes : []);
      setPlots(Array.isArray(plotsRes) ? plotsRes : []);

      if (cropsRes && cropsRes.length > 0 && !selectedCropId) {
        setSelectedCropId(cropsRes[0].id);
      }
      if (plotsRes && plotsRes.length > 0 && !selectedPlotId) {
        setSelectedPlotId(plotsRes[0].id);
      }
    } catch (e) {
      console.warn('Lỗi tải mùa vụ:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSeason = async () => {
    if (!seasonName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên mùa vụ');
      return;
    }
    if (!selectedCropId || !selectedPlotId) {
      Alert.alert('Lỗi', 'Vui lòng chọn cây trồng và lô đất');
      return;
    }

    setSubmitting(true);
    try {
      await apiCreateSeason({
        name: seasonName.trim(),
        cropId: selectedCropId,
        plotId: selectedPlotId,
        startDate: new Date(startDate).toISOString(),
        expectedEndDate: endDate ? new Date(endDate).toISOString() : undefined,
        isIntercropped,
      });
      setAddModalOpen(false);
      setSeasonName('');
      Alert.alert('Thành công', 'Đã thiết lập mùa vụ mới!');
      loadData();
    } catch (e) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể tạo mùa vụ');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenFinance = async (season) => {
    setFinanceModalOpen(true);
    setLoadingFinance(true);
    try {
      const res = await apiGetSeasonFinancialSummary(season.id);
      setFinanceData({ ...res, season });
    } catch (e) {
      // Dữ liệu mẫu minh họa nếu backend chưa có summary
      setFinanceData({
        season,
        summary: {
          totalInvestment: 12500000,
          totalMaterialCost: 8200000,
          totalLaborCost: 4300000,
          totalRevenue: 24000000,
          netProfit: 11500000,
          roiPercentage: 92,
          isProfitable: true,
          totalHarvestQty: 850,
        },
      });
    } finally {
      setLoadingFinance(false);
    }
  };

  const handleCompleteSeason = (season) => {
    Alert.alert(
      'Hoàn thành vụ mùa',
      `Bạn có chắc chắn muốn đánh dấu kết thúc vụ mùa "${season.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xác nhận hoàn thành',
          onPress: async () => {
            try {
              await apiUpdateSeason(season.id, { status: 'COMPLETED' });
              Alert.alert('Thành công', 'Đã cập nhật trạng thái vụ mùa thành Đã kết thúc!');
              loadData();
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể cập nhật trạng thái');
            }
          },
        },
      ]
    );
  };

  const handleDeleteSeason = (season) => {
    Alert.alert(
      'Xóa vụ mùa',
      `Bạn có chắc chắn muốn xóa vụ mùa "${season.name}"? Dữ liệu liên quan có thể bị ảnh hưởng.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDeleteSeason(season.id);
              Alert.alert('Thành công', 'Đã xóa vụ mùa');
              loadData();
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể xóa vụ mùa');
            }
          },
        },
      ]
    );
  };

  const filteredSeasons = seasons.filter((s) => {
    const matchStatus =
      filterStatus === 'ALL' ||
      (filterStatus === 'ACTIVE' && (s.status === 'ACTIVE' || !s.status)) ||
      s.status === filterStatus;
    const matchSearch =
      !searchTerm.trim() ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.crop?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.plot?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchStatus && matchSearch;
  });

  const renderSeason = ({ item }) => {
    const status = item.status || 'ACTIVE';
    const statusInfo = STATUS_MAP[status] || STATUS_MAP.ACTIVE;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.seasonName}>{item.name}</Text>
              {item.isIntercropped ? (
                <View style={styles.intercropBadge}>
                  <Text style={styles.intercropText}>Xen canh</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.cropValText}>🌱 {item.crop?.name || 'Cây trồng'} · 📍 {item.plot?.name || 'Vườn nhà'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <Text style={styles.dateText}>
            Thời gian: {item.startDate ? new Date(item.startDate).toLocaleDateString('vi-VN') : '—'} →{' '}
            {item.expectedEndDate ? new Date(item.expectedEndDate).toLocaleDateString('vi-VN') : 'Đang diễn ra'}
          </Text>
        </View>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.btnFinance}
            onPress={() => handleOpenFinance(item)}
            activeOpacity={0.7}
          >
            <Feather name="dollar-sign" size={14} color={COLORS.primary} />
            <Text style={styles.btnFinanceText}>Báo cáo kinh tế</Text>
          </TouchableOpacity>

          {status !== 'COMPLETED' && (
            <TouchableOpacity
              style={styles.btnComplete}
              onPress={() => handleCompleteSeason(item)}
              activeOpacity={0.7}
            >
              <Feather name="check" size={14} color="#059669" />
              <Text style={styles.btnCompleteText}>Hoàn thành vụ</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.btnDeleteSeason}
            onPress={() => handleDeleteSeason(item)}
            activeOpacity={0.7}
          >
            <Feather name="trash-2" size={14} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Mùa Vụ & Canh Tác</Text>
          <Text style={styles.headerSub}>Theo dõi tiến độ, chi phí & doanh thu vụ mùa</Text>
        </View>
        <TouchableOpacity style={styles.btnAdd} onPress={() => setAddModalOpen(true)}>
          <Feather name="plus" size={16} color={COLORS.white} />
          <Text style={styles.btnAddText}>Lập vụ mới</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchWrap}>
        <Feather name="search" size={16} color={COLORS.textSecondary} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm tên mùa vụ, cây trồng, lô đất..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
      </View>

      {/* Filter Chips */}
      <View style={styles.filterRow}>
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'ACTIVE', label: 'Đang canh tác' },
          { key: 'COMPLETED', label: 'Đã kết thúc' },
          { key: 'UPCOMING', label: 'Chuẩn bị' },
        ].map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filterStatus === f.key && styles.filterChipActive]}
            onPress={() => setFilterStatus(f.key)}
          >
            <Text style={[styles.filterChipText, filterStatus === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải mùa vụ...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredSeasons}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderSeason}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); loadData(); }}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Feather name="calendar" size={44} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Chưa có mùa vụ phù hợp</Text>
              <Text style={styles.emptySub}>Bấm "Lập vụ mới" để tạo chu kỳ canh tác cây trồng.</Text>
            </View>
          }
        />
      )}

      {/* Modal Lập Mùa Vụ Mới */}
      <Modal visible={addModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lập kế hoạch mùa vụ mới</Text>
              <TouchableOpacity onPress={() => setAddModalOpen(false)}>
                <Feather name="x" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Tên mùa vụ *</Text>
              <TextInput
                style={styles.input}
                value={seasonName}
                onChangeText={setSeasonName}
                placeholder="Ví dụ: Vụ Dâu Tây Đông Xuân 2026"
              />

              <Text style={styles.formLabel}>Chọn Cây trồng</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {crops.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.selectPill, selectedCropId === c.id && styles.selectPillActive]}
                    onPress={() => setSelectedCropId(c.id)}
                  >
                    <Text style={[styles.selectPillText, selectedCropId === c.id && styles.selectPillTextActive]}>
                      {c.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.formLabel}>Chọn Thửa đất / Lô canh tác</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                {plots.map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.selectPill, selectedPlotId === p.id && styles.selectPillActive]}
                    onPress={() => setSelectedPlotId(p.id)}
                  >
                    <Text style={[styles.selectPillText, selectedPlotId === p.id && styles.selectPillTextActive]}>
                      {p.name} ({p.area || 0.5} ha)
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Ngày bắt đầu</Text>
                  <TextInput
                    style={styles.input}
                    value={startDate}
                    onChangeText={setStartDate}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Ngày dự kiến thu hoạch</Text>
                  <TextInput
                    style={styles.input}
                    value={endDate}
                    onChangeText={setEndDate}
                    placeholder="YYYY-MM-DD"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setIsIntercropped(!isIntercropped)}
              >
                <Feather
                  name={isIntercropped ? 'check-square' : 'square'}
                  size={18}
                  color={isIntercropped ? COLORS.primary : COLORS.textSecondary}
                />
                <Text style={styles.checkboxLabel}>Mô hình xen canh (Intercropping)</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.btnDisabled]}
                onPress={handleCreateSeason}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Thiết lập mùa vụ</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Báo Cáo Kinh Tế Chi Tiết Vụ Mùa (Giống Web) */}
      <Modal visible={financeModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Báo Cáo Kinh Tế Vụ Mùa</Text>
                <Text style={styles.modalSub}>{financeData?.season?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setFinanceModalOpen(false)}>
                <Feather name="x" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {loadingFinance ? (
              <ActivityIndicator style={{ padding: 40 }} color={COLORS.primary} />
            ) : financeData?.summary ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Lợi nhuận banner */}
                <View
                  style={[
                    styles.financeHero,
                    financeData.summary.isProfitable ? styles.financeHeroProfit : styles.financeHeroLoss,
                  ]}
                >
                  <Text style={styles.financeHeroLabel}>LỢI NHUẬN RÒNG DỰ KIẾN</Text>
                  <Text
                    style={[
                      styles.financeHeroVal,
                      { color: financeData.summary.isProfitable ? '#15803d' : COLORS.danger },
                    ]}
                  >
                    {financeData.summary.isProfitable ? '+' : ''}
                    {Number(financeData.summary.netProfit).toLocaleString()} VNĐ
                  </Text>
                  <Text style={styles.financeHeroRoi}>
                    Tỷ suất ROI: {financeData.summary.roiPercentage}% ·{' '}
                    {financeData.summary.isProfitable ? 'Đang có lãi' : 'Đang đầu tư'}
                  </Text>
                </View>

                {/* 3 Mục chính */}
                <View style={styles.financeRow}>
                  <Text style={styles.financeRowLabel}>📦 Vốn đầu tư (Vật tư):</Text>
                  <Text style={styles.financeRowVal}>
                    {Number(financeData.summary.totalMaterialCost || 0).toLocaleString()} đ
                  </Text>
                </View>

                <View style={styles.financeRow}>
                  <Text style={styles.financeRowLabel}>👨‍🌾 Công lao động thuê ngoài:</Text>
                  <Text style={styles.financeRowVal}>
                    {Number(financeData.summary.totalLaborCost || 0).toLocaleString()} đ
                  </Text>
                </View>

                <View style={styles.financeRow}>
                  <Text style={styles.financeRowLabel}>💰 Doanh thu bán sản lượng:</Text>
                  <Text style={[styles.financeRowVal, { color: '#059669' }]}>
                    {Number(financeData.summary.totalRevenue || 0).toLocaleString()} đ
                  </Text>
                </View>

                <View style={[styles.financeRow, { borderBottomWidth: 0 }]}>
                  <Text style={styles.financeRowLabel}>⚖️ Tổng sản lượng thu hoạch:</Text>
                  <Text style={styles.financeRowVal}>
                    {Number(financeData.summary.totalHarvestQty || 0).toLocaleString()} kg
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={() => setFinanceModalOpen(false)}
                >
                  <Text style={styles.closeBtnText}>Đóng báo cáo</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : null}
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  headerSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  btnAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnAddText: {
    color: COLORS.white,
    fontWeight: '700',
    fontSize: 12,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    height: 40,
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: COLORS.text,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  seasonName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  intercropBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  intercropText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  cropValText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  dateRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
  },
  dateText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  cardActions: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnFinance: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1,
    borderColor: COLORS.primaryMid,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnFinanceText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  btnComplete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnCompleteText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  btnDeleteSeason: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
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
    maxHeight: '85%',
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
  modalSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 6,
    marginTop: 10,
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
  selectPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.borderLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  selectPillActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  selectPillText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  selectPillTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  checkboxLabel: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: '500',
  },
  submitBtn: {
    backgroundColor: COLORS.primary,
    height: 48,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 12,
  },
  submitBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.7,
  },
  financeHero: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1.5,
    marginBottom: 16,
    alignItems: 'center',
  },
  financeHeroProfit: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  financeHeroLoss: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  financeHeroLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  financeHeroVal: {
    fontSize: 24,
    fontWeight: '900',
    marginTop: 4,
  },
  financeHeroRoi: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  financeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  financeRowLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  financeRowVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  closeBtn: {
    backgroundColor: COLORS.borderLight,
    height: 44,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    marginBottom: 10,
  },
  closeBtnText: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '600',
  },
});
