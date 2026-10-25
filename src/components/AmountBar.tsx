import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/colors';
import { useEntryStore } from '../store/entryStore';
import { useCategoryStore } from '../store/categoryStore';
import { calcDisplay, calcEditingHint } from '../utils/money';
import { friendlyDate } from '../utils/date';

/**
 * 金额输入栏(金额步专用):日期 / 分类 / 金额 同一行,备注独立一行。
 */
export function AmountBar({
  onOpenNote,
  onOpenCalendar,
  onCategoryPress,
}: {
  onOpenNote: () => void;
  onOpenCalendar: () => void;
  onCategoryPress: () => void;
}) {
  const p = useTheme();
  const calc = useEntryStore((s) => s.calc);
  const note = useEntryStore((s) => s.note);
  const dateStr = useEntryStore((s) => s.dateStr);
  const categoryId = useEntryStore((s) => s.categoryId);
  const pressKey = useEntryStore((s) => s.pressKey);
  const category = useCategoryStore((s) => s.visible).find((c) => c.id === categoryId);

  const display = calcDisplay(calc);
  const hint = calcEditingHint(calc);

  return (
    <View style={styles.bar}>
      {/* 日期 / 分类 / 金额 同一行 */}
      <View style={styles.row}>
        <Pressable style={[styles.chip, { backgroundColor: 'rgba(255,255,255,0.55)' }]} onPress={onOpenCalendar}>
          <MaterialCommunityIcons name="calendar-month-outline" size={14} color={p.primary} />
          <Text style={{ color: p.primary, fontSize: 13, fontWeight: '600' }}>{friendlyDate(dateStr)}</Text>
        </Pressable>

        <Pressable style={[styles.chip, { backgroundColor: p.primaryMist }]} onPress={onCategoryPress}>
          {category ? (
            <>
              <MaterialCommunityIcons name={category.icon as any} size={14} color={p.primary} />
              <Text style={{ color: p.primary, fontSize: 13, fontWeight: '600' }}>{category.name}</Text>
            </>
          ) : (
            <>
              <MaterialCommunityIcons name="shape-outline" size={14} color={p.textSub} />
              <Text style={{ color: p.textSub, fontSize: 13 }}>选分类</Text>
            </>
          )}
        </Pressable>

        <View style={styles.amountWrap}>
          <Text
            style={{ color: p.textHeavy, fontSize: 26, fontWeight: '700', fontVariant: ['tabular-nums'] }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {display}
          </Text>
          {hint ? <Text style={{ color: p.textSub, fontSize: 14 }}>{hint}</Text> : null}
        </View>

        <Pressable style={styles.backspace} onPress={() => pressKey('back')} android_ripple={{ color: p.border, radius: 20 }}>
          <MaterialCommunityIcons name="backspace-outline" size={22} color={p.textSub} />
        </Pressable>
      </View>

      {/* 备注独立一行(点击行内编辑,系统键盘顶起) */}
      <Pressable style={[styles.noteRow, note ? { backgroundColor: p.primaryMist } : { backgroundColor: 'rgba(255,255,255,0.55)' }]} onPress={onOpenNote}>
        <MaterialCommunityIcons name={note ? 'note-text-outline' : 'plus'} size={15} color={note ? p.primary : p.textSub} />
        <Text style={{ color: note ? p.primary : p.textSub, fontSize: 13, flex: 1 }} numberOfLines={1}>
          {note || '添加备注(可选)'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 32,
    borderRadius: 16,
    maxWidth: 130,
  },
  amountWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: 3,
    minWidth: 60,
  },
  backspace: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 2,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 8,
    marginBottom: 8,
  },
});

export default AmountBar;
