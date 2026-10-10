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
  apiGetMaterials,
  apiCreateMaterial,
  apiUpdateMaterial,
  apiDeleteMaterial,
  apiGetMaterialHistory,
  apiSeedLamDong,
} from '../services/api';

const CATEGORIES = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PHAN_BON', label: 'Phân bón' },
  { value: 'THUOC_BVTV', label: 'Thuốc BVTV' },
  { value: 'GIONG', label: 'Cây giống' },
  { value: 'KHAC', label: 'Vật tư khác' },
];

const STANDARD_UNITS = ['kg', 'lít', 'chai', 'bao', 'gói', 'tấn', 'cây', 'viên'];

export default function MaterialsScreen() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Material Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState('PHAN_BON');
  const [unit, setUnit] = useState('kg');
  const [activeIngredient, setActiveIngredient] = useState('');
  const [packaging, setPackaging] = useState('');
  const [isolationPeriod, setIsolationPeriod] = useState(''); // PHI (ngày)
  const [price, setPrice] = useState('');
  const [instructions, setInstructions] = useState('');

  const loadData = async () => {
    try {
      const data = await apiGetMaterials();
      setMaterials(Array.isArray(data) ? data : []);
    } catch (e) {
      console.warn('Lỗi tải danh mục vật tư:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const openCreateModal = () => {
    setEditingItem(null);
    setName('');
    setCategory('PHAN_BON');
    setUnit('kg');
    setActiveIngredient('');
    setPackaging('');
    setIsolationPeriod('');
    setPrice('');
    setInstructions('');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setName(item.name || '');
    setCategory(item.category || item.type || 'PHAN_BON');
    setUnit(item.unit || 'kg');
    setActiveIngredient(item.activeIngredient || '');
    setPackaging(item.packaging || '');
    setIsolationPeriod(item.isolationPeriod ? String(item.isolationPeriod) : '');
    setPrice(String(item.price || item.unitPrice || ''));
    setInstructions(item.instructions || item.description || '');
    setModalOpen(true);
  };

  const openHistoryModal = async (item) => {
    setHistoryItem(item);
    setHistoryModalOpen(true);
    setLoadingHistory(true);
    try {
      const hist = await apiGetMaterialHistory(item.id);
      setHistoryList(Array.isArray(hist) ? hist : []);
    } catch {
      setHistoryList([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên vật tư');
      return;
    }

    setSubmitting(true);
    const payload = {
      name: name.trim(),
      category,
      unit,
      activeIngredient: activeIngredient.trim() || undefined,
      packaging: packaging.trim() || undefined,
      isolationPeriod: isolationPeriod ? Number(isolationPeriod) : undefined,
      price: price ? Number(price) : 0,
      instructions: instructions.trim() || undefined,
    };

    try {
      if (editingItem) {
        await apiUpdateMaterial(editingItem.id, payload);
        Alert.alert('Thành công', 'Đã cập nhật thông tin vật tư');
      } else {
        await apiCreateMaterial(payload);
        Alert.alert('Thành công', 'Đã thêm vật tư mới vào danh mục');
      }
      setModalOpen(false);
      loadData();
    } catch (e) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể lưu vật tư');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc chắn muốn xóa "${item.name}" khỏi danh mục?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDeleteMaterial(item.id);
              loadData();
            } catch (e) {
              Alert.alert('Lỗi', e.response?.data?.message || 'Không thể xóa vật tư');
            }
          },
        },
      ]
    );
  };

  const handleSeedLamDong = async () => {
    Alert.alert(
      'Nạp dữ liệu mẫu Lâm Đồng',
      'Hệ thống sẽ thêm danh mục các loại Phân bón & Thuốc BVTV thông dụng nhất vùng Đà Lạt - Lâm Đồng (NPK Đầu Trâu, Hữu cơ vi sinh, Anvil, Ridomil Gold, Score, v.v.). Tiếp tục?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Nạp dữ liệu',
          onPress: async () => {
            try {
              setLoading(true);
              await apiSeedLamDong();
              Alert.alert('Thành công', 'Đã nạp gói dữ liệu vật tư nông nghiệp chuẩn!');
              loadData();
            } catch {
              Alert.alert('Lỗi', 'Không thể nạp dữ liệu mẫu');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Filter
  const filtered = materials.filter((m) => {
    const matchCat = filterType === 'ALL' || (m.category || m.type) === filterType;
    const matchSearch =
      searchTerm.trim() === '' ||
      (m.name && m.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (m.activeIngredient && m.activeIngredient.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchCat && matchSearch;
  });

  const getCategoryBadge = (cat) => {
    switch (cat) {
      case 'PHAN_BON':
        return { label: 'Phân bón', bg: '#dcfce7', color: '#15803d' };
      case 'THUOC_BVTV':
        return { label: 'Thuốc BVTV', bg: '#fee2e2', color: '#b91c1c' };
      case 'GIONG':
        return { label: 'Cây giống', bg: '#e0e7ff', color: '#4338ca' };
      default:
        return { label: 'Vật tư khác', bg: '#f1f5f9', color: '#475569' };
    }
  };

  return (
    <View style={styles.container}>
      {/* Header Toolbar */}
      <View style={styles.topToolbar}>
        <View style={styles.searchBar}>
          <Feather name="search" size={18} color={COLORS.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm tên vật tư, hoạt chất..."
            placeholderTextColor={COLORS.textMuted}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
          {searchTerm.length > 0 && (
            <TouchableOpacity onPress={() => setSearchTerm('')}>
              <Feather name="x" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.headerBtnGroup}>
          <TouchableOpacity
            style={styles.seedBtn}
            onPress={handleSeedLamDong}
            activeOpacity={0.8}
          >
            <Feather name="database" size={15} color="#0891b2" />
            <Text style={styles.seedBtnText}>Mẫu Lâm Đồng</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.createBtn}
            onPress={openCreateModal}
            activeOpacity={0.8}
          >
            <Feather name="plus" size={16} color={COLORS.white} />
            <Text style={styles.createBtnText}>Thêm vật tư</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Filter Tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScroll}
      >
        {CATEGORIES.map((cat) => {
          const active = filterType === cat.value;
          return (
            <TouchableOpacity
              key={cat.value}
              style={[styles.filterChip, active && styles.filterChipActive]}
              onPress={() => setFilterType(cat.value)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* List */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải danh mục vật tư...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
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
            <View style={styles.emptyContainer}>
              <Feather name="box" size={48} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Chưa có vật tư nào</Text>
              <Text style={styles.emptyDesc}>
                Nhấn "Thêm vật tư" hoặc "Mẫu Lâm Đồng" để nạp sẵn kho phân thuốc chuẩn.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const badge = getCategoryBadge(item.category || item.type);
            return (
              <View style={styles.itemCard}>
                <View style={styles.itemHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    {item.activeIngredient ? (
                      <Text style={styles.itemIngredient}>
                        Hoạt chất: <Text style={{ color: COLORS.text }}>{item.activeIngredient}</Text>
                      </Text>
                    ) : null}
                  </View>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                {/* Info row */}
                <View style={styles.itemMetaRow}>
                  <View style={styles.metaItem}>
                    <Feather name="tag" size={13} color={COLORS.textMuted} />
                    <Text style={styles.metaText}>ĐVT: <Text style={{ fontWeight: '700' }}>{item.unit || 'kg'}</Text></Text>
                  </View>

                  {item.packaging ? (
                    <View style={styles.metaItem}>
                      <Feather name="package" size={13} color={COLORS.textMuted} />
                      <Text style={styles.metaText}>{item.packaging}</Text>
                    </View>
                  ) : null}

                  {item.isolationPeriod ? (
                    <View style={styles.metaItem}>
                      <Feather name="clock" size={13} color="#dc2626" />
                      <Text style={[styles.metaText, { color: '#dc2626', fontWeight: '700' }]}>
                        Cách ly: {item.isolationPeriod} ngày
                      </Text>
                    </View>
                  ) : null}

                  {item.price > 0 ? (
                    <View style={styles.metaItem}>
                      <Feather name="dollar-sign" size={13} color="#15803d" />
                      <Text style={[styles.metaText, { color: '#15803d', fontWeight: '700' }]}>
                        {Number(item.price).toLocaleString('vi-VN')} đ/{item.unit || 'kg'}
                      </Text>
                    </View>
                  ) : null}
                </View>

                {item.instructions ? (
                  <Text style={styles.instructionText} numberOfLines={2}>
                    <Text style={{ fontWeight: '600' }}>HDSD: </Text>{item.instructions}
                  </Text>
                ) : null}

                {/* Footer action buttons */}
                <View style={styles.actionRow}>
                  <TouchableOpacity
                    style={styles.historyBtn}
                    onPress={() => openHistoryModal(item)}
                    activeOpacity={0.7}
                  >
                    <Feather name="clock" size={14} color="#4338ca" />
                    <Text style={styles.historyBtnText}>Lịch sử giá</Text>
                  </TouchableOpacity>

                  <View style={styles.rightActions}>
                    <TouchableOpacity
                      style={styles.editBtn}
                      onPress={() => openEditModal(item)}
                      activeOpacity={0.7}
                    >
                      <Feather name="edit-2" size={15} color={COLORS.primary} />
                      <Text style={styles.editBtnText}>Sửa</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => handleDelete(item)}
                      activeOpacity={0.7}
                    >
                      <Feather name="trash-2" size={15} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Modal Add / Edit */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Sửa thông tin vật tư' : 'Thêm vật tư nông nghiệp'}
              </Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Feather name="x" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} keyboardShouldPersistTaps="handled">
              <Text style={styles.formLabel}>Tên vật tư / Phân thuốc *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="VD: NPK 20-20-15 Đầu Trâu, Ridomil Gold..."
                value={name}
                onChangeText={setName}
              />

              <Text style={styles.formLabel}>Phân loại vật tư</Text>
              <View style={styles.chipGroup}>
                {[
                  { value: 'PHAN_BON', label: 'Phân bón' },
                  { value: 'THUOC_BVTV', label: 'Thuốc BVTV' },
                  { value: 'GIONG', label: 'Cây giống' },
                  { value: 'KHAC', label: 'Khác' },
                ].map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    style={[styles.smallChip, category === c.value && styles.smallChipActive]}
                    onPress={() => setCategory(c.value)}
                  >
                    <Text style={[styles.smallChipText, category === c.value && styles.smallChipTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.twoCol}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Đơn vị tính cơ bản</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                    {STANDARD_UNITS.map((u) => (
                      <TouchableOpacity
                        key={u}
                        style={[styles.unitChip, unit === u && styles.unitChipActive]}
                        onPress={() => setUnit(u)}
                      >
                        <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>
                          {u}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <Text style={styles.formLabel}>Hoạt chất chính (nếu là thuốc BVTV / phân)</Text>
              <TextInput
                style={styles.formInput}
                placeholder="VD: Metalaxyl M 40g/kg, Mancozeb 640g/kg..."
                value={activeIngredient}
                onChangeText={setActiveIngredient}
              />

              <View style={styles.twoCol}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Quy cách đóng gói</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="VD: Chai 500ml, Bao 50kg..."
                    value={packaging}
                    onChangeText={setPackaging}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Thời gian cách ly (ngày)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="VD: 7, 14..."
                    keyboardType="numeric"
                    value={isolationPeriod}
                    onChangeText={setIsolationPeriod}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Đơn giá tham khảo (VNĐ / {unit})</Text>
              <TextInput
                style={styles.formInput}
                placeholder="VD: 85000"
                keyboardType="numeric"
                value={price}
                onChangeText={setPrice}
              />

              <Text style={styles.formLabel}>Hướng dẫn sử dụng & liều lượng</Text>
              <TextInput
                style={[styles.formInput, { height: 70, textAlignVertical: 'top' }]}
                placeholder="VD: Pha 25ml cho bình 20 lít nước, phun đều tán lá vào sáng sớm..."
                multiline
                value={instructions}
                onChangeText={setInstructions}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setModalOpen(false)}
                disabled={submitting}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalSubmitBtn, submitting && { opacity: 0.7 }]}
                onPress={handleSave}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.modalSubmitText}>{editingItem ? 'Lưu cập nhật' : 'Thêm vật tư'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Lịch sử giá */}
      <Modal visible={historyModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '75%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Lịch sử biến động giá</Text>
                <Text style={{ fontSize: 13, color: COLORS.textMuted }}>{historyItem?.name}</Text>
              </View>
              <TouchableOpacity onPress={() => setHistoryModalOpen(false)}>
                <Feather name="x" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16 }}>
              {loadingHistory ? (
                <ActivityIndicator color={COLORS.primary} />
              ) : historyList.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 24 }}>
                  <Feather name="info" size={32} color={COLORS.textMuted} style={{ marginBottom: 8 }} />
                  <Text style={{ color: COLORS.textMuted, fontSize: 14 }}>Chưa ghi nhận biến động giá trước đây.</Text>
                </View>
              ) : (
                <FlatList
                  data={historyList}
                  keyExtractor={(_, i) => String(i)}
                  renderItem={({ item }) => (
                    <View style={styles.historyRow}>
                      <View>
                        <Text style={styles.historyPrice}>
                          {Number(item.price || item.unitPrice || 0).toLocaleString('vi-VN')} đ
                        </Text>
                        <Text style={styles.historyDate}>
                          {item.date ? new Date(item.date).toLocaleDateString('vi-VN') : 'Gần đây'}
                        </Text>
                      </View>
                      <Text style={styles.historyNote}>{item.notes || 'Cập nhật giá'}</Text>
                    </View>
                  )}
                />
              )}
            </View>
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
  topToolbar: {
    backgroundColor: COLORS.white,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    marginLeft: 8,
  },
  headerBtnGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  seedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfeff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a5f3fc',
    gap: 6,
  },
  seedBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0891b2',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  createBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
  filterScroll: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
  centerLoading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: COLORS.textMuted,
  },
  listContent: {
    padding: 12,
    paddingBottom: 40,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 13,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 6,
    paddingHorizontal: 32,
  },
  itemCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  itemIngredient: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginVertical: 6,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  instructionText: {
    fontSize: 12,
    color: COLORS.textMuted,
    backgroundColor: '#f8fafc',
    padding: 8,
    borderRadius: 6,
    marginVertical: 6,
    fontStyle: 'italic',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
    marginTop: 6,
  },
  historyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
  },
  historyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4338ca',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  deleteBtn: {
    padding: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
  },
  modalForm: {
    padding: 16,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  formInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 14,
  },
  chipGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  smallChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  smallChipActive: {
    backgroundColor: COLORS.primary,
  },
  smallChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  smallChipTextActive: {
    color: COLORS.white,
  },
  twoCol: {
    flexDirection: 'row',
  },
  unitChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  unitChipActive: {
    backgroundColor: '#0891b2',
  },
  unitChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  unitChipTextActive: {
    color: COLORS.white,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 12,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  modalSubmitBtn: {
    flex: 2,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  modalSubmitText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.white,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  historyPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#15803d',
  },
  historyDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  historyNote: {
    fontSize: 13,
    color: COLORS.text,
  },
});
