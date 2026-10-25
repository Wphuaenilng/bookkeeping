/**
 * 金额与自绘键盘的输入引擎。
 * 铁律:落库一律整数「分」,浮点只存在于输入过程的显示层,
 * 且每一步运算都四舍五入到 2 位小数,杜绝 0.1+0.2 问题。
 */

export const MAX_INTEGER_DIGITS = 7; // 整数部分最多 7 位(千万级)
export const MAX_DECIMALS = 2;

/** 输入引擎状态:base 是正在输入的操作数,acc/op 组成待结算的算式 */
export interface CalcState {
  base: string;
  acc: number | null;
  op: '+' | '-' | null;
}

export const emptyCalc: CalcState = { base: '', acc: null, op: null };

function parseBase(base: string): number {
  if (base === '' || base === '.') return 0;
  return parseFloat(base);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function appendDigit(base: string, d: string): string {
  const dotIndex = base.indexOf('.');
  if (dotIndex >= 0) {
    if (base.length - dotIndex - 1 >= MAX_DECIMALS) return base;
    return base + d;
  }
  if (base === '0') return d; // 前导 0 替换
  if (base.replace('-', '').length >= MAX_INTEGER_DIGITS) return base;
  return base + d;
}

/** 处理数字键盘按键,返回新状态。key: '0'-'9' | '.' | '00' | '+' | '-' | 'back' */
export function pressCalcKey(state: CalcState, key: string): CalcState {
  switch (key) {
    case '+':
    case '-': {
      const op = key as '+' | '-';
      if (state.base === '') {
        // 没有新操作数:只允许改运算符
        return state.acc === null || state.op === null ? state : { ...state, op };
      }
      if (state.acc === null || state.op === null) {
        return { base: '', acc: round2(parseBase(state.base)), op };
      }
      return { base: '', acc: round2(applyOp(state.acc, state.op, parseBase(state.base))), op };
    }
    case '.':
      if (state.base.indexOf('.') >= 0) return state;
      return { ...state, base: state.base === '' ? '0.' : state.base + '.' };
    case '00':
      return { ...state, base: appendDigit(appendDigit(state.base, '0'), '0') };
    case 'back': {
      if (state.base !== '') {
        return { ...state, base: state.base.slice(0, -1) };
      }
      if (state.op !== null) {
        return { ...state, op: null };
      }
      if (state.acc !== null) {
        // 把累计值放回继续编辑(去掉多余小数位)
        const s = String(state.acc);
        return { base: s, acc: null, op: null };
      }
      return state;
    }
    default: {
      if (!/^[0-9]$/.test(key)) return state;
      return { ...state, base: appendDigit(state.base, key) };
    }
  }
}

function applyOp(a: number, op: '+' | '-', b: number): number {
  return op === '+' ? a + b : a - b;
}

/** 当前有效金额(元,最多 2 位小数);无输入时为 0 */
export function calcResult(state: CalcState): number {
  if (state.acc === null) return round2(parseBase(state.base));
  if (state.op === null || state.base === '') return state.acc;
  return round2(applyOp(state.acc, state.op, parseBase(state.base)));
}

/** 是否有可保存的金额 */
export function calcHasValue(state: CalcState): boolean {
  return calcResult(state) > 0;
}

/** 金额显示串:无输入显示 '0';算式态显示 "12+3.5" */
export function calcDisplay(state: CalcState): string {
  if (state.acc === null) return state.base === '' ? '0' : state.base;
  const opStr = state.op ?? '';
  return `${trimNum(state.acc)}${opStr}${state.base}`;
}

/** 当前正在敲的算式尾部光标提示,如 "9+" */
export function calcEditingHint(state: CalcState): string | null {
  if (state.acc !== null && state.op !== null && state.base === '') {
    return `${trimNum(state.acc)} ${state.op}`;
  }
  return null;
}

/** 分 → 显示金额(去掉多余的 0):1250 -> '12.5', 1200 -> '12' */
export function centToDisplay(cent: number): string {
  const abs = Math.abs(cent);
  const s = (abs / 100).toFixed(2);
  return s.replace(/\.?0+$/, '');
}

/** 分 → 固定两位小数金额:1250 -> '12.50' */
export function centToFixed(cent: number): string {
  return (Math.abs(cent) / 100).toFixed(2);
}

/** 元(浮点,来自输入引擎) → 分 */
export function yuanToCent(yuan: number): number {
  return Math.round(yuan * 100);
}

/** 分 → 千分位带两位小数:1234567 -> '12,345.67'(概览/统计用) */
export function centToThousand(cent: number): string {
  const s = (Math.abs(cent) / 100).toFixed(2);
  const [int, dec] = s.split('.');
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec ? `${grouped}.${dec}` : grouped;
}

/** 分 → 纯数字字符串(导出 CSV 用,不带千分位) */
export function centToPlain(cent: number): string {
  return (Math.abs(cent) / 100).toFixed(2);
}

function trimNum(n: number): string {
  const s = n.toFixed(2);
  return s.replace(/\.?0+$/, '');
}
