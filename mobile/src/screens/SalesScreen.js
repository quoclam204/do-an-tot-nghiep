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
  apiGetMyFarms,
  apiGetProducts,
  apiCreateProduct,
  apiUpdateProduct,
  apiDeleteProduct,
  apiGetInvoices,
  apiCreateInvoice,
  apiCancelInvoice,
  apiGetSalesStats,
} from '../services/api';

const TABS = [
  { id: 'invoices', label: 'Hóa đơn & Bán hàng', icon: 'file-text' },
  { id: 'products', label: 'Sản phẩm bán', icon: 'package' },
  { id: 'stats', label: 'Thống kê doanh số', icon: 'trending-up' },
];

export default function SalesScreen() {
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [activeTab, setActiveTab] = useState('invoices');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Products Data
  const [products, setProducts] = useState([]);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodName, setProdName] = useState('');
  const [prodUnit, setProdUnit] = useState('kg');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [submittingProduct, setSubmittingProduct] = useState(false);

  // Invoices Data
  const [invoices, setInvoices] = useState([]);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);

  // Create Invoice Form
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [discount, setDiscount] = useState('0');
  const [notes, setNotes] = useState('');
  const [invoiceItems, setInvoiceItems] = useState([
    { productId: '', quantity: '', unitPrice: '' },
  ]);

  // Stats Data
  const [stats, setStats] = useState(null);

  const loadFarmsAndData = async () => {
    try {
      const farmsRes = await apiGetMyFarms();
      const farmList = Array.isArray(farmsRes) ? farmsRes : [];
      setFarms(farmList);
      const farmId = selectedFarmId || (farmList.length > 0 ? farmList[0].id : '');
      if (!selectedFarmId && farmId) {
        setSelectedFarmId(farmId);
      }
      await loadTabContent(farmId);
    } catch (e) {
      console.warn('Lỗi tải dữ liệu bán hàng:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadTabContent = async (farmId) => {
    try {
      if (activeTab === 'products') {
        const p = await apiGetProducts(farmId || undefined);
        setProducts(Array.isArray(p) ? p : []);
      } else if (activeTab === 'invoices') {
        const [inv, p] = await Promise.all([
          apiGetInvoices(farmId || undefined),
          apiGetProducts(farmId || undefined).catch(() => []),
        ]);
        setInvoices(Array.isArray(inv) ? inv : []);
        setProducts(Array.isArray(p) ? p : []);
      } else if (activeTab === 'stats') {
        const s = await apiGetSalesStats(farmId || undefined);
        setStats(s || {});
      }
    } catch (e) {
      console.warn('Lỗi tải tab:', e);
    }
  };

  useEffect(() => {
    loadFarmsAndData();
  }, [activeTab, selectedFarmId]);

  // Product CRUD
  const openCreateProduct = () => {
    setEditingProduct(null);
    setProdName('');
    setProdUnit('kg');
    setProdPrice('');
    setProdStock('');
    setProdDesc('');
    setProductModalOpen(true);
  };

  const openEditProduct = (prod) => {
    setEditingProduct(prod);
    setProdName(prod.name || '');
    setProdUnit(prod.unit || 'kg');
    setProdPrice(String(prod.price || ''));
    setProdStock(String(prod.stockQuantity || '0'));
    setProdDesc(prod.description || '');
    setProductModalOpen(true);
  };

  const handleSaveProduct = async () => {
    if (!prodName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên sản phẩm nông sản');
      return;
    }
    setSubmittingProduct(true);
    const payload = {
      name: prodName.trim(),
      unit: prodUnit.trim() || 'kg',
      price: Number(prodPrice) || 0,
      stockQuantity: Number(prodStock) || 0,
      description: prodDesc.trim() || undefined,
      farmId: selectedFarmId || undefined,
    };

    try {
      if (editingProduct) {
        await apiUpdateProduct(editingProduct.id, payload);
        Alert.alert('Thành công', 'Đã cập nhật sản phẩm');
      } else {
        await apiCreateProduct(payload);
        Alert.alert('Thành công', 'Đã thêm sản phẩm bán mới');
      }
      setProductModalOpen(false);
      loadTabContent(selectedFarmId);
    } catch (e) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể lưu sản phẩm');
    } finally {
      setSubmittingProduct(false);
    }
  };

  const handleDeleteProduct = (prod) => {
    Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa sản phẩm "${prod.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa vĩnh viễn',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDeleteProduct(prod.id);
            loadTabContent(selectedFarmId);
          } catch (e) {
            Alert.alert('Lỗi', 'Không thể xóa sản phẩm này');
          }
        },
      },
    ]);
  };

  // Invoice Handlers
  const openCreateInvoice = () => {
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setDiscount('0');
    setNotes('');
    if (products.length > 0) {
      setInvoiceItems([{ productId: products[0].id, quantity: '1', unitPrice: String(products[0].price || 0) }]);
    } else {
      setInvoiceItems([{ productId: '', quantity: '1', unitPrice: '' }]);
    }
    setInvoiceModalOpen(true);
  };

  const handleAddInvoiceItem = () => {
    const firstProd = products.length > 0 ? products[0] : null;
    setInvoiceItems([
      ...invoiceItems,
      {
        productId: firstProd ? firstProd.id : '',
        quantity: '1',
        unitPrice: firstProd ? String(firstProd.price || 0) : '',
      },
    ]);
  };

  const handleRemoveInvoiceItem = (index) => {
    if (invoiceItems.length === 1) return;
    setInvoiceItems(invoiceItems.filter((_, i) => i !== index));
  };

  const updateItemField = (index, field, value) => {
    const updated = [...invoiceItems];
    updated[index][field] = value;
    if (field === 'productId') {
      const found = products.find((p) => p.id === value);
      if (found) {
        updated[index].unitPrice = String(found.price || 0);
      }
    }
    setInvoiceItems(updated);
  };

  // Calculate invoice preview total
  const subtotal = invoiceItems.reduce((sum, item) => {
    return sum + (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
  }, 0);
  const finalTotal = Math.max(0, subtotal - (Number(discount) || 0));

  const handleSaveInvoice = async () => {
    if (!customerName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên khách hàng / người mua');
      return;
    }
    if (invoiceItems.length === 0 || !invoiceItems[0].productId) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 1 sản phẩm bán');
      return;
    }

    setSubmittingInvoice(true);
    const payload = {
      farmId: selectedFarmId || undefined,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || undefined,
      customerAddress: customerAddress.trim() || undefined,
      discount: Number(discount) || 0,
      notes: notes.trim() || undefined,
      items: invoiceItems.map((item) => ({
        productId: item.productId,
        quantity: Number(item.quantity) || 1,
        unitPrice: Number(item.unitPrice) || 0,
      })),
    };

    try {
      await apiCreateInvoice(payload);
      Alert.alert('Thành công', 'Đã lập hóa đơn xuất bán thành công!');
      setInvoiceModalOpen(false);
      loadTabContent(selectedFarmId);
    } catch (e) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể tạo hóa đơn');
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const handleCancelInvoice = (inv) => {
    Alert.alert('Hủy hóa đơn', `Bạn có chắc muốn hủy đơn hàng #${inv.code || inv.id.slice(-6)}?`, [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy đơn',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiCancelInvoice(inv.id);
            Alert.alert('Thông báo', 'Đã hủy hóa đơn');
            setDetailModalOpen(false);
            loadTabContent(selectedFarmId);
          } catch (e) {
            Alert.alert('Lỗi', 'Không thể hủy hóa đơn này');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Farm Switcher & Header */}
      {farms.length > 1 && (
        <View style={styles.farmBar}>
          <Text style={styles.farmBarLabel}>Nông trại:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {farms.map((f) => {
              const active = f.id === selectedFarmId;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.farmChip, active && styles.farmChipActive]}
                  onPress={() => setSelectedFarmId(f.id)}
                >
                  <Text style={[styles.farmChipText, active && styles.farmChipTextActive]}>
                    {f.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map((t) => {
          const active = activeTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => setActiveTab(t.id)}
              activeOpacity={0.7}
            >
              <Feather
                name={t.icon}
                size={16}
                color={active ? COLORS.primary : COLORS.textMuted}
                style={{ marginBottom: 4 }}
              />
              <Text style={[styles.tabText, active && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content Area */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải dữ liệu bán hàng...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* TAB 1: INVOICES */}
          {activeTab === 'invoices' && (
            <View style={{ flex: 1 }}>
              <View style={styles.actionHeader}>
                <Text style={styles.sectionTitle}>Danh sách Hóa đơn xuất bán</Text>
                <TouchableOpacity
                  style={styles.primaryAddBtn}
                  onPress={openCreateInvoice}
                  activeOpacity={0.8}
                >
                  <Feather name="plus" size={16} color={COLORS.white} />
                  <Text style={styles.primaryAddBtnText}>Lập hóa đơn</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={invoices}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                      setRefreshing(true);
                      loadFarmsAndData();
                    }}
                    colors={[COLORS.primary]}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Feather name="file-text" size={44} color={COLORS.textMuted} />
                    <Text style={styles.emptyTitle}>Chưa có đơn xuất bán</Text>
                    <Text style={styles.emptyDesc}>
                      Bấm "Lập hóa đơn" để tạo đơn xuất nông sản đầu tiên cho khách hàng.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => {
                  const isCanceled = item.status === 'CANCELLED' || item.status === 'CANCELED';
                  const total = item.finalAmount || item.totalAmount || 0;
                  return (
                    <TouchableOpacity
                      style={[styles.invoiceCard, isCanceled && { opacity: 0.6 }]}
                      onPress={() => {
                        setSelectedInvoice(item);
                        setDetailModalOpen(true);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.invoiceTopRow}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Feather name="user" size={16} color={COLORS.primary} />
                          <Text style={styles.invoiceCustomer}>{item.customerName || 'Khách vãng lai'}</Text>
                        </View>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: isCanceled ? '#fee2e2' : '#dcfce7' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              { color: isCanceled ? '#dc2626' : '#166534' },
                            ]}
                          >
                            {isCanceled ? 'Đã hủy' : 'Hoàn thành'}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.invoiceMidRow}>
                        <Text style={styles.invoiceDate}>
                          <Feather name="calendar" size={12} color={COLORS.textMuted} />{' '}
                          {item.createdAt ? new Date(item.createdAt).toLocaleDateString('vi-VN') : 'Hôm nay'}
                        </Text>
                        {item.customerPhone ? (
                          <Text style={styles.invoicePhone}>
                            <Feather name="phone" size={12} color={COLORS.textMuted} /> {item.customerPhone}
                          </Text>
                        ) : null}
                      </View>

                      <View style={styles.invoiceBottomRow}>
                        <Text style={styles.invoiceItemCount}>
                          {Array.isArray(item.items) ? item.items.length : 1} mặt hàng
                        </Text>
                        <Text style={styles.invoiceTotal}>
                          {Number(total).toLocaleString('vi-VN')} đ
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            </View>
          )}

          {/* TAB 2: PRODUCTS */}
          {activeTab === 'products' && (
            <View style={{ flex: 1 }}>
              <View style={styles.actionHeader}>
                <Text style={styles.sectionTitle}>Sản phẩm nông sản bán</Text>
                <TouchableOpacity
                  style={styles.primaryAddBtn}
                  onPress={openCreateProduct}
                  activeOpacity={0.8}
                >
                  <Feather name="plus" size={16} color={COLORS.white} />
                  <Text style={styles.primaryAddBtnText}>Thêm sản phẩm</Text>
                </TouchableOpacity>
              </View>

              <FlatList
                data={products}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={styles.listContent}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={() => {
                      setRefreshing(true);
                      loadFarmsAndData();
                    }}
                    colors={[COLORS.primary]}
                  />
                }
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Feather name="package" size={44} color={COLORS.textMuted} />
                    <Text style={styles.emptyTitle}>Chưa có danh mục sản phẩm</Text>
                    <Text style={styles.emptyDesc}>
                      Thêm sản phẩm để dễ dàng chọn xuất kho bán cho khách hàng.
                    </Text>
                  </View>
                }
                renderItem={({ item }) => (
                  <View style={styles.productCard}>
                    <View style={styles.productLeft}>
                      <Text style={styles.productName}>{item.name}</Text>
                      <Text style={styles.productPrice}>
                        {Number(item.price || 0).toLocaleString('vi-VN')} đ / {item.unit || 'kg'}
                      </Text>
                      <Text style={styles.productStock}>
                        Tồn khả dụng:{' '}
                        <Text style={{ fontWeight: '700', color: COLORS.text }}>
                          {item.stockQuantity || 0} {item.unit || 'kg'}
                        </Text>
                      </Text>
                      {item.description ? (
                        <Text style={styles.productDesc} numberOfLines={1}>
                          {item.description}
                        </Text>
                      ) : null}
                    </View>

                    <View style={styles.productActions}>
                      <TouchableOpacity
                        style={styles.iconAction}
                        onPress={() => openEditProduct(item)}
                      >
                        <Feather name="edit-2" size={16} color={COLORS.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.iconAction}
                        onPress={() => handleDeleteProduct(item)}
                      >
                        <Feather name="trash-2" size={16} color="#ef4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              />
            </View>
          )}

          {/* TAB 3: STATS */}
          {activeTab === 'stats' && (
            <ScrollView contentContainerStyle={styles.statsScroll}>
              <View style={styles.statsSummaryCard}>
                <Text style={styles.statsSummaryLabel}>Tổng Doanh Thu Xuất Bán</Text>
                <Text style={styles.statsSummaryValue}>
                  {Number(stats?.totalRevenue || 0).toLocaleString('vi-VN')} đ
                </Text>
                <Text style={styles.statsSummarySub}>
                  Từ {stats?.totalInvoices || invoices.length || 0} đơn hàng bán nông sản
                </Text>
              </View>

              <View style={styles.statsGrid}>
                <View style={styles.statMetricBox}>
                  <Feather name="check-circle" size={24} color="#16a34a" />
                  <Text style={styles.statMetricNum}>{stats?.totalInvoices || invoices.length || 0}</Text>
                  <Text style={styles.statMetricLabel}>Đơn hoàn tất</Text>
                </View>

                <View style={styles.statMetricBox}>
                  <Feather name="package" size={24} color="#0891b2" />
                  <Text style={styles.statMetricNum}>{products.length}</Text>
                  <Text style={styles.statMetricLabel}>Mặt hàng bán</Text>
                </View>
              </View>

              {/* Best selling or recent breakdown */}
              <View style={styles.detailCard}>
                <Text style={styles.detailCardTitle}>Thông tin lưu ý xuất bán</Text>
                <Text style={styles.detailCardText}>
                  • Mọi giao dịch tạo đơn bán hàng sẽ tự động ghi nhận vào Báo cáo Doanh thu & Dòng tiền tài chính toàn hệ thống.
                </Text>
                <Text style={styles.detailCardText}>
                  • Bạn có thể tạo nhiều sản phẩm nông sản tương ứng với từng lô thu hoạch trong mùa vụ.
                </Text>
              </View>
            </ScrollView>
          )}
        </View>
      )}

      {/* Modal Add / Edit Product */}
      <Modal visible={productModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingProduct ? 'Sửa sản phẩm nông sản' : 'Thêm sản phẩm nông sản'}
              </Text>
              <TouchableOpacity onPress={() => setProductModalOpen(false)}>
                <Feather name="x" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm}>
              <Text style={styles.formLabel}>Tên nông sản bán *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="VD: Dâu tây New Zealand, Cà phê nhân..."
                value={prodName}
                onChangeText={setProdName}
              />

              <View style={styles.twoCol}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Đơn vị tính</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="kg, hộp, thùng..."
                    value={prodUnit}
                    onChangeText={setProdUnit}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Đơn giá bán (VNĐ)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="VD: 150000"
                    keyboardType="numeric"
                    value={prodPrice}
                    onChangeText={setProdPrice}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Số lượng tồn kho sẵn bán</Text>
              <TextInput
                style={styles.formInput}
                placeholder="VD: 50"
                keyboardType="numeric"
                value={prodStock}
                onChangeText={setProdStock}
              />

              <Text style={styles.formLabel}>Mô tả / Phân loại</Text>
              <TextInput
                style={[styles.formInput, { height: 60 }]}
                placeholder="VD: Loại 1 trái to đều, thu hoạch sáng sớm..."
                multiline
                value={prodDesc}
                onChangeText={setProdDesc}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setProductModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveProduct}
                disabled={submittingProduct}
              >
                {submittingProduct ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.modalSubmitText}>Lưu sản phẩm</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal Create Invoice */}
      <Modal visible={invoiceModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '92%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Lập hóa đơn xuất bán</Text>
              <TouchableOpacity onPress={() => setInvoiceModalOpen(false)}>
                <Feather name="x" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} keyboardShouldPersistTaps="handled">
              <Text style={styles.formLabel}>Họ tên Khách hàng / Đại lý *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="VD: Chị Lan Vựa Đà Lạt, Cửa hàng Rau Sạch..."
                value={customerName}
                onChangeText={setCustomerName}
              />

              <View style={styles.twoCol}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.formLabel}>Số điện thoại</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0912..."
                    keyboardType="phone-pad"
                    value={customerPhone}
                    onChangeText={setCustomerPhone}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.formLabel}>Chiết khấu (VNĐ)</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="0"
                    keyboardType="numeric"
                    value={discount}
                    onChangeText={setDiscount}
                  />
                </View>
              </View>

              <Text style={styles.formLabel}>Địa chỉ giao hàng</Text>
              <TextInput
                style={styles.formInput}
                placeholder="VD: Phường 8, TP. Đà Lạt..."
                value={customerAddress}
                onChangeText={setCustomerAddress}
              />

              {/* Items List */}
              <View style={styles.itemsSectionHeader}>
                <Text style={styles.itemsSectionTitle}>Mặt hàng bán</Text>
                <TouchableOpacity onPress={handleAddInvoiceItem} style={styles.addItemBtn}>
                  <Feather name="plus-circle" size={15} color={COLORS.primary} />
                  <Text style={styles.addItemBtnText}>Thêm mặt hàng</Text>
                </TouchableOpacity>
              </View>

              {invoiceItems.map((item, index) => (
                <View key={index} style={styles.itemRowBox}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.text }}>
                      Mặt hàng #{index + 1}
                    </Text>
                    {invoiceItems.length > 1 && (
                      <TouchableOpacity onPress={() => handleRemoveInvoiceItem(index)}>
                        <Feather name="trash-2" size={14} color="#ef4444" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Select product */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                    {products.map((p) => {
                      const selected = item.productId === p.id;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[styles.prodSelectChip, selected && styles.prodSelectChipActive]}
                          onPress={() => updateItemField(index, 'productId', p.id)}
                        >
                          <Text
                            style={[
                              styles.prodSelectChipText,
                              selected && styles.prodSelectChipTextActive,
                            ]}
                          >
                            {p.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <View style={styles.twoCol}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.subLabel}>Số lượng</Text>
                      <TextInput
                        style={styles.smallInput}
                        placeholder="1"
                        keyboardType="numeric"
                        value={item.quantity}
                        onChangeText={(v) => updateItemField(index, 'quantity', v)}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subLabel}>Đơn giá (VNĐ)</Text>
                      <TextInput
                        style={styles.smallInput}
                        placeholder="100000"
                        keyboardType="numeric"
                        value={item.unitPrice}
                        onChangeText={(v) => updateItemField(index, 'unitPrice', v)}
                      />
                    </View>
                  </View>
                </View>
              ))}

              {/* Total Calculation Banner */}
              <View style={styles.totalBanner}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Tạm tính:</Text>
                  <Text style={styles.totalVal}>{subtotal.toLocaleString('vi-VN')} đ</Text>
                </View>
                {Number(discount) > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={[styles.totalLabel, { color: '#dc2626' }]}>Giảm giá:</Text>
                    <Text style={[styles.totalVal, { color: '#dc2626' }]}>
                      -{Number(discount).toLocaleString('vi-VN')} đ
                    </Text>
                  </View>
                )}
                <View style={[styles.totalRow, { marginTop: 6, borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 6 }]}>
                  <Text style={[styles.totalLabel, { fontWeight: '800', fontSize: 16 }]}>Tổng thanh toán:</Text>
                  <Text style={[styles.totalVal, { fontWeight: '800', fontSize: 17, color: '#16a34a' }]}>
                    {finalTotal.toLocaleString('vi-VN')} đ
                  </Text>
                </View>
              </View>

              <Text style={styles.formLabel}>Ghi chú đơn hàng</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Ghi chú giao nhận..."
                value={notes}
                onChangeText={setNotes}
              />
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setInvoiceModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSaveInvoice}
                disabled={submittingInvoice}
              >
                {submittingInvoice ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.modalSubmitText}>Hoàn tất xuất bán</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal View Invoice Detail */}
      <Modal visible={detailModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết Hóa đơn</Text>
              <TouchableOpacity onPress={() => setDetailModalOpen(false)}>
                <Feather name="x" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {selectedInvoice && (
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.text }}>
                    Khách hàng: {selectedInvoice.customerName}
                  </Text>
                  {selectedInvoice.customerPhone ? (
                    <Text style={{ color: COLORS.textMuted, marginTop: 4 }}>
                      SĐT: {selectedInvoice.customerPhone}
                    </Text>
                  ) : null}
                  {selectedInvoice.customerAddress ? (
                    <Text style={{ color: COLORS.textMuted, marginTop: 2 }}>
                      Địa chỉ: {selectedInvoice.customerAddress}
                    </Text>
                  ) : null}

                  <View style={{ height: 1, backgroundColor: COLORS.border, marginVertical: 12 }} />

                  <Text style={{ fontWeight: '700', marginBottom: 8 }}>Mặt hàng đã mua:</Text>
                  {Array.isArray(selectedInvoice.items) &&
                    selectedInvoice.items.map((it, idx) => (
                      <View
                        key={idx}
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          paddingVertical: 6,
                          borderBottomWidth: 1,
                          borderBottomColor: '#f1f5f9',
                        }}
                      >
                        <Text style={{ flex: 1, color: COLORS.text }}>
                          {it.product?.name || it.productName || 'Nông sản'} (x{it.quantity})
                        </Text>
                        <Text style={{ fontWeight: '700', color: COLORS.text }}>
                          {Number(it.subtotal || it.quantity * it.unitPrice || 0).toLocaleString('vi-VN')} đ
                        </Text>
                      </View>
                    ))}

                  <View style={{ marginTop: 16, padding: 12, backgroundColor: '#f8fafc', borderRadius: 8 }}>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: '#16a34a' }}>
                      Tổng thanh toán: {Number(selectedInvoice.finalAmount || selectedInvoice.totalAmount || 0).toLocaleString('vi-VN')} đ
                    </Text>
                  </View>

                  {selectedInvoice.status !== 'CANCELLED' && selectedInvoice.status !== 'CANCELED' && (
                    <TouchableOpacity
                      style={styles.cancelInvoiceBtn}
                      onPress={() => handleCancelInvoice(selectedInvoice)}
                    >
                      <Feather name="slash" size={15} color="#dc2626" />
                      <Text style={styles.cancelInvoiceBtnText}>Hủy hóa đơn này</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
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
  farmBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  farmBarLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textMuted,
    marginRight: 8,
  },
  farmChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  farmChipActive: {
    backgroundColor: COLORS.primary,
  },
  farmChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  farmChipTextActive: {
    color: COLORS.white,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
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
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  primaryAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  primaryAddBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 14,
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
  invoiceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  invoiceTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceCustomer: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  invoiceMidRow: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 6,
  },
  invoiceDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  invoicePhone: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  invoiceBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    marginTop: 4,
  },
  invoiceItemCount: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  invoiceTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#16a34a',
  },
  productCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  productLeft: {
    flex: 1,
  },
  productName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#16a34a',
    marginTop: 2,
  },
  productStock: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  productDesc: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
    fontStyle: 'italic',
  },
  productActions: {
    flexDirection: 'row',
    gap: 12,
    paddingLeft: 10,
  },
  iconAction: {
    padding: 6,
  },
  statsScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  statsSummaryCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  statsSummaryLabel: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  statsSummaryValue: {
    color: COLORS.white,
    fontSize: 28,
    fontWeight: '800',
    marginVertical: 6,
  },
  statsSummarySub: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statMetricBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statMetricNum: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
    marginVertical: 4,
  },
  statMetricLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  detailCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailCardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 8,
  },
  detailCardText: {
    fontSize: 13,
    color: COLORS.textMuted,
    lineHeight: 20,
    marginBottom: 6,
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
    marginBottom: 12,
  },
  twoCol: {
    flexDirection: 'row',
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
  itemsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
  itemsSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  addItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addItemBtnText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
  },
  itemRowBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  prodSelectChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 6,
  },
  prodSelectChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  prodSelectChipText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  prodSelectChipTextActive: {
    color: COLORS.white,
  },
  subLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginBottom: 4,
  },
  smallInput: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 13,
  },
  totalBanner: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
    borderRadius: 8,
    padding: 12,
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 2,
  },
  totalLabel: {
    fontSize: 13,
    color: COLORS.text,
  },
  totalVal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  cancelInvoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  cancelInvoiceBtnText: {
    fontSize: 13,
    color: '#dc2626',
    fontWeight: '700',
  },
});
