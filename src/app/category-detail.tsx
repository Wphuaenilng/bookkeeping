import { Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/colors';
import { AuroraBackground } from '../theme/AuroraBackground';
import { useLedgerStore } from '../store/ledgerStore';
import { useCategoryStore } from '../store/categoryStore';
import { groupByDay } from '../utils/group';
import { centToThousand, centToDisplay } from '../utils/money';
import { friendlyDate, formatYM, shiftMonth, currentMonth } from '../utils/date';

/**
 * 分类流水下钻页:统计排行里点某个分类,看它当月的每一笔。
 * 月份切换与全局联动;空态给引导。
 */
export default function CategoryDetailScreen() {
  const p = useTheme();
  const params = useLocalSearchParams<{ categoryId?: string }>();
  const categoryId = params.categoryId ?? '';
  const month = useLedgerStore((s) => s.month);
  const setMonth = useLedgerStore((s) => s.setMonth);
  const allTxns = useLedgerStore((s) => s.transactions);
  const category = useCategoryStore((s) => s.all).find((c) => c.id === categoryId);

  const txns = allTxns.filter((t) => t.category_id === categoryId);
  const total = txns.reduce((s, t) => s + t.amount_cent, 0);
  const sections = groupByDay(txns);
  const isCurrent = month === currentMonth();

  return (
    <AuroraBackground>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={{ flex: 0 }} />

      {/* 头部:返回 + 居中月份切换 */}
      <View style={styles.head}>
        <View style={styles.monthRow}>
          <Pressable hitSlop={10} onPress={() => router.back()} style={styles.sideSlot}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={p.text} />
          </Pressable>
          <View style={styles.monthNav}>
            <Pressable hitSlop={8} onPress={() => setMonth(shiftMonth(month, -1))}>
              <MaterialCommunityIcons name="chevron-left" size={22} color={p.text} />
            </Pressable>
            <Text style={{ color: p.text, fontSize: 16, fontWeight: '700' }}>{formatYM(month)}</Text>
            <Pressable hitSlop={8} onPress={() => setMonth(shiftMonth(month, 1))} disabled={isCurrent}>
              <MaterialCommunityIcons name="chevron-right" size={22} color={isCurrent ? 'transparent' : p.text} />
            </Pressable>
          </View>
          <View style={styles.sideSlot} />
        </View>

        {/* 分类 + 当月合计 */}
        <View style={[styles.totalCard, { backgroundColor: p.glassSurface, borderColor: p.glassBorder }]}>
          <View style={styles.catRow}>
            <View style={[styles.iconCircle, { backgroundColor: p.primaryMist }]}>
              <MaterialCommunityIcons name={(category?.icon ?? 'shape-outline') as any} size={20} color={p.primary} />
            </View>
            <Text style={{ color: p.text, fontSize: 16, fontWeight: '600' }}>
              {category?.name ?? '分类'}
            </Text>
          </View>
          <Text style={{ color: p.text, fontSize: 28, fontWeight: '800', fontVariant: ['tabular-nums'], marginTop: 6 }}>
            ¥{centToThousand(total)}
          </Text>
          <Text style={{ color: p.textSub, fontSize: 12, marginTop: 2 }}>共 {txns.length} 笔</Text>
        </View>
      </View>

      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        contentContainerStyle={{ paddingBottom: 32, paddingHorizontal: 16 }}
        renderSectionHeader={({ section }) => (
          <View style={styles.dayHeader}>
            <Text style={{ color: p.textSub, fontSize: 13, fontWeight: '600' }}>{friendlyDate(section.date)}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View style={styles.middle}>
              <Text style={{ color: p.text, fontSize: 15, fontWeight: '500' }} numberOfLines={1}>
                {item.note || (item.type === 'expense' ? '支出' : '收入')}
              </Text>
              <Text style={{ color: p.textSub, fontSize: 12, marginTop: 2 }}>
                {item.occurred_date}
              </Text>
            </View>
            <Text style={{ color: p.text, fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
              {item.type === 'expense' ? '-' : '+'}¥{centToDisplay(item.amount_cent)}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <MaterialCommunityIcons name="tray-arrow-down" size={40} color={p.textSub} />
            <Text style={{ color: p.textSub, fontSize: 14, marginTop: 10 }}>本月该分类暂无流水</Text>
          </View>
        }
      />
    </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  head: {
    paddingHorizontal: 16,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  sideSlot: {
    width: 32,
    alignItems: 'center',
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 10,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeader: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF00',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E3EAF355',
  },
  middle: {
    flex: 1,
    marginRight: 12,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 60,
  },
});
