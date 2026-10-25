import { ReactNode } from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { glassShadow, useTheme } from '../theme/colors';

/**
 * 毛玻璃卡片:真实背景模糊(Android 用 dimezis 引擎)+ 高光描边 + 柔影。
 * 用于少量大面积表面(TabBar/汇总卡/Dock),列表行用半透明表面即可。
 */
export function GlassCard({
  children,
  style,
  intensity = 42,
  radius = 18,
}: {
  children: ReactNode;
  style?: ViewStyle | ViewStyle[];
  intensity?: number;
  radius?: number;
}) {
  const p = useTheme();
  return (
    <View
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor: p.glassBorder,
          backgroundColor: p.glassSurface,
        },
        glassShadow(),
        style as ViewStyle,
      ]}
    >
      {Platform.OS === 'android' ? (
        <BlurView
          intensity={intensity}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <BlurView intensity={intensity} tint="light" style={StyleSheet.absoluteFill} />
      )}
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    backgroundColor: 'transparent',
  },
});

export default GlassCard;
