import { create } from 'zustand';

/** 全局 Toast:落库 → toast → 3 秒可撤销 */
interface ToastState {
  id: number;
  visible: boolean;
  message: string;
  undo: (() => void) | null;
  showToast: (message: string, undo?: () => void) => void;
  dismiss: () => void;
  runUndo: () => void;
}

let toastTimer: ReturnType<typeof setTimeout> | null = null;
let toastSeq = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  id: 0,
  visible: false,
  message: '',
  undo: null,
  showToast: (message, undo) => {
    if (toastTimer) clearTimeout(toastTimer);
    toastSeq += 1;
    set({ id: toastSeq, visible: true, message, undo: undo ?? null });
    toastTimer = setTimeout(() => {
      set({ visible: false, undo: null });
      toastTimer = null;
    }, 3000);
  },
  dismiss: () => {
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = null;
    set({ visible: false, undo: null });
  },
  runUndo: () => {
    const { undo } = get();
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = null;
    set({ visible: false, undo: null });
    undo?.();
  },
}));
