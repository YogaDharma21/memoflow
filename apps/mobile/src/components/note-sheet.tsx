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
  KeyboardAvoidingView,
  Platform,
  Linking,
  useColorScheme,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { DraftPhoto, Note } from '@/types';
import { compressMobileImage } from '@/lib/image';
import { ConfirmDialog } from '@/components/confirm-dialog';

type Props = {
  visible: boolean;
  editNote: Note | null;
  cursor: Date;
  onClose: () => void;
  onSave: (
    body: string,
    draftPhotos: DraftPhoto[],
    editId: string | null
  ) => Promise<boolean | void>;
  onDelete: (id: string) => Promise<boolean | void>;
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
  const [error, setError] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [permissionDialog, setPermissionDialog] = useState<{
    visible: boolean;
    needsSettings: boolean;
    message: string;
  }>({
    visible: false,
    needsSettings: false,
    message: '',
  });

  useEffect(() => {
    setError('');
    setDeleteConfirmOpen(false);
    setDeleting(false);
    setPermissionDialog({ visible: false, needsSettings: false, message: '' });
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
    setError('');
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.82,
      });
      if (!res.canceled && res.assets) {
        const added: DraftPhoto[] = await Promise.all(
          res.assets.map(async (a) => {
            const compressed = await compressMobileImage(a, 2048, 0.82);
            return {
              kind: 'new',
              uri: compressed.uri,
              mimeType: compressed.mimeType,
            };
          })
        );
        setDraftPhotos((prev) => [...prev, ...added]);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not pick photos');
    }
  };

  const launchCamera = async () => {
    try {
      const res = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.82,
      });
      if (!res.canceled && res.assets) {
        const added: DraftPhoto[] = await Promise.all(
          res.assets.map(async (a) => {
            const compressed = await compressMobileImage(a, 2048, 0.82);
            return {
              kind: 'new',
              uri: compressed.uri,
              mimeType: compressed.mimeType,
            };
          })
        );
        setDraftPhotos((prev) => [...prev, ...added]);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not capture photo');
    }
  };

  const onTakePhoto = async () => {
    setError('');
    try {
      let { status, canAskAgain } = await ImagePicker.getCameraPermissionsAsync();
      if (status !== 'granted' && canAskAgain) {
        const req = await ImagePicker.requestCameraPermissionsAsync();
        status = req.status;
        canAskAgain = req.canAskAgain;
      }

      if (status === 'granted') {
        await launchCamera();
        return;
      }

      if (!canAskAgain) {
        setPermissionDialog({
          visible: true,
          needsSettings: true,
          message:
            'Camera permission is disabled in system settings. Open settings to grant permission.',
        });
      } else {
        setError('Camera access is required to take photos.');
      }
    } catch (err: any) {
      setError(err?.message || 'Could not access camera');
    }
  };

  const handlePermissionConfirm = () => {
    const isSettings = permissionDialog.needsSettings;
    setPermissionDialog((prev) => ({ ...prev, visible: false }));
    if (isSettings) {
      void Linking.openSettings();
    }
  };

  const removePhoto = (index: number) => {
    setDraftPhotos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const trimmed = body.trim();
    if ((!trimmed && !draftPhotos.length) || saving) return;
    setSaving(true);
    setError('');
    try {
      const ok = await onSave(trimmed, draftPhotos, editNote ? editNote._id : null);
      if (ok !== false) {
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Could not save note');
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!editNote || deleting) return;
    setDeleting(true);
    setError('');
    try {
      const ok = await onDelete(editNote._id);
      if (ok !== false) {
        setDeleteConfirmOpen(false);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Could not delete note');
      setDeleting(false);
      setDeleteConfirmOpen(false);
    }
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

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={onTakePhoto}
            >
              <Feather name="camera" size={16} color={colors.textSecondary} />
              <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>
                Camera
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={onPickPhotos}
            >
              <Feather name="image" size={16} color={colors.textSecondary} />
              <Text style={[styles.actionButtonText, { color: colors.textSecondary }]}>
                {draftPhotos.length ? `${draftPhotos.length} photos` : 'Photos'}
              </Text>
            </TouchableOpacity>
          </View>

          {Boolean(error) && (
            <View
              style={[
                styles.errorBox,
                {
                  borderColor: colors.destructive,
                  backgroundColor: colors.surfaceInset,
                },
              ]}
            >
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {error}
              </Text>
            </View>
          )}

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
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => setDeleteConfirmOpen(true)}
              disabled={deleting}
            >
              <Text style={[styles.deleteText, { color: colors.destructive }]}>
                Delete note
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Custom Styled Permission Request Popup */}
        <ConfirmDialog
          visible={permissionDialog.visible}
          useModal={false}
          title="Camera permission"
          message={permissionDialog.message}
          confirmText={permissionDialog.needsSettings ? 'Open Settings' : 'Continue'}
          cancelText="Cancel"
          onCancel={() =>
            setPermissionDialog((prev) => ({ ...prev, visible: false }))
          }
          onConfirm={handlePermissionConfirm}
        />

        {/* Custom Styled Delete Confirmation Popup */}
        <ConfirmDialog
          visible={deleteConfirmOpen}
          useModal={false}
          title="Delete note"
          message="Are you sure you want to delete this note?"
          confirmText="Delete"
          cancelText="Cancel"
          isDestructive
          onCancel={() => setDeleteConfirmOpen(false)}
          onConfirm={executeDelete}
        />
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
    ...StyleSheet.absoluteFillObject,
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
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
    gap: Spacing.two,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
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
