import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme/colors';
import { useEntryStore } from '../store/entryStore';

/**
 * 自绘数字键盘(不用系统键盘):
 * 左侧 7-8-9 / 4-5-6 / 1-2-3 / .-0-00,右列 + / − / 完成(占满高度)。
 * 日期切换在金额栏胶囊上(今天→昨天→日历)。
 */
const KEY_H = 58;

const DIGITS = ['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '00'];

export function NumericKeyboard() {
  const p = useTheme();
  const pressKey = useEntryStore((s) => s.pressKey);
  const save = useEntryStore((s) => s.save);
  const hasValue = useEntryStore((s) => s.calc.base !== '' || s.calc.acc !== null);

  return (
    <View style={styles.kbd}>
      <View style={styles.digits}>
        {DIGITS.map((d) => (
          <Pressable
            key={d}
            style={({ pressed }) => [styles.key, { backgroundColor: 'rgba(255,255,255,0.55)', opacity: pressed ? 0.8 : 1 }]}
            android_ripple={{ color: p.border, borderless: false, radius: 40 }}
            onPress={() => pressKey(d)}
          >
            <Text style={{ color: p.keyText, fontSize: 24, fontWeight: '500', fontVariant: ['tabular-nums'] }}>{d}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.ops}>
        <Pressable
          style={({ pressed }) => [styles.key, styles.opKey, { backgroundColor: p.primaryMist, opacity: pressed ? 0.8 : 1 }]}
          android_ripple={{ color: p.border, borderless: false, radius: 40 }}
          onPress={() => pressKey('+')}
        >
          <Text style={{ color: p.primary, fontSize: 22, fontWeight: '600' }}>+</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.key, styles.opKey, { backgroundColor: p.primaryMist, opacity: pressed ? 0.85 : 1 }]}
          android_ripple={{ color: p.border, borderless: false, radius: 40 }}
          onPress={() => pressKey('-')}
        >
          <Text style={{ color: p.primary, fontSize: 22, fontWeight: '600' }}>−</Text>
        </Pressable>
        <Pressable
          style={[styles.doneKey, { backgroundColor: hasValue ? p.primary : p.primarySoft }]}
          android_ripple={{ color: 'rgba(255,255,255,0.25)', borderless: false, radius: 40 }}
          onPress={() => save()}
        >
          <Text style={{ color: hasValue ? '#FFFFFF' : p.card, fontSize: 18, fontWeight: '700' }}>完成</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  kbd: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingTop: 4,
    paddingBottom: 10,
    gap: 8,
  },
  digits: {
    width: '75%',
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  key: {
    width: '33.333%',
    height: KEY_H,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  ops: {
    flex: 1,
  },
  opKey: {
    width: '100%',
  },
  doneKey: {
    flex: 1,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
});

export default NumericKeyboard;
