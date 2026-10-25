import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { useTheme } from '../theme/colors';
import { useCategoryStore } from '../store/categoryStore';
import { useEntryStore } from '../store/entryStore';
import * as categoriesRepo from '../db/categoriesRepo';
import { useToastStore } from '../store/uiStore';
import type { Category } from '../types';

/**
 * 全屏分类选择(录入第一步):4 列圆形图标宫格。
 * 末尾固定「添加」入口跳分类管理;长按分类可编辑/删除。
 */
export function CategoryGrid() {
  const p = useTheme();
  const router = useRouter();
  const showToast = useToastStore((s) => s.showToast);
  const type = useEntryStore((s) => s.type);
  const categoryId = useEntryStore((s) => s.categoryId);
  const setCategory = useEntryStore((s) => s.setCategory);
  const refreshCategories = useCategoryStore((s) => s.refresh);
  const categories = useCategoryStore((s) => s.visible).filter((c) => c.type === type);

  const onLongPress = (c: Category) => {
    Alert.alert(c.name, '管理这个分类', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除',
        style: 'destructive',
        onPress: () => {
          const r = categoriesRepo.deleteCategory(c.id);
          refreshCategories();
          showToast(r.deleted ? '已删除' : '该分类有流水,已改为隐藏');
        },
      },
      { text: '编辑', onPress: () => router.push('/category-manage') },
    ]);
  };

  const data = [...categories, 'ADD' as const];

  return (
    <FlatList
      data={data}
      keyExtractor={(item) => (item === 'ADD' ? '__add__' : item.id)}
      numColumns={4}
      contentContainerStyle={styles.grid}
      keyboardShouldPersistTaps="handled"
      renderItem={({ item }) => {
        if (item === 'ADD') {
          return (
            <Pressable style={styles.cell} onPress={() => router.push('/category-manage')}>
              <View style={[styles.circle, { backgroundColor: 'transparent', borderWidth: 1.5, borderStyle: 'dashed', borderColor: p.primarySoft }]}>
                <MaterialCommunityIcons name="plus" size={26} color={p.primary} />
              </View>
              <Text style={{ color: p.primary, fontSize: 12, fontWeight: '600' }}>添加</Text>
            </Pressable>
          );
        }
        const selected = item.id === categoryId;
        return (
          <Pressable
            style={styles.cell}
            onPress={() => setCategory(item.id)}
            onLongPress={() => onLongPress(item)}
            android_ripple={{ color: 'transparent' }}
          >
            <View
              style={[
                styles.circle,
                {
                  backgroundColor: selected ? p.primary : 'rgba(255,255,255,0.6)',
                  borderWidth: selected ? 0 : 1,
                  borderColor: p.border,
                },
              ]}
            >
              <MaterialCommunityIcons name={item.icon as any} size={26} color={selected ? '#FFFFFF' : p.primary} />
            </View>
            <Text style={{ color: selected ? p.primaryDeep : p.textSub, fontSize: 13, fontWeight: selected ? '700' : '400' }} numberOfLines={1}>
              {item.name}
            </Text>
          </Pressable>
        );
      }}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Text style={{ color: p.textSub, fontSize: 13 }}>该类型暂无分类,点下方「添加」创建</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  grid: {
    paddingHorizontal: 12,
    paddingVertical: 18,
  },
  cell: {
    width: '25%',
    alignItems: 'center',
    marginBottom: 22,
  },
  circle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  empty: {
    padding: 24,
    alignItems: 'center',
  },
});

export default CategoryGrid;
