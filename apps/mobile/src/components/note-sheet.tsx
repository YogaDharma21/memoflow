import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { DraftPhoto, Note } from '@/types';

type Props = {
  visible: boolean;
  editNote: Note | null;
  cursor: Date;
  onClose: () => void;
  onSave: (body: string, draftPhotos: DraftPhoto[], editId: string | null) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function NoteSheet({
  visible,
  editNote,
  cursor,
  onClose,
  onSave,
  onDelete,
}: Props) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'light' ? 'light' : 'dark'];

  const [body, setBody] = useState('');
  const [draftPhotos, setDraftPhotos] = useState<DraftPhoto[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editNote) {
      setBody(editNote.body);
      setDraftPhotos(
        editNote.photoIds.map((id, i) => ({
          kind: 'stored',
          storageId: id,
          url: editNote.photoUrls[i] ?? '',
        }))
      );
    } else {
      setBody('');
      setDraftPhotos([]);
    }
  }, [editNote, visible]);

  const onPickPhotos = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
    });
    if (!res.canceled && res.assets) {
      const added: DraftPhoto[] = res.assets.map((a) => ({
        kind: 'new',
        uri: a.uri,
        mimeType: a.mimeType || 'image/jpeg',
      }));
      setDraftPhotos((prev) => [...prev, ...added]);
    }
  };

  const removePhoto = (index: number) => {
    setDraftPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const trimmed = body.trim();
    if ((!trimmed && !draftPhotos.length) || saving) return;
    setSaving(true);
    try {
      await onSave(trimmed, draftPhotos, editNote ? editNote._id : null);
      onClose();
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Could not save note');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = () => {
    if (!editNote) return;
    Alert.alert('Delete note', 'Are you sure you want to delete this note?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const id = editNote._id;
          onClose();
          await onDelete(id);
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.card,
              borderTopColor: colors.border,
            },
          ]}
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textSecondary }]}>
              {editNote ? 'Edit note' : 'New note'}
            </Text>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.backgroundElement,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            placeholder="type a note"
            placeholderTextColor={colors.textSecondary}
            multiline
            numberOfLines={4}
            value={body}
            onChangeText={setBody}
            textAlignVertical="top"
          />

          {draftPhotos.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.photoList}
            >
              {draftPhotos.map((p, i) => (
                <View key={i} style={styles.photoThumb}>
                  <Image
                    source={{ uri: p.kind === 'stored' ? p.url : p.uri }}
                    style={styles.thumbImage}
                  />
                  <TouchableOpacity
                    style={styles.removePhoto}
                    onPress={() => removePhoto(i)}
                    hitSlop={6}
                  >
                    <Feather name="x" size={12} color="#fff" />
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}

          <TouchableOpacity
            style={styles.addPhotosButton}
            onPress={onPickPhotos}
          >
            <Feather name="image" size={16} color={colors.textSecondary} />
            <Text style={[styles.addPhotosText, { color: colors.textSecondary }]}>
              {draftPhotos.length ? `${draftPhotos.length} photos` : 'Photos'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color={colors.primaryForeground} size="small" />
            ) : (
              <Text style={[styles.saveText, { color: colors.primaryForeground }]}>
                Save
              </Text>
            )}
          </TouchableOpacity>

          {Boolean(editNote) && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Text style={[styles.deleteText, { color: colors.destructive }]}>
                Delete note
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    padding: Spacing.four,
    paddingBottom: Spacing.five,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  input: {
    minHeight: 100,
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.three,
    fontSize: 15,
  },
  photoList: {
    marginTop: Spacing.two,
    flexDirection: 'row',
  },
  photoThumb: {
    width: 60,
    height: 60,
    borderRadius: 16,
    marginRight: Spacing.two,
    overflow: 'hidden',
    position: 'relative',
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  removePhoto: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotosButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    marginTop: Spacing.two,
  },
  addPhotosText: {
    fontSize: 13,
    fontWeight: '600',
  },
  saveButton: {
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  saveText: {
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    marginTop: Spacing.two,
    alignItems: 'center',
    paddingVertical: Spacing.one,
  },
  deleteText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
