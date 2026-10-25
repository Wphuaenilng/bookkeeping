import { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from './colors';

/**
 * 柔和极光页面背景:很浅的蓝→紫→青三段斜向渐变,内容浮于其上。
 * 只换肤不改布局:替换各页面根 View 的纯色底。
 */
export function AuroraBackground({ children }: { children: ReactNode }) {
  const p = useTheme();
  return (
    <View style={styles.flex}>
      <LinearGradient
        colors={p.auroraBg}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.flex}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

export default AuroraBackground;
