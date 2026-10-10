import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../theme/colors';
import { Feather } from '@expo/vector-icons';
import { apiCreateLog, apiGetSeasons } from '../services/api';

const STORAGE_KEY = 'dalat_agri_offline_logs';

const QUICK_ACTIVITIES = [
  'Bón phân',
  'Tưới nước',
  'Phun thuốc BVTV',
  'Làm cỏ & Vun gốc',
  'Thu hoạch',
  'Kiểm tra vườn',
];

export default function OfflineSyncScreen() {
  const [offlineLogs, setOfflineLogs] = useState([]);
  const [seasons, setSeasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Form Offline Ghi Nhanh
  const [activity, setActivity] = useState('Bón phân');
  const [selectedSeasonId, setSelectedSeasonId] = useState('');
  const [plotName, setPlotName] = useState('');
  const [materialName, setMaterialName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [cost, setCost] = useState('');
  const [notes, setNotes] = useState('');

  const loadOfflineData = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      const list = raw ? JSON.parse(raw) : [];
      setOfflineLogs(Array.isArray(list) ? list : []);

      // Try load seasons from cache or API
      const s = await apiGetSeasons().catch(() => []);
      if (Array.isArray(s) && s.length > 0) {
        setSeasons(s);
        if (!selectedSeasonId) setSelectedSeasonId(s[0].id);
      }
    } catch (e) {
      console.warn('Lỗi đọc dữ liệu offline:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOfflineData();
  }, []);

  const saveOfflineLog = async () => {
    if (!plotName.trim() && !notes.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập tên thửa đất hoặc ghi chú công việc');
      return;
    }

    const newLog = {
      id: 'local_' + Date.now(),
      activityType: activity,
      cropCycleId: selectedSeasonId || undefined,
      plotName: plotName.trim(),
      materialName: materialName.trim(),
      quantity: quantity.trim(),
      cost: Number(cost) || 0,
      notes: notes.trim(),
      createdAt: new Date().toISOString(),
      syncStatus: 'PENDING',
    };

    const updated = [newLog, ...offlineLogs];
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setOfflineLogs(updated);
      Alert.alert('Đã lưu ngoại tuyến', 'Nhật ký đã được lưu vào bộ nhớ máy điện thoại. Dữ liệu sẽ đồng bộ khi có sóng mạng.');
      // Reset form
      setPlotName('');
      setMaterialName('');
      setQuantity('');
      setCost('');
      setNotes('');
    } catch {
      Alert.alert('Lỗi', 'Không thể lưu nhật ký vào điện thoại');
    }
  };

  const handleSyncNow = async () => {
    if (offlineLogs.length === 0) {
      Alert.alert('Thông báo', 'Hàng đợi trống, không có nhật ký ngoại tuyến nào cần đồng bộ.');
      return;
    }

    setSyncing(true);
    let successCount = 0;
    const remaining = [];

    for (const item of offlineLogs) {
      try {
        await apiCreateLog({
          activityType: item.activityType,
          cropCycleId: item.cropCycleId,
          notes: `${item.plotName ? `[Lô: ${item.plotName}] ` : ''}${item.materialName ? `Vật tư: ${item.materialName} (${item.quantity}). ` : ''}${item.notes || ''}`,
          cost: item.cost,
          date: item.createdAt,
        });
        successCount++;
      } catch (e) {
        console.warn('Đồng bộ thất bại 1 mục:', e);
        remaining.push(item);
      }
    }

    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
      setOfflineLogs(remaining);
      Alert.alert(
        'Kết quả đồng bộ',
        `Đã đồng bộ thành công ${successCount} nhật ký lên máy chủ!${remaining.length > 0 ? ` Còn lại ${remaining.length} mục sẽ thử lại sau.` : ''}`
      );
    } catch (e) {
      console.warn('Lỗi lưu lại trạng thái hàng đợi:', e);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearAll = () => {
    Alert.alert('Xóa hàng đợi', 'Bạn có chắc chắn muốn xóa tất cả bản ghi ngoại tuyến chưa đồng bộ?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa hết',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setOfflineLogs([]);
        },
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Status banner */}
      <View style={styles.statusBar}>
        <View style={styles.statusLeft}>
          <View style={styles.onlineDot} />
          <View>
            <Text style={styles.statusTitle}>Chế độ Nhật ký Ngoại tuyến (Offline-First)</Text>
            <Text style={styles.statusSub}>
              Hàng đợi chờ đồng bộ:{' '}
              <Text style={{ fontWeight: '800', color: COLORS.text }}>{offlineLogs.length} bản ghi</Text>
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.syncBtn, (syncing || offlineLogs.length === 0) && { opacity: 0.6 }]}
          onPress={handleSyncNow}
          disabled={syncing || offlineLogs.length === 0}
          activeOpacity={0.8}
        >
          {syncing ? (
            <ActivityIndicator color={COLORS.white} size="small" />
          ) : (
            <>
              <Feather name="refresh-cw" size={14} color={COLORS.white} />
              <Text style={styles.syncBtnText}>Đồng bộ ngay</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Ghi chép ngoại tuyến form */}
      <View style={styles.formCard}>
        <Text style={styles.formCardTitle}>Ghi chép nhanh tại vườn (Không cần mạng)</Text>

        <Text style={styles.formLabel}>Loại hoạt động canh tác</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
          {QUICK_ACTIVITIES.map((act) => (
            <TouchableOpacity
              key={act}
              style={[styles.actChip, activity === act && styles.actChipActive]}
              onPress={() => setActivity(act)}
            >
              <Text style={[styles.actChipText, activity === act && styles.actChipTextActive]}>
                {act}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.formLabel}>Thửa đất / Vườn</Text>
        <TextInput
          style={styles.input}
          placeholder="VD: Lô 1 Cà phê, Vườn dâu tây đồi A..."
          value={plotName}
          onChangeText={setPlotName}
        />

        <View style={styles.twoCol}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.formLabel}>Tên vật tư / phân thuốc</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: NPK, Ridomil..."
              value={materialName}
              onChangeText={setMaterialName}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.formLabel}>Số lượng</Text>
            <TextInput
              style={styles.input}
              placeholder="VD: 2 bao, 5 chai..."
              value={quantity}
              onChangeText={setQuantity}
            />
          </View>
        </View>

        <Text style={styles.formLabel}>Chi phí phát sinh (nếu có - VNĐ)</Text>
        <TextInput
          style={styles.input}
          placeholder="VD: 150000"
          keyboardType="numeric"
          value={cost}
          onChangeText={setCost}
        />

        <Text style={styles.formLabel}>Ghi chú chi tiết</Text>
        <TextInput
          style={[styles.input, { height: 60 }]}
          placeholder="Ghi chú thời tiết, tình hình sâu bệnh..."
          multiline
          value={notes}
          onChangeText={setNotes}
        />

        <TouchableOpacity style={styles.saveOfflineBtn} onPress={saveOfflineLog} activeOpacity={0.8}>
          <Feather name="save" size={16} color={COLORS.white} />
          <Text style={styles.saveOfflineBtnText}>Lưu vào điện thoại</Text>
        </TouchableOpacity>
      </View>

      {/* Queue items list */}
      <View style={styles.queueHeader}>
        <Text style={styles.queueTitle}>Hàng đợi nhật ký chưa đồng bộ</Text>
        {offlineLogs.length > 0 && (
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '700' }}>Xóa tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 20 }} />
      ) : offlineLogs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Feather name="check-circle" size={36} color="#16a34a" />
          <Text style={styles.emptyTitle}>Tất cả dữ liệu đã được đồng bộ</Text>
          <Text style={styles.emptySub}>
            Không có nhật ký nào tồn đọng trong bộ nhớ ngoại tuyến của máy.
          </Text>
        </View>
      ) : (
        offlineLogs.map((item) => (
          <View key={item.id} style={styles.queueItem}>
            <View style={styles.queueItemTop}>
              <Text style={styles.queueItemAct}>{item.activityType}</Text>
              <View style={styles.pendingBadge}>
                <Feather name="clock" size={11} color="#b45309" />
                <Text style={styles.pendingBadgeText}>Chờ đồng bộ</Text>
              </View>
            </View>

            {item.plotName ? (
              <Text style={styles.queueItemSub}>Vườn: {item.plotName}</Text>
            ) : null}
            {item.materialName ? (
              <Text style={styles.queueItemSub}>
                Vật tư: {item.materialName} ({item.quantity})
              </Text>
            ) : null}
            {item.notes ? (
              <Text style={styles.queueItemNote} numberOfLines={2}>
                {item.notes}
              </Text>
            ) : null}

            <Text style={styles.queueItemDate}>
              {new Date(item.createdAt).toLocaleString('vi-VN')}
            </Text>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 14,
    paddingBottom: 40,
    backgroundColor: COLORS.background,
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#16a34a',
  },
  statusTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.text,
  },
  statusSub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  syncBtnText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: COLORS.white,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  formCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 12,
  },
  formLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  actChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
    marginRight: 6,
  },
  actChipActive: {
    backgroundColor: COLORS.primary,
  },
  actChipText: {
    fontSize: 12,
    color: COLORS.textMuted,
    fontWeight: '600',
  },
  actChipTextActive: {
    color: COLORS.white,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: COLORS.text,
    marginBottom: 10,
  },
  twoCol: {
    flexDirection: 'row',
  },
  saveOfflineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 4,
  },
  saveOfflineBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  queueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  queueTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.text,
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.text,
    marginTop: 8,
  },
  emptySub: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 4,
  },
  queueItem: {
    backgroundColor: COLORS.white,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  queueItemTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  queueItemAct: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pendingBadgeText: {
    fontSize: 10,
    color: '#b45309',
    fontWeight: '700',
  },
  queueItemSub: {
    fontSize: 12,
    color: COLORS.text,
    marginTop: 2,
  },
  queueItemNote: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  queueItemDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 6,
  },
});
