import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { Feather } from '@expo/vector-icons';
import {
  apiGetFarm,
  apiGetPlots,
  apiCreatePlot,
  apiUpdatePlot,
  apiDeletePlot,
  apiGetFarmMembers,
  apiAddFarmMember,
  apiRemoveFarmMember,
} from '../services/api';

const PRESET_PLOTS = [
  { name: 'Vườn Cà phê Robusta cao sản', area: '1.2', soil: 'Đất đỏ bazan', image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80' },
  { name: 'Vườn Sầu riêng Ri6 ghép', area: '0.8', soil: 'Đất đỏ bazan', image: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?auto=format&fit=crop&w=400&q=80' },
  { name: 'Vườn Bơ sáp 034', area: '0.5', soil: 'Đất mùn đồi núi', image: 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=400&q=80' },
  { name: 'Đồi Chè Oolong Cầu Đất', area: '2.0', soil: 'Đất mùn đồi núi', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80' },
  { name: 'Vườn Dâu tây Thủy canh', area: '0.3', soil: 'Giá thể xơ dừa', image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=400&q=80' },
];

const SOIL_TYPES = [
  'Đất đỏ bazan',
  'Đất mùn đồi núi',
  'Đất phù sa',
  'Đất cát pha',
  'Đất thịt nhẹ',
  'Giá thể xơ dừa',
];

const ROLES = [
  { value: 'FARM_WORKER', label: 'Nông dân / Nhân công' },
  { value: 'FARM_MANAGER', label: 'Quản lý kỹ thuật' },
  { value: 'FARM_OWNER', label: 'Đồng chủ hộ' },
];

export default function FarmDetailScreen({ route, navigation }) {
  const { farmId, farm: initialFarm } = route.params || {};
  const [farm, setFarm] = useState(initialFarm || null);
  const [plots, setPlots] = useState([]);
  const [members, setMembers] = useState([]);
  const [activeTab, setActiveTab] = useState('plots'); // 'plots' | 'members'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Plot Modal
  const [plotModalOpen, setPlotModalOpen] = useState(false);
  const [editingPlot, setEditingPlot] = useState(null);
  const [plotName, setPlotName] = useState('');
  const [plotArea, setPlotArea] = useState('');
  const [plotSoil, setPlotSoil] = useState('Đất đỏ bazan');
  const [plotImage, setPlotImage] = useState(PRESET_PLOTS[0].image);
  const [submittingPlot, setSubmittingPlot] = useState(false);

  // QR Modal
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedPlotForQr, setSelectedPlotForQr] = useState(null);

  // Member Modal
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [memberEmail, setMemberEmail] = useState('');
  const [memberRole, setMemberRole] = useState('FARM_WORKER');
  const [submittingMember, setSubmittingMember] = useState(false);

  const loadData = async () => {
    const targetId = farmId || farm?.id;
    if (!targetId) return;

    try {
      const [farmRes, plotsRes, membersRes] = await Promise.allSettled([
        apiGetFarm(targetId),
        apiGetPlots(targetId),
        apiGetFarmMembers(targetId),
      ]);

      if (farmRes.status === 'fulfilled') setFarm(farmRes.value);
      if (plotsRes.status === 'fulfilled') setPlots(Array.isArray(plotsRes.value) ? plotsRes.value : []);
      if (membersRes.status === 'fulfilled') setMembers(Array.isArray(membersRes.value) ? membersRes.value : []);
    } catch (e) {
      console.warn('Lỗi tải chi tiết nông trại:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [farmId]);

  // Plot CRUD
  const openCreatePlot = () => {
    setEditingPlot(null);
    setPlotName('');
    setPlotArea('');
    setPlotSoil('Đất đỏ bazan');
    setPlotImage(PRESET_PLOTS[0].image);
    setPlotModalOpen(true);
  };

  const openEditPlot = (p) => {
    setEditingPlot(p);
    setPlotName(p.name || '');
    setPlotArea(String(p.area || ''));
    setPlotSoil(p.soilType || 'Đất đỏ bazan');
    setPlotImage(p.image || PRESET_PLOTS[0].image);
    setPlotModalOpen(true);
  };

  const handleSavePlot = async () => {
    if (!plotName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên thửa / lô đất');
      return;
    }
    setSubmittingPlot(true);
    const targetId = farmId || farm?.id;
    const payload = {
      name: plotName.trim(),
      area: Number(plotArea) || 0,
      soilType: plotSoil,
      image: plotImage,
    };

    try {
      if (editingPlot) {
        await apiUpdatePlot(targetId, editingPlot.id, payload);
        Alert.alert('Thành công', 'Đã cập nhật thông tin lô đất');
      } else {
        await apiCreatePlot(targetId, payload);
        Alert.alert('Thành công', 'Đã thêm lô đất mới vào nông trại');
      }
      setPlotModalOpen(false);
      loadData();
    } catch (e) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể lưu lô đất');
    } finally {
      setSubmittingPlot(false);
    }
  };

  const handleDeletePlot = (p) => {
    const targetId = farmId || farm?.id;
    Alert.alert('Xác nhận xóa', `Bạn có chắc muốn xóa lô đất "${p.name}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa vĩnh viễn',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiDeletePlot(targetId, p.id);
            loadData();
          } catch {
            Alert.alert('Lỗi', 'Không thể xóa lô đất');
          }
        },
      },
    ]);
  };

  // Member CRUD
  const handleAddMember = async () => {
    if (!memberEmail.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập email tài khoản');
      return;
    }
    setSubmittingMember(true);
    const targetId = farmId || farm?.id;
    try {
      await apiAddFarmMember(targetId, {
        email: memberEmail.trim(),
        role: memberRole,
      });
      Alert.alert('Thành công', 'Đã thêm thành viên vào nông hộ');
      setMemberModalOpen(false);
      setMemberEmail('');
      loadData();
    } catch (e) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không tìm thấy tài khoản với email này');
    } finally {
      setSubmittingMember(false);
    }
  };

  const handleRemoveMember = (m) => {
    const targetId = farmId || farm?.id;
    Alert.alert('Xóa thành viên', `Xóa ${m.user?.fullName || m.user?.email || 'thành viên'} khỏi nông hộ?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiRemoveFarmMember(targetId, m.id);
            loadData();
          } catch {
            Alert.alert('Lỗi', 'Không thể xóa thành viên');
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerLoading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Đang tải chi tiết nông trại...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Farm Profile Header Card */}
      <View style={styles.farmHeaderCard}>
        <View style={styles.farmHeaderTop}>
          <View style={styles.farmIcon}>
            <Feather name="home" size={24} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.farmName}>{farm?.name || 'Nông trại'}</Text>
            <Text style={styles.farmAddress}>
              <Feather name="map-pin" size={12} color={COLORS.textMuted} /> {farm?.address || 'Đà Lạt, Lâm Đồng'}
            </Text>
          </View>
        </View>

        <View style={styles.farmStatsRow}>
          <View style={styles.farmStat}>
            <Text style={styles.farmStatNum}>{farm?.area || 0} ha</Text>
            <Text style={styles.farmStatLabel}>Tổng diện tích</Text>
          </View>
          <View style={styles.farmStat}>
            <Text style={styles.farmStatNum}>{plots.length}</Text>
            <Text style={styles.farmStatLabel}>Lô canh tác</Text>
          </View>
          <View style={styles.farmStat}>
            <Text style={styles.farmStatNum}>{members.length}</Text>
            <Text style={styles.farmStatLabel}>Thành viên</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabNav}>
        <TouchableOpacity
          style={[styles.tabNavItem, activeTab === 'plots' && styles.tabNavItemActive]}
          onPress={() => setActiveTab('plots')}
        >
          <Feather
            name="layers"
            size={16}
            color={activeTab === 'plots' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.tabNavText, activeTab === 'plots' && styles.tabNavTextActive]}>
            Thửa & Lô đất ({plots.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabNavItem, activeTab === 'members' && styles.tabNavItemActive]}
          onPress={() => setActiveTab('members')}
        >
          <Feather
            name="users"
            size={16}
            color={activeTab === 'members' ? COLORS.primary : COLORS.textMuted}
          />
          <Text style={[styles.tabNavText, activeTab === 'members' && styles.tabNavTextActive]}>
            Thành viên ({members.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
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
      >
        {activeTab === 'plots' ? (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Danh sách Lô đất canh tác</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={openCreatePlot}
                activeOpacity={0.8}
              >
                <Feather name="plus" size={15} color={COLORS.white} />
                <Text style={styles.addBtnText}>Thêm lô</Text>
              </TouchableOpacity>
            </View>

            {plots.length === 0 ? (
              <View style={styles.emptyCard}>
                <Feather name="layers" size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>Chưa có lô đất nào</Text>
                <Text style={styles.emptySub}>
                  Chia nhỏ vườn thành các lô đất để theo dõi mùa vụ, cây trồng và vật tư chính xác hơn.
                </Text>
              </View>
            ) : (
              plots.map((p) => (
                <View key={p.id} style={styles.plotCard}>
                  {p.image ? (
                    <Image source={{ uri: p.image }} style={styles.plotImg} />
                  ) : (
                    <View style={styles.plotImgPlaceholder}>
                      <Feather name="image" size={24} color={COLORS.textMuted} />
                    </View>
                  )}

                  <View style={styles.plotBody}>
                    <View style={styles.plotTop}>
                      <Text style={styles.plotName}>{p.name}</Text>
                      <TouchableOpacity
                        style={styles.qrBtn}
                        onPress={() => {
                          setSelectedPlotForQr(p);
                          setQrModalOpen(true);
                        }}
                      >
                        <Feather name="maximize" size={14} color="#0891b2" />
                        <Text style={styles.qrBtnText}>Mã QR</Text>
                      </TouchableOpacity>
                    </View>

                    <View style={styles.plotMetaRow}>
                      <Text style={styles.plotMeta}>
                        <Feather name="maximize-2" size={12} color={COLORS.textMuted} /> {p.area} ha
                      </Text>
                      <Text style={styles.plotMeta}>
                        <Feather name="globe" size={12} color={COLORS.textMuted} /> {p.soilType || 'Đất đỏ bazan'}
                      </Text>
                    </View>

                    <View style={styles.plotActions}>
                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => openEditPlot(p)}
                      >
                        <Feather name="edit-2" size={14} color={COLORS.primary} />
                        <Text style={styles.actionBtnText}>Sửa</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.actionBtn}
                        onPress={() => handleDeletePlot(p)}
                      >
                        <Feather name="trash-2" size={14} color="#ef4444" />
                        <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Xóa</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        ) : (
          <View>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Nông dân & Nhân công phụ trách</Text>
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setMemberModalOpen(true)}
                activeOpacity={0.8}
              >
                <Feather name="user-plus" size={15} color={COLORS.white} />
                <Text style={styles.addBtnText}>Thêm người</Text>
              </TouchableOpacity>
            </View>

            {members.length === 0 ? (
              <View style={styles.emptyCard}>
                <Feather name="users" size={40} color={COLORS.textMuted} />
                <Text style={styles.emptyTitle}>Chưa có thành viên nào</Text>
                <Text style={styles.emptySub}>
                  Thêm tài khoản nhân công hoặc kỹ thuật viên để cùng ghi nhật ký canh tác cho vườn này.
                </Text>
              </View>
            ) : (
              members.map((m) => (
                <View key={m.id} style={styles.memberCard}>
                  <View style={styles.memberAvatar}>
                    <Feather name="user" size={18} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.memberName}>
                      {m.user?.fullName || m.user?.email || 'Nông dân'}
                    </Text>
                    <Text style={styles.memberEmail}>{m.user?.email}</Text>
                    <Text style={styles.memberRole}>
                      Vai trò: <Text style={{ fontWeight: '700' }}>{m.role || 'Nhân công'}</Text>
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.removeMemberBtn}
                    onPress={() => handleRemoveMember(m)}
                  >
                    <Feather name="x" size={18} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Modal Add / Edit Plot */}
      <Modal visible={plotModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingPlot ? 'Sửa thông tin Lô đất' : 'Thêm Lô đất mới'}
              </Text>
              <TouchableOpacity onPress={() => setPlotModalOpen(false)}>
                <Feather name="x" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={styles.formLabel}>Tên lô / Thửa đất *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="VD: Lô 1 - Cà phê đồi trên, Lô 2 - Vườn dâu..."
                value={plotName}
                onChangeText={setPlotName}
              />

              <Text style={styles.formLabel}>Diện tích (ha) *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="VD: 0.8"
                keyboardType="numeric"
                value={plotArea}
                onChangeText={setPlotArea}
              />

              <Text style={styles.formLabel}>Loại thổ nhưỡng / Đất</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                {SOIL_TYPES.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.chip, plotSoil === s && styles.chipActive]}
                    onPress={() => setPlotSoil(s)}
                  >
                    <Text style={[styles.chipText, plotSoil === s && styles.chipTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={styles.formLabel}>Ảnh đại diện loại cây trồng chuyên canh</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                {PRESET_PLOTS.map((preset, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.presetItem,
                      plotImage === preset.image && styles.presetItemActive,
                    ]}
                    onPress={() => {
                      setPlotImage(preset.image);
                      if (!plotName) setPlotName(preset.name);
                      if (!plotArea) setPlotArea(preset.area);
                    }}
                  >
                    <Image source={{ uri: preset.image }} style={styles.presetImg} />
                    <Text style={styles.presetLabel} numberOfLines={1}>
                      {preset.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setPlotModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSavePlot}
                disabled={submittingPlot}
              >
                {submittingPlot ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.modalSubmitText}>Lưu lô đất</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal QR Code */}
      <Modal visible={qrModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { alignItems: 'center', padding: 24 }]}>
            <Text style={{ fontSize: 18, fontWeight: '800', color: COLORS.text, marginBottom: 4 }}>
              Mã QR Truy Xuất Nguồn Gốc
            </Text>
            <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 20 }}>
              {selectedPlotForQr?.name} ({farm?.name})
            </Text>

            <View style={styles.qrPlaceholder}>
              <Feather name="grid" size={120} color={COLORS.primary} />
              <Text style={{ marginTop: 12, fontWeight: '700', color: COLORS.primary }}>
                MÃ LÔ: PLOT-{selectedPlotForQr?.id?.slice(0, 8).toUpperCase() || 'DALAT-AGRI'}
              </Text>
            </View>

            <Text style={{ fontSize: 12, color: COLORS.textMuted, textAlign: 'center', marginVertical: 16 }}>
              In mã QR này dán tại vườn để khách thu mua quét tra cứu nhật ký phân thuốc và nguồn gốc xuất xứ.
            </Text>

            <TouchableOpacity
              style={[styles.modalSubmitBtn, { alignSelf: 'stretch' }]}
              onPress={() => setQrModalOpen(false)}
            >
              <Text style={styles.modalSubmitText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Add Member */}
      <Modal visible={memberModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thêm nông dân vào nông hộ</Text>
              <TouchableOpacity onPress={() => setMemberModalOpen(false)}>
                <Feather name="x" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16 }}>
              <Text style={styles.formLabel}>Địa chỉ Email tài khoản *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="VD: nongdan1@dalatagri.vn"
                keyboardType="email-address"
                autoCapitalize="none"
                value={memberEmail}
                onChangeText={setMemberEmail}
              />

              <Text style={styles.formLabel}>Vai trò trong nông hộ</Text>
              <View style={{ gap: 8, marginBottom: 16 }}>
                {ROLES.map((r) => (
                  <TouchableOpacity
                    key={r.value}
                    style={[
                      styles.roleOption,
                      memberRole === r.value && styles.roleOptionActive,
                    ]}
                    onPress={() => setMemberRole(r.value)}
                  >
                    <Feather
                      name={memberRole === r.value ? 'check-circle' : 'circle'}
                      size={18}
                      color={memberRole === r.value ? COLORS.primary : COLORS.textMuted}
                    />
                    <Text
                      style={[
                        styles.roleOptionText,
                        memberRole === r.value && styles.roleOptionTextActive,
                      ]}
                    >
                      {r.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setMemberModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleAddMember}
                disabled={submittingMember}
              >
                {submittingMember ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.modalSubmitText}>Thêm vào vườn</Text>
                )}
              </TouchableOpacity>
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
  farmHeaderCard: {
    backgroundColor: COLORS.white,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  farmHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  farmIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmName: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  farmAddress: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  farmStatsRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    paddingVertical: 10,
  },
  farmStat: {
    flex: 1,
    alignItems: 'center',
  },
  farmStatNum: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  farmStatLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  tabNav: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tabNavItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabNavItemActive: {
    borderBottomColor: COLORS.primary,
  },
  tabNavText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  tabNavTextActive: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  addBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  plotCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  plotImg: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  plotImgPlaceholder: {
    width: '100%',
    height: 80,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  plotBody: {
    padding: 12,
  },
  plotTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plotName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  qrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfeff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  qrBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0891b2',
  },
  plotMetaRow: {
    flexDirection: 'row',
    gap: 16,
    marginVertical: 6,
  },
  plotMeta: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  plotActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    marginTop: 4,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  memberEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  memberRole: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  removeMemberBtn: {
    padding: 6,
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
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: COLORS.primary,
  },
  chipText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  chipTextActive: {
    color: COLORS.white,
    fontWeight: '700',
  },
  presetItem: {
    width: 120,
    marginRight: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  presetItemActive: {
    borderColor: COLORS.primary,
  },
  presetImg: {
    width: 120,
    height: 70,
  },
  presetLabel: {
    fontSize: 11,
    padding: 4,
    backgroundColor: '#f8fafc',
    color: COLORS.text,
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
  qrPlaceholder: {
    width: 220,
    height: 220,
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  roleOptionActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight,
  },
  roleOptionText: {
    fontSize: 14,
    color: COLORS.text,
  },
  roleOptionTextActive: {
    fontWeight: '700',
    color: COLORS.primary,
  },
});
