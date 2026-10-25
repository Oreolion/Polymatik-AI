import { useRef, useState } from 'react';
import type { ComponentRef } from 'react';
import {
  AccessibilityInfo,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Stack } from 'expo-router/stack';
import { Link } from 'expo-router';
import { layout, radii, spacing, typography } from '@polymatik/ui-tokens';
import {
  resources,
  selectResources,
  topics,
} from '@polymatik/domain-types/discovery-preview';
import type {
  Resource,
  Topic,
} from '@polymatik/domain-types/discovery-preview';
import { useDiscoverySession } from './discovery-session';
import { usePalette } from './use-palette';
import { DiscoveryIcon } from './discovery-icon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const serif = Platform.select({
  ios: 'Georgia',
  android: 'serif',
  default: 'serif',
});
type Mode = 'discover' | 'search' | 'library';

function ResourceRow({
  resource,
  onDismiss,
}: {
  resource: Resource;
  onDismiss?: (() => void) | undefined;
}) {
  const { colors } = usePalette();
  const session = useDiscoverySession();
  const saved = session.saved.includes(resource.id);
  const [opening, setOpening] = useState(false);
  const openingRef = useRef(false);
  const [openError, setOpenError] = useState(false);
  async function openOriginal() {
    if (openingRef.current) return;
    openingRef.current = true;
    setOpening(true);
    setOpenError(false);
    try {
      await Linking.openURL(resource.url);
    } catch {
      setOpenError(true);
      AccessibilityInfo.announceForAccessibility(
        'The original source could not be opened. You can retry.',
      );
    } finally {
      openingRef.current = false;
      setOpening(false);
    }
  }
  return (
    <View style={[styles.resource, { borderColor: colors.controlBorder }]}>
      <View style={styles.sourceRow}>
        <Text selectable style={[styles.source, { color: colors.ink }]}>
          {resource.source}
        </Text>
        <Text style={[styles.metadata, { color: colors.muted }]}>
          {resource.kind}
        </Text>
      </View>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`Open ${resource.title} at the original source`}
        accessibilityHint="Opens the original website in your browser"
        accessibilityState={{ busy: opening, disabled: opening }}
        disabled={opening}
        onPress={() => void openOriginal()}
        style={styles.titleLink}
      >
        <Text style={[styles.title, { color: colors.ink, flex: 1 }]}>
          {resource.title}
        </Text>
        <DiscoveryIcon name="arrow" color={colors.accent} />
      </Pressable>
      <Text selectable style={[styles.body, { color: colors.muted }]}>
        {resource.description}
      </Text>
      <View style={styles.metaRow}>
        <Text style={[styles.subject, { color: colors.teal }]}>
          {resource.topic}
        </Text>
        <Text selectable style={[styles.metadata, { color: colors.muted }]}>
          {resource.note}
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            saved
              ? `Remove ${resource.title} from session Library`
              : `Save ${resource.title} for this session`
          }
          accessibilityState={{ selected: saved }}
          onPress={() => {
            session.toggleSave(resource.id);
            AccessibilityInfo.announceForAccessibility(
              saved
                ? 'Removed from your session Library.'
                : 'Saved for this app session.',
            );
          }}
          style={styles.action}
        >
          <DiscoveryIcon
            name={saved ? 'saved' : 'bookmark'}
            color={colors.accent}
          />
          <Text style={[styles.actionLabel, { color: colors.accent }]}>
            {saved ? 'Saved' : 'Save for later'}
          </Text>
        </Pressable>
        {onDismiss && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Dismiss ${resource.title}`}
            onPress={onDismiss}
            style={styles.action}
          >
            <DiscoveryIcon name="close" color={colors.muted} />
            <Text style={[styles.actionLabel, { color: colors.muted }]}>
              Not now
            </Text>
          </Pressable>
        )}
      </View>
      {openError && (
        <View accessibilityLiveRegion="polite" style={styles.linkError}>
          <Text selectable style={[styles.metadata, { color: colors.error }]}>
            The original source could not be opened. You can retry.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Retry opening ${resource.title}`}
            onPress={() => void openOriginal()}
            style={styles.action}
          >
            <Text style={[styles.actionLabel, { color: colors.accent }]}>
              Retry original source
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export function DiscoveryScreen({ mode }: { mode: Mode }) {
  const { colors, scheme } = usePalette();
  const session = useDiscoverySession();
  const insets = useSafeAreaInsets();
  const [topic, setTopic] = useState<Topic>('All subjects');
  const [query, setQuery] = useState('');
  const heading = useRef<ComponentRef<typeof Text>>(null);
  const search = useRef<ComponentRef<typeof TextInput>>(null);
  const visible = selectResources({
    topic,
    query,
    savedOnly: mode === 'library',
    saved: session.saved,
    dismissed: session.dismissed,
  });
  const title =
    mode === 'discover' ? 'Discover' : mode === 'search' ? 'Search' : 'Library';
  const allSetAside =
    mode !== 'library' &&
    topic === 'All subjects' &&
    !query.trim() &&
    session.dismissed.length === resources.length;
  function focusHeading() {
    requestAnimationFrame(() => {
      if (heading.current)
        AccessibilityInfo.sendAccessibilityEvent(heading.current, 'focus');
    });
  }
  const appearanceButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Switch to ${scheme === 'dark' ? 'light' : 'dark'} appearance`}
      accessibilityHint="This appearance choice lasts for this app session"
      onPress={() =>
        session.setPreference(scheme === 'dark' ? 'light' : 'dark')
      }
      style={styles.appearance}
    >
      <DiscoveryIcon
        name={scheme === 'dark' ? 'sun' : 'moon'}
        color={colors.ink}
      />
    </Pressable>
  );
  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView
        testID={`discovery-${mode}`}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        style={{ backgroundColor: colors.canvas }}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: process.env.EXPO_OS === 'android' ? insets.top : 0,
            paddingBottom: spacing.display + insets.bottom,
          },
        ]}
      >
        <View style={styles.column}>
          <View style={styles.wordmarkRow}>
            <Text selectable style={[styles.wordmark, { color: colors.ink }]}>
              Polymatik AI
            </Text>
            {appearanceButton}
          </View>
          <Text style={[styles.eyebrow, { color: colors.teal }]}>
            {mode === 'library'
              ? 'YOUR PERSONAL SHELF'
              : mode === 'search'
                ? 'FOLLOW A QUESTION'
                : 'THE ART OF PAYING ATTENTION'}
          </Text>
          <Text
            ref={heading}
            accessible
            accessibilityRole="header"
            style={[styles.heading, { color: colors.ink }]}
          >
            {mode === 'library'
              ? 'Keep a thought for later.'
              : mode === 'search'
                ? 'What are you curious about?'
                : 'Let curiosity take the lead.'}
          </Text>
          <Text selectable style={[styles.body, { color: colors.muted }]}>
            {mode === 'library'
              ? 'The ideas you chose to keep, ready when you are.'
              : 'Ideas worth pausing for. Perspectives worth exploring. A starting point for your next rabbit hole.'}
          </Text>
          <View
            style={[styles.previewNote, { borderColor: colors.controlBorder }]}
          >
            <Text selectable style={[styles.metadata, { color: colors.muted }]}>
              Four handpicked resources. Not personalized. Saves last for this
              app session; they reset when the app restarts and do not sync with
              web.
            </Text>
          </View>
          <TextInput
            ref={search}
            accessibilityLabel="Search the preview collection"
            placeholder="Search ideas, subjects, sourcesâ€¦"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            maxLength={200}
            returnKeyType="search"
            autoCorrect={false}
            style={[
              styles.search,
              {
                color: colors.ink,
                borderColor: colors.controlBorder,
                backgroundColor: colors.surface,
              },
            ]}
          />
          <View style={styles.filters}>
            {topics.map((value) => (
              <Pressable
                key={value}
                accessibilityRole="button"
                accessibilityLabel={value}
                accessibilityState={{ selected: topic === value }}
                onPress={() => setTopic(value)}
                style={[
                  styles.filter,
                  {
                    backgroundColor:
                      topic === value ? colors.ink : colors.canvas,
                    borderColor: colors.controlBorder,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.metadata,
                    { color: topic === value ? colors.canvas : colors.ink },
                  ]}
                >
                  {value}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.resultCount, { color: colors.muted }]}
          >
            {visible.length} {visible.length === 1 ? 'resource' : 'resources'}
          </Text>
          {session.undoId && mode !== 'library' && (
            <View style={[styles.undo, { borderColor: colors.controlBorder }]}>
              <Text style={[styles.metadata, { color: colors.muted }]}>
                Set aside for this session.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Undo dismissal"
                onPress={() => {
                  session.undoDismiss();
                  AccessibilityInfo.announceForAccessibility(
                    'Resource restored.',
                  );
                  focusHeading();
                }}
                style={styles.action}
              >
                <Text style={[styles.actionLabel, { color: colors.accent }]}>
                  Undo dismissal
                </Text>
              </Pressable>
            </View>
          )}
          {visible.map((resource) => (
            <ResourceRow
              key={resource.id}
              resource={resource}
              onDismiss={
                mode === 'library'
                  ? undefined
                  : () => {
                      session.dismiss(resource.id);
                      AccessibilityInfo.announceForAccessibility(
                        'Resource set aside. Undo dismissal is available before the resource list.',
                      );
                      focusHeading();
                    }
              }
            />
          ))}
          {!visible.length && (
            <View style={styles.empty}>
              <Text
                accessibilityRole="header"
                style={[styles.title, { color: colors.ink }]}
              >
                {mode === 'library' && !session.saved.length
                  ? 'Make room for a good idea.'
                  : allSetAside
                    ? 'A little room to reflect.'
                    : 'A different path, perhaps?'}
              </Text>
              <Text selectable style={[styles.body, { color: colors.muted }]}>
                {mode === 'library' && !session.saved.length
                  ? 'Save something in Discover. It will be waiting here until this app session ends.'
                  : allSetAside
                    ? 'You have set this collection aside. Undo your last dismissal above to bring an idea back.'
                    : 'No resources match these filters. Try another subject or a broader search.'}
              </Text>
              {mode === 'library' && !session.saved.length ? (
                <Link href="/" asChild>
                  <Pressable accessibilityRole="link" style={styles.action}>
                    <Text
                      style={[styles.actionLabel, { color: colors.accent }]}
                    >
                      Explore Discover
                    </Text>
                  </Pressable>
                </Link>
              ) : allSetAside ? null : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Reset filters"
                  onPress={() => {
                    setTopic('All subjects');
                    setQuery('');
                    search.current?.blur();
                  }}
                  style={styles.action}
                >
                  <Text style={[styles.actionLabel, { color: colors.accent }]}>
                    Reset filters
                  </Text>
                </Pressable>
              )}
            </View>
          )}
          <View style={styles.end}>
            <Text style={[styles.endTitle, { color: colors.teal }]}>
              Stay curious. Think deeply.
            </Text>
            <Text selectable style={[styles.metadata, { color: colors.muted }]}>
              Youâ€™ve reached the edge of this little atlas.
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
    paddingHorizontal: layout.mobileGutter,
    paddingBottom: spacing.display,
  },
  column: {
    width: '100%',
    maxWidth: layout.readingWidth,
    alignSelf: 'center',
    gap: spacing.lg,
  },
  wordmarkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
    paddingTop: spacing.lg,
  },
  wordmark: { fontFamily: serif, fontSize: 24, lineHeight: 32, flexShrink: 1 },
  appearance: {
    minWidth: layout.minimumTouchTarget,
    minHeight: layout.minimumTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eyebrow: {
    ...typography.native.metadata,
    letterSpacing: 1.5,
    marginTop: spacing.xl,
  },
  heading: { ...typography.native.display, fontFamily: serif },
  body: { ...typography.native.body },
  metadata: { ...typography.native.metadata },
  previewNote: {
    borderLeftWidth: 2,
    paddingLeft: spacing.md,
    marginVertical: spacing.md,
  },
  search: {
    ...typography.native.body,
    borderWidth: 1,
    borderRadius: radii.control,
    padding: spacing.md,
    minHeight: layout.minimumTouchTarget,
  },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filter: {
    minHeight: layout.minimumTouchTarget,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderRadius: radii.control,
    justifyContent: 'center',
    flexShrink: 1,
  },
  resultCount: {
    ...typography.native.metadata,
    fontVariant: ['tabular-nums'],
    marginVertical: spacing.sm,
  },
  resource: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  sourceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  source: { ...typography.native.metadata, fontWeight: '600', flexShrink: 1 },
  titleLink: {
    minHeight: layout.minimumTouchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: { ...typography.native.title, fontFamily: serif },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    gap: spacing.md,
  },
  subject: { ...typography.native.metadata, fontWeight: '600' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xl },
  action: {
    minHeight: layout.minimumTouchTarget,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    flexShrink: 1,
  },
  actionLabel: { ...typography.native.metadata, fontWeight: '600' },
  linkError: { gap: spacing.sm },
  undo: {
    borderWidth: 1,
    borderRadius: radii.control,
    padding: spacing.md,
    gap: spacing.xs,
  },
  empty: { gap: spacing.lg, paddingVertical: spacing.xl },
  end: { gap: spacing.md, alignItems: 'center', paddingVertical: spacing.xl },
  endTitle: {
    fontFamily: serif,
    fontStyle: 'italic',
    ...typography.native.body,
  },
});
