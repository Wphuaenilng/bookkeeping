import { create } from 'zustand';
import * as transactionsRepo from '../db/transactionsRepo';
import { currentMonth, isSameMonth } from '../utils/date';
import type { MonthSummary, QuickTemplate, TransactionWithCategory } from '../types';

interface LedgerState {
  /** 当前查看的月份 'YYYY-MM' */
  month: string;
  transactions: TransactionWithCategory[];
  summary: MonthSummary;
  templates: QuickTemplate[];
  setMonth: (month: string) => void;
  /** 保存/删除后统一刷新(列表 + 概览 + 快速模板) */
  refresh: () => void;
  /** 新记的流水若不在当前查看的月份,切过去让用户看得见 */
  revealDate: (dateStr: string) => void;
  /** 列表左滑删除(无确认) */
  softDeleteRow: (id: string) => void;
  /** 撤销列表删除 */
  undoDeleteRow: (id: string) => void;
}

const emptySummary: MonthSummary = { expense: 0, income: 0, balance: 0 };

export const useLedgerStore = create<LedgerState>((set, get) => ({
  month: currentMonth(),
  transactions: transactionsRepo.listMonthTransactions(currentMonth()),
  summary: transactionsRepo.monthSummary(currentMonth()),
  templates: transactionsRepo.quickTemplates(),

  setMonth: (month) => {
    if (month === get().month) return;
    set({
      month,
      transactions: transactionsRepo.listMonthTransactions(month),
      summary: transactionsRepo.monthSummary(month),
    });
  },

  refresh: () => {
    const month = get().month;
    set({
      transactions: transactionsRepo.listMonthTransactions(month),
      summary: transactionsRepo.monthSummary(month),
      templates: transactionsRepo.quickTemplates(),
    });
  },

  revealDate: (dateStr) => {
    const month = get().month;
    if (!isSameMonth(dateStr, month)) {
      const next = dateStr.slice(0, 7);
      set({
        month: next,
        transactions: transactionsRepo.listMonthTransactions(next),
        summary: transactionsRepo.monthSummary(next),
      });
    }
  },

  softDeleteRow: (id) => {
    transactionsRepo.softDeleteTransaction(id);
    get().refresh();
  },

  undoDeleteRow: (id) => {
    transactionsRepo.restoreTransaction(id);
    get().refresh();
  },
}));
