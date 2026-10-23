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
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return notes
      .filter((n) => n.body.toLowerCase().includes(q))
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
        <View style={[styles.dialog, { backgroundColor: colors.background }]}>
          <View style={[styles.searchHeader, { borderBottomColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.textSecondary} />
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
                <Feather name="x" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={8}>
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.resultsList}>
            {!query.trim() ? (
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Type to search notes
              </Text>
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
                    style={[styles.item, { borderBottomColor: colors.border }]}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.three,
  },
  dialog: {
    width: '100%',
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: Spacing.one,
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
