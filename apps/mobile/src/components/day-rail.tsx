import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Colors, Spacing } from '@/constants/theme';
import { Note } from '@/types';
import { NoteCard } from './note-card';

type Props = {
  notes: Note[];
  cursor: Date;
  onStar: (n: Note) => void;
  onOpen: (n: Note) => void;
  onViewer: (list: string[], i: number) => void;
  unlocked?: boolean;
  onSelectTag?: (tag: string) => void;
};

const fmtHour = (h: number) =>
  h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`;

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export function DayRail({ notes, cursor, onStar, onOpen, onViewer, unlocked, onSelectTag }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'light' ? 'light' : 'dark'];

  const now = new Date();
  const isToday = sameDay(cursor, now);
  const currentHour = now.getHours();

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
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
                      onSelectTag={onSelectTag}
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
});
