import { create } from 'zustand';
import { emptyCalc, calcHasValue, calcResult, pressCalcKey, yuanToCent } from '../utils/money';
import { todayStr, yesterdayStr } from '../utils/date';
import { getEntrySnapshot, saveSnapshot } from '../db/settingsRepo';
import {
  insertTransaction,
  restoreTransaction,
  softDeleteTransaction,
  updateTransaction,
} from '../db/transactionsRepo';
import { pickDefaultCategoryId, useCategoryStore } from './categoryStore';
import { useLedgerStore } from './ledgerStore';
import { useToastStore } from './uiStore';
import { centToDisplay } from '../utils/money';
import type { Transaction, TxnType } from '../types';

export type EntryMode = 'closed' | 'new' | 'edit';
/** 录入两步流:先选分类,再输金额/备注 */
export type EntryStep = 'category' | 'amount';

/**
 * 录入面板状态机:金额输入引擎 + 分类 + 备注 + 日期。
 * 保存无弹窗:落库 → toast → 3 秒可撤销。
 */
interface EntryState {
  mode: EntryMode;
  step: EntryStep;
  type: TxnType;
  calc: typeof emptyCalc;
  categoryId: string | null;
  note: string;
  dateStr: string;
  editingId: string | null;
  /** 编辑前的原值,撤销时恢复 */
  editingOriginal: Transaction | null;

  openNew: () => void;
  openEdit: (txn: Transaction) => void;
  close: () => void;
  setStep: (step: EntryStep) => void;
  pressKey: (key: string) => void;
  clearCalc: () => void;
  setType: (type: TxnType) => void;
  setCategory: (id: string) => void;
  setNote: (note: string) => void;
  setDate: (dateStr: string) => void;
  /** 「今天」键:今天 → 昨天 → (组件层)弹日历;自定义日期 → 回今天 */
  cycleDate: () => 'open-calendar' | null;
  save: () => boolean;
  /** 编辑态里删除:软删 + toast 撤销 */
  deleteEditing: () => void;
}

/** 由快照决定打开时的类型与分类(默认值继承);preferred 优先于快照 */
function initialPick(preferred?: TxnType): { type: TxnType; categoryId: string | null } {
  const snap = getEntrySnapshot();
  const t = preferred ?? snap.lastType ?? 'expense';
  return { type: t, categoryId: pickDefaultCategoryId(t, snap.lastCategoryId[t]) };
}

export const useEntryStore = create<EntryState>((set, get) => ({
  mode: 'closed',
  step: 'category',
  type: 'expense',
  calc: emptyCalc,
  categoryId: null,
  note: '',
  dateStr: todayStr(),
  editingId: null,
  editingOriginal: null,

  openNew: () => {
    const pick = initialPick();
    set({
      mode: 'new',
      step: 'category', // 点记账先进分类选择
      type: pick.type,
      categoryId: pick.categoryId,
      calc: emptyCalc,
      note: '',
      dateStr: todayStr(),
      editingId: null,
      editingOriginal: null,
    });
  },

  openEdit: (txn) => {
    // 金额转回可编辑字符串(去掉小数尾巴)
    const yuan = txn.amount_cent / 100;
    const base = yuan.toFixed(2).replace(/\.?0+$/, '');
    set({
      mode: 'edit',
      step: 'amount', // 编辑直接进金额步
      type: txn.type,
      categoryId: txn.category_id,
      calc: { base, acc: null, op: null },
      note: txn.note,
      dateStr: txn.occurred_date,
      editingId: txn.id,
      editingOriginal: txn,
    });
  },

  close: () => set({ mode: 'closed', step: 'category', editingId: null, editingOriginal: null }),

  setStep: (step) => set({ step }),

  pressKey: (key) => set((s) => ({ calc: pressCalcKey(s.calc, key) })),

  clearCalc: () => set({ calc: emptyCalc }),

  setType: (type) => {
    const { type: curType, categoryId, step } = get();
    if (type === curType) return;
    // 切类型时:若当前分类不属于新类型,带入新类型的上次分类,并回到分类步
    const cats = useCategoryStore.getState().visible;
    const keep = categoryId && cats.some((c) => c.id === categoryId && c.type === type);
    const snap = getEntrySnapshot();
    set({
      type,
      categoryId: keep ? categoryId : pickDefaultCategoryId(type, snap.lastCategoryId[type]),
      step: step === 'amount' && !keep ? 'category' : step,
    });
  },

  setCategory: (id) => set({ categoryId: id, step: 'amount' }), // 选完分类弹键盘

  setNote: (note) => set({ note }),

  setDate: (dateStr) => set({ dateStr }),

  cycleDate: () => {
    const cur = get().dateStr;
    if (cur === todayStr()) {
      set({ dateStr: yesterdayStr() });
      return null;
    }
    if (cur === yesterdayStr()) {
      return 'open-calendar'; // 再深才弹日历
    }
    set({ dateStr: todayStr() });
    return null;
  },

  save: () => {
    const s = get();
    if (s.mode === 'closed') return false;
    if (!calcHasValue(s.calc)) return false;
    const amountCent = yuanToCent(calcResult(s.calc));
    if (amountCent <= 0 || !s.categoryId) return false;

    if (s.mode === 'edit' && s.editingId) {
      const original = s.editingOriginal;
      updateTransaction(s.editingId, {
        type: s.type,
        amount_cent: amountCent,
        category_id: s.categoryId,
        note: s.note,
        occurred_date: s.dateStr,
      });
      saveSnapshot(s.type, s.categoryId);
      useLedgerStore.getState().revealDate(s.dateStr);
      useLedgerStore.getState().refresh();
      useToastStore.getState().showToast(`已更新 ¥${centToDisplay(amountCent)}`, () => {
        if (!original) return;
        updateTransaction(original.id, {
          type: original.type,
          amount_cent: original.amount_cent,
          category_id: original.category_id,
          note: original.note,
          occurred_date: original.occurred_date,
        });
        useLedgerStore.getState().refresh();
      });
    } else {
      const txn = insertTransaction({
        type: s.type,
        amount_cent: amountCent,
        category_id: s.categoryId,
        note: s.note,
        occurred_date: s.dateStr,
      });
      saveSnapshot(s.type, s.categoryId);
      useLedgerStore.getState().revealDate(s.dateStr);
      useLedgerStore.getState().refresh();
      useToastStore.getState().showToast(`已记一笔 ¥${centToDisplay(amountCent)}`, () => {
        softDeleteTransaction(txn.id);
        useLedgerStore.getState().refresh();
      });
    }

    set({ mode: 'closed', step: 'category', editingId: null, editingOriginal: null });
    return true;
  },

  deleteEditing: () => {
    const s = get();
    if (s.mode !== 'edit' || !s.editingId || !s.editingOriginal) return;
    const original = s.editingOriginal;
    softDeleteTransaction(original.id);
    useLedgerStore.getState().refresh();
    set({ mode: 'closed', step: 'category', editingId: null, editingOriginal: null });
    useToastStore.getState().showToast('已删除', () => {
      restoreTransaction(original.id);
      useLedgerStore.getState().refresh();
    });
  },
}));

/** 快速模板:一键记一笔 */
export function saveByTemplate(tpl: { type: TxnType; amount_cent: number; categoryId: string }): void {
  const txn = insertTransaction({
    type: tpl.type,
    amount_cent: tpl.amount_cent,
    category_id: tpl.categoryId,
    note: '',
    occurred_date: todayStr(),
  });
  saveSnapshot(tpl.type, tpl.categoryId);
  const ledger = useLedgerStore.getState();
  ledger.revealDate(txn.occurred_date);
  ledger.refresh();
  useToastStore.getState().showToast(`已记一笔 ¥${centToDisplay(tpl.amount_cent)}`, () => {
    softDeleteTransaction(txn.id);
    useLedgerStore.getState().refresh();
  });
}
