import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { Stack } from 'expo-router/stack';
import { StatusBar } from 'expo-status-bar';
import { usePalette } from '../components/use-palette';
import { DiscoverySession } from '../components/discovery-session';

export { ErrorBoundary } from 'expo-router';
export const unstable_settings = { initialRouteName: '(tabs)' };

export default function RootLayout() {
  return (
    <DiscoverySession>
      <RootNavigator />
    </DiscoverySession>
  );
}

function RootNavigator() {
  const { scheme, colors } = usePalette();
  const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
  const theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.canvas,
      card: colors.surface,
      text: colors.ink,
      border: colors.controlBorder,
      notification: colors.accent,
    },
  };
  return (
    <ThemeProvider value={theme}>
      <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{ contentStyle: { backgroundColor: colors.canvas } }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/sign-in" options={{ title: 'Account' }} />
        <Stack.Screen name="+not-found" options={{ title: 'Page not found' }} />
      </Stack>
    </ThemeProvider>
  );
}
