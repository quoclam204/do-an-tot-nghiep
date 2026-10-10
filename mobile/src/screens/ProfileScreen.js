import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';
import { Feather } from '@expo/vector-icons';
import {
  IconWarehouse,
  IconSprout,
  IconPackage,
  IconFlask,
  IconDollarSign,
  IconWifiOff,
  IconPieChart,
  IconShield,
  IconSmartphone,
  IconServer,
  IconCloud,
  IconLogOut,
  IconPenLine,
  IconPhone,
  IconChevronRight,
} from '../components/icons';
import {
  API_URL,
  PROD_API_URL,
  apiUpdateMe,
  apiGetAllUsers,
  apiUpdateUserRole,
  apiToggleUserActive,
} from '../services/api';

export default function ProfileScreen({ navigation }) {
  const { user, logout, updateUser } = useAuth();

  // Edit Profile Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);

  // Admin Users Management Modal
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Sync state if user changes
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Lỗi', 'Họ và tên không được để trống');
      return;
    }
    setSavingProfile(true);
    try {
      const updated = await apiUpdateMe({
        fullName: fullName.trim(),
        phone: phone.trim(),
      });
      if (updateUser) {
        updateUser({ ...user, ...updated });
      }
      setEditModalOpen(false);
      Alert.alert('Thành công', 'Đã cập nhật thông tin cá nhân!');
    } catch (e) {
      Alert.alert('Lỗi', e.response?.data?.message || 'Không thể cập nhật hồ sơ');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleOpenAdmin = async () => {
    setAdminModalOpen(true);
    setLoadingUsers(true);
    try {
      const list = await apiGetAllUsers();
      setUsersList(Array.isArray(list) ? list : []);
    } catch (e) {
      console.warn('Lỗi lấy danh sách users:', e);
      Alert.alert('Lỗi', 'Không thể lấy danh sách người dùng');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleToggleUserActive = async (targetUser) => {
    try {
      await apiToggleUserActive(targetUser.id);
      setUsersList((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, isActive: !u.isActive } : u))
      );
      Alert.alert('Thành công', `Đã cập nhật trạng thái tài khoản ${targetUser.email}`);
    } catch (e) {
      Alert.alert('Lỗi', 'Không thể cập nhật tài khoản');
    }
  };

  const handleChangeRole = (targetUser) => {
    const nextRole = targetUser.role === 'ADMIN' ? 'USER' : 'ADMIN';
    Alert.alert(
      'Đổi vai trò',
      `Bạn có muốn chuyển vai trò của ${targetUser.fullName || targetUser.email} thành ${nextRole}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Đồng ý',
          onPress: async () => {
            try {
              await apiUpdateUserRole(targetUser.id, nextRole);
              setUsersList((prev) =>
                prev.map((u) => (u.id === targetUser.id ? { ...u, role: nextRole } : u))
              );
              Alert.alert('Thành công', 'Đã thay đổi quyền tài khoản');
            } catch (err) {
              Alert.alert('Lỗi', 'Không thể đổi quyền');
            }
          },
        },
      ]
    );
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc chắn muốn đăng xuất khỏi DalatAgri?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: logout,
      },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Profile Card */}
      <View style={styles.userCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(user?.fullName || user?.email || 'N')[0].toUpperCase()}
          </Text>
        </View>
        <Text style={styles.name}>{user?.fullName || 'Người dùng DalatAgri'}</Text>
        <Text style={styles.email}>{user?.email || 'nongdan@dalatagri.vn'}</Text>

        {user?.phone ? (
          <Text style={styles.phoneText}>
            <Feather name="phone" size={12} color={COLORS.textSecondary} /> {user.phone}
          </Text>
        ) : null}

        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>
            {user?.role === 'ADMIN' ? 'QUẢN TRỊ VIÊN HỆ THỐNG' : 'CHỦ NÔNG HỘ'}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.editProfileBtn}
          onPress={() => setEditModalOpen(true)}
        >
          <Feather name="edit-2" size={14} color={COLORS.primary} />
          <Text style={styles.editProfileBtnText}>Chỉnh sửa thông tin</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Navigation to System Modules */}
      <View style={styles.menuCard}>
        <Text style={styles.sectionTitle}>Chức năng Quản lý</Text>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Farms')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#f0fdf4' }]}>
            <IconWarehouse size={18} color={COLORS.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuItemTitle}>Nông trại & Thửa đất</Text>
            <Text style={styles.menuItemSub}>Quản lý vườn tược, diện tích và thành viên</Text>
          </View>
          <IconChevronRight size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Crops')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#eff6ff' }]}>
            <IconSprout size={18} color="#2563eb" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuItemTitle}>Danh mục Cây trồng</Text>
            <Text style={styles.menuItemSub}>Giống cây & Chu kỳ nông nghiệp Đà Lạt</Text>
          </View>
          <IconChevronRight size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Inventory')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#fef3c7' }]}>
            <IconPackage size={18} color="#d97706" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuItemTitle}>Kho vật tư & Phân thuốc</Text>
            <Text style={styles.menuItemSub}>Quản lý tồn kho và cảnh báo thiếu hụt</Text>
          </View>
          <IconChevronRight size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Materials')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#fef9c3' }]}>
            <IconFlask size={18} color="#a16207" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuItemTitle}>Danh mục Vật tư & Hoạt chất</Text>
            <Text style={styles.menuItemSub}>Phân bón, thuốc BVTV, cách ly PHI & quy cách</Text>
          </View>
          <IconChevronRight size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Sales')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#dbeafe' }]}>
            <IconDollarSign size={18} color="#1d4ed8" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuItemTitle}>Bán hàng & Hóa đơn</Text>
            <Text style={styles.menuItemSub}>Quản lý sản phẩm bán, đơn hàng & đại lý thu mua</Text>
          </View>
          <IconChevronRight size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('OfflineSync')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#e2e8f0' }]}>
            <IconWifiOff size={18} color="#475569" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuItemTitle}>Nhật ký Ngoại tuyến & Đồng bộ</Text>
            <Text style={styles.menuItemSub}>Ghi chép ngoài vườn khi mất sóng & đẩy dữ liệu</Text>
          </View>
          <IconChevronRight size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Reports')}
        >
          <View style={[styles.menuIcon, { backgroundColor: '#f5f3ff' }]}>
            <IconPieChart size={18} color="#7c3aed" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.menuItemTitle}>Báo cáo kinh tế & Tài chính</Text>
            <Text style={styles.menuItemSub}>Doanh thu, chi phí, lợi nhuận ròng & ROI</Text>
          </View>
          <IconChevronRight size={18} color={COLORS.textMuted} />
        </TouchableOpacity>

        {user?.role === 'ADMIN' && (
          <TouchableOpacity
            style={[styles.menuItem, { borderBottomWidth: 0 }]}
            onPress={() => navigation.navigate('Admin')}
          >
            <View style={[styles.menuIcon, { backgroundColor: '#fee2e2' }]}>
              <IconShield size={18} color="#dc2626" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuItemTitle, { color: '#dc2626' }]}>Trung tâm Quản trị Admin</Text>
              <Text style={styles.menuItemSub}>Duyệt tài khoản, giám sát nông trại & nhật ký toàn tỉnh</Text>
            </View>
            <IconChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* App & System Info */}
      <View style={styles.infoCard}>
        <Text style={styles.sectionTitle}>Thông tin ứng dụng</Text>

        <View style={styles.infoRow}>
          <IconSmartphone size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoLabel}>Phiên bản:</Text>
          <Text style={styles.infoVal}>DalatAgri Mobile v1.0.0 (Expo SDK 52)</Text>
        </View>

        <View style={styles.infoRow}>
          <IconServer size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoLabel}>Máy chủ API:</Text>
          <Text style={styles.infoVal} numberOfLines={1}>
            {API_URL}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <IconCloud size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoLabel}>Đám mây Render:</Text>
          <Text style={styles.infoVal} numberOfLines={1}>
            {PROD_API_URL}
          </Text>
        </View>
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
        <IconLogOut size={18} color={COLORS.danger} />
        <Text style={styles.logoutText}>Đăng xuất tài khoản</Text>
      </TouchableOpacity>

      <View style={{ height: 40 }} />

      {/* Modal Chỉnh Sửa Hồ Sơ */}
      <Modal visible={editModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
              <TouchableOpacity onPress={() => setEditModalOpen(false)}>
                <Feather name="x" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.formLabel}>Họ và tên *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Nguyễn Văn A"
            />

            <Text style={styles.formLabel}>Số điện thoại liên hệ</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="0912345678"
              keyboardType="phone-pad"
            />

            <Text style={styles.formLabel}>Email tài khoản (Không thể đổi)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: '#f1f5f9', color: COLORS.textMuted }]}
              value={user?.email || ''}
              editable={false}
            />

            <TouchableOpacity
              style={[styles.submitBtn, savingProfile && styles.btnDisabled]}
              onPress={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.submitBtnText}>Lưu thông tin</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Quản Trị Người Dùng (Admin) */}
      <Modal visible={adminModalOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quản lý tài khoản (Admin)</Text>
              <TouchableOpacity onPress={() => setAdminModalOpen(false)}>
                <Feather name="x" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            {loadingUsers ? (
              <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ marginTop: 8, color: COLORS.textSecondary }}>Đang tải danh sách...</Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false}>
                {usersList.map((u) => (
                  <View key={u.id} style={styles.adminUserCard}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.adminUserName}>{u.fullName || 'Người dùng'}</Text>
                      <Text style={styles.adminUserEmail}>{u.email}</Text>
                      <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                        <View style={[styles.badgeSmall, u.role === 'ADMIN' ? styles.badgeAdmin : styles.badgeUser]}>
                          <Text style={styles.badgeSmallText}>{u.role}</Text>
                        </View>
                        <View style={[styles.badgeSmall, u.isActive !== false ? styles.badgeActive : styles.badgeInactive]}>
                          <Text style={styles.badgeSmallText}>{u.isActive !== false ? 'Hoạt động' : 'Đã khóa'}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.adminUserActions}>
                      <TouchableOpacity
                        style={styles.btnAdminAction}
                        onPress={() => handleChangeRole(u)}
                      >
                        <Feather name="shield" size={14} color={COLORS.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.btnAdminAction, { borderColor: u.isActive !== false ? COLORS.danger : COLORS.primary }]}
                        onPress={() => handleToggleUserActive(u)}
                      >
                        <Feather
                          name={u.isActive !== false ? 'lock' : 'unlock'}
                          size={14}
                          color={u.isActive !== false ? COLORS.danger : COLORS.primary}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: 16,
  },
  userCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.primary,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  email: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  phoneText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  roleBadge: {
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginTop: 8,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  editProfileBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
  },
  menuCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    gap: 12,
  },
  menuIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  menuItemSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  infoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#fee2e2',
    height: 48,
    borderRadius: 12,
  },
  logoutText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: '700',
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
  adminUserCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  adminUserName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  adminUserEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  badgeSmall: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeAdmin: {
    backgroundColor: '#fee2e2',
  },
  badgeUser: {
    backgroundColor: COLORS.primaryLight,
  },
  badgeActive: {
    backgroundColor: '#dcfce7',
  },
  badgeInactive: {
    backgroundColor: '#f1f5f9',
  },
  badgeSmallText: {
    fontSize: 10,
    fontWeight: '700',
  },
  adminUserActions: {
    flexDirection: 'row',
    gap: 6,
  },
  btnAdminAction: {
    width: 34,
    height: 34,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
