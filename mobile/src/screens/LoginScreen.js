import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';
import { Feather } from '@expo/vector-icons';
import { api, API_URL, PROD_API_URL, apiRegister } from '../services/api';

export default function LoginScreen({ navigation }) {
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isProdServer, setIsProdServer] = useState(false);
  const { login } = useAuth();

  const handleAction = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập đầy đủ Email và Mật khẩu');
      return;
    }

    setLoading(true);

    if (isRegisterMode) {
      if (!fullName.trim()) {
        Alert.alert('Thông báo', 'Vui lòng nhập Họ và tên');
        setLoading(false);
        return;
      }
      try {
        await apiRegister({
          fullName: fullName.trim(),
          email: email.trim(),
          password,
          phone: phone.trim() || undefined,
        });
        Alert.alert('Thành công', 'Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.');
        setIsRegisterMode(false);
      } catch (err) {
        Alert.alert('Đăng ký thất bại', err.response?.data?.message || 'Không thể tạo tài khoản');
      } finally {
        setLoading(false);
      }
    } else {
      const result = await login(email.trim(), password);
      setLoading(false);

      if (!result.success) {
        Alert.alert('Đăng nhập thất bại', result.message);
      }
    }
  };

  const toggleServer = () => {
    const nextProd = !isProdServer;
    setIsProdServer(nextProd);
    api.defaults.baseURL = nextProd ? PROD_API_URL : API_URL;
    Alert.alert(
      'Đổi máy chủ',
      `Đã chuyển sang kết nối: ${nextProd ? 'Cloud Render (Production)' : 'Local PC (' + API_URL + ')'}`
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Logo & Header */}
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Feather name="feather" size={36} color={COLORS.white} />
          </View>
          <Text style={styles.appName}>DalatAgri</Text>
          <Text style={styles.appSubtitle}>Hệ thống Quản lý Nông nghiệp Thông minh</Text>
        </View>

        {/* Tab Switcher: Đăng nhập / Đăng ký */}
        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, !isRegisterMode && styles.modeTabActive]}
            onPress={() => setIsRegisterMode(false)}
          >
            <Text style={[styles.modeTabText, !isRegisterMode && styles.modeTabTextActive]}>
              Đăng nhập
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, isRegisterMode && styles.modeTabActive]}
            onPress={() => setIsRegisterMode(true)}
          >
            <Text style={[styles.modeTabText, isRegisterMode && styles.modeTabTextActive]}>
              Đăng ký mới
            </Text>
          </TouchableOpacity>
        </View>

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {isRegisterMode ? 'Đăng ký tài khoản Nông hộ' : 'Đăng nhập hệ thống'}
          </Text>

          {/* Full Name for register */}
          {isRegisterMode && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Họ và tên *</Text>
              <View style={styles.inputWrap}>
                <Feather name="user" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Ví dụ: Nguyễn Văn Nông"
                  placeholderTextColor={COLORS.textMuted}
                  value={fullName}
                  onChangeText={setFullName}
                />
              </View>
            </View>
          )}

          {/* Email input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email tài khoản *</Text>
            <View style={styles.inputWrap}>
              <Feather name="mail" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="nongdan@dalatagri.vn"
                placeholderTextColor={COLORS.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* Phone for register */}
          {isRegisterMode && (
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Số điện thoại</Text>
              <View style={styles.inputWrap}>
                <Feather name="phone" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="0912345678"
                  placeholderTextColor={COLORS.textMuted}
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          )}

          {/* Password input */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu *</Text>
            <View style={styles.inputWrap}>
              <Feather name="lock" size={18} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor={COLORS.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
          </View>

          {/* Forgot Password link */}
          {!isRegisterMode && (
            <TouchableOpacity
              style={{ alignSelf: 'flex-end', marginBottom: 16, marginTop: -4 }}
              onPress={() => navigation.navigate('ForgotPassword')}
              activeOpacity={0.7}
            >
              <Text style={{ fontSize: 13, color: COLORS.primary, fontWeight: '600' }}>
                Quên mật khẩu?
              </Text>
            </TouchableOpacity>
          )}

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.loginBtn, loading && styles.btnDisabled]}
            onPress={handleAction}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Text style={styles.loginBtnText}>
                  {isRegisterMode ? 'Hoàn tất Đăng ký' : 'Đăng nhập'}
                </Text>
                <Feather name="arrow-right" size={18} color={COLORS.white} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Server Switch Hint */}
        <TouchableOpacity style={styles.serverCard} onPress={toggleServer}>
          <Feather
            name={isProdServer ? 'cloud' : 'hard-drive'}
            size={18}
            color={COLORS.primary}
          />
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.serverTitle}>
              Máy chủ: {isProdServer ? 'Cloud Render (Production)' : 'Mạng nội bộ LAN'}
            </Text>
            <Text style={styles.serverSub} numberOfLines={1}>
              {isProdServer ? PROD_API_URL : API_URL}
            </Text>
          </View>
          <Feather name="repeat" size={16} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logoBadge: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  appName: {
    fontSize: 26,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  appSubtitle: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#e2e8f0',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: COLORS.white,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  modeTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  modeTabTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
  },
  loginBtn: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  loginBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
  serverCard: {
    marginTop: 20,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  serverTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.text,
  },
  serverSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
