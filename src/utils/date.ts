import dayjs from 'dayjs';

export const DATE_FMT = 'YYYY-MM-DD';

export function todayStr(): string {
  return dayjs().format(DATE_FMT);
}

export function yesterdayStr(): string {
  return dayjs().subtract(1, 'day').format(DATE_FMT);
}

/** 'YYYY-MM-DD' -> 'M月D日' */
export function formatMD(dateStr: string): string {
  return dayjs(dateStr).format('M月D日');
}

/** 'YYYY-MM-DD' -> '今天' / '昨天' / 'M月D日 周X' */
export function friendlyDate(dateStr: string): string {
  if (dateStr === todayStr()) return '今天';
  if (dateStr === yesterdayStr()) return '昨天';
  const week = ['日', '一', '二', '三', '四', '五', '六'][dayjs(dateStr).day()];
  return `${formatMD(dateStr)} 周${week}`;
}

/** 'YYYY-MM' -> 'YYYY年M月' */
export function formatYM(month: string): string {
  return dayjs(`${month}-01`).format('YYYY年M月');
}

/** 'YYYY-MM' -> 'YYYY年'(概览月份块第一行) */
export function formatYear(month: string): string {
  return dayjs(`${month}-01`).format('YYYY年');
}

/** 'YYYY-MM' -> '10月'(概览月份块第二行大字) */
export function formatMonthShort(month: string): string {
  return dayjs(`${month}-01`).format('M月');
}

/** 当前月份 'YYYY-MM' */
export function currentMonth(): string {
  return dayjs().format('YYYY-MM');
}

/** 月份加减:'2026-10' + 1 -> '2026-11' */
export function shiftMonth(month: string, delta: number): string {
  return dayjs(`${month}-01`).add(delta, 'month').format('YYYY-MM');
}

/** 日期所在月份 'YYYY-MM' */
export function monthOf(dateStr: string): string {
  return dateStr.slice(0, 7);
}

export function isSameMonth(a: string, b: string): boolean {
  return monthOf(a) === monthOf(b);
}
