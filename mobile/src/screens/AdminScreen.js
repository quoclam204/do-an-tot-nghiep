import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { Feather } from '@expo/vector-icons';
import {
  apiGetStatistics,
  apiGetAllUsers,
  apiGetPendingUsers,
  apiApproveUser,
  apiRejectUser,
  apiUpdateUserRole,
  apiToggleUserActive,
  apiDeleteUser,
  apiAdminResetPassword,
  apiAdminGetAllFarms,
  apiAdminGetAllActivityLogs,
} from '../services/api';

const ADMIN_TABS = [
  { id: 'overview', label: 'Tổng quan', icon: 'activity' },
  { id: 'users', label: 'Người dùng & Duyệt', icon: 'users' },
  { id: 'farms', label: 'Tất cả Nông trại', icon: 'home' },
  { id: 'logs', label: 'Giám sát Nhật ký', icon: 'clipboard' },
];

export default function AdminScreen() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Overview Stats
  const [stats, setStats] = useState(null);

  // Users & Approvals
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [targetUser, setTargetUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [submittingReset, setSubmittingReset] = useState(false);

  // Farms All
  const [allFarms, setAllFarms] = useState([]);

  // Logs All
  const [allLogs, setAllLogs] = useState([]);

  const loadData = async () => {
    try {
      if (activeTab === 'overview') {
        const s = await apiGetStatistics().catch(() => null);
        setStats(s);
      } else if (activeTab === 'users') {
        const [uList, pList] = await Promise.all([
          apiGetAllUsers().catch(() => []),
          apiGetPendingUsers().catch(() => []),
        ]);
        setUsers(Array.isArray(uList) ? uList : []);
        setPendingUsers(Array.isArray(pList) ? pList : []);
      } else if (activeTab === 'farms') {
        const f = await apiAdminGetAllFarms().catch(() => []);
        setAllFarms(Array.isArray(f) ? f : []);
      } else if (activeTab === 'logs') {
        const l = await apiAdminGetAllActivityLogs().catch(() => []);
        setAllLogs(Array.isArray(l) ? l : []);
      }
    } catch (e) {
      console.warn('Lỗi tải dữ liệu Admin:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // User Actions
  const handleApprove = async (user) => {
    try {
      await apiApproveUser(user.id);
      Alert.alert('Thành công', `Đã duyệt tài khoản ${user.email}`);
      loadData();
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể duyệt tài khoản');
    }
  };

  const handleReject = (user) => {
    Alert.prompt
      ? Alert.prompt('Từ chối duyệt', 'Nhập lý do từ chối (tùy chọn):', async (reason) => {
          try {
            await apiRejectUser(user.id, reason || 'Không đủ điều kiện');
            Alert.alert('Thông báo', 'Đã từ chối tài khoản');
            loadData();
          } catch {
            Alert.alert('Lỗi', 'Không thể từ chối tài khoản');
          }
        })
      : Alert.alert('Từ chối', `Từ chối cấp quyền cho ${user.email}?`, [
          { text: 'Hủy', style: 'cancel' },
          {
            text: 'Từ chối',
            style: 'destructive',
            onPress: async () => {
              try {
                await apiRejectUser(user.id, 'Thông tin chưa hợp lệ');
                loadData();
              } catch {
                Alert.alert('Lỗi', 'Thao tác thất bại');
              }
            },
          },
        ]);
  };

  const handleToggleActive = async (u) => {
    try {
      await apiToggleUserActive(u.id);
      setUsers((prev) =>
        prev.map((item) => (item.id === u.id ? { ...item, isActive: !item.isActive } : item))
      );
      Alert.alert('Thành công', `Đã ${u.isActive ? 'khóa' : 'mở khóa'} tài khoản ${u.email}`);
    } catch {
      Alert.alert('Lỗi', 'Không thể cập nhật trạng thái tài khoản');
    }
  };

  const handleChangeRole = (u) => {
    const nextRole = u.role === 'ADMIN' ? 'USER' : 'ADMIN';
    Alert.alert('Đổi vai trò', `Chuyển vai trò của ${u.fullName || u.email} thành ${nextRole}?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đồng ý',
        onPress: async () => {
          try {
            await apiUpdateUserRole(u.id, nextRole);
            setUsers((prev) =>
              prev.map((item) => (item.id === u.id ? { ...item, role: nextRole } : item))
            );
            Alert.alert('Thành công', 'Đã cập nhật vai trò');
          } catch {
            Alert.alert('Lỗi', 'Không thể đổi vai trò');
          }
        },
      },
    ]);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu mới tối thiểu 6 ký tự');
      return;
    }
    setSubmittingReset(true);
    try {
      await apiAdminResetPassword(targetUser.id, newPassword);
      Alert.alert('Thành công', `Đã đặt lại mật khẩu cho ${targetUser.email}`);
      setResetModalOpen(false);
      setNewPassword('');
    } catch {
      Alert.alert('Lỗi', 'Không thể đặt lại mật khẩu');
    } finally {
      setSubmittingReset(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const match =
      userSearch.trim() === '' ||
      (u.fullName && u.fullName.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase()));
    return match;
  });

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.adminBanner}>
        <View style={styles.shieldBadge}>
          <Feather name="shield" size={18} color="#dc2626" />
          <Text style={styles.shieldText}>TRUNG TÂM QUẢN TRỊ ADMIN TOÀN HỆ THỐNG</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsRow}>
        {ADMIN_TABS.map((t) => {
          const active = activeTab === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              style={[styles.tabBtn, active && styles.tabBtnActive]}
              onPress={() => setActiveTab(t.id)}
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

      {/* Content */}
      {loading ? (
        <View style={styles.centerLoading}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải trung tâm quản trị...</Text>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
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
              <Text style={styles.sectionHeaderTitle}>Chỉ số Toàn Tỉnh Lâm Đồng</Text>

              <View style={styles.kpiGrid}>
                <View style={styles.kpiCard}>
                  <View style={[styles.kpiIconWrap, { backgroundColor: '#e0e7ff' }]}>
                    <Feather name="users" size={20} color="#4338ca" />
                  </View>
                  <Text style={styles.kpiNum}>{stats?.totalUsers || stats?.usersCount || 0}</Text>
                  <Text style={styles.kpiLabel}>Người dùng đăng ký</Text>
                </View>

                <View style={styles.kpiCard}>
                  <View style={[styles.kpiIconWrap, { backgroundColor: '#dcfce7' }]}>
                    <Feather name="home" size={20} color="#15803d" />
                  </View>
                  <Text style={styles.kpiNum}>{stats?.totalFarms || stats?.farmsCount || 0}</Text>
                  <Text style={styles.kpiLabel}>Nông hộ & Trang trại</Text>
                </View>

                <View style={styles.kpiCard}>
                  <View style={[styles.kpiIconWrap, { backgroundColor: '#fef3c7' }]}>
                    <Feather name="calendar" size={20} color="#b45309" />
                  </View>
                  <Text style={styles.kpiNum}>{stats?.totalSeasons || stats?.seasonsCount || 0}</Text>
                  <Text style={styles.kpiLabel}>Vụ mùa canh tác</Text>
                </View>

                <View style={styles.kpiCard}>
                  <View style={[styles.kpiIconWrap, { backgroundColor: '#f3e8ff' }]}>
                    <Feather name="edit-3" size={20} color="#7e22ce" />
                  </View>
                  <Text style={styles.kpiNum}>{stats?.totalLogs || stats?.logsCount || 0}</Text>
                  <Text style={styles.kpiLabel}>Nhật ký đồng áng</Text>
                </View>
              </View>

              <View style={styles.infoBox}>
                <Feather name="check-circle" size={20} color="#16a34a" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: COLORS.text }}>Hệ thống vận hành ổn định</Text>
                  <Text style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 2 }}>
                    Cơ sở dữ liệu đám mây đồng bộ hai chiều thời gian thực giữa Web Portal và Ứng dụng Di động.
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}

          {/* TAB 2: USERS & APPROVALS */}
          {activeTab === 'users' && (
            <View style={{ flex: 1, padding: 12 }}>
              {/* Pending Approvals Section */}
              {pendingUsers.length > 0 && (
                <View style={styles.pendingSection}>
                  <View style={styles.pendingHeader}>
                    <Feather name="alert-circle" size={16} color="#b45309" />
                    <Text style={styles.pendingTitle}>
                      Tài khoản chờ duyệt ({pendingUsers.length})
                    </Text>
                  </View>

                  {pendingUsers.map((pu) => (
                    <View key={pu.id} style={styles.pendingCard}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.pendingName}>{pu.fullName || pu.email}</Text>
                        <Text style={styles.pendingEmail}>{pu.email}</Text>
                        {pu.phone ? <Text style={styles.pendingPhone}>SĐT: {pu.phone}</Text> : null}
                      </View>
                      <View style={styles.pendingActions}>
                        <TouchableOpacity
                          style={styles.approveBtn}
                          onPress={() => handleApprove(pu)}
                        >
                          <Feather name="check" size={14} color={COLORS.white} />
                          <Text style={styles.approveBtnText}>Duyệt</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.rejectBtn}
                          onPress={() => handleReject(pu)}
                        >
                          <Feather name="x" size={14} color="#dc2626" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Users search */}
              <View style={styles.searchBar}>
                <Feather name="search" size={16} color={COLORS.textMuted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Tìm tài khoản theo tên, email..."
                  value={userSearch}
                  onChangeText={setUserSearch}
                />
              </View>

              <FlatList
                data={filteredUsers}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingBottom: 40 }}
                renderItem={({ item }) => (
                  <View style={styles.userCard}>
                    <View style={styles.userTop}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.userName}>{item.fullName || 'Người dùng'}</Text>
                        <Text style={styles.userEmail}>{item.email}</Text>
                      </View>
                      <View
                        style={[
                          styles.roleBadge,
                          {
                            backgroundColor: item.role === 'ADMIN' ? '#fee2e2' : '#f1f5f9',
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.roleBadgeText,
                            { color: item.role === 'ADMIN' ? '#dc2626' : '#475569' },
                          ]}
                        >
                          {item.role || 'USER'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.userActionsRow}>
                      <TouchableOpacity
                        style={[
                          styles.statusToggleBtn,
                          { backgroundColor: item.isActive ? '#dcfce7' : '#fee2e2' },
                        ]}
                        onPress={() => handleToggleActive(item)}
                      >
                        <Feather
                          name={item.isActive ? 'check' : 'lock'}
                          size={12}
                          color={item.isActive ? '#15803d' : '#dc2626'}
                        />
                        <Text
                          style={{
                            fontSize: 11,
                            fontWeight: '700',
                            color: item.isActive ? '#15803d' : '#dc2626',
                          }}
                        >
                          {item.isActive ? 'Đang hoạt động' : 'Đã khóa'}
                        </Text>
                      </TouchableOpacity>

                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <TouchableOpacity
                          style={styles.textAction}
                          onPress={() => handleChangeRole(item)}
                        >
                          <Feather name="refresh-cw" size={13} color="#4338ca" />
                          <Text style={{ fontSize: 12, color: '#4338ca', fontWeight: '600' }}>
                            Đổi role
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.textAction}
                          onPress={() => {
                            setTargetUser(item);
                            setResetModalOpen(true);
                          }}
                        >
                          <Feather name="key" size={13} color={COLORS.primary} />
                          <Text style={{ fontSize: 12, color: COLORS.primary, fontWeight: '600' }}>
                            Reset MK
                          </Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                )}
              />
            </View>
          )}

          {/* TAB 3: ALL FARMS */}
          {activeTab === 'farms' && (
            <FlatList
              data={allFarms}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.scrollContent}
              renderItem={({ item }) => (
                <View style={styles.farmItemCard}>
                  <View style={styles.farmIcon}>
                    <Feather name="home" size={20} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.farmName}>{item.name}</Text>
                    <Text style={styles.farmAddress}>{item.address || 'Đà Lạt, Lâm Đồng'}</Text>
                    <Text style={styles.farmOwner}>
                      Chủ sở hữu: <Text style={{ fontWeight: '700' }}>{item.owner?.fullName || item.owner?.email || 'Nông dân'}</Text>
                    </Text>
                  </View>
                  <View style={styles.farmAreaBadge}>
                    <Text style={styles.farmAreaText}>{item.area || 0} ha</Text>
                  </View>
                </View>
              )}
            />
          )}

          {/* TAB 4: ALL LOGS */}
          {activeTab === 'logs' && (
            <FlatList
              data={allLogs}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={styles.scrollContent}
              renderItem={({ item }) => (
                <View style={styles.logCard}>
                  <View style={styles.logTop}>
                    <Text style={styles.logActivity}>{item.activityType || 'Canh tác'}</Text>
                    <Text style={styles.logDate}>
                      {item.date ? new Date(item.date).toLocaleDateString('vi-VN') : 'Hôm nay'}
                    </Text>
                  </View>
                  <Text style={styles.logFarmName}>
                    Vườn: {item.cropCycle?.plot?.farm?.name || item.farmName || 'Nông trại Lâm Đồng'}
                  </Text>
                  {item.notes ? <Text style={styles.logNotes} numberOfLines={2}>{item.notes}</Text> : null}
                </View>
              )}
            />
          )}
        </View>
      )}

      {/* Modal Reset Password */}
      <Modal visible={resetModalOpen} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đặt lại mật khẩu</Text>
              <TouchableOpacity onPress={() => setResetModalOpen(false)}>
                <Feather name="x" size={22} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 16 }}>
              <Text style={{ fontSize: 13, color: COLORS.textMuted, marginBottom: 12 }}>
                Đặt mật khẩu mới cho tài khoản: <Text style={{ fontWeight: '700' }}>{targetUser?.email}</Text>
              </Text>

              <Text style={styles.formLabel}>Mật khẩu mới *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Nhập tối thiểu 6 ký tự..."
                secureTextEntry
                value={newPassword}
                onChangeText={setNewPassword}
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setResetModalOpen(false)}
              >
                <Text style={styles.modalCancelText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleResetPassword}
                disabled={submittingReset}
              >
                {submittingReset ? (
                  <ActivityIndicator color={COLORS.white} />
                ) : (
                  <Text style={styles.modalSubmitText}>Xác nhận</Text>
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
  adminBanner: {
    backgroundColor: '#fef2f2',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#fecaca',
  },
  shieldBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shieldText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
    letterSpacing: 0.5,
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
    fontSize: 11,
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
  scrollContent: {
    padding: 14,
    paddingBottom: 40,
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kpiIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  kpiNum: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.text,
  },
  kpiLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#bbf7d0',
    gap: 12,
    alignItems: 'center',
  },
  pendingSection: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: 14,
  },
  pendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  pendingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#b45309',
  },
  pendingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    padding: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  pendingName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  pendingEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  pendingPhone: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  pendingActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  approveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#16a34a',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  approveBtnText: {
    color: COLORS.white,
    fontSize: 11,
    fontWeight: '700',
  },
  rejectBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#fee2e2',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    marginLeft: 8,
  },
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  userTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  userActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: 8,
    marginTop: 8,
  },
  statusToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  textAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  farmItemCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    gap: 12,
  },
  farmIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  farmName: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  farmAddress: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  farmOwner: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  farmAreaBadge: {
    backgroundColor: '#ecfeff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  farmAreaText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0891b2',
  },
  logCard: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  logTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logActivity: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  logDate: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  logFarmName: {
    fontSize: 12,
    color: COLORS.text,
    fontWeight: '600',
  },
  logNotes: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
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
    fontSize: 16,
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
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f1f5f9',
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  modalSubmitBtn: {
    flex: 2,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: COLORS.primary,
  },
  modalSubmitText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.white,
  },
});
