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
  onStar: (n: Note) => void;
  onOpen: (n: Note) => void;
  onViewer: (list: string[], i: number) => void;
};

export function ImportantView({ notes, onStar, onOpen, onViewer }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'light' ? 'light' : 'dark'];

  if (!notes.length) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No important notes yet. Tap the star on a note to mark it.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
      {notes.map((n) => (
        <NoteCard
          key={n._id}
          note={n}
          onStar={onStar}
          onOpen={onOpen}
          onViewer={onViewer}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    paddingHorizontal: Spacing.three,
    paddingBottom: 100,
  },
  emptyContainer: {
    flex: 1,
    padding: Spacing.four,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
});
