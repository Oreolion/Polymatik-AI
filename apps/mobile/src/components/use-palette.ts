import { resolveTheme, themes } from '@polymatik/ui-tokens';
import { useColorScheme } from 'react-native';
import { useDiscoverySession } from './discovery-session';

export function usePalette() {
  const systemScheme = useColorScheme();
  const { preference } = useDiscoverySession();
  const scheme = resolveTheme(
    preference,
    systemScheme === 'dark' ? 'dark' : 'light',
  );
  return { scheme, colors: themes[scheme] };
}
