import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../theme/colors';
import { Feather } from '@expo/vector-icons';

import LoginScreen from '../screens/LoginScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import HomeScreen from '../screens/HomeScreen';
import FarmingLogsScreen from '../screens/FarmingLogsScreen';
import SeasonsScreen from '../screens/SeasonsScreen';
import HarvestScreen from '../screens/HarvestScreen';
import InventoryScreen from '../screens/InventoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import FarmsScreen from '../screens/FarmsScreen';
import FarmDetailScreen from '../screens/FarmDetailScreen';
import CropsScreen from '../screens/CropsScreen';
import MaterialsScreen from '../screens/MaterialsScreen';
import SalesScreen from '../screens/SalesScreen';
import ReportsScreen from '../screens/ReportsScreen';
import AdminScreen from '../screens/AdminScreen';
import OfflineSyncScreen from '../screens/OfflineSyncScreen';

import {
  IconHome,
  IconPenLine,
  IconCalendar,
  IconShoppingBag,
  IconUser,
} from '../components/icons';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const iconSize = size || 20;
          if (route.name === 'Home') return <IconHome size={iconSize} color={color} />;
          if (route.name === 'FarmingLogs') return <IconPenLine size={iconSize} color={color} />;
          if (route.name === 'Seasons') return <IconCalendar size={iconSize} color={color} />;
          if (route.name === 'Harvest') return <IconShoppingBag size={iconSize} color={color} />;
          if (route.name === 'Profile') return <IconUser size={iconSize} color={color} />;
          return null;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: COLORS.white,
          borderBottomColor: COLORS.border,
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 17,
          color: COLORS.text,
        },
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Trang chủ', headerTitle: 'DalatAgri Mobile' }}
      />
      <Tab.Screen
        name="FarmingLogs"
        component={FarmingLogsScreen}
        options={{ title: 'Nhật ký', headerTitle: 'Nhật ký Canh tác' }}
      />
      <Tab.Screen
        name="Seasons"
        component={SeasonsScreen}
        options={{ title: 'Mùa vụ', headerTitle: 'Mùa vụ Canh tác' }}
      />
      <Tab.Screen
        name="Harvest"
        component={HarvestScreen}
        options={{ title: 'Thu hoạch', headerTitle: 'Sản lượng Thu hoạch' }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Cá nhân', headerTitle: 'Hồ sơ Nông hộ' }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerTintColor: COLORS.primary,
        headerTitleStyle: { fontWeight: '700', color: COLORS.text },
      }}
    >
      {token ? (
        <>
          <Stack.Screen
            name="MainTabs"
            component={MainTabNavigator}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Farms"
            component={FarmsScreen}
            options={{ title: 'Nông trại & Thửa đất' }}
          />
          <Stack.Screen
            name="FarmDetail"
            component={FarmDetailScreen}
            options={{ title: 'Chi tiết Nông trại & Lô đất' }}
          />
          <Stack.Screen
            name="Crops"
            component={CropsScreen}
            options={{ title: 'Danh mục Cây trồng' }}
          />
          <Stack.Screen
            name="Materials"
            component={MaterialsScreen}
            options={{ title: 'Danh mục Vật tư Nông nghiệp' }}
          />
          <Stack.Screen
            name="Inventory"
            component={InventoryScreen}
            options={{ title: 'Kho vật tư nông nghiệp' }}
          />
          <Stack.Screen
            name="Sales"
            component={SalesScreen}
            options={{ title: 'Bán hàng & Quản lý Hóa đơn' }}
          />
          <Stack.Screen
            name="Reports"
            component={ReportsScreen}
            options={{ title: 'Báo cáo & Tài chính' }}
          />
          <Stack.Screen
            name="Admin"
            component={AdminScreen}
            options={{ title: 'Trung tâm Quản trị Admin' }}
          />
          <Stack.Screen
            name="OfflineSync"
            component={OfflineSyncScreen}
            options={{ title: 'Nhật ký Ngoại tuyến & Đồng bộ' }}
          />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
            options={{ title: 'Khôi phục Mật khẩu' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

