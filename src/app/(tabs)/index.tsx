import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/colors';
import { AuroraBackground } from '../../theme/AuroraBackground';
import { useLedgerStore } from '../../store/ledgerStore';
import { useEntryStore, saveByTemplate } from '../../store/entryStore';
import { useToastStore } from '../../store/uiStore';
import { centToThousand } from '../../utils/money';
import { formatYear, formatMonthShort } from '../../utils/date';
import AmountBar from '../../components/AmountBar';
import CategoryGrid from '../../components/CategoryGrid';
import NumericKeyboard from '../../components/NumericKeyboard';
import TransactionList from '../../components/TransactionList';
import DatePickerModal from '../../components/DatePickerModal';
import MonthPickerModal from '../../components/MonthPickerModal';
import NoteBar from '../../components/NoteBar';
import type { TransactionWithCategory } from '../../types';

/**
 * 定稿主界面:明细+录入同屏。
 * 顶部「支出/收入」切换 + 本月概览,中部按天分组流水,
 * 底部金额备注栏 + 自绘键盘常驻(列表态直接按数字即开记)。
 */
export default function HomeScreen() {
  const p = useTheme();
  const router = useRouter();

  const month = useLedgerStore((s) => s.month);
  const transactions = useLedgerStore((s) => s.transactions);
  const summary = useLedgerStore((s) => s.summary);
  const templates = useLedgerStore((s) => s.templates);
  const setMonth = useLedgerStore((s) => s.setMonth);

  const mode = useEntryStore((s) => s.mode);
  const step = useEntryStore((s) => s.step);
  const type = useEntryStore((s) => s.type);
  const dateStr = useEntryStore((s) => s.dateStr);
  const note = useEntryStore((s) => s.note);
  const setType = useEntryStore((s) => s.setType);
  const setNote = useEntryStore((s) => s.setNote);
  const setDate = useEntryStore((s) => s.setDate);
  const setStep = useEntryStore((s) => s.setStep);
  const openNew = useEntryStore((s) => s.openNew);
  const openEdit = useEntryStore((s) => s.openEdit);
  const close = useEntryStore((s) => s.close);

  const showToast = useToastStore((s) => s.showToast);

  const [calendarVisible, setCalendarVisible] = useState(false);
  const [noteEditing, setNoteEditing] = useState(false);
  const [monthPickerVisible, setMonthPickerVisible] = useState(false);

  useEffect(() => {
    useLedgerStore.getState().refresh();
  }, []);

  const entryOpen = mode !== 'closed';

  const onRowTap = (txn: TransactionWithCategory) => {
    if (entryOpen) return;
    openEdit(txn);
  };

  const onRowDelete = (txn: TransactionWithCategory) => {
    if (entryOpen) return;
    // 列表左滑删除:无确认,可撤销
    useLedgerStore.getState().softDeleteRow(txn.id);
    showToast('已删除', () => {
      useLedgerStore.getState().undoDeleteRow(txn.id);
    });
  };

  return (
    <AuroraBackground>
      <StatusBar style="light" />
      <LinearGradient colors={p.headerGrad} style={styles.header}>
        <SafeAreaView edges={['top']} style={{ flex: 0 }}>
          {/* 列表态=App 标题;录入态=支出/收入切换 + 取消(切换只在记账页出现) */}
          {entryOpen ? (
            <View style={styles.switchRow}>
              <View style={styles.switchTabs}>
                {(['expense', 'income'] as const).map((t) => {
                  const active = type === t;
                  return (
                    <Pressable
                      key={t}
                      hitSlop={6}
                      onPress={() => setType(t)}
                      style={styles.tabBtn}
                    >
                      <Text
                        style={{
                          color: '#FFFFFF',
                          fontSize: 18,
                          fontWeight: active ? '800' : '400',
                          opacity: active ? 1 : 0.75,
                        }}
                      >
                        {t === 'expense' ? '支出' : '收入'}
                      </Text>
                      <View style={[styles.tabUnderline, { opacity: active ? 1 : 0 }]} />
                    </Pressable>
                  );
                })}
              </View>
              <Pressable style={styles.cancelBtn} hitSlop={8} onPress={close}>
                <Text style={{ color: '#FFFFFF', fontSize: 15 }}>取消</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.titleRow}>
              <Text style={styles.titleText}>轻记账</Text>
            </View>
          )}

          {/* 月份块 + 概览三列(参照鲨鱼记账样式:label 上、数值下,一律单行不换行) */}
          <View style={styles.overviewRow}>
            <Pressable style={styles.monthBlock} onPress={() => setMonthPickerVisible(true)}>
              <Text style={styles.monthYear}>{formatYear(month)}</Text>
              <View style={styles.monthLine}>
                <Text style={styles.monthLabel}>{formatMonthShort(month)}</Text>
                <MaterialCommunityIcons name="chevron-down" size={17} color="#FFFFFF" />
              </View>
            </Pressable>
            <Pressable style={styles.statCol} onPress={() => router.push({ pathname: '/stats', params: { type: 'income' } })}>
              <Text style={styles.statLabel}>收入</Text>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                {centToThousand(summary.income)}
              </Text>
            </Pressable>
            <Pressable style={styles.statCol} onPress={() => router.push({ pathname: '/stats', params: { type: 'expense' } })}>
              <Text style={styles.statLabel}>支出</Text>
              <Text style={styles.statValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
                {centToThousand(summary.expense)}
              </Text>
            </Pressable>
          </View>

          {/* 快速模板:一键记一笔(按使用频率自动生成) */}
          {!entryOpen && templates.length > 0 ? (
            <View style={styles.tplRow}>
              {templates.slice(0, 4).map((t) => (
                <Pressable
                  key={`${t.categoryId}-${t.amount_cent}`}
                  style={[styles.tplChip, { backgroundColor: 'rgba(255,255,255,0.24)', borderColor: 'rgba(255,255,255,0.45)', borderWidth: 1 }]}
                  onPress={() =>
                    saveByTemplate({ type: t.type, amount_cent: t.amount_cent, categoryId: t.categoryId })
                  }
                >
                  <MaterialCommunityIcons name={t.categoryIcon as any} size={13} color="#FFFFFF" />
                  <Text style={{ color: '#FFFFFF', fontSize: 12 }}>
                    {t.categoryName} ¥{(t.amount_cent / 100).toFixed(2).replace(/\.?0+$/, '')}
                  </Text>
                </Pressable>
              ))}
            </View>
          ) : null}
        </SafeAreaView>
      </LinearGradient>

      {/* 中部:列表态=流水;分类步=全屏宫格;金额步=留白给键盘区 */}
      <View style={{ flex: 1 }}>
        {!entryOpen ? (
          <TransactionList
            transactions={transactions}
            onRowTap={onRowTap}
            onRowDelete={onRowDelete}
            onScroll={() => useToastStore.getState().dismiss()}
          />
        ) : step === 'category' ? (
          <CategoryGrid />
        ) : null}
      </View>

      {/* 底部:仅金额步显示;备注编辑时切换为行内输入条(系统键盘顶起) */}
      {entryOpen && step === 'amount' ? (
        <View style={[styles.entryDock, { backgroundColor: p.dockSurface, borderTopColor: p.glassBorder }]}>
          {noteEditing ? (
            <NoteBar
              value={note}
              onDone={(n) => {
                setNote(n);
                setNoteEditing(false);
              }}
            />
          ) : (
            <>
              <AmountBar
                onOpenNote={() => setNoteEditing(true)}
                onOpenCalendar={() => {
                  // 日期胶囊循环:今天 → 昨天 → 再点弹日历(唯一日期入口,不与键盘重复)
                  if (useEntryStore.getState().cycleDate() === 'open-calendar') setCalendarVisible(true);
                }}
                onCategoryPress={() => setStep('category')}
              />
              <NumericKeyboard />
            </>
          )}
        </View>
      ) : null}

      <MonthPickerModal
        visible={monthPickerVisible}
        value={month}
        onPick={(m) => {
          setMonth(m);
          setMonthPickerVisible(false);
        }}
        onClose={() => setMonthPickerVisible(false)}
      />
      <DatePickerModal
        visible={calendarVisible}
        value={dateStr}
        onPick={(d) => {
          setDate(d);
          setCalendarVisible(false);
        }}
        onClose={() => setCalendarVisible(false)}
      />
    </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingBottom: 10,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
  },
  titleRow: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '800',
    letterSpacing: 2,
  },
  switchTabs: {
    flexDirection: 'row',
    gap: 28,
  },
  tabBtn: {
    alignItems: 'center',
  },
  tabUnderline: {
    marginTop: 3,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#FFFFFF',
  },
  cancelBtn: {
    position: 'absolute',
    right: 16,
  },
  overviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  monthBlock: {
    width: 82,
  },
  monthYear: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
  },
  monthLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthLabel: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  statCol: {
    flex: 1,
    minWidth: 0,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    marginTop: 1,
  },
  tplRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  tplChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    height: 26,
    borderRadius: 13,
  },
  entryDock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
});
