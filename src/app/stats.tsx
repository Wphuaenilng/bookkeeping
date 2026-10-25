import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router, useLocalSearchParams } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/colors';
import { AuroraBackground } from '../theme/AuroraBackground';
import { useLedgerStore } from '../store/ledgerStore';
import { centToThousand } from '../utils/money';
import { formatYM, shiftMonth, currentMonth } from '../utils/date';

/**
 * 分类统计页:本月分类排行 + 占比横条。
 * 从首页概览的「收入/支出」点进来,自动定位对应类型;月份切换与首页联动。
 */
export default function StatsScreen() {
  const p = useTheme();
  const params = useLocalSearchParams<{ type?: string }>();
  const month = useLedgerStore((s) => s.month);
  const summary = useLedgerStore((s) => s.summary);
  const setMonth = useLedgerStore((s) => s.setMonth);
  const transactions = useLedgerStore((s) => s.transactions);
  const [type, setType] = useState<'expense' | 'income'>(params.type === 'income' ? 'income' : 'expense');

  const rank = useMemo(() => {
    const map = new Map<string, { id: string; name: string; icon: string; total: number }>();
    for (const t of transactions) {
      if (t.type !== type) continue;
      const cur = map.get(t.category_id);
      if (cur) cur.total += t.amount_cent;
      else
        map.set(t.category_id, {
          id: t.category_id,
          name: t.category_name,
          icon: t.category_icon,
          total: t.amount_cent,
        });
    }
    const list = Array.from(map.values()).sort((a, b) => b.total - a.total);
    const grand = list.reduce((s, c) => s + c.total, 0);
    return { list, grand };
  }, [transactions, type]);

  const monthLabel = formatYM(month);
  const isCurrent = month === currentMonth();

  return (
    <AuroraBackground>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={{ flex: 0 }} />
      <View style={[styles.head, { paddingTop: 8 }]}>
        <View style={styles.monthRow}>
          <Pressable hitSlop={10} onPress={() => router.back()} style={styles.sideSlot}>
            <MaterialCommunityIcons name="arrow-left" size={24} color={p.text} />
          </Pressable>
          <View style={styles.monthNav}>
            <Pressable hitSlop={8} onPress={() => setMonth(shiftMonth(month, -1))}>
              <MaterialCommunityIcons name="chevron-left" size={22} color={p.text} />
            </Pressable>
            <Text style={{ color: p.text, fontSize: 16, fontWeight: '700' }}>{monthLabel}</Text>
            <Pressable hitSlop={8} onPress={() => setMonth(shiftMonth(month, 1))} disabled={isCurrent}>
              <MaterialCommunityIcons
                name="chevron-right"
                size={22}
                color={isCurrent ? 'transparent' : p.text}
              />
            </Pressable>
          </View>
          <View style={styles.sideSlot} />
        </View>

        <View style={[styles.totalCard, { backgroundColor: p.glassSurface, borderColor: p.glassBorder }]}>
          <Text style={{ color: p.textSub, fontSize: 13 }}>
            {type === 'expense' ? '本月支出' : '本月收入'}
          </Text>
          <Text
            style={{
              color: p.text,
              fontSize: 30,
              fontWeight: '800',
              fontVariant: ['tabular-nums'],
              marginTop: 4,
            }}
          >
            ¥{centToThousand(type === 'expense' ? summary.expense : summary.income)}
          </Text>
          <Text style={{ color: p.textSub, fontSize: 12, marginTop: 2 }}>
            结余 ¥{centToThousand(summary.balance)}
          </Text>
        </View>

        <View style={[styles.seg, { backgroundColor: p.primaryMist }]}>
          {(['expense', 'income'] as const).map((t) => (
            <Pressable key={t} style={[styles.segBtn, type === t ? { backgroundColor: p.card } : null]} onPress={() => setType(t)}>
              <Text style={{ color: type === t ? p.primary : p.textSub, fontSize: 14, fontWeight: '600' }}>
                {t === 'expense' ? '支出排行' : '收入排行'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        {rank.list.length === 0 ? (
          <View style={styles.empty}>
            <MaterialCommunityIcons name="chart-donut" size={44} color={p.textSub} />
            <Text style={{ color: p.textSub, fontSize: 14, marginTop: 10 }}>本月暂无{type === 'expense' ? '支出' : '收入'}</Text>
          </View>
        ) : (
          rank.list.map((c, i) => {
            const pct = rank.grand > 0 ? (c.total / rank.grand) * 100 : 0;
            return (
              <Pressable
                key={c.id}
                style={[styles.rankItem, { backgroundColor: p.glassSurface, borderColor: p.glassBorder }]}
                android_ripple={{ color: p.border }}
                onPress={() =>
                  router.push({ pathname: '/category-detail', params: { categoryId: c.id } })
                }
              >
                <View style={styles.rankHead}>
                  <View style={styles.rankLeft}>
                    <Text style={{ color: p.textSub, fontSize: 12, width: 18 }}>{i + 1}</Text>
                    <View style={[styles.rankIcon, { backgroundColor: p.primaryMist }]}>
                      <MaterialCommunityIcons name={c.icon as any} size={18} color={p.primary} />
                    </View>
                    <Text style={{ color: p.text, fontSize: 15, fontWeight: '500' }}>{c.name}</Text>
                  </View>
                  <View style={styles.rankRight}>
                    <Text style={{ color: p.text, fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] }}>
                      ¥{centToThousand(c.total)}
                    </Text>
                    <Text style={{ color: p.textSub, fontSize: 12, marginLeft: 8, fontVariant: ['tabular-nums'] }}>
                      {pct.toFixed(0)}%
                    </Text>
                  </View>
                </View>
                <View style={[styles.track, { backgroundColor: 'rgba(23,43,77,0.08)' }]}>
                  <View style={[styles.fill, { backgroundColor: p.primary, width: `${Math.max(pct, 2)}%` }]} />
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
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
  },
  seg: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    marginTop: 12,
  },
  segBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  rankItem: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
  },
  rankHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rankLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rankRight: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  rankIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  track: {
    height: 6,
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
  empty: {
    alignItems: 'center',
    paddingTop: 80,
  },
});
