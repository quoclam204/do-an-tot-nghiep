import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { COLORS } from '../theme/colors';
import { Feather } from '@expo/vector-icons';
import {
  apiGetFinancialReport,
  apiGetSeasons,
  apiGetMyFarms,
  apiGetSeasonFinancialSummary,
} from '../services/api';

export default function ReportsScreen() {
  const [report, setReport] = useState(null);
  const [farms, setFarms] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState('');
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [fRes, sRes] = await Promise.allSettled([
        apiGetMyFarms(),
        apiGetSeasons(selectedFarmId || undefined),
      ]);

      if (fRes.status === 'fulfilled') {
        setFarms(Array.isArray(fRes.value) ? fRes.value : []);
      }
      if (sRes.status === 'fulfilled') {
        setSeasons(Array.isArray(sRes.value) ? sRes.value : []);
      }

      await fetchFinancials(selectedSeasonId, selectedFarmId);
    } catch (e) {
      console.warn('Lỗi tải báo cáo tổng hợp:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchFinancials = async (seasonId, farmId) => {
    try {
      if (seasonId) {
        const summary = await apiGetSeasonFinancialSummary(seasonId);
        setReport(summary || {});
      } else {
        const rep = await apiGetFinancialReport(farmId ? { farmId } : {});
        setReport(rep || {});
      }
    } catch (e) {
      console.warn('Lỗi tải số liệu tài chính:', e);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedFarmId, selectedSeasonId]);

  const handleSelectFarm = (farmId) => {
    setSelectedFarmId(farmId === selectedFarmId ? '' : farmId);
    setSelectedSeasonId('');
  };

  const handleSelectSeason = (seasonId) => {
    setSelectedSeasonId(seasonId === selectedSeasonId ? '' : seasonId);
  };

  // Metrics extraction
  const totalRevenue =
    Number(report?.summary?.totalRevenue || report?.totalRevenue || report?.revenue || 0);
  const totalCost =
    Number(report?.summary?.totalInvestment || report?.summary?.totalCost || report?.totalCost || report?.cost || 0);
  const materialCost =
    Number(report?.summary?.totalMaterialCost || report?.totalMaterialCost || Math.round(totalCost * 0.65));
  const laborCost =
    Number(report?.summary?.totalLaborCost || report?.totalLaborCost || Math.round(totalCost * 0.25));
  const otherCost =
    Number(report?.summary?.totalOtherCost || report?.totalOtherCost || Math.max(0, totalCost - materialCost - laborCost));

  const netProfit = totalRevenue - totalCost;
  const roi = totalCost > 0 ? Math.round((netProfit / totalCost) * 100) : 0;
  const isProfit = netProfit >= 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
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
      <View style={styles.header}>
        <Text style={styles.title}>Báo Cáo Hiệu Quả Kinh Tế</Text>
        <Text style={styles.subtitle}>Phân tích chi phí vật tư, công cán, doanh thu & lợi nhuận</Text>
      </View>

      {/* Filter by Farm */}
      {farms.length > 0 && (
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionLabel}>Lọc theo Nông trại:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, selectedFarmId === '' && styles.filterChipActive]}
              onPress={() => handleSelectFarm('')}
            >
              <Text style={[styles.filterChipText, selectedFarmId === '' && styles.filterChipTextActive]}>
                Toàn hệ thống
              </Text>
            </TouchableOpacity>
            {farms.map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.filterChip, selectedFarmId === f.id && styles.filterChipActive]}
                onPress={() => handleSelectFarm(f.id)}
              >
                <Text style={[styles.filterChipText, selectedFarmId === f.id && styles.filterChipTextActive]}>
                  {f.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Filter by Season */}
      {seasons.length > 0 && (
        <View style={styles.filterSection}>
          <Text style={styles.filterSectionLabel}>Lọc theo Vụ mùa:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[styles.filterChip, selectedSeasonId === '' && styles.filterChipActive]}
              onPress={() => handleSelectSeason('')}
            >
              <Text style={[styles.filterChipText, selectedSeasonId === '' && styles.filterChipTextActive]}>
                Tất cả vụ
              </Text>
            </TouchableOpacity>
            {seasons.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={[styles.filterChip, selectedSeasonId === s.id && styles.filterChipActive]}
                onPress={() => handleSelectSeason(s.id)}
              >
                <Text style={[styles.filterChipText, selectedSeasonId === s.id && styles.filterChipTextActive]}>
                  {s.name || s.crop?.name || 'Vụ mùa'}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tổng hợp dữ liệu kế toán...</Text>
        </View>
      ) : (
        <>
          {/* Lợi nhuận ròng Hero Card */}
          <View style={[styles.heroCard, isProfit ? styles.heroCardProfit : styles.heroCardLoss]}>
            <View style={styles.heroTop}>
              <Text style={styles.heroLabel}>LỢI NHUẬN RÒNG NÔNG HỘ</Text>
              <View style={[styles.roiBadge, isProfit ? styles.roiProfit : styles.roiLoss]}>
                <Text style={styles.roiText}>ROI {roi}%</Text>
              </View>
            </View>
            <Text style={[styles.heroValue, { color: isProfit ? '#15803d' : COLORS.danger }]}>
              {isProfit ? '+' : ''}
              {netProfit.toLocaleString('vi-VN')} <Text style={styles.heroUnit}>VNĐ</Text>
            </Text>
            <Text style={styles.heroDesc}>
              {isProfit
                ? 'Nông trại đang sinh lời tốt sau khi khấu trừ chi phí phân bón, thuốc BVTV và nhân công.'
                : 'Đang trong giai đoạn đầu tư xuống giống, chờ đến kỳ thu hoạch.'}
            </Text>
          </View>

          {/* 2 Thẻ Doanh Thu & Vốn Đầu Tư */}
          <View style={styles.twoCol}>
            <View style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: '#ecfdf5' }]}>
                <Feather name="trending-up" size={18} color="#059669" />
              </View>
              <Text style={styles.kpiLabel}>Doanh Thu Bán Ra</Text>
              <Text style={styles.kpiValRevenue}>{totalRevenue.toLocaleString('vi-VN')}</Text>
              <Text style={styles.kpiUnit}>VNĐ</Text>
            </View>

            <View style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: '#fef2f2' }]}>
                <Feather name="trending-down" size={18} color="#dc2626" />
              </View>
              <Text style={styles.kpiLabel}>Tổng Chi Phí</Text>
              <Text style={styles.kpiValCost}>{totalCost.toLocaleString('vi-VN')}</Text>
              <Text style={styles.kpiUnit}>VNĐ</Text>
            </View>
          </View>

          {/* Chi tiết cơ cấu chi phí */}
          <View style={styles.breakdownCard}>
            <Text style={styles.breakdownTitle}>Cơ cấu chi phí vụ mùa</Text>

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.dot, { backgroundColor: '#10b981' }]} />
                <Text style={styles.breakdownItemName}>Vật tư (Phân bón & Thuốc BVTV)</Text>
              </View>
              <Text style={styles.breakdownVal}>
                {materialCost.toLocaleString('vi-VN')} đ
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.dot, { backgroundColor: '#3b82f6' }]} />
                <Text style={styles.breakdownItemName}>Nhân công & Chăm sóc</Text>
              </View>
              <Text style={styles.breakdownVal}>
                {laborCost.toLocaleString('vi-VN')} đ
              </Text>
            </View>

            <View style={styles.breakdownRow}>
              <View style={styles.breakdownLeft}>
                <View style={[styles.dot, { backgroundColor: '#f59e0b' }]} />
                <Text style={styles.breakdownItemName}>Khác (Điện nước, tưới tiêu, khấu hao)</Text>
              </View>
              <Text style={styles.breakdownVal}>
                {otherCost.toLocaleString('vi-VN')} đ
              </Text>
            </View>
          </View>

          {/* Khuyến nghị tối ưu hóa kinh tế */}
          <View style={styles.adviceCard}>
            <View style={styles.adviceHeader}>
              <Feather name="shield" size={16} color={COLORS.primary} />
              <Text style={styles.adviceTitle}>Khuyến nghị kỹ thuật & Kinh tế</Text>
            </View>
            <Text style={styles.adviceText}>
              • Tăng cường ủ phân hữu cơ vi sinh tại chỗ để giảm 20-30% chi phí phân vô cơ.{'\n'}
              • Quản lý phun thuốc BVTV theo ngưỡng dịch hại, tránh phun phòng định kỳ gây lãng phí chi phí thuốc.{'\n'}
              • Ghi chép nhật ký thu hoạch theo từng đợt để đánh giá chính xác phẩm cấp quả loại 1.
            </Text>
          </View>
        </>
      )}

      <View style={{ height: 40 }} />
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
    paddingBottom: 60,
  },
  header: {
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  filterSection: {
    marginBottom: 10,
  },
  filterSectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  filterScroll: {
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: 8,
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
    paddingVertical: 60,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  heroCard: {
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
    marginTop: 6,
  },
  heroCardProfit: {
    backgroundColor: '#f0fdf4',
    borderColor: '#86efac',
  },
  heroCardLoss: {
    backgroundColor: '#fff1f2',
    borderColor: '#fca5a5',
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  roiBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roiProfit: {
    backgroundColor: '#bbf7d0',
  },
  roiLoss: {
    backgroundColor: '#fecdd3',
  },
  roiText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.text,
  },
  heroValue: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 6,
  },
  heroUnit: {
    fontSize: 14,
    fontWeight: '600',
  },
  heroDesc: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  twoCol: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  kpiIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  kpiValRevenue: {
    fontSize: 17,
    fontWeight: '800',
    color: '#059669',
  },
  kpiValCost: {
    fontSize: 17,
    fontWeight: '800',
    color: '#dc2626',
  },
  kpiUnit: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },
  breakdownCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  breakdownTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 14,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  breakdownItemName: {
    fontSize: 13,
    color: COLORS.text,
  },
  breakdownVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.text,
  },
  adviceCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  adviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  adviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
  },
  adviceText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
});
