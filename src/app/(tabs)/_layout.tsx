import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/colors';
import { useEntryStore } from '../../store/entryStore';
import { Platform } from 'react-native';

/** expo-router 58 传入的自定义 tabBar 形状(只声明用到的字段) */
interface TabBarProps {
  state: { index: number; routes: Array<{ key: string; name: string }> };
  navigateToTab: (routeKey: string) => void;
}

/**
 * 底部导航:明细 / 记账(正中间凸起 +) / 我的。三等分,记账键天然居中。
 * 图表页后续作为统计入口再加回(v0.2)。
 */
function CustomTabBar({ state, navigateToTab }: TabBarProps) {
  const p = useTheme();
  const insets = useSafeAreaInsets();
  const openNew = useEntryStore((s) => s.openNew);
  /** 录入中(分类/金额步)算独立页面:底部 Tab 一律不高亮 */
  const entryOpen = useEntryStore((s) => s.mode !== 'closed');

  const left = [{ name: 'index', label: '明细', icon: 'format-list-text' }];
  const right = [{ name: 'profile', label: '我的', icon: 'account-circle-outline' }];

  const renderTab = (name: string, label: string, icon: string) => {
    const idx = state.routes.findIndex((r) => r.name === name);
    if (idx < 0) return null;
    const focused = !entryOpen && state.index === idx;
    const color = focused ? p.primary : p.textSub;
    return (
      <Pressable
        key={name}
        style={styles.tabItem}
        onPress={() => {
          // 切 Tab 即退出录入态:明细=列表页,记账=重新进入录入
          useEntryStore.getState().close();
          navigateToTab(state.routes[idx].key);
        }}
        android_ripple={{ color: 'transparent' }}
      >
        <MaterialCommunityIcons name={icon as any} size={22} color={color} />
        <Text style={{ color, fontSize: 11, marginTop: 2, fontWeight: focused ? '700' : '400' }}>{label}</Text>
      </Pressable>
    );
  };

  const onCenterPress = () => {
    const idx = state.routes.findIndex((r) => r.name === 'index');
    if (idx >= 0 && state.index !== idx) navigateToTab(state.routes[idx].key);
    openNew();
  };

  return (
    <View style={[styles.bar, { borderTopColor: p.glassBorder, paddingBottom: insets.bottom }]}>
      {Platform.OS === 'android' ? (
        <BlurView
          intensity={46}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : (
        <BlurView intensity={46} tint="light" style={StyleSheet.absoluteFill} pointerEvents="none" />
      )}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: p.glassSurface }]} pointerEvents="none" />
      {left.map((t) => renderTab(t.name, t.label, t.icon))}
      <View style={styles.centerSlot}>
        <Pressable style={[styles.centerBtn, { backgroundColor: p.primary }]} onPress={onCenterPress}>
          <MaterialCommunityIcons name="plus" size={26} color="#FFFFFF" />
        </Pressable>
        <Text style={{ color: p.textSub, fontSize: 11, marginTop: 2 }}>记账</Text>
      </View>
      {right.map((t) => renderTab(t.name, t.label, t.icon))}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <CustomTabBar {...props} />} screenOptions={{ headerShown: false, lazy: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 2,
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    marginTop: -22,
  },
  centerBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4A90E2',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 5,
  },
});
