import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { useEffect, useRef } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useToastStore } from '../store/uiStore';
import { useTheme } from '../theme/colors';

/** 全局 Toast:落库 → toast → 3 秒可撤销(取消确认弹窗,动线不停) */
export function ToastHost() {
  const p = useTheme();
  const insets = useSafeAreaInsets();
  const { visible, message, undo, dismiss, runUndo, id } = useToastStore();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: visible ? 1 : 0,
      duration: 160,
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, visible]);

  if (!visible && (opacity as any)._value === 0) return null;

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.host, { bottom: insets.bottom + 72, opacity }]}
    >
      <Pressable style={[styles.pill, { backgroundColor: p.toastBg }]} onPress={dismiss}>
        <Text style={{ color: p.toastText, fontSize: 14 }} numberOfLines={1}>
          {message}
        </Text>
        {undo ? (
          <Pressable hitSlop={8} onPress={runUndo} style={styles.undoBtn}>
            <Text style={{ color: p.primarySoft, fontSize: 14, fontWeight: '700' }}>撤销</Text>
          </Pressable>
        ) : null}
        <MaterialCommunityIcons name="close" size={16} color={p.toastText} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    maxWidth: '88%',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  undoBtn: {
    paddingHorizontal: 4,
  },
});

export default ToastHost;
