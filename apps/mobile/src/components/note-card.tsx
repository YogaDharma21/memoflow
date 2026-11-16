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
  unlocked?: boolean;
  onSelectTag?: (tag: string) => void;
};

export function NoteCard({ note, onStar, onOpen, onViewer, unlocked, onSelectTag }: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'light' ? 'light' : 'dark'];

  const isLocked = Boolean(note.isLocked ?? (note.important && !unlocked));
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
          shadowOpacity: scheme === 'light' ? 0.08 : 0.45,
        },
      ]}
      onPress={() => onOpen(note)}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.body,
            {
              color: isLocked ? colors.textSecondary : colors.text,
              fontStyle: isLocked ? 'italic' : 'normal',
            },
          ]}
        >
          {isLocked ? '🔒 Locked note' : note.body.trim() ? note.body : 'photo'}
        </Text>
        <TouchableOpacity
          hitSlop={8}
          onPress={() => onStar(note)}
          style={styles.starButton}
        >
          {isLocked ? (
            <Feather name="lock" size={15} color={colors.textSecondary} />
          ) : note.important ? (
            <FontAwesome name="star" size={15} color={colors.star} />
          ) : (
            <Feather name="star" size={15} color={colors.textSecondary} />
          )}
        </TouchableOpacity>
      </View>

      {!isLocked &&
        note.photoUrls.map((url, i) => (
          <TouchableOpacity
            key={`${note._id}-${i}`}
            activeOpacity={0.9}
            onPress={() => onViewer(note.photoUrls, i)}
            style={styles.imageWrapper}
          >
            <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
          </TouchableOpacity>
        ))}

      {!isLocked && note.tags && note.tags.length > 0 && (
        <View style={styles.tagRow}>
          {note.tags.map((t) => (
            <TouchableOpacity
              key={t}
              hitSlop={4}
              onPress={() => onSelectTag?.(t)}
              style={[
                styles.tagPill,
                {
                  backgroundColor: colors.backgroundElement,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={[styles.meta, { color: colors.textSecondary }]}>
        {dateStr} · {timeStr}
        {!isLocked && note.photoIds.length > 0
          ? ` · ${note.photoIds.length} photo${note.photoIds.length > 1 ? 's' : ''}`
          : ''}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 4,
    padding: Spacing.three,
    borderRadius: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 14 },
    shadowRadius: 20,
    elevation: 4,
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
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
    borderRadius: 16,
  },
  meta: {
    marginTop: Spacing.one,
    fontSize: 11,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: Spacing.two,
    marginBottom: Spacing.half,
  },
  tagPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 11,
    fontWeight: '500',
  },
});
