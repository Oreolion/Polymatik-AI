import { layout, radii, spacing, typography } from '@polymatik/ui-tokens';
import { Link } from 'expo-router';
import type { Href } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';
import { usePalette } from './use-palette';

export function RouteButton({
  href,
  children,
  replace = false,
}: {
  href: Href;
  children: string;
  replace?: boolean;
}) {
  const { colors } = usePalette();
  return (
    <Link href={href} replace={replace} asChild>
      <Pressable
        accessibilityRole="link"
        style={({ pressed }) => [
          styles.button,
          {
            backgroundColor: pressed ? colors.ink : colors.accent,
          },
        ]}
      >
        <Text style={[styles.label, { color: colors.onAccent }]}>
          {children}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: layout.minimumTouchTarget,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radii.control,
  },
  label: { ...typography.native.body, fontWeight: '600' },
});
