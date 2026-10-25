import { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/colors';
import { AuroraBackground } from '../theme/AuroraBackground';
import * as categoriesRepo from '../db/categoriesRepo';
import { useCategoryStore } from '../store/categoryStore';
import { useToastStore } from '../store/uiStore';
import type { Category, TxnType } from '../types';

const ICON_CHOICES = [
  'silverware-fork-knife', 'bus', 'shopping', 'home-city', 'gamepad-variant',
  'medical-bag', 'gift-outline', 'laptop', 'book-open-variant', 'dots-horizontal',
  'coffee-outline', 'car-outline', 'airplane', 'pill', 'tshirt-crew-outline',
  'phone-outline', 'music-note-outline', 'basketball', 'dog-side', 'cash',
  'trending-up', 'piggy-bank-outline', 'school-outline', 'cart-outline',
];

/** 分类管理:增删改排序;有流水的分类删除转为隐藏,历史数据不失去归属 */
export default function CategoryManageScreen() {
  const p = useTheme();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);
  const refresh = useCategoryStore((s) => s.refresh);
  const all = useCategoryStore((s) => s.all);
  const [tab, setTab] = useState<TxnType>('expense');
  const [editing, setEditing] = useState<Category | null>(null);
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftIcon, setDraftIcon] = useState(ICON_CHOICES[0]);

  const list = all.filter((c) => c.type === tab);

  const openCreate = () => {
    setDraftName('');
    setDraftIcon(ICON_CHOICES[0]);
    setCreating(true);
  };

  const openEdit = (c: Category) => {
    setDraftName(c.name);
    setDraftIcon(c.icon);
    setEditing(c);
  };

  const closeModal = () => {
    setCreating(false);
    setEditing(null);
  };

  const saveModal = () => {
    const name = draftName.trim();
    if (!name) {
      showToast('分类名不能为空');
      return;
    }
    if (editing) {
      categoriesRepo.updateCategory(editing.id, { name, icon: draftIcon, color: '#4A90E2' });
      showToast('已保存');
    } else {
      categoriesRepo.createCategory({ name, icon: draftIcon, color: '#4A90E2', type: tab });
      showToast('已添加');
    }
    refresh();
    closeModal();
  };

  const onDelete = (c: Category) => {
    const usage = categoriesRepo.categoryUsageCount(c.id);
    if (usage > 0) {
      Alert.alert('删除分类', `「${c.name}」已有 ${usage} 笔流水,将改为隐藏(历史记录不受影响)。要继续吗?`, [
        { text: '取消', style: 'cancel' },
        {
          text: '隐藏',
          onPress: () => {
            categoriesRepo.setCategoryHidden(c.id, true);
            refresh();
            showToast('已隐藏');
          },
        },
      ]);
    } else {
      Alert.alert('删除分类', `确定删除「${c.name}」?`, [
        { text: '取消', style: 'cancel' },
        {
          text: '删除',
          style: 'destructive',
          onPress: () => {
            categoriesRepo.deleteCategory(c.id);
            refresh();
            showToast('已删除');
          },
        },
      ]);
    }
  };

  const onMove = (c: Category, dir: 'up' | 'down') => {
    categoriesRepo.moveCategory(c.id, dir);
    refresh();
  };

  return (
    <AuroraBackground>
      <StatusBar style="dark" />
      <SafeAreaView edges={['top']} style={{ flex: 0 }} />
      {/* 头部 */}
      <View style={styles.header}>
        <Pressable hitSlop={10} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={p.text} />
        </Pressable>
        <Text style={{ color: p.text, fontSize: 18, fontWeight: '700' }}>分类管理</Text>
        <Pressable hitSlop={10} onPress={openCreate}>
          <MaterialCommunityIcons name="plus" size={26} color={p.primary} />
        </Pressable>
      </View>

      {/* 类型切换 */}
      <View style={[styles.seg, { backgroundColor: p.primaryMist, marginHorizontal: 16 }]}>
        {(['expense', 'income'] as const).map((t) => (
          <Pressable
            key={t}
            style={[styles.segBtn, tab === t ? { backgroundColor: p.card } : null]}
            onPress={() => setTab(t)}
          >
            <Text style={{ color: tab === t ? p.primary : p.textSub, fontSize: 14, fontWeight: '600' }}>
              {t === 'expense' ? '支出分类' : '收入分类'}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {list.map((c, i) => (
          <View key={c.id} style={[styles.row, { backgroundColor: p.glassSurface, borderColor: p.glassBorder }]}>
            <View style={[styles.iconCircle, { backgroundColor: p.primaryMist }]}>
              <MaterialCommunityIcons name={c.icon as any} size={20} color={p.primary} />
            </View>
            <Pressable style={{ flex: 1 }} onPress={() => openEdit(c)}>
              <Text style={{ color: p.text, fontSize: 15, fontWeight: '500' }}>{c.name}</Text>
              {c.hidden ? <Text style={{ color: p.textSub, fontSize: 11 }}>已隐藏</Text> : null}
            </Pressable>
            <Pressable hitSlop={10} onPress={() => onMove(c, 'up')} disabled={i === 0}>
              <MaterialCommunityIcons
                name="arrow-up"
                size={20}
                color={i === 0 ? p.border : p.textSub}
              />
            </Pressable>
            <Pressable hitSlop={10} onPress={() => onMove(c, 'down')} disabled={i === list.length - 1} style={{ marginHorizontal: 10 }}>
              <MaterialCommunityIcons
                name="arrow-down"
                size={20}
                color={i === list.length - 1 ? p.border : p.textSub}
              />
            </Pressable>
            <Pressable hitSlop={10} onPress={() => onDelete(c)}>
              <MaterialCommunityIcons name="trash-can-outline" size={20} color={p.danger} />
            </Pressable>
          </View>
        ))}
        {list.length === 0 ? (
          <Text style={{ color: p.textSub, textAlign: 'center', marginTop: 40 }}>暂无分类,点右上角 + 添加</Text>
        ) : null}
      </ScrollView>

      {/* 新增/编辑弹窗 */}
      <Modal transparent visible={creating || !!editing} animationType="fade" onRequestClose={closeModal}>
        <Pressable style={styles.mask} onPress={closeModal}>
          <Pressable style={[styles.modalCard, { backgroundColor: p.card }]} onPress={(e) => e.stopPropagation()}>
            <Text style={{ color: p.text, fontSize: 17, fontWeight: '700', marginBottom: 14 }}>
              {editing ? '编辑分类' : `新增${tab === 'expense' ? '支出' : '收入'}分类`}
            </Text>
            <TextInput
              style={{
                color: p.text,
                backgroundColor: p.bg,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                fontSize: 15,
              }}
              value={draftName}
              placeholder="分类名称"
              placeholderTextColor={p.textSub}
              maxLength={8}
              onChangeText={setDraftName}
            />
            <Text style={{ color: p.textSub, fontSize: 12, marginTop: 12, marginBottom: 6 }}>图标</Text>
            <View style={styles.iconGrid}>
              {ICON_CHOICES.map((ic) => (
                <Pressable
                  key={ic}
                  style={[
                    styles.iconCell,
                    { backgroundColor: draftIcon === ic ? p.primary : p.bg },
                  ]}
                  onPress={() => setDraftIcon(ic)}
                >
                  <MaterialCommunityIcons name={ic as any} size={20} color={draftIcon === ic ? '#FFFFFF' : p.textSub} />
                </Pressable>
              ))}
            </View>
            <View style={styles.modalActions}>
              <Pressable hitSlop={8} onPress={closeModal}>
                <Text style={{ color: p.textSub, fontSize: 15 }}>取消</Text>
              </Pressable>
              <Pressable hitSlop={8} onPress={saveModal}>
                <Text style={{ color: p.primary, fontSize: 15, fontWeight: '700' }}>保存</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </AuroraBackground>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  seg: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  segBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 8,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  mask: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    borderRadius: 16,
    padding: 16,
    alignSelf: 'stretch',
    maxHeight: '86%',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  iconCell: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 24,
    marginTop: 18,
  },
});
