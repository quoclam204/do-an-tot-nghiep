import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';
import {
  IconCheckCircle,
  IconHome,
  IconWarehouse,
  IconCalendar,
  IconClipboardList,
  IconPenLine,
  IconShoppingBag,
  IconSprout,
  IconPackage,
  IconFlask,
  IconDollarSign,
  IconWifiOff,
  IconTrendingUp,
  IconShield,
} from '../components/icons';
import { apiGetLogs, apiGetSeasons, apiGetMyFarms } from '../services/api';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const [logsCount, setLogsCount] = useState(0);
  const [seasonsCount, setSeasonsCount] = useState(0);
  const [farmsCount, setFarmsCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadOverview = async () => {
    try {
      const [logs, seasons, farms] = await Promise.all([
        apiGetLogs().catch(() => []),
        apiGetSeasons().catch(() => []),
        apiGetMyFarms().catch(() => []),
      ]);
      setLogsCount(Array.isArray(logs) ? logs.length : 0);
      setSeasonsCount(Array.isArray(seasons) ? seasons.length : 0);
      setFarmsCount(Array.isArray(farms) ? farms.length : 0);
    } catch (e) {
      console.warn('Lỗi tải overview:', e);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOverview();
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.primary]} />}
    >
      {/* Welcome Banner */}
      <View style={styles.welcomeCard}>
        <View style={styles.badge}>
          <IconCheckCircle size={13} color={COLORS.primary} />
          <Text style={styles.badgeText}>SỔ TAY NÔNG DÂN ĐIỆN TỬ</Text>
        </View>
        <Text style={styles.greeting}>Xin chào, {user?.fullName || 'Bác nông dân'}!</Text>
        <Text style={styles.greetingSub}>
          Chào mừng đến với DalatAgri Mobile. Mọi dữ liệu đều được đồng bộ tự động với bảng Web.
        </Text>
      </View>

      {/* KPI Stats Grid */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.primaryLight }]}>
            <IconWarehouse size={18} color={COLORS.primary} />
          </View>
          <Text style={styles.statNumber}>{farmsCount}</Text>
          <Text style={styles.statLabel}>Khu vườn</Text>
        </View>

        <View style={styles.statBox}>
          <View style={[styles.statIcon, { backgroundColor: '#e0e7ff' }]}>
            <IconCalendar size={18} color="#4338ca" />
          </View>
          <Text style={styles.statNumber}>{seasonsCount}</Text>
          <Text style={styles.statLabel}>Vụ mùa</Text>
        </View>

        <View style={styles.statBox}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.secondaryLight }]}>
            <IconClipboardList size={18} color={COLORS.secondary} />
          </View>
          <Text style={styles.statNumber}>{logsCount}</Text>
          <Text style={styles.statLabel}>Nhật ký</Text>
        </View>
      </View>

      {/* Full Suite of Modules (Matching Web Portal) */}
      <Text style={styles.sectionTitle}>Danh mục chức năng nông trại</Text>

      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('FarmingLogs')}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#dcfce7' }]}>
            <IconPenLine size={22} color="#15803d" />
          </View>
          <Text style={styles.actionTitle}>Nhật ký canh tác</Text>
          <Text style={styles.actionDesc}>Ghi chép công việc đồng áng</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Harvest')}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#fef3c7' }]}>
            <IconShoppingBag size={22} color="#b45309" />
          </View>
          <Text style={styles.actionTitle}>Thu hoạch nhanh</Text>
          <Text style={styles.actionDesc}>Cân đo kg & tính tiền tại vườn</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Seasons')}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#e0e7ff' }]}>
            <IconCalendar size={22} color="#4338ca" />
          </View>
          <Text style={styles.actionTitle}>Quản lý Mùa vụ</Text>
          <Text style={styles.actionDesc}>Chu kỳ sinh trưởng cây trồng</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Farms')}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#f0fdf4' }]}>
            <IconWarehouse size={22} color="#16a34a" />
          </View>
          <Text style={styles.actionTitle}>Nông trại & Lô đất</Text>
          <Text style={styles.actionDesc}>Quản lý diện tích và vườn tược</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Crops')}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#ecfeff' }]}>
            <IconSprout size={22} color="#0891b2" />
          </View>
          <Text style={styles.actionTitle}>Giống Cây trồng</Text>
          <Text style={styles.actionDesc}>Danh mục cây Đà Lạt & ngày lớn</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Inventory')}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#f3e8ff' }]}>
            <IconPackage size={22} color="#7e22ce" />
          </View>
          <Text style={styles.actionTitle}>Kho Vật tư</Text>
          <Text style={styles.actionDesc}>Tồn phân bón & thuốc BVTV</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Materials')}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#fef9c3' }]}>
            <IconFlask size={22} color="#a16207" />
          </View>
          <Text style={styles.actionTitle}>Danh mục Vật tư</Text>
          <Text style={styles.actionDesc}>Phân thuốc, hoạt chất & PHI</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Sales')}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#dbeafe' }]}>
            <IconDollarSign size={22} color="#1d4ed8" />
          </View>
          <Text style={styles.actionTitle}>Bán hàng & Hóa đơn</Text>
          <Text style={styles.actionDesc}>Xuất bán nông sản, đại lý</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('OfflineSync')}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#e2e8f0' }]}>
            <IconWifiOff size={22} color="#475569" />
          </View>
          <Text style={styles.actionTitle}>Nhật ký Ngoại tuyến</Text>
          <Text style={styles.actionDesc}>Ghi ngoài rẫy & đồng bộ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionCard}
          onPress={() => navigation.navigate('Reports')}
          activeOpacity={0.7}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#fee2e2' }]}>
            <IconTrendingUp size={22} color="#dc2626" />
          </View>
          <Text style={styles.actionTitle}>Báo cáo Tài chính</Text>
          <Text style={styles.actionDesc}>Lợi nhuận ròng, vốn & doanh thu</Text>
        </TouchableOpacity>

        {user?.role === 'ADMIN' && (
          <TouchableOpacity
            style={[styles.actionCard, { borderColor: '#fca5a5', borderWidth: 1.5 }]}
            onPress={() => navigation.navigate('Admin')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconWrap, { backgroundColor: '#fee2e2' }]}>
              <IconShield size={22} color="#dc2626" />
            </View>
            <Text style={[styles.actionTitle, { color: '#dc2626' }]}>Quản trị Hệ thống</Text>
            <Text style={styles.actionDesc}>Duyệt tài khoản, nông hộ toàn tỉnh</Text>
          </TouchableOpacity>
        )}
      </View>
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
  welcomeCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: COLORS.primaryLight,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginBottom: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  greetingSub: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 14,
  },
});
