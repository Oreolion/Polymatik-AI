// Shared values and preferences only. Web and native components remain separate.
export const themes = Object.freeze({
  light: Object.freeze({
    canvas: '#F8F7F4',
    surface: '#FFFFFF',
    ink: '#202326',
    muted: '#52605B',
    accent: '#2349B8',
    teal: '#137565',
    error: '#A82D36',
    warning: '#79520E',
    controlBorder: '#76837B',
    onAccent: '#FFFFFF',
    brassDecoration: '#B58B4A',
  }),
  dark: Object.freeze({
    canvas: '#141B1A',
    surface: '#1E2825',
    ink: '#EDF0E8',
    muted: '#B7C2BA',
    accent: '#A9BCFF',
    teal: '#7CD4BC',
    error: '#FFB4BB',
    warning: '#EBC575',
    controlBorder: '#819189',
    onAccent: '#141B1A',
    brassDecoration: '#D2B071',
  }),
});

export type ThemeName = keyof typeof themes;
export type ThemePreference = ThemeName | 'system';

export function resolveTheme(
  preference: ThemePreference,
  systemScheme?: ThemeName | null,
): ThemeName {
  return preference === 'system'
    ? systemScheme === 'dark'
      ? 'dark'
      : 'light'
    : preference;
}

export const spacing = Object.freeze({
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  section: 48,
  display: 64,
});

export const radii = Object.freeze({ control: 8, overlay: 12 });
export const layout = Object.freeze({
  minimumTouchTarget: 44,
  mobileGutter: 16,
  readingWidth: 720,
});

const textStyle = (fontSize: number, lineHeight: number) =>
  Object.freeze({ fontSize, lineHeight });

export const typography = Object.freeze({
  // Descriptors, not loaded font assets. Consumers must load fonts before use.
  families: Object.freeze({
    editorial: 'Source Serif 4',
    body: 'Source Sans 3',
  }),
  web: Object.freeze({
    display: textStyle(48, 54),
    heading: textStyle(32, 40),
    title: textStyle(26, 34),
    body: textStyle(18, 29),
    metadata: textStyle(14, 20),
  }),
  native: Object.freeze({
    display: textStyle(32, 38),
    heading: textStyle(26, 32),
    title: textStyle(24, 30),
    body: textStyle(17, 27),
    metadata: textStyle(14, 20),
  }),
});

const regularMotion = Object.freeze({ feedbackMs: 120, transitionMs: 180 });
const reducedMotion = Object.freeze({ feedbackMs: 0, transitionMs: 0 });

export function getMotionTokens(reduceMotion: boolean) {
  return reduceMotion ? reducedMotion : regularMotion;
}
