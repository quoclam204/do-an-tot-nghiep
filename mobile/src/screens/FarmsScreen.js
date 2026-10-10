import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  apiGetMyFarms,
  apiCreateFarm,
  apiUpdateFarm,
  apiDeleteFarm,
  apiGetPlots,
  apiCreatePlot,
  apiUpdatePlot,
  apiDeletePlot,
  apiGetFarmMembers,
  apiAddFarmMember,
  apiRemoveFarmMember,
} from '../services/api';

const SOIL_TYPES = [
  'Đất đỏ bazan',
  'Đất phù sa',
  'Đất cát pha',
  'Đất thịt nhẹ',
  'Đất mùn đồi núi',
];

const MEMBER_ROLES = [
  { value: 'FARM_WORKER', label: 'Nông dân / Nhân công' },
  { value: 'FARM_MANAGER', label: 'Quản lý kỹ thuật' },
  { value: 'FARM_OWNER', label: 'Đồng chủ hộ' },
];

export default function FarmsScreen({ navigation }) {
  const [farms, setFarms] = useState([]);
  const [selectedFarm, setSelectedFarm] = useState(null);
  const [activeTab, setActiveTab] = useState('plots'); // 'plots' | 'members'
  const [plots, setPlots] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Farm Modals
  const [farmModalOpen, setFarmModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState(null);
  const [farmName, setFarmName] = useState('');
  const [farmAddress, setFarmAddress] = useState('');
  const [farmArea, setFarmArea] = useState('');
  const [submittingFarm, setSubmittingFarm] = useState(false);

  // Plot Modals
  const [plotModalOpen, setPlotModalOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState(null);
  const [plotName, setPlotName] = useState('');
  const [plotArea, setPlotArea] = useState('');
  const [plotSoil, setPlotSoil] = useState('Đất đỏ bazan');
  const [submittingPlot, setSubmittingPlot] = useState(false);

  // Member Modal
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('FARM_WORKER');
  const [submittingMember, setSubmittingMember] = useState(false);

  const loadFarms = async () => {
    try {
      const data = await apiGetMyFarms();
      const list = Array.isArray(data) ? data : [];
      setFarms(list);
      if (list.length > 0) {
        // Keep current selected farm or pick the first
        const current = selectedFarm ? list.find((f) => f.id === selectedFarm.id) || list[0] : list[0];
        setSelectedFarm(current);
        loadFarmDetails(current.id);
      } else {
        setSelectedFarm(null);
        setPlots([]);
        setMembers([]);
      }
    } catch (e) {
      console.warn('Lỗi tải danh sách nông trại:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadFarmDetails = async (farmId) => {
    if (!farmId) return;
    try {
      const [plotsData, membersData] = await Promise.allSettled([
        apiGetPlots(farmId),
        apiGetFarmMembers(farmId),
      ]);
      if (plotsData.status === 'fulfilled') {
        setPlots(Array.isArray(plotsData.value) ? plotsData.value : []);
      }
      if (membersData.status === 'fulfilled') {
        setMembers(Array.isArray(membersData.value) ? membersData.value : []);
      }
    } catch (e) {
      console.warn('Lỗi tải chi tiết farm:', e);
    }
  };

  useEffect(() => {
    loadFarms();
  }, []);

  const handleSelectFarm = (farm) => {
    setSelectedFarm(farm);
    loadFarmDetails(farm.id);
  };

  // ── FARM CRUD ──
  const openCreateFarmModal = () => {
    setEditingFarm(null);
    setFarmName('');
    setFarmAddress('Đà Lạt, Lâm Đồng');
    setFarmArea('1.5');
    setFarmModalOpen(true);
  };

  const openEditFarmModal = (farm) => {
    setEditingFarm(farm);
    setFarmName(farm.name || '');
    setFarmAddress(farm.address || '');
    setFarmArea(farm.totalArea ? String(farm.totalArea) : '');
    setFarmModalOpen(true);
  };

  const handleSaveFarm = async () => {
    if (!farmName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên nông trại');
      return;
    }
    setSubmittingFarm(true);
    const payload = {
      name: farmName.trim(),
      address: farmAddress.trim() || 'Đà Lạt, Lâm Đồng',
      totalArea: Number(farmArea) || 1,
    };

    try {
      if (editingFarm) {
        await apiUpdateFarm(editingFarm.id, payload);
        Alert.alert('Thành công', 'Đã cập nhật thông tin nông trại');
      } else {
        await apiCreateFarm(payload);
        Alert.alert('Thành công', 'Đã thêm nông trại mới!');
      }
      setFarmModalOpen(false);
      loadFarms();
    } catch (e) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể lưu nông trại');
    } finally {
      setSubmittingFarm(false);
    }
  };

  const handleDeleteFarm = (farm) => {
    Alert.alert(
      'Xóa nông trại',
      `Bạn có chắc chắn muốn xóa nông trại "${farm.name}"? Dữ liệu các lô đất sẽ bị ảnh hưởng.`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa vĩnh viễn',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDeleteFarm(farm.id);
              Alert.alert('Thành công', 'Đã xóa nông trại');
              loadFarms();
            } catch (err) {
              Alert.alert('Lỗi', err.response?.data?.message || 'Không thể xóa nông trại');
            }
          },
        },
      ]
    );
  };

  // ── PLOT CRUD ──
  const openCreatePlotModal = () => {
    if (!selectedFarm) {
      Alert.alert('Lỗi', 'Vui lòng chọn nông trại trước');
      return;
    }
    setEditingPlot(null);
    setPlotName('');
    setPlotArea('0.5');
    setPlotSoil('Đất đỏ bazan');
    setPlotModalOpen(true);
  };

  const openEditPlotModal = (plot) => {
    setEditingPlot(plot);
    setPlotName(plot.name || '');
    setPlotArea(plot.area ? String(plot.area) : '');
    setPlotSoil(plot.soilType || 'Đất đỏ bazan');
    setPlotModalOpen(true);
  };

  const handleSavePlot = async () => {
    if (!plotName.trim() || !selectedFarm) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên thửa đất / lô trồng');
      return;
    }
    setSubmittingPlot(true);
    const payload = {
      name: plotName.trim(),
      area: Number(plotArea) || 0.5,
      soilType: plotSoil,
    };

    try {
      if (editingPlot) {
        await apiUpdatePlot(selectedFarm.id, editingPlot.id, payload);
        Alert.alert('Thành công', 'Đã cập nhật thửa đất!');
      } else {
        await apiCreatePlot(selectedFarm.id, payload);
        Alert.alert('Thành công', 'Đã tạo thửa đất mới!');
      }
      setPlotModalOpen(false);
      loadFarmDetails(selectedFarm.id);
    } catch (e) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể lưu thửa đất');
    } finally {
      setSubmittingPlot(false);
    }
  };

  const handleDeletePlot = (plot) => {
    Alert.alert(
      'Xóa lô đất',
      `Bạn có chắc muốn xóa thửa đất "${plot.name}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiDeletePlot(selectedFarm.id, plot.id);
              Alert.alert('Thành công', 'Đã xóa thửa đất');
              loadFarmDetails(selectedFarm.id);
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể xóa thửa đất');
            }
          },
        },
      ]
    );
  };

  // ── MEMBER CRUD ──
  const handleAddMember = async () => {
    if (!memberEmail.trim() || !selectedFarm) {
      Alert.alert('Lỗi', 'Vui lòng nhập email tài khoản thành viên');
      return;
    }
    setSubmittingMember(true);
    try {
      await apiAddFarmMember(selectedFarm.id, {
        email: memberEmail.trim(),
        role: memberRole,
      });
      setMemberModalOpen(false);
      setMemberEmail('');
      Alert.alert('Thành công', 'Đã thêm thành viên vào nông trại!');
      loadFarmDetails(selectedFarm.id);
    } catch (e) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể thêm thành viên. Kiểm tra lại email.');
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleRemoveMember = (member) => {
    Alert.alert(
      'Xóa thành viên',
      `Bạn có chắc muốn mời ${member.user?.fullName || member.user?.email || 'thành viên này'} rời nông trại?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiRemoveFarmMember(selectedFarm.id, member.id || member.userId);
              Alert.alert('Thành công', 'Đã xóa thành viên khỏi nông trại');
              loadFarmDetails(selectedFarm.id);
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể xóa thành viên');
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải thông tin nông trại...</Text>
        </View>
      ) : (
        <ScrollView
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadFarms();
              }}
              colors={[COLORS.primary]}
            />
          }
        >
          {/* Top Section & Thêm Farm Button */}
          <View style={styles.topSection}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>Hệ thống Nông trại</Text>
              <Text style={styles.headerSub}>Quản lý vườn tược, thửa đất và nhân sự</Text>
            </View>
            <TouchableOpacity style={styles.btnAddFarm} onPress={openCreateFarmModal}>
              <Feather name="plus" size={16} color={COLORS.white} />
              <Text style={styles.btnAddFarmText}>Thêm vườn</Text>
            </TouchableOpacity>
          </View>

          {/* Farm Horizontal Tabs */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.farmTabScroll}>
            {farms.map((f) => {
              const active = selectedFarm?.id === f.id;
              return (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.farmTab, active && styles.farmTabActive]}
                  onPress={() => handleSelectFarm(f)}
                >
                  <Feather
                    name="home"
                    size={16}
                    color={active ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text style={[styles.farmTabText, active && styles.farmTabTextActive]}>
                    {f.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Chi tiết Farm đã chọn */}
          {selectedFarm && (
            <View style={styles.farmInfoCard}>
              <View style={styles.farmInfoHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectedFarmName}>{selectedFarm.name}</Text>
                  <View style={styles.farmInfoRow}>
                    <Feather name="map-pin" size={14} color={COLORS.primary} />
                    <Text style={styles.farmAddressText}>{selectedFarm.address || 'Đà Lạt, Lâm Đồng'}</Text>
                  </View>
                </View>
                <View style={styles.farmActionsRow}>
                  <TouchableOpacity onPress={() => openEditFarmModal(selectedFarm)} style={styles.actionIconBtn}>
                    <Feather name="edit-2" size={16} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDeleteFarm(selectedFarm)} style={styles.actionIconBtn}>
                    <Feather name="trash-2" size={16} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.farmStatsBar}>
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Diện tích</Text>
                  <Text style={styles.statVal}>{selectedFarm.totalArea || 0} ha</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Số thửa đất</Text>
                  <Text style={styles.statVal}>{plots.length} lô</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statCol}>
                  <Text style={styles.statLabel}>Nhân sự</Text>
                  <Text style={styles.statVal}>{members.length} người</Text>
                </View>
              </View>

              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  backgroundColor: '#ecfeff',
                  borderWidth: 1,
                  borderColor: '#a5f3fc',
                  paddingVertical: 10,
                  borderRadius: 8,
                  marginTop: 12,
                }}
                onPress={() =>
                  navigation.navigate('FarmDetail', { farmId: selectedFarm.id, farm: selectedFarm })
                }
                activeOpacity={0.8}
              >
                <Feather name="external-link" size={14} color="#0891b2" />
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#0891b2' }}>
                  Xem chuyên sâu, ảnh lô cây trồng & QR Truy xuất
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Sub Navigation Tabs: Plots vs Members */}
          <View style={styles.subTabsRow}>
            <TouchableOpacity
              style={[styles.subTab, activeTab === 'plots' && styles.subTabActive]}
              onPress={() => setActiveTab('plots')}
            >
              <Feather
                name="grid"
                size={16}
                color={activeTab === 'plots' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.subTabText, activeTab === 'plots' && styles.subTabTextActive]}>
                Thửa đất & Lô trồng ({plots.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.subTab, activeTab === 'members' && styles.subTabActive]}
              onPress={() => setActiveTab('members')}
            >
              <Feather
                name="users"
                size={16}
                color={activeTab === 'members' ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.subTabText, activeTab === 'members' && styles.subTabTextActive]}>
                Thành viên nông hộ ({members.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* TAB 1: PLOTS CONTENT */}
          {activeTab === 'plots' && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Danh sách lô canh tác</Text>
                <TouchableOpacity style={styles.btnAddSmall} onPress={openCreatePlotModal}>
                  <Feather name="plus" size={14} color={COLORS.primary} />
                  <Text style={styles.btnAddSmallText}>Thêm thửa</Text>
                </TouchableOpacity>
              </View>

              {plots.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Feather name="inbox" size={36} color={COLORS.border} />
                  <Text style={styles.emptyText}>Chưa có lô đất nào trong trang trại này.</Text>
                </View>
              ) : (
                plots.map((plot) => (
                  <View key={plot.id} style={styles.plotCard}>
                    <View style={styles.plotHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.plotTitle}>{plot.name}</Text>
                        <Text style={styles.plotSoilText}>
                          Thổ nhưỡng: <Text style={{ color: COLORS.text, fontWeight: '600' }}>{plot.soilType || 'Đất đỏ bazan'}</Text>
                        </Text>
                      </View>
                      <View style={styles.plotActionBtns}>
                        <TouchableOpacity onPress={() => openEditPlotModal(plot)} style={styles.plotIconBtn}>
                          <Feather name="edit-2" size={14} color={COLORS.primary} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => handleDeletePlot(plot)} style={styles.plotIconBtn}>
                          <Feather name="trash-2" size={14} color={COLORS.danger} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={styles.plotFooter}>
                      <View style={styles.plotBadge}>
                        <Feather name="maximize-2" size={12} color={COLORS.primary} />
                        <Text style={styles.plotBadgeText}>{plot.area || 0.5} ha</Text>
                      </View>
                      {plot.crop && (
                        <View style={[styles.plotBadge, { backgroundColor: '#f0fdf4' }]}>
                          <Feather name="feather" size={12} color={COLORS.primary} />
                          <Text style={styles.plotBadgeText}>{plot.crop.name}</Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 2: MEMBERS CONTENT */}
          {activeTab === 'members' && (
            <View style={styles.sectionContainer}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionTitle}>Đội ngũ nông dân & Kỹ thuật</Text>
                <TouchableOpacity style={styles.btnAddSmall} onPress={() => setMemberModalOpen(true)}>
                  <Feather name="user-plus" size={14} color={COLORS.primary} />
                  <Text style={styles.btnAddSmallText}>Thêm thành viên</Text>
                </TouchableOpacity>
              </View>

              {members.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Feather name="users" size={36} color={COLORS.border} />
                  <Text style={styles.emptyText}>Chưa có thành viên nào được gán vào nông hộ này.</Text>
                </View>
              ) : (
                members.map((m) => (
                  <View key={m.id || m.userId} style={styles.memberCard}>
                    <View style={styles.memberAvatar}>
                      <Text style={styles.memberAvatarText}>
                        {(m.user?.fullName || m.user?.email || 'N')[0].toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.memberName}>{m.user?.fullName || m.user?.email || 'Nông dân'}</Text>
                      <Text style={styles.memberEmail}>{m.user?.email || m.email}</Text>
                      <View style={styles.roleBadge}>
                        <Text style={styles.roleBadgeText}>
                          {m.role === 'FARM_OWNER'
                            ? 'Chủ hộ'
                            : m.role === 'FARM_MANAGER'
                            ? 'Quản lý kỹ thuật'
                            : 'Nông dân'}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity onPress={() => handleRemoveMember(m)} style={styles.memberRemoveBtn}>
                      <Feather name="user-x" size={16} color={COLORS.danger} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Modal Thêm / Sửa Farm */}
      <Modal visible={farmModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingFarm ? 'Chỉnh sửa nông trại' : 'Thêm nông trại mới'}</Text>
              <TouchableOpacity onPress={() => setFarmModalOpen(false)}>
                <Feather name="x" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Tên nông trại / Khu vườn *</Text>
              <TextInput
                style={styles.input}
                value={farmName}
                onChangeText={setFarmName}
                placeholder="Ví dụ: Vườn Dâu Tây LangBiang"
              />

              <Text style={styles.formLabel}>Địa chỉ / Vị trí</Text>
              <TextInput
                style={styles.input}
                value={farmAddress}
                onChangeText={setFarmAddress}
                placeholder="Ví dụ: Phường 7, TP. Đà Lạt"
              />

              <Text style={styles.formLabel}>Tổng diện tích (ha)</Text>
              <TextInput
                style={styles.input}
                value={farmArea}
                onChangeText={setFarmArea}
                keyboardType="numeric"
                placeholder="1.5"
              />

              <TouchableOpacity
                style={[styles.submitBtn, submittingFarm && styles.btnDisabled]}
                onPress={handleSaveFarm}
                disabled={submittingFarm}
              >
                {submittingFarm ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>{editingFarm ? 'Cập nhật nông trại' : 'Tạo nông trại'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Thêm / Sửa Plot */}
      <Modal visible={plotModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingPlot ? 'Sửa thửa đất' : 'Thêm thửa đất mới'}</Text>
              <TouchableOpacity onPress={() => setPlotModalOpen(false)}>
                <Feather name="x" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Tên thửa đất / Lô vườn *</Text>
              <TextInput
                style={styles.input}
                value={plotName}
                onChangeText={setPlotName}
                placeholder="Ví dụ: Lô A1 - Trồng dâu tây"
              />

              <Text style={styles.formLabel}>Diện tích (ha)</Text>
              <TextInput
                style={styles.input}
                value={plotArea}
                onChangeText={setPlotArea}
                keyboardType="numeric"
                placeholder="0.5"
              />

              <Text style={styles.formLabel}>Loại thổ nhưỡng / Đất</Text>
              <View style={styles.soilGrid}>
                {SOIL_TYPES.map((soil) => (
                  <TouchableOpacity
                    key={soil}
                    style={[styles.soilChip, plotSoil === soil && styles.soilChipActive]}
                    onPress={() => setPlotSoil(soil)}
                  >
                    <Text style={[styles.soilChipText, plotSoil === soil && styles.soilChipTextActive]}>
                      {soil}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, submittingPlot && styles.btnDisabled]}
                onPress={handleSavePlot}
                disabled={submittingPlot}
              >
                {submittingPlot ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>{editingPlot ? 'Cập nhật thửa đất' : 'Tạo thửa đất'}</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Modal Thêm Thành Viên */}
      <Modal visible={memberModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm thành viên nông hộ</Text>
              <TouchableOpacity onPress={() => setMemberModalOpen(false)}>
                <Feather name="x" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.formLabel}>Email tài khoản người dùng *</Text>
              <TextInput
                style={styles.input}
                value={memberEmail}
                onChangeText={setMemberEmail}
                placeholder="nguoidung@gmail.com"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.formLabel}>Vai trò trong nông trại</Text>
              <View style={styles.roleGrid}>
                {MEMBER_ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[styles.roleChip, memberRole === r.value && styles.roleChipActive]}
                    onPress={() => setMemberRole(r.value)}
                  >
                    <Text style={[styles.roleChipText, memberRole === r.value && styles.roleChipTextActive]}>
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={[styles.submitBtn, submittingMember && styles.btnDisabled]}
                onPress={handleAddMember}
                disabled={submittingMember}
              >
                {submittingMember ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.submitBtnText}>Gán vào nông trại</Text>
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
  topSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
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
  btnAddFarm: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  btnAddFarmText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  farmTabScroll: {
    paddingHorizontal: 16,
    marginVertical: 8,
  },
  farmTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
  },
  farmTabActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  farmTabText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  farmTabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  farmInfoCard: {
    backgroundColor: COLORS.white,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 12,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  farmInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  selectedFarmName: {
    fontSize: 17,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  farmInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  farmAddressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  farmActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionIconBtn: {
    padding: 6,
    backgroundColor: COLORS.background,
    borderRadius: 8,
  },
  farmStatsBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    marginTop: 14,
    borderRadius: 10,
    paddingVertical: 10,
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
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  statVal: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  subTabsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  subTabActive: {
    backgroundColor: COLORS.primaryLight,
  },
  subTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  subTabTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  sectionContainer: {
    paddingHorizontal: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  btnAddSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  btnAddSmallText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  emptyContainer: {
    backgroundColor: COLORS.white,
    padding: 30,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  plotCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  plotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  plotTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  plotSoilText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  plotActionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  plotIconBtn: {
    padding: 4,
  },
  plotFooter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  plotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  plotBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  memberAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatarText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  memberEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  memberRemoveBtn: {
    padding: 8,
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
  soilGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  soilChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: COLORS.borderLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  soilChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  soilChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  soilChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  roleGrid: {
    gap: 6,
    marginBottom: 8,
  },
  roleChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.borderLight,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  roleChipText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  roleChipTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
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
