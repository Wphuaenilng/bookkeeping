import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../theme/colors';
import { AuroraBackground } from '../../theme/AuroraBackground';
import { exportData } from '../../db/exportService';
import { useToastStore } from '../../store/uiStore';
import { useLedgerStore } from '../../store/ledgerStore';
import { allTransactionsForExport } from '../../db/transactionsRepo';

/** 我的页:数据安全绳(导出)+ 分类管理 + 项目边界说明 */
export default function ProfileScreen() {
  const p = useTheme();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);
  const txnCount = useLedgerStore((s) => s.transactions.length);

  const onExport = async (format: 'json' | 'csv') => {
    try {
      await exportData(format);
      showToast(`已生成 ${format.toUpperCase()},选择保存位置`);
    } catch (e) {
      showToast('导出失败,请重试');
    }
  };

  const rows: Array<{ icon: string; label: string; sub?: string; onPress: () => void }> = [
    {
      icon: 'code-json',
      label: '导出 JSON',
      sub: '完整备份,未来可导入恢复',
      onPress: () => onExport('json'),
    },
    {
      icon: 'file-delimited-outline',
      label: '导出 CSV',
      sub: '表格软件可直接打开',
      onPress: () => onExport('csv'),
    },
    {
      icon: 'shape-outline',
      label: '分类管理',
      sub: '增删改、排序、隐藏',
      onPress: () => router.push('/category-manage'),
    },
  ];

  return (
    <AuroraBackground>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={{ flex: 0 }} />
      <Text style={{ color: p.text, fontSize: 22, fontWeight: '800', paddingHorizontal: 16, paddingTop: 10 }}>
        我的
      </Text>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        <View style={[styles.card, { backgroundColor: p.glassSurface, borderColor: p.glassBorder }]}>
          <View style={styles.statRow}>
            <MaterialCommunityIcons name="database-outline" size={20} color={p.primary} />
            <Text style={{ color: p.text, fontSize: 14, marginLeft: 8 }}>
              本月 {txnCount} 笔流水 · 全部数据仅存本机
            </Text>
          </View>
          <Text style={{ color: p.textSub, fontSize: 12, marginTop: 8, lineHeight: 18 }}>
            定期导出 JSON 备份到网盘,配合手机自带云备份,数据更安全。v1.0 之前不做服务端。
          </Text>
        </View>

        <View style={[styles.group, { backgroundColor: p.glassSurface, borderColor: p.glassBorder }]}>
          {rows.map((r, i) => (
            <Pressable
              key={r.label}
              style={[styles.row, i > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: p.border } : null]}
              onPress={r.onPress}
              android_ripple={{ color: p.border }}
            >
              <MaterialCommunityIcons name={r.icon as any} size={22} color={p.primary} />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={{ color: p.text, fontSize: 15, fontWeight: '500' }}>{r.label}</Text>
                {r.sub ? <Text style={{ color: p.textSub, fontSize: 12, marginTop: 1 }}>{r.sub}</Text> : null}
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={p.textSub} />
            </Pressable>
          ))}
        </View>

        <View style={[styles.card, { backgroundColor: p.glassSurface, borderColor: p.glassBorder }]}>
          <Text style={{ color: p.text, fontSize: 14, fontWeight: '700' }}>关于轻记账 v0.1</Text>
          <Text style={{ color: p.textSub, fontSize: 12, marginTop: 8, lineHeight: 19 }}>
            个人日常流水记账 · 仅安卓。明确不做:注册登录、云同步、多币种、账单导入、OCR 扫小票、投资资产、家庭共享、会员、广告。
          </Text>
          <Text style={{ color: p.textSub, fontSize: 12, marginTop: 6, lineHeight: 19 }}>
            深色模式跟随系统。快速模板按最近 90 天记账频率自动生成。
          </Text>
        </View>
      </ScrollView>
    </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  group: {
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 14,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
