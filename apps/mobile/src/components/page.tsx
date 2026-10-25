import { layout, spacing, typography } from '@polymatik/ui-tokens';
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { usePalette } from './use-palette';

type PageProps = {
  section: string;
  heading: string;
  description: string;
  children?: ReactNode;
};

export function Page({ section, heading, description, children }: PageProps) {
  const { colors } = usePalette();
  return (
    <ScrollView
      testID={`page-${section.toLowerCase()}`}
      contentInsetAdjustmentBehavior="automatic"
      style={{ backgroundColor: colors.canvas }}
      contentContainerStyle={styles.scroll}
    >
      <View style={styles.column}>
        <Text style={[styles.wordmark, { color: colors.ink }]}>
          POLYMATIK AI
        </Text>
        <View
          style={[styles.rule, { backgroundColor: colors.controlBorder }]}
        />
        <Text style={[styles.section, { color: colors.teal }]}>{section}</Text>
        <Text
          accessibilityRole="header"
          style={[styles.heading, { color: colors.ink }]}
        >
          {heading}
        </Text>
        <Text selectable style={[styles.description, { color: colors.muted }]}>
          {description}
        </Text>
        <View style={styles.actions}>{children}</View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    padding: layout.mobileGutter,
    paddingBottom: spacing.section,
  },
  column: { width: '100%', maxWidth: layout.readingWidth, alignSelf: 'center' },
  wordmark: {
    ...typography.native.metadata,
    fontWeight: '700',
    letterSpacing: 2,
    paddingTop: spacing.xl,
  },
  rule: { height: StyleSheet.hairlineWidth, marginVertical: spacing.xl },
  section: {
    ...typography.native.metadata,
    fontWeight: '600',
    marginBottom: spacing.lg,
  },
  heading: {
    ...typography.native.display,
    fontWeight: '600',
    marginBottom: spacing.xl,
  },
  description: { ...typography.native.body },
  actions: { gap: spacing.lg, marginTop: spacing.xxl },
});
