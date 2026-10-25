import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';
import { useTheme } from '../theme/colors';
import { currentMonth, formatYM } from '../utils/date';

/**
 * 月份选择弹窗:点顶部月份 ▼ 弹出,年翻页 + 12 宫格选月。
 * 对应计划「月份切换:左右滑或下拉选月」的下拉路线。
 */
export function MonthPickerModal({
  visible,
  value,
  onPick,
  onClose,
}: {
  visible: boolean;
  value: string; // 'YYYY-MM'
  onPick: (month: string) => void;
  onClose: () => void;
}) {
  const p = useTheme();
  const [year, setYear] = useState(() => dayjs(`${value}-01`).year());

  useEffect(() => {
    if (visible) setYear(dayjs(`${value}-01`).year());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const thisMonth = currentMonth();

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.mask} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: 'rgba(255,255,255,0.94)', borderColor: 'rgba(255,255,255,0.6)', borderWidth: 1 }]}>
        <View style={styles.headRow}>
          <Pressable hitSlop={10} onPress={() => setYear(year - 1)}>
            <MaterialCommunityIcons name="chevron-left" size={24} color={p.text} />
          </Pressable>
          <Text style={{ color: p.text, fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
            {year}年
          </Text>
          <Pressable hitSlop={10} onPress={() => setYear(year + 1)}>
            <MaterialCommunityIcons name="chevron-right" size={24} color={p.text} />
          </Pressable>
        </View>

        <View style={styles.grid}>
          {Array.from({ length: 12 }, (_, i) => {
            const m = `${year}-${String(i + 1).padStart(2, '0')}`;
            const selected = m === value;
            const isNow = m === thisMonth;
            return (
              <Pressable
                key={m}
                style={[
                  styles.monthCell,
                  {
                    backgroundColor: selected ? p.primary : isNow ? p.primaryMist : 'transparent',
                    borderWidth: isNow && !selected ? 1 : 0,
                    borderColor: p.primary,
                  },
                ]}
                onPress={() => onPick(m)}
              >
                <Text
                  style={{
                    color: selected ? '#FFFFFF' : isNow ? p.primary : p.text,
                    fontSize: 15,
                    fontWeight: selected || isNow ? '700' : '400',
                    fontVariant: ['tabular-nums'],
                  }}
                >
                  {i + 1}月
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Pressable
          style={[styles.todayBtn, { backgroundColor: p.primaryMist }]}
          onPress={() => onPick(thisMonth)}
        >
          <Text style={{ color: p.primary, fontSize: 14, fontWeight: '600' }}>
            回到本月({formatYM(thisMonth)})
          </Text>
        </Pressable>
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
    marginBottom: 10,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  monthCell: {
    width: '23%',
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  todayBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 12,
  },
});

export default MonthPickerModal;
