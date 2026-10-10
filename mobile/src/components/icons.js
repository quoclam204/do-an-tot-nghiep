import React from 'react';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../theme/colors';

const defaultColor = COLORS.text || '#0f172a';

// ── Nông nghiệp & Thiên nhiên (Agri & Nature Icons) ──
export function IconSprout({ size = 20, color = defaultColor, style }) {
  return <MaterialCommunityIcons name="sprout" size={size} color={color} style={style} />;
}

export function IconLeaf({ size = 20, color = defaultColor, style }) {
  return <MaterialCommunityIcons name="leaf" size={size} color={color} style={style} />;
}

export function IconWarehouse({ size = 20, color = defaultColor, style }) {
  return <MaterialCommunityIcons name="warehouse" size={size} color={color} style={style} />;
}

export function IconFlask({ size = 20, color = defaultColor, style }) {
  return <MaterialCommunityIcons name="flask-outline" size={size} color={color} style={style} />;
}

export function IconSun({ size = 20, color = defaultColor, style }) {
  return <Feather name="sun" size={size} color={color} style={style} />;
}

export function IconMoon({ size = 20, color = defaultColor, style }) {
  return <Feather name="moon" size={size} color={color} style={style} />;
}

export function IconSunrise({ size = 20, color = defaultColor, style }) {
  return <Feather name="sunrise" size={size} color={color} style={style} />;
}

// ── Thao tác Cơ bản (CRUD & Actions) ──
export function IconPlus({ size = 20, color = defaultColor, style }) {
  return <Feather name="plus" size={size} color={color} style={style} />;
}

export function IconPenLine({ size = 20, color = defaultColor, style }) {
  return <Feather name="edit-3" size={size} color={color} style={style} />;
}

export function IconEdit({ size = 20, color = defaultColor, style }) {
  return <Feather name="edit-2" size={size} color={color} style={style} />;
}

export function IconTrash({ size = 20, color = defaultColor, style }) {
  return <Feather name="trash-2" size={size} color={color} style={style} />;
}

export function IconSearch({ size = 20, color = defaultColor, style }) {
  return <Feather name="search" size={size} color={color} style={style} />;
}

export function IconCheck({ size = 20, color = defaultColor, style }) {
  return <Feather name="check" size={size} color={color} style={style} />;
}

export function IconCheckCircle({ size = 20, color = defaultColor, style }) {
  return <Feather name="check-circle" size={size} color={color} style={style} />;
}

export function IconX({ size = 20, color = defaultColor, style }) {
  return <Feather name="x" size={size} color={color} style={style} />;
}

export function IconXCircle({ size = 20, color = defaultColor, style }) {
  return <Feather name="x-circle" size={size} color={color} style={style} />;
}

export function IconAlertTriangle({ size = 20, color = defaultColor, style }) {
  return <Feather name="alert-triangle" size={size} color={color} style={style} />;
}

export function IconAlertCircle({ size = 20, color = defaultColor, style }) {
  return <Feather name="alert-circle" size={size} color={color} style={style} />;
}

export function IconInfo({ size = 20, color = defaultColor, style }) {
  return <Feather name="info" size={size} color={color} style={style} />;
}

export function IconHelpCircle({ size = 20, color = defaultColor, style }) {
  return <Feather name="help-circle" size={size} color={color} style={style} />;
}

export function IconLightbulb({ size = 20, color = defaultColor, style }) {
  return <MaterialCommunityIcons name="lightbulb-outline" size={size} color={color} style={style} />;
}

// ── Điều hướng & Menu (Navigation & Arrows) ──
export function IconHome({ size = 20, color = defaultColor, style }) {
  return <Feather name="home" size={size} color={color} style={style} />;
}

export function IconMenu({ size = 20, color = defaultColor, style }) {
  return <Feather name="menu" size={size} color={color} style={style} />;
}

export function IconArrowLeft({ size = 20, color = defaultColor, style }) {
  return <Feather name="arrow-left" size={size} color={color} style={style} />;
}

export function IconArrowRight({ size = 20, color = defaultColor, style }) {
  return <Feather name="arrow-right" size={size} color={color} style={style} />;
}

export function IconChevronRight({ size = 20, color = defaultColor, style }) {
  return <Feather name="chevron-right" size={size} color={color} style={style} />;
}

export function IconChevronDown({ size = 20, color = defaultColor, style }) {
  return <Feather name="chevron-down" size={size} color={color} style={style} />;
}

export function IconChevronUp({ size = 20, color = defaultColor, style }) {
  return <Feather name="chevron-up" size={size} color={color} style={style} />;
}

// ── Người dùng & Bảo mật (Users & Auth) ──
export function IconUser({ size = 20, color = defaultColor, style }) {
  return <Feather name="user" size={size} color={color} style={style} />;
}

export function IconUsers({ size = 20, color = defaultColor, style }) {
  return <Feather name="users" size={size} color={color} style={style} />;
}

export function IconUserPlus({ size = 20, color = defaultColor, style }) {
  return <Feather name="user-plus" size={size} color={color} style={style} />;
}

export function IconShield({ size = 20, color = defaultColor, style }) {
  return <Feather name="shield" size={size} color={color} style={style} />;
}

export function IconShieldCheck({ size = 20, color = defaultColor, style }) {
  return <Feather name="shield" size={size} color={color} style={style} />;
}

export function IconLock({ size = 20, color = defaultColor, style }) {
  return <Feather name="lock" size={size} color={color} style={style} />;
}

export function IconUnlock({ size = 20, color = defaultColor, style }) {
  return <Feather name="unlock" size={size} color={color} style={style} />;
}

export function IconKey({ size = 20, color = defaultColor, style }) {
  return <Feather name="key" size={size} color={color} style={style} />;
}

export function IconEye({ size = 20, color = defaultColor, style }) {
  return <Feather name="eye" size={size} color={color} style={style} />;
}

export function IconEyeOff({ size = 20, color = defaultColor, style }) {
  return <Feather name="eye-off" size={size} color={color} style={style} />;
}

export function IconLogIn({ size = 20, color = defaultColor, style }) {
  return <Feather name="log-in" size={size} color={color} style={style} />;
}

export function IconLogOut({ size = 20, color = defaultColor, style }) {
  return <Feather name="log-out" size={size} color={color} style={style} />;
}

// ── Kinh tế, Tài chính & Bán hàng (Finance, Sales & Stock) ──
export function IconDollarSign({ size = 20, color = defaultColor, style }) {
  return <Feather name="dollar-sign" size={size} color={color} style={style} />;
}

export function IconBanknote({ size = 20, color = defaultColor, style }) {
  return <Feather name="dollar-sign" size={size} color={color} style={style} />;
}

export function IconCoins({ size = 20, color = defaultColor, style }) {
  return <MaterialCommunityIcons name="cash-multiple" size={size} color={color} style={style} />;
}

export function IconCircleDollar({ size = 20, color = defaultColor, style }) {
  return <MaterialCommunityIcons name="currency-usd-circle-outline" size={size} color={color} style={style} />;
}

export function IconShoppingBag({ size = 20, color = defaultColor, style }) {
  return <Feather name="shopping-bag" size={size} color={color} style={style} />;
}

export function IconPackage({ size = 20, color = defaultColor, style }) {
  return <Feather name="package" size={size} color={color} style={style} />;
}

export function IconReceipt({ size = 20, color = defaultColor, style }) {
  return <MaterialCommunityIcons name="receipt" size={size} color={color} style={style} />;
}

export function IconTag({ size = 20, color = defaultColor, style }) {
  return <Feather name="tag" size={size} color={color} style={style} />;
}

// ── Thống kê & Báo cáo (Charts & Analytics) ──
export function IconBarChart({ size = 20, color = defaultColor, style }) {
  return <Feather name="bar-chart-2" size={size} color={color} style={style} />;
}

export function IconLineChart({ size = 20, color = defaultColor, style }) {
  return <Feather name="activity" size={size} color={color} style={style} />;
}

export function IconPieChart({ size = 20, color = defaultColor, style }) {
  return <Feather name="pie-chart" size={size} color={color} style={style} />;
}

export function IconTrendingUp({ size = 20, color = defaultColor, style }) {
  return <Feather name="trending-up" size={size} color={color} style={style} />;
}

export function IconCalculator({ size = 20, color = defaultColor, style }) {
  return <MaterialCommunityIcons name="calculator-variant-outline" size={size} color={color} style={style} />;
}

// ── Thời gian, Công việc & Tài liệu (Time & Documents) ──
export function IconCalendar({ size = 20, color = defaultColor, style }) {
  return <Feather name="calendar" size={size} color={color} style={style} />;
}

export function IconClock({ size = 20, color = defaultColor, style }) {
  return <Feather name="clock" size={size} color={color} style={style} />;
}

export function IconHistory({ size = 20, color = defaultColor, style }) {
  return <MaterialCommunityIcons name="history" size={size} color={color} style={style} />;
}

export function IconClipboardList({ size = 20, color = defaultColor, style }) {
  return <Feather name="clipboard" size={size} color={color} style={style} />;
}

export function IconFileText({ size = 20, color = defaultColor, style }) {
  return <Feather name="file-text" size={size} color={color} style={style} />;
}

export function IconBookOpen({ size = 20, color = defaultColor, style }) {
  return <Feather name="book-open" size={size} color={color} style={style} />;
}

// ── Hệ thống, Thiết bị & Mạng (System, Device & Network) ──
export function IconWifi({ size = 20, color = defaultColor, style }) {
  return <Feather name="wifi" size={size} color={color} style={style} />;
}

export function IconWifiOff({ size = 20, color = defaultColor, style }) {
  return <Feather name="wifi-off" size={size} color={color} style={style} />;
}

export function IconRotateCw({ size = 20, color = defaultColor, style }) {
  return <Feather name="rotate-cw" size={size} color={color} style={style} />;
}

export function IconRefreshCw({ size = 20, color = defaultColor, style }) {
  return <Feather name="refresh-cw" size={size} color={color} style={style} />;
}

export function IconRefresh({ size = 20, color = defaultColor, style }) {
  return <Feather name="refresh-cw" size={size} color={color} style={style} />;
}

export function IconDatabase({ size = 20, color = defaultColor, style }) {
  return <Feather name="database" size={size} color={color} style={style} />;
}

export function IconServer({ size = 20, color = defaultColor, style }) {
  return <Feather name="server" size={size} color={color} style={style} />;
}

export function IconSettings({ size = 20, color = defaultColor, style }) {
  return <Feather name="settings" size={size} color={color} style={style} />;
}

export function IconBell({ size = 20, color = defaultColor, style }) {
  return <Feather name="bell" size={size} color={color} style={style} />;
}

export function IconSend({ size = 20, color = defaultColor, style }) {
  return <Feather name="send" size={size} color={color} style={style} />;
}

export function IconUpload({ size = 20, color = defaultColor, style }) {
  return <Feather name="upload" size={size} color={color} style={style} />;
}

export function IconDownload({ size = 20, color = defaultColor, style }) {
  return <Feather name="download" size={size} color={color} style={style} />;
}

export function IconSmartphone({ size = 20, color = defaultColor, style }) {
  return <Feather name="smartphone" size={size} color={color} style={style} />;
}

export function IconPrinter({ size = 20, color = defaultColor, style }) {
  return <Feather name="printer" size={size} color={color} style={style} />;
}

export function IconCamera({ size = 20, color = defaultColor, style }) {
  return <Feather name="camera" size={size} color={color} style={style} />;
}

export function IconImage({ size = 20, color = defaultColor, style }) {
  return <Feather name="image" size={size} color={color} style={style} />;
}

// ── Liên lạc & Vị trí (Communication & Location) ──
export function IconMail({ size = 20, color = defaultColor, style }) {
  return <Feather name="mail" size={size} color={color} style={style} />;
}

export function IconPhone({ size = 20, color = defaultColor, style }) {
  return <Feather name="phone" size={size} color={color} style={style} />;
}

export function IconPhoneCall({ size = 20, color = defaultColor, style }) {
  return <Feather name="phone-call" size={size} color={color} style={style} />;
}

export function IconHeadphones({ size = 20, color = defaultColor, style }) {
  return <Feather name="headphones" size={size} color={color} style={style} />;
}

export function IconMapPin({ size = 20, color = defaultColor, style }) {
  return <Feather name="map-pin" size={size} color={color} style={style} />;
}

export function IconGlobe({ size = 20, color = defaultColor, style }) {
  return <Feather name="globe" size={size} color={color} style={style} />;
}

export function IconRuler({ size = 20, color = defaultColor, style }) {
  return <MaterialCommunityIcons name="ruler" size={size} color={color} style={style} />;
}

export function IconLayers({ size = 20, color = defaultColor, style }) {
  return <Feather name="layers" size={size} color={color} style={style} />;
}

export function IconZoomIn({ size = 20, color = defaultColor, style }) {
  return <Feather name="zoom-in" size={size} color={color} style={style} />;
}

export function IconCloud({ size = 20, color = defaultColor, style }) {
  return <Feather name="cloud" size={size} color={color} style={style} />;
}

