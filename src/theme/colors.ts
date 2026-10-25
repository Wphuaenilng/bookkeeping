import { useColorScheme } from 'react-native';
import { Platform, ViewStyle } from 'react-native';

/**
 * 视觉语言:极简主义 + 毛玻璃拟态 + 柔和极光渐变 + 瑞士排版。
 * 主色天蓝,头部与背景为柔和极光渐变,表面一律半透明玻璃 + 高光描边。
 */
export interface Palette {
  bg: string;
  card: string;
  primary: string;
  primaryDeep: string;
  primarySoft: string;
  primaryMist: string;
  text: string;
  textSub: string;
  textHeavy: string;
  border: string;
  danger: string;
  toastBg: string;
  toastText: string;
  /** 头部极光渐变(蓝→紫,柔和) */
  headerGrad: [string, string, string];
  /** 页面极光背景(很浅的三段渐变) */
  auroraBg: [string, string, string];
  /** 毛玻璃表面 */
  glassSurface: string;
  glassBorder: string;
  /** 底部 Dock(键盘/备注)表面,略高不透明度保证可读 */
  dockSurface: string;
  keyText: string;
}

const light: Palette = {
  bg: '#F3F7FC',
  card: '#FFFFFF',
  primary: '#4E8FE8',
  primaryDeep: '#2F6FB8',
  primarySoft: '#7FB3F0',
  primaryMist: 'rgba(78, 143, 232, 0.12)',
  text: '#17233D',
  textSub: '#7A8699',
  textHeavy: '#0B1424',
  border: 'rgba(23, 43, 77, 0.07)',
  danger: '#E5484D',
  toastBg: 'rgba(20, 32, 56, 0.82)',
  toastText: '#FFFFFF',
  headerGrad: ['#5FA5F7', '#7E90F2', '#A48FF2'],
  auroraBg: ['#EAF3FF', '#F0EDFF', '#EAF9F3'],
  glassSurface: 'rgba(255, 255, 255, 0.62)',
  glassBorder: 'rgba(255, 255, 255, 0.75)',
  dockSurface: 'rgba(255, 255, 255, 0.78)',
  keyText: '#17233D',
};

const dark: Palette = {
  bg: '#0F1622',
  card: '#1B2434',
  primary: '#5EA0E8',
  primaryDeep: '#8AB9F0',
  primarySoft: '#3C5F8C',
  primaryMist: 'rgba(94, 160, 232, 0.16)',
  text: '#E8EFFA',
  textSub: '#8B98AB',
  textHeavy: '#FFFFFF',
  border: 'rgba(232, 239, 250, 0.08)',
  danger: '#F0565B',
  toastBg: 'rgba(226, 235, 248, 0.9)',
  toastText: '#101828',
  headerGrad: ['#25406B', '#2B3A6E', '#45357A'],
  auroraBg: ['#0E1626', '#141B33', '#0F1B26'],
  glassSurface: 'rgba(30, 42, 66, 0.55)',
  glassBorder: 'rgba(232, 239, 250, 0.14)',
  dockSurface: 'rgba(24, 34, 54, 0.82)',
  keyText: '#E8EFFA',
};

export function paletteFor(scheme: 'light' | 'dark' | null | undefined): Palette {
  return scheme === 'dark' ? dark : light;
}

/** 深色模式跟随系统 */
export function useTheme(): Palette {
  return paletteFor(useColorScheme());
}

/** 玻璃卡片通用外描边:高光 + 柔影 */
export function glassShadow(elevation = 3): ViewStyle {
  return Platform.select<ViewStyle>({
    android: { elevation },
    default: {
      shadowColor: '#3A5B8C',
      shadowOpacity: 0.14,
      shadowRadius: 18,
      shadowOffset: { width: 0, height: 8 },
    },
  }) as ViewStyle;
}
