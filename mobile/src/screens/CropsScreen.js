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
  apiGetCrops,
  apiCreateCrop,
  apiUpdateCrop,
  apiDeleteCrop,
  apiSeedLamDong,
} from '../services/api';

const CROP_CATEGORIES = ['Tất cả', 'Cây ăn quả', 'Rau củ', 'Hoa Đà Lạt', 'Cây công nghiệp'];

export default function CropsScreen() {
  const [crops, setCrops] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('Tất cả');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState(null);
  const [editingCrop, setEditingCrop] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [type, setType] = useState('Cây ăn quả');
  const [growthDays, setGrowthDays] = useState('90');
  const [idealPH, setIdealPH] = useState('6.0 - 6.8');
  const [density, setDensity] = useState('');
  const [notes, setNotes] = useState('');

  const loadCrops = async () => {
    try {
      const data = await apiGetCrops();
      setCrops(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Lỗi tải cây trồng:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCrops();
  }, []);

  const openCreateModal = () => {
    setEditingCrop(null);
    setName('');
    setType('Cây ăn quả');
    setGrowthDays('90');
    setIdealPH('6.0 - 6.8');
    setDensity('');
    setNotes('');
    setModalOpen(true);
  };

  const openEditModal = (crop) => {
    setEditingCrop(crop);
    setName(crop.name || '');
    setType(crop.type || 'Cây ăn quả');
    setGrowthDays(crop.growthDays ? String(crop.growthDays) : '90');
    setIdealPH(crop.idealPH || '6.0 - 6.8');
    setDensity(crop.density || '');
    setNotes(crop.notes || crop.description || '');
    setModalOpen(true);
  };

  const openDetailModal = (crop) => {
    setSelectedCrop(crop);
    setDetailModalOpen(true);
  };

  const handleSaveCrop = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên giống cây');
      return;
    }
    setSubmitting(true);
    const payload = {
      name: name.trim(),
      type,
      growthDays: Number(growthDays) || 90,
      idealPH,
      density: density.trim(),
      notes: notes.trim(),
    };

    try {
      if (editingCrop) {
        await apiUpdateCrop(editingCrop.id, payload);
        Alert.alert('Thành công', 'Đã cập nhật giống cây trồng!');
      } else {
        await apiCreateCrop(payload);
        Alert.alert('Thành công', 'Đã thêm giống cây trồng mới!');
      }
      setModalOpen(false);
      loadCrops();
    } catch (e) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể lưu cây trồng');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCrop = (crop) => {
    Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa giống "${crop.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDeleteCrop(crop.id);
            Alert.alert('Thành công', 'Đã xóa giống cây');
            loadCrops();
          } catch (e) {
            Alert.alert('Lỗi', 'Không thể xóa giống cây');
          }
        },
      },
    ]);
  };

  const handleSeedLamDong = async () => {
    Alert.alert(
      'Nạp mẫu cây trồng Lâm Đồng',
      'Hệ thống sẽ nạp các giống chủ lực Đà Lạt & Lâm Đồng (Cà phê Robusta, Sầu riêng Ri6, Dâu tây Hana, Mắc ca, Bơ 034, Chè Oolong...)?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Nạp ngay',
          onPress: async () => {
            setSeeding(true);
            try {
              await apiSeedLamDong();
              Alert.alert('Thành công', 'Đã nạp đầy đủ giống cây và vật tư nông nghiệp Lâm Đồng!');
              loadCrops();
            } catch (err) {
              Alert.alert('Thông báo', 'Đã nạp hoặc dữ liệu đã có sẵn');
              loadCrops();
            } finally {
              setSeeding(false);
            }
          },
        },
      ]
    );
  };

  // Filter crops
  const filteredCrops = crops.filter((item) => {
    const cName = (item.name || '').toLowerCase();
    const cNotes = (item.notes || item.description || '').toLowerCase();
    const cType = (item.type || '').toLowerCase();

    const matchesSearch =
      !searchTerm.trim() ||
      cName.includes(searchTerm.toLowerCase()) ||
      cNotes.includes(searchTerm.toLowerCase()) ||
      cType.includes(searchTerm.toLowerCase());

    const matchesCat =
      categoryFilter === 'Tất cả' ||
      cType.includes(categoryFilter.toLowerCase());

    return matchesSearch && matchesCat;
  });

  const renderCrop = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() => openDetailModal(item)}
    >
      <View style={styles.cardTop}>
        <View style={styles.badgeWrap}>
          <Feather name="feather" size={14} color={COLORS.primary} />
          <Text style={styles.cropName}>{item.name}</Text>
        </View>
        <View style={styles.typeBadge}>
          <Text style={styles.typeText}>{item.type || 'Nông sản'}</Text>
        </View>
      </View>

      <View style={styles.specsGrid}>
        <View style={styles.specItem}>
          <Text style={styles.specLabel}>Chu kỳ sinh trưởng</Text>
          <Text style={styles.specVal}>{item.growthDays || 90} ngày</Text>
        </View>
        <View style={styles.specItem}>
          <Text style={styles.specLabel}>Độ pH tối ưu</Text>
          <Text style={styles.specVal}>{item.idealPH || '6.0 - 6.5'}</Text>
        </View>
      </View>

      {item.notes || item.description ? (
        <Text style={styles.notesText} numberOfLines={2}>
          💡 {item.notes || item.description}
        </Text>
      ) : null}

      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.btnDetail}
          onPress={() => openDetailModal(item)}
        >
          <Feather name="info" size={13} color={COLORS.primary} />
          <Text style={styles.btnDetailText}>Chi tiết kỹ thuật</Text>
        </TouchableOpacity>

        <View style={styles.actionIcons}>
          <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
            <Feather name="edit-2" size={15} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteCrop(item)} style={styles.iconBtn}>
            <Feather name="trash-2" size={15} color={COLORS.danger} />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Top Header & Actions */}
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Danh mục Cây trồng</Text>
          <Text style={styles.subTitle}>Giống cây & Chu kỳ nông nghiệp Đà Lạt</Text>
        </View>
        <View style={styles.headerBtnGroup}>
          <TouchableOpacity
            style={styles.btnSeed}
            onPress={handleSeedLamDong}
            disabled={seeding}
          >
            {seeding ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <>
                <Feather name="database" size={13} color={COLORS.primary} />
                <Text style={styles.btnSeedText}>Mẫu Lâm Đồng</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnAdd} onPress={openCreateModal}>
            <Feather name="plus" size={15} color={COLORS.white} />
            <Text style={styles.btnAddText}>Thêm</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Input */}
      <View style={styles.searchBar}>
        <Feather name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm giống cây, đặc tính, sâu bệnh..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Feather name="x" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Category Horizontal Filter Chips */}
      <View style={styles.categoryScrollWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
          {CROP_CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.catChip, categoryFilter === cat && styles.catChipActive]}
              onPress={() => setCategoryFilter(cat)}
            >
              <Text style={[styles.catChipText, categoryFilter === cat && styles.catChipTextActive]}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải danh mục cây trồng...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredCrops}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderCrop}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadCrops();
              }}
              colors={[COLORS.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Feather name="feather" size={44} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Chưa có giống cây trồng nào</Text>
              <Text style={styles.emptySub}>
                Bấm nút "Mẫu Lâm Đồng" để tự động nạp các giống cà phê, sầu riêng, dâu tây hoặc bấm "+" để tự thêm.
              </Text>
            </View>
          }
        />
      )}

      {/* Modal Thêm / Chỉnh Sửa Giống Cây */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingCrop ? 'Sửa giống cây trồng' : 'Thêm giống cây trồng'}</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Feather name="x" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Tên giống cây trồng *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ví dụ: Cà phê Robusta cao sản"
              />

              <Text style={styles.formLabel}>Phân loại</Text>
              <View style={styles.typeGrid}>
                {['Cây ăn quả', 'Rau củ', 'Hoa Đà Lạt', 'Cây công nghiệp'].map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.typeChip, type === t && styles.typeChipActive]}
                    onPress={() => setType(t)}
                  >
                    <Text style={[styles.typeChipText, type === t && styles.typeChipTextActive]}>
                      {t}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Chu kỳ sinh trưởng (ngày)</Text>
                  <TextInput
                    style={styles.input}
                    value={growthDays}
                    onChangeText={setGrowthDays}
                    keyboardType="numeric"
                    placeholder="90"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.formLabel}>Độ pH tối ưu</Text>
                  <TextInput
                    style={styles.input}
                    value={idealPH}
                    onChangeText={setIdealPH}
                    placeholder="6.0 - 6.8"
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Mật độ gieo trồng khuyến nghị</Text>
              <TextInput
                style={styles.input}
                value={density}
                onChangeText={setDensity}
                placeholder="Ví dụ: 1.100 cây/ha (cự ly 3m x 3m)"
              />

              <Text style={styles.formLabel}>Mô tả & Sâu bệnh hại phổ biến</Text>
              <TextInput
                style={[styles.input, { height: 75 }]}
                value={notes}
                onChangeText={setNotes}
                placeholder="Ví dụ: Đất đỏ bazan, phòng trừ rệp sáp, nấm gỉ sắt..."
                multiline
              />

              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.btnDisabled]}
                onPress={handleSaveCrop}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>{editingCrop ? 'Cập nhật giống' : 'Tạo giống cây mới'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Chi tiết kỹ thuật Cây trồng */}
      <Modal visible={detailModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>{selectedCrop?.name}</Text>
                <Text style={styles.detailTypeBadge}>{selectedCrop?.type || 'Cây trồng'}</Text>
              </View>
              <TouchableOpacity onPress={() => setDetailModalOpen(false)}>
                <Feather name="x" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.detailCard}>
                <View style={styles.detailRow}>
                  <Feather name="clock" size={15} color={COLORS.primary} />
                  <Text style={styles.detailLabel}>Thời gian sinh trưởng:</Text>
                  <Text style={styles.detailVal}>{selectedCrop?.growthDays || 90} ngày</Text>
                </View>

                <View style={styles.detailRow}>
                  <Feather name="droplet" size={15} color={COLORS.primary} />
                  <Text style={styles.detailLabel}>Độ pH đất phù hợp:</Text>
                  <Text style={styles.detailVal}>{selectedCrop?.idealPH || '6.0 - 6.8'}</Text>
                </View>

                {selectedCrop?.density && (
                  <View style={styles.detailRow}>
                    <Feather name="grid" size={15} color={COLORS.primary} />
                    <Text style={styles.detailLabel}>Mật độ khuyến cáo:</Text>
                    <Text style={styles.detailVal}>{selectedCrop?.density}</Text>
                  </View>
                )}
              </View>

              <Text style={styles.detailSectionTitle}>Mô tả & Hướng dẫn canh tác</Text>
              <Text style={styles.detailDescText}>
                {selectedCrop?.notes || selectedCrop?.description || 'Chưa có thông tin kỹ thuật bổ sung.'}
              </Text>

              <TouchableOpacity
                style={styles.closeDetailBtn}
                onPress={() => setDetailModalOpen(false)}
              >
                <Text style={styles.closeDetailBtnText}>Đóng</Text>
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
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  subTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  headerBtnGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnSeed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  btnSeedText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  btnAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  btnAddText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 8,
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
  categoryScrollWrap: {
    marginBottom: 8,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  catChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  catChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  catChipTextActive: {
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
    paddingTop: 4,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  cropName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  typeBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  specsGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  specItem: {
    flex: 1,
  },
  specLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  specVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  notesText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.borderLight,
    paddingTop: 8,
    marginTop: 4,
  },
  btnDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btnDetailText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  actionIcons: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    padding: 4,
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
    lineHeight: 18,
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
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  typeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.borderLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  typeChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  typeChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  typeChipTextActive: {
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
  detailTypeBadge: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  detailCard: {
    backgroundColor: COLORS.background,
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  detailVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  detailSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
  },
  detailDescText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 20,
  },
  closeDetailBtn: {
    backgroundColor: COLORS.primary,
    height: 44,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  closeDetailBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
