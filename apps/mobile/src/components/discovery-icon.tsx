import { SymbolView } from 'expo-symbols';

const names = {
  bookmark: { ios: 'bookmark', android: 'bookmark_border' },
  saved: { ios: 'bookmark.fill', android: 'bookmark' },
  arrow: { ios: 'arrow.up.right', android: 'north_east' },
  close: { ios: 'xmark', android: 'close' },
  sun: { ios: 'sun.max', android: 'light_mode' },
  moon: { ios: 'moon', android: 'dark_mode' },
} as const;

export function DiscoveryIcon({
  name,
  color,
}: {
  name: keyof typeof names;
  color: string;
}) {
  return (
    <SymbolView
      name={names[name]}
      tintColor={color}
      size={20}
      accessible={false}
      importantForAccessibility="no"
    />
  );
}
