import { create } from 'zustand';
import * as categoriesRepo from '../db/categoriesRepo';
import type { Category, TxnType } from '../types';

interface CategoryState {
  /** 可见分类(宫格用) */
  visible: Category[];
  /** 全部分类(管理页用,含隐藏) */
  all: Category[];
  refresh: () => void;
}

export const useCategoryStore = create<CategoryState>((set) => ({
  visible: categoriesRepo.listCategories(true),
  all: categoriesRepo.listCategories(false),
  refresh: () => {
    set({
      visible: categoriesRepo.listCategories(true),
      all: categoriesRepo.listCategories(false),
    });
  },
}));

/** 取某类型下默认选中的分类:优先上次用过的 */
export function pickDefaultCategoryId(type: TxnType, lastId: string | null): string | null {
  const cats = useCategoryStore.getState().visible.filter((c) => c.type === type);
  if (lastId && cats.some((c) => c.id === lastId)) return lastId;
  return cats[0]?.id ?? null;
}
