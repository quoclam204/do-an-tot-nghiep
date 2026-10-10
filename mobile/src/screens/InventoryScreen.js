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
  apiGetInventory,
  apiGetMaterials,
  apiCreateMaterial,
  apiUpdateMaterial,
  apiDeleteMaterial,
  apiSeedLamDong,
} from '../services/api';

const CATEGORIES = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'PHAN_BON', label: 'Phân bón' },
  { value: 'THUOC_BVTV', label: 'Thuốc BVTV' },
  { value: 'GIONG', label: 'Hạt giống' },
  { value: 'KHAC', label: 'Vật tư khác' },
  { value: 'LOW_STOCK', label: '⚠️ Sắp hết kho' },
];

const STANDARD_UNITS = ['kg', 'lít', 'chai', 'bao', 'gói', 'tấn', 'cây'];

export default function InventoryScreen({ navigation }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterType, setFilterType] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [restockModalOpen, setRestockModalOpen] = useState(false);
  const [restockItem, setRestockItem] = useState(null);
  const [restockQty, setRestockQty] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('PHAN_BON');
  const [unit, setUnit] = useState('kg');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [supplier, setSupplier] = useState('');
  const [minThreshold, setMinThreshold] = useState('5');

  const loadData = async () => {
    try {
      const [inv, mats] = await Promise.all([
        apiGetInventory().catch(() => []),
        apiGetMaterials().catch(() => []),
      ]);
      // Hợp nhất danh sách
      const list = Array.isArray(mats) && mats.length > 0 ? mats : (Array.isArray(inv) ? inv : []);
      setMaterials(list);
    } catch (e) {
      console.warn('Lỗi tải kho vật tư:', e);
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
    setQuantity('');
    setPrice('');
    setSupplier('');
    setMinThreshold('5');
    setModalOpen(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setName(item.name || '');
    setCategory(item.category || item.type || 'PHAN_BON');
    setUnit(item.unit || 'kg');
    setQuantity(String(item.quantity || item.stock || 0));
    setPrice(String(item.price || item.unitPrice || ''));
    setSupplier(item.supplier || '');
    setMinThreshold(String(item.minThreshold || 5));
    setModalOpen(true);
  };

  const openRestockModal = (item) => {
    setRestockItem(item);
    setRestockQty('');
    setRestockModalOpen(true);
  };

  const handleSaveMaterial = async () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên vật tư');
      return;
    }
    setSubmitting(true);
    const payload = {
      name: name.trim(),
      category,
      unit: unit.trim() || 'kg',
      quantity: Number(quantity) || 0,
      price: Number(price) || 0,
      supplier: supplier.trim(),
      minThreshold: Number(minThreshold) || 5,
    };

    try {
      if (editingItem) {
        await apiUpdateMaterial(editingItem.id, payload);
        Alert.alert('Thành công', 'Đã cập nhật thông tin vật tư!');
      } else {
        await apiCreateMaterial(payload);
        Alert.alert('Thành công', 'Đã thêm vật tư vào kho nông hộ!');
      }
      setModalOpen(false);
      loadData();
    } catch (e) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể lưu vật tư');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRestock = async () => {
    const addQty = Number(restockQty);
    if (!addQty || addQty <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số lượng nhập thêm');
      return;
    }
    setSubmitting(true);
    try {
      const currentQty = Number(restockItem.quantity || restockItem.stock || 0);
      await apiUpdateMaterial(restockItem.id, {
        quantity: currentQty + addQty,
      });
      setRestockModalOpen(false);
      Alert.alert('Thành công', `Đã nhập thêm ${addQty} ${restockItem.unit || 'kg'} vào kho!`);
      loadData();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể cập nhật số lượng nhập kho');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item) => {
    Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa "${item.name}" khỏi danh mục kho?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDeleteMaterial(item.id);
            Alert.alert('Thành công', 'Đã xóa vật tư');
            loadData();
          } catch (e) {
            Alert.alert('Lỗi', 'Không thể xóa');
          }
        },
      },
    ]);
  };

  // Filter materials
  const filteredMaterials = materials.filter((m) => {
    const mName = (m.name || '').toLowerCase();
    const mSup = (m.supplier || '').toLowerCase();
    const mCat = m.category || m.type || '';
    const qty = Number(m.quantity || m.stock || 0);

    const matchesSearch =
      !searchTerm.trim() ||
      mName.includes(searchTerm.toLowerCase()) ||
      mSup.includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (filterType === 'ALL') return true;
    if (filterType === 'LOW_STOCK') return qty <= 5;
    return mCat === filterType;
  });

  // Calculate KPIs
  const totalItems = materials.length;
  const totalStockVal = materials.reduce((sum, m) => {
    const q = Number(m.quantity || m.stock || 0);
    const p = Number(m.price || m.unitPrice || 0);
    return sum + q * p;
  }, 0);
  const lowStockCount = materials.filter((m) => Number(m.quantity || m.stock || 0) <= 5).length;

  const renderMaterial = ({ item }) => {
    const qty = Number(item.quantity || item.stock || 0);
    const isLow = qty <= (Number(item.minThreshold) || 5);
    const priceVal = Number(item.price || item.unitPrice || 0);
    const totalVal = qty * priceVal;

    return (
      <View style={styles.card}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.matName}>{item.name}</Text>
            <Text style={styles.categorySub}>
              {item.category === 'PHAN_BON'
                ? 'Phân bón'
                : item.category === 'THUOC_BVTV'
                ? 'Thuốc BVTV'
                : item.category === 'GIONG'
                ? 'Giống cây'
                : 'Vật tư khác'}
            </Text>
          </View>
          <View style={styles.actionIcons}>
            <TouchableOpacity onPress={() => openRestockModal(item)} style={styles.btnRestock}>
              <Feather name="plus-circle" size={14} color={COLORS.primary} />
              <Text style={styles.btnRestockText}>Nhập thêm</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openEditModal(item)} style={styles.iconBtn}>
              <Feather name="edit-2" size={15} color={COLORS.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item)} style={styles.iconBtn}>
              <Feather name="trash-2" size={15} color={COLORS.danger} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Tồn kho</Text>
            <Text style={[styles.metricVal, isLow && { color: COLORS.danger }]}>
              {qty} <Text style={styles.metricUnit}>{item.unit || 'kg'}</Text>
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Đơn giá nhập</Text>
            <Text style={styles.metricVal}>
              {priceVal > 0 ? `${priceVal.toLocaleString('vi-VN')} đ` : 'Chưa có'}
            </Text>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <Text style={styles.metricLabel}>Tổng giá trị</Text>
            <Text style={[styles.metricVal, { color: COLORS.primary }]}>
              {totalVal > 0 ? `${totalVal.toLocaleString('vi-VN')} đ` : '0 đ'}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          {isLow ? (
            <View style={styles.warnBadge}>
              <Feather name="alert-triangle" size={12} color="#dc2626" />
              <Text style={styles.warnText}>Sắp hết (Dưới {item.minThreshold || 5})</Text>
            </View>
          ) : (
            <View style={styles.okBadge}>
              <Feather name="check" size={12} color={COLORS.primary} />
              <Text style={styles.okText}>Tồn an toàn</Text>
            </View>
          )}

          {item.supplier ? (
            <Text style={styles.supplierText}>
              NCC: <Text style={{ color: COLORS.text }}>{item.supplier}</Text>
            </Text>
          ) : null}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Materials Master Catalog Shortcut */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: '#ecfeff',
          marginHorizontal: 12,
          marginTop: 10,
          marginBottom: 4,
          padding: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: '#a5f3fc',
          gap: 10,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 13, fontWeight: '800', color: '#0891b2' }}>
            Danh mục Vật tư & Hoạt chất
          </Text>
          <Text style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 1 }}>
            Tra cứu thời gian cách ly PHI, đơn vị chuẩn & quy cách
          </Text>
        </View>
        <TouchableOpacity
          style={{
            backgroundColor: '#0891b2',
            paddingHorizontal: 10,
            paddingVertical: 6,
            borderRadius: 6,
          }}
          onPress={() => navigation.navigate('Materials')}
          activeOpacity={0.8}
        >
          <Text style={{ color: COLORS.white, fontSize: 11, fontWeight: '700' }}>Chi tiết</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchBar}>
        <Feather name="search" size={16} color={COLORS.textMuted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm vật tư, nhà cung cấp..."
          value={searchTerm}
          onChangeText={setSearchTerm}
        />
        {searchTerm.length > 0 && (
          <TouchableOpacity onPress={() => setSearchTerm('')}>
            <Feather name="x" size={16} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* KPI Top Summary Cards */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Tổng loại vật tư</Text>
          <Text style={styles.kpiValue}>{totalItems}</Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Giá trị kho</Text>
          <Text style={[styles.kpiValue, { color: COLORS.primary }]}>
            {totalStockVal.toLocaleString('vi-VN')} <Text style={styles.kpiUnit}>đ</Text>
          </Text>
        </View>
        <View style={styles.kpiDivider} />
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Cảnh báo cạn</Text>
          <Text style={[styles.kpiValue, { color: lowStockCount > 0 ? COLORS.danger : COLORS.primary }]}>
            {lowStockCount}
          </Text>
        </View>
      </View>

      {/* Category Chips Scroll */}
      <View style={styles.filterScrollWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.value}
              style={[styles.filterChip, filterType === cat.value && styles.filterChipActive]}
              onPress={() => setFilterType(cat.value)}
            >
              <Text style={[styles.filterChipText, filterType === cat.value && styles.filterChipTextActive]}>
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải dữ liệu kho vật tư...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredMaterials}
          keyExtractor={(item, index) => item.id?.toString() || index.toString()}
          renderItem={renderMaterial}
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
              <Feather name="box" size={44} color={COLORS.border} />
              <Text style={styles.emptyTitle}>Không có vật tư nào</Text>
              <Text style={styles.emptySub}>Bấm nút "+" để thêm vật tư phân bón hoặc hạt giống vào kho.</Text>
            </View>
          }
        />
      )}

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab} onPress={openCreateModal} activeOpacity={0.8}>
        <Feather name="plus" size={26} color={COLORS.white} />
      </TouchableOpacity>

      {/* Modal Thêm / Chỉnh Sửa Vật Tư */}
      <Modal visible={modalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingItem ? 'Sửa thông tin vật tư' : 'Nhập vật tư mới vào kho'}</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Feather name="x" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Tên vật tư *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Ví dụ: NPK Đầu Trâu 20-20-15"
              />

              <Text style={styles.formLabel}>Phân loại</Text>
              <View style={styles.catGrid}>
                {[
                  { value: 'PHAN_BON', label: 'Phân bón' },
                  { value: 'THUOC_BVTV', label: 'Thuốc BVTV' },
                  { value: 'GIONG', label: 'Hạt giống' },
                  { value: 'KHAC', label: 'Khác' },
                ].map((c) => (
                  <TouchableOpacity
                    key={c.value}
                    style={[styles.catBtn, category === c.value && styles.catBtnActive]}
                    onPress={() => setCategory(c.value)}
                  >
                    <Text style={[styles.catBtnText, category === c.value && styles.catBtnTextActive]}>
                      {c.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.formLabel}>Đơn vị tính</Text>
              <View style={styles.unitGrid}>
                {STANDARD_UNITS.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
                    onPress={() => setUnit(u)}
                  >
                    <Text style={[styles.unitBtnText, unit === u && styles.unitBtnTextActive]}>
                      {u}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Số lượng tồn *</Text>
                  <TextInput
                    style={styles.input}
                    value={quantity}
                    onChangeText={setQuantity}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.formLabel}>Đơn giá nhập (VNĐ)</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                </View>
              </View>

              <View style={styles.row}>
                <View style={{ flex: 1.5, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Nhà cung cấp / Đại lý</Text>
                  <TextInput
                    style={styles.input}
                    value={supplier}
                    onChangeText={setSupplier}
                    placeholder="Ví dụ: Đại lý VTNN Đà Lạt"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.formLabel}>Ngưỡng cảnh báo</Text>
                  <TextInput
                    style={styles.input}
                    value={minThreshold}
                    onChangeText={setMinThreshold}
                    keyboardType="numeric"
                    placeholder="5"
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, submitting && styles.btnDisabled]}
                onPress={handleSaveMaterial}
                disabled={submitting}
              >
                {submitting ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {editingItem ? 'Lưu thay đổi' : 'Nhập vào kho'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Quick Restock (Nhập thêm hàng vào kho) */}
      <Modal visible={restockModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '45%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nhập thêm hàng</Text>
              <TouchableOpacity onPress={() => setRestockModalOpen(false)}>
                <Feather name="x" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 14, color: COLORS.text, marginBottom: 12 }}>
              Vật tư: <Text style={{ fontWeight: '700' }}>{restockItem?.name}</Text>
              {'\n'}Hiện tại đang có: {restockItem?.quantity || restockItem?.stock || 0} {restockItem?.unit || 'kg'}
            </Text>

            <Text style={styles.formLabel}>Số lượng nhập thêm ({restockItem?.unit || 'kg'}) *</Text>
            <TextInput
              style={styles.input}
              value={restockQty}
              onChangeText={setRestockQty}
              keyboardType="numeric"
              placeholder="Nhập số lượng bổ sung (Ví dụ: 50)"
              autoFocus
            />

            <TouchableOpacity
              style={[styles.submitBtn, submitting && styles.btnDisabled, { marginTop: 16 }]}
              onPress={handleRestock}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitBtnText}>Xác nhận nhập kho</Text>
              )}
            </TouchableOpacity>
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
  filterScrollWrap: {
    marginBottom: 8,
  },
  filterScroll: {
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
    paddingTop: 4,
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  matName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  categorySub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  actionIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  btnRestock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  btnRestockText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  iconBtn: {
    padding: 2,
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 10,
    paddingVertical: 8,
    marginVertical: 6,
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.border,
  },
  metricLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  metricUnit: {
    fontSize: 11,
    fontWeight: '500',
    color: COLORS.textSecondary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  warnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  warnText: {
    fontSize: 10,
    color: '#dc2626',
    fontWeight: '700',
  },
  okBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  okText: {
    fontSize: 10,
    color: COLORS.primary,
    fontWeight: '700',
  },
  supplierText: {
    fontSize: 11,
    color: COLORS.textSecondary,
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
  catGrid: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 6,
  },
  catBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: COLORS.borderLight,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  catBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  catBtnText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  catBtnTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  unitGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  unitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: COLORS.borderLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unitBtnActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  unitBtnText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  unitBtnTextActive: {
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
