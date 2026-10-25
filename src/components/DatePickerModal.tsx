import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import { useTheme } from '../theme/colors';
import { DATE_FMT } from '../utils/date';

/**
 * 轻量日历弹窗:补记日期选择 ≤ 2 步。
 * 键盘「今天」键循环 今天→昨天,再深才弹这里。
 */
export function DatePickerModal({
  visible,
  value,
  onPick,
  onClose,
}: {
  visible: boolean;
  value: string;
  onPick: (dateStr: string) => void;
  onClose: () => void;
}) {
  const p = useTheme();
  const [cursor, setCursor] = useState(() => dayjs(value || undefined).startOf('month'));

  // 每次打开都定位到所选日期所在月份
  useEffect(() => {
    if (visible) setCursor(dayjs(value || undefined).startOf('month'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const monthStart = cursor.startOf('month');
  // 周一开头
  const firstWeekday = (monthStart.day() + 6) % 7;
  const daysInMonth = cursor.daysInMonth();
  const cells: Array<{ date: string | null; day: number | null }> = [];
  for (let i = 0; i < firstWeekday; i++) cells.push({ date: null, day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: cursor.date(d).format(DATE_FMT), day: d });
  }

  const today = dayjs().format(DATE_FMT);
  const selected = value;

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.mask} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: 'rgba(255,255,255,0.94)', borderColor: 'rgba(255,255,255,0.6)', borderWidth: 1 }]}>
        <View style={styles.headRow}>
          <Pressable hitSlop={10} onPress={() => setCursor(cursor.subtract(1, 'month'))}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={p.text} />
          </Pressable>
          <Text style={{ color: p.text, fontSize: 17, fontWeight: '700' }}>{cursor.format('YYYY年M月')}</Text>
          <Pressable hitSlop={10} onPress={() => setCursor(cursor.add(1, 'month'))}>
            <MaterialCommunityIcons name="chevron-right" size={24} color={p.text} />
          </Pressable>
        </View>

        <View style={styles.weekRow}>
          {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
            <Text key={w} style={[styles.weekCell, { color: p.textSub }]}>
              {w}
            </Text>
          ))}
        </View>

        <View style={styles.grid}>
          {cells.map((c, i) => {
            if (!c.date) return <View key={`e${i}`} style={styles.dayCell} />;
            const isToday = c.date === today;
            const isSelected = c.date === selected;
            return (
              <Pressable key={c.date} style={styles.dayCell} onPress={() => onPick(c.date!)}>
                <View
                  style={[
                    styles.dayInner,
                    {
                      backgroundColor: isSelected ? p.primary : isToday ? p.primaryMist : 'transparent',
                      borderWidth: isToday && !isSelected ? 1 : 0,
                      borderColor: p.primary,
                    },
                  ]}
                >
                  <Text
                    style={{
                      color: isSelected ? '#FFFFFF' : isToday ? p.primary : p.text,
                      fontSize: 15,
                      fontWeight: isSelected || isToday ? '700' : '400',
                      fontVariant: ['tabular-nums'],
                    }}
                  >
                    {c.day}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  mask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 28,
  },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  weekRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  weekCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DatePickerModal;
