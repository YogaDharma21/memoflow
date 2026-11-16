import React, { useState, useMemo } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  useColorScheme,
} from 'react-native';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { Note } from '@/types';

type Props = {
  visible: boolean;
  notes: Note[];
  unlocked: boolean;
  onClose: () => void;
  onSelectNote: (note: Note) => void;
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const fmtHour = (h: number) => (h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`);

export function SearchDialog({
  visible,
  notes,
  unlocked,
  onClose,
  onSelectNote,
}: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'light' ? 'light' : 'dark'];

  const [query, setQuery] = useState('');

  const activeTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const note of notes) {
      if (note.isLocked || (note.important && !unlocked)) continue;
      const tags = note.tags ?? [];
      for (const tag of tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag]) => tag);
  }, [notes, unlocked]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return notes
      .filter((n) => {
        if (n.body.toLowerCase().includes(q)) return true;
        if (n.tags?.some((t) => t.toLowerCase().includes(q))) return true;
        return false;
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [notes, query]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View
          style={[
            styles.dialog,
            {
              backgroundColor: colors.card,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={[styles.searchHeader, { borderBottomColor: colors.border }]}>
            <View
              style={[
                styles.searchPill,
                { backgroundColor: colors.surfaceInset },
              ]}
            >
              <Feather name="search" size={15} color={colors.textSecondary} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="Search notes..."
                placeholderTextColor={colors.textSecondary}
                autoFocus
                value={query}
                onChangeText={setQuery}
              />
              {Boolean(query) && (
                <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
                  <Feather name="x" size={15} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.resultsList}>
            {!query.trim() ? (
              <View style={styles.tagSection}>
                {activeTags.length > 0 && (
                  <View style={styles.tagWrapper}>
                    <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                      TAGS
                    </Text>
                    <View style={styles.tagGrid}>
                      {activeTags.map((tag) => (
                        <TouchableOpacity
                          key={tag}
                          style={[
                            styles.dialogTagPill,
                            { backgroundColor: colors.backgroundElement, borderColor: colors.border },
                          ]}
                          onPress={() => setQuery(tag)}
                        >
                          <Text style={[styles.dialogTagText, { color: colors.textSecondary }]}>
                            {tag}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  Type to search notes
                </Text>
              </View>
            ) : matches.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No matching notes found
              </Text>
            ) : (
              matches.map((note) => {
                const isLocked = note.important && !unlocked;
                const d = new Date(note.createdAt);
                const timeStr = `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${fmtHour(d.getHours())}`;

                return (
                  <TouchableOpacity
                    key={note._id}
                    style={[styles.item, { borderBottomColor: colors.borderSubtle }]}
                    onPress={() => onSelectNote(note)}
                  >
                    <View style={styles.itemHeader}>
                      <Text style={[styles.itemTime, { color: colors.textSecondary }]}>
                        {timeStr}
                      </Text>
                      <View style={styles.itemIcons}>
                        {note.photoIds.length > 0 && (
                          <View style={styles.iconTag}>
                            <Feather name="image" size={12} color={colors.textSecondary} />
                            <Text style={[styles.tagCount, { color: colors.textSecondary }]}>
                              {note.photoIds.length}
                            </Text>
                          </View>
                        )}
                        {note.important && (
                          isLocked ? (
                            <Feather name="lock" size={12} color={colors.star} />
                          ) : (
                            <FontAwesome name="star" size={12} color={colors.star} />
                          )
                        )}
                      </View>
                    </View>
                    <Text
                      numberOfLines={2}
                      style={[
                        styles.itemBody,
                        { color: isLocked ? colors.textSecondary : colors.text },
                      ]}
                    >
                      {isLocked ? '🔒 Locked note' : note.body || 'Photo note'}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  dialog: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.two,
  },
  searchPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 9999,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 4,
  },
  closeBtn: {
    marginLeft: Spacing.one,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resultsList: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  emptyText: {
    textAlign: 'center',
    paddingVertical: Spacing.five,
    fontSize: 13,
  },
  tagSection: {
    paddingVertical: Spacing.two,
  },
  tagWrapper: {
    marginBottom: Spacing.three,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: Spacing.two,
    textTransform: 'uppercase',
  },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  dialogTagPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  dialogTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  item: {
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemTime: {
    fontSize: 11,
    fontWeight: '500',
  },
  itemIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  iconTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  tagCount: {
    fontSize: 11,
  },
  itemBody: {
    fontSize: 13,
    lineHeight: 18,
  },
});
