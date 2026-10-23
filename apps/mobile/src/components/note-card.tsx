import React from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
  useColorScheme,
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { Note } from '@/types';

type Props = {
  note: Note;
  onStar: (n: Note) => void;
  onOpen: (n: Note) => void;
  onViewer: (list: string[], i: number) => void;
};

export function NoteCard({ note, onStar, onOpen, onViewer }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const date = new Date(note.createdAt);
  const timeStr = date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.cardBorder,
        },
      ]}
      onPress={() => onOpen(note)}
    >
      <View style={styles.header}>
        <Text style={[styles.body, { color: colors.text }]}>
          {note.body.trim() ? note.body : 'photo'}
        </Text>
        <TouchableOpacity
          hitSlop={8}
          onPress={() => onStar(note)}
          style={styles.starButton}
        >
          {note.important ? (
            <FontAwesome name="star" size={15} color={colors.star} />
          ) : (
            <Feather name="star" size={15} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      {note.photoUrls.map((url, i) => (
        <TouchableOpacity
          key={`${note._id}-${i}`}
          activeOpacity={0.9}
          onPress={() => onViewer(note.photoUrls, i)}
          style={styles.imageWrapper}
        >
          <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
        </TouchableOpacity>
      ))}

      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {dateStr} · {timeStr}
        {note.photoUrls.length > 0
          ? ` · ${note.photoUrls.length} photo${note.photoUrls.length > 1 ? 's' : ''}`
          : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    padding: Spacing.three,
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  body: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  starButton: {
    paddingLeft: Spacing.one,
  },
  imageWrapper: {
    marginTop: Spacing.two,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
  meta: {
    marginTop: Spacing.one,
    fontSize: 11,
  },
});
