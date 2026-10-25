import { useEffect, useRef } from 'react';
import { Animated, PanResponder, Pressable, SectionList, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import type { TransactionWithCategory } from '../types';
import { centToDisplay } from '../utils/money';
import { friendlyDate } from '../utils/date';
import { groupByDay } from '../utils/group';
import { useTheme } from '../theme/colors';

const DELETE_W = 76;

/** 同一时间只允许一行处于展开态 */
let closeActiveRow: (() => void) | null = null;

/** 单条流水:左滑删除(无确认,可撤销),点击进入编辑 */
function SwipeRow({
  txn,
  onTap,
  onDelete,
}: {
  txn: TransactionWithCategory;
  onTap: () => void;
  onDelete: () => void;
}) {
  const p = useTheme();
  const translateX = useRef(new Animated.Value(0)).current;
  const openRef = useRef(false);

  function closeRow() {
    snapTo(false);
  }

  const snapTo = (open: boolean, animate = true) => {
    openRef.current = open;
    if (open) {
      if (closeActiveRow && closeActiveRow !== closeRow) closeActiveRow();
      closeActiveRow = closeRow;
    } else if (closeActiveRow === closeRow) {
      closeActiveRow = null;
    }
    Animated.spring(translateX, {
      toValue: open ? -DELETE_W : 0,
      useNativeDriver: true,
      speed: animate ? 20 : 1000,
      bounciness: 0,
    }).start();
  };

  useEffect(() => closeRow, []);

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 10 && Math.abs(g.dy) < 10,
      onPanResponderGrant: () => {
        if (closeActiveRow && closeActiveRow !== closeRow) closeActiveRow();
      },
      onPanResponderMove: (_e, g) => {
        const next = Math.min(0, Math.max(-DELETE_W - 30, g.dx));
        translateX.setValue(next);
      },
      onPanResponderRelease: (_e, g) => {
        snapTo(g.dx < -DELETE_W * 0.4 || g.vx < -0.8);
      },
      onPanResponderTerminate: () => snapTo(false),
    }),
  ).current;

  const isExpense = txn.type === 'expense';
  /** 删除底衬只在左滑时淡入,合拢状态下完全不露边 */
  const underlayOpacity = translateX.interpolate({
    inputRange: [-DELETE_W, 0],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  return (
    <View collapsable={false}>
      <Animated.View style={[styles.rowUnderlay, { opacity: underlayOpacity }]}>
        <Pressable
          style={[styles.deleteBtn, { backgroundColor: p.danger }]}
          onPress={() => {
            snapTo(false, false);
            onDelete();
          }}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={20} color="#FFFFFF" />
          <Text style={{ color: '#FFFFFF', fontSize: 12, marginTop: 2 }}>删除</Text>
        </Pressable>
      </Animated.View>
      <Animated.View
        style={[styles.row, { backgroundColor: p.glassSurface, borderColor: p.glassBorder, transform: [{ translateX }] }]}
        {...pan.panHandlers}
      >
        <Pressable style={styles.rowContent} onPress={() => (openRef.current ? snapTo(false) : onTap())}>
          <View style={[styles.iconCircle, { backgroundColor: p.primaryMist }]}>
            <MaterialCommunityIcons name={txn.category_icon as any} size={20} color={p.primary} />
          </View>
          <View style={styles.middle}>
            <Text style={{ color: p.text, fontSize: 15, fontWeight: '500' }} numberOfLines={1}>
              {txn.category_name}
            </Text>
            {txn.note ? (
              <Text style={{ color: p.textSub, fontSize: 12, marginTop: 2 }} numberOfLines={1}>
                {txn.note}
              </Text>
            ) : null}
          </View>
          <Text
            style={{ color: p.text, fontSize: 16, fontWeight: '700', fontVariant: ['tabular-nums'] }}
          >
            {isExpense ? '-' : '+'}¥{centToDisplay(txn.amount_cent)}
          </Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

/** 按天分组的流水列表:当天总额置顶 */
export function TransactionList({
  transactions,
  onRowTap,
  onRowDelete,
  onEndReached,
  onScroll,
}: {
  transactions: TransactionWithCategory[];
  onRowTap: (txn: TransactionWithCategory) => void;
  onRowDelete: (txn: TransactionWithCategory) => void;
  onEndReached?: () => void;
  onScroll?: () => void;
}) {
  const p = useTheme();
  const sections = groupByDay(transactions);

  return (
    <SectionList
      sections={sections}
      keyExtractor={(item) => item.id}
      stickySectionHeadersEnabled={false}
      contentContainerStyle={{ paddingBottom: 96, paddingHorizontal: 12 }}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      onScrollBeginDrag={onScroll}
      renderSectionHeader={({ section }) => (
        <View style={styles.dayHeader}>
          <Text style={{ color: p.textSub, fontSize: 13, fontWeight: '600' }}>{friendlyDate(section.date)}</Text>
          {section.expenseCent > 0 ? (
            <Text style={{ color: p.textSub, fontSize: 12, fontVariant: ['tabular-nums'] }}>
              支出 ¥{centToDisplay(section.expenseCent)}
            </Text>
          ) : null}
        </View>
      )}
      renderItem={({ item }) => (
        <View style={[styles.itemWrap, { borderColor: p.border }]}>
          <SwipeRow txn={item} onTap={() => onRowTap(item)} onDelete={() => onRowDelete(item)} />
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <MaterialCommunityIcons name="notebook-outline" size={44} color={p.textSub} />
          <Text style={{ color: p.textSub, fontSize: 14, marginTop: 10 }}>本月暂无流水,点 + 记一笔</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  itemWrap: {
    marginBottom: 6,
  },
  rowUnderlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  deleteBtn: {
    width: DELETE_W,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  row: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  rowContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  dayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 64,
  },
});

export default TransactionList;
