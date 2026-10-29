import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { Note } from '@/types';
import { FlashbackGroup } from '@/lib/flashbacks';
import { NoteCard } from './note-card';

type Props = {
  notes: Note[];
  cursor: Date;
  onStar: (n: Note) => void;
  onOpen: (n: Note) => void;
  onViewer: (list: string[], i: number) => void;
  unlocked?: boolean;
  flashbackGroups?: FlashbackGroup<Note>[];
  onDrill?: (d: Date) => void;
  scrollRef?: React.RefObject<ScrollView | null>;
};

const fmtHour = (h: number) =>
  h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export function DayRail({
  notes,
  cursor,
  onStar,
  onOpen,
  onViewer,
  unlocked,
  flashbackGroups = [],
  onDrill,
  scrollRef,
}: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'light' ? 'light' : 'dark'];

  const now = new Date();
  const isToday = sameDay(cursor, now);
  const currentHour = now.getHours();
  const totalFlashbacks = flashbackGroups.reduce(
    (acc, g) => acc + g.notes.length,
    0
  );

  return (
    <ScrollView
      ref={scrollRef as any}
      style={styles.scroll}
      contentContainerStyle={styles.container}
    >
      {flashbackGroups.length > 0 && (
        <View
          style={[
            styles.flashbackCard,
            { backgroundColor: colors.card, borderColor: colors.cardBorder },
          ]}
        >
          <View style={styles.flashbackHeader}>
            <View style={styles.flashbackHeaderLeft}>
              <View
                style={[
                  styles.flashbackIconWrap,
                  { backgroundColor: colors.surfaceInset },
                ]}
              >
                <Feather name="clock" size={14} color={colors.textSecondary} />
              </View>
              <Text style={[styles.flashbackTitle, { color: colors.text }]}>
                On this day
              </Text>
            </View>
            <Text
              style={[styles.flashbackCount, { color: colors.textSecondary }]}
            >
              {totalFlashbacks} {totalFlashbacks === 1 ? 'memory' : 'memories'}
            </Text>
          </View>

          {flashbackGroups.map((group) => (
            <View key={group.year} style={styles.flashbackYearGroup}>
              <View
                style={[
                  styles.flashbackYearHeader,
                  { borderBottomColor: colors.borderSubtle },
                ]}
              >
                <Text
                  style={[
                    styles.flashbackYearLabel,
                    { color: colors.textSecondary },
                  ]}
                >
                  {group.year} · {group.yearsAgo}{' '}
                  {group.yearsAgo === 1 ? 'year' : 'years'} ago
                </Text>
                {onDrill && (
                  <TouchableOpacity
                    onPress={() =>
                      onDrill(
                        new Date(
                          group.year,
                          cursor.getMonth(),
                          cursor.getDate()
                        )
                      )
                    }
                    hitSlop={6}
                  >
                    <Text
                      style={[
                        styles.jumpButtonText,
                        { color: colors.textSecondary },
                      ]}
                    >
                      Jump to day
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.notesColumn}>
                {group.notes.map((note) => (
                  <NoteCard
                    key={note._id}
                    note={note}
                    onStar={onStar}
                    onOpen={onOpen}
                    onViewer={onViewer}
                    unlocked={unlocked}
                  />
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={[styles.rail, { borderLeftColor: colors.border }]}>
        {Array.from({ length: 24 }, (_, h) => {
          const list = notes.filter((n) => new Date(n.createdAt).getHours() === h);
          const isNow = isToday && h === currentHour;

          return (
            <View
              key={h}
              style={[
                styles.hourRow,
                isNow && { backgroundColor: colors.backgroundElement },
              ]}
            >
              <Text style={[styles.hourLabel, { color: colors.textSecondary }]}>
                {fmtHour(h)}
              </Text>

              <View
                style={[
                  styles.dot,
                  {
                    borderColor: colors.border,
                    backgroundColor:
                      list.length || isNow ? colors.primary : colors.backgroundElement,
                  },
                ]}
              />

              {!list.length ? (
                <Text style={[styles.emptyDash, { color: colors.textSecondary }]}>
                  —
                </Text>
              ) : (
                <View style={styles.notesColumn}>
                  {list.map((note) => (
                    <NoteCard
                      key={note._id}
                      note={note}
                      onStar={onStar}
                      onOpen={onOpen}
                      onViewer={onViewer}
                      unlocked={unlocked}
                    />
                  ))}
                </View>
              )}
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    paddingLeft: 48,
    paddingRight: Spacing.three,
    paddingBottom: 100,
  },
  rail: {
    borderLeftWidth: 1,
  },
  hourRow: {
    minHeight: 46,
    paddingLeft: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: 8,
    position: 'relative',
    justifyContent: 'center',
    marginVertical: 1,
  },
  hourLabel: {
    position: 'absolute',
    left: -48,
    top: 10,
    width: 40,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '600',
  },
  dot: {
    position: 'absolute',
    left: -6,
    top: 14,
    width: 11,
    height: 11,
    borderRadius: 6,
    borderWidth: 2,
  },
  emptyDash: {
    fontSize: 12,
    opacity: 0.5,
  },
  notesColumn: {
    flex: 1,
  },
  flashbackCard: {
    marginLeft: -32,
    marginBottom: Spacing.four,
    padding: Spacing.three,
    borderRadius: 20,
    borderWidth: 1,
  },
  flashbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  flashbackHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  flashbackIconWrap: {
    padding: 6,
    borderRadius: 8,
  },
  flashbackTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  flashbackCount: {
    fontSize: 11,
    fontWeight: '500',
  },
  flashbackYearGroup: {
    marginBottom: Spacing.three,
  },
  flashbackYearHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing.one,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: Spacing.one,
  },
  flashbackYearLabel: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  jumpButtonText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
