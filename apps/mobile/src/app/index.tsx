import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  ActivityIndicator,
  useColorScheme,
  Alert,
  ScrollView,
} from 'react-native';
import { useAuth, useUser } from '@clerk/clerk-expo';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@workspace/convex/api';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { Colors, Spacing } from '@/constants/theme';
import { hashPin } from '@/lib/pin';
import { DraftPhoto, Note, View as ViewMode } from '@/types';

import { AuthView } from '@/components/auth-view';
import { DayRail } from '@/components/day-rail';
import { MonthView } from '@/components/month-view';
import { YearView } from '@/components/year-view';
import { ImportantView } from '@/components/important-view';
import { NoteSheet } from '@/components/note-sheet';
import { PinDialog } from '@/components/pin-dialog';
import { SearchDialog } from '@/components/search-dialog';
import { PhotoViewer } from '@/components/photo-viewer';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const startOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

export default function HomeScreen() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'light' ? 'light' : 'dark'];

  const { isLoaded, isSignedIn, userId, signOut } = useAuth();
  const { user } = useUser();

  const [activePinHash, setActivePinHash] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);

  const notes = useQuery(
    api.notes.listMine,
    activePinHash ? { pinHash: activePinHash } : {}
  ) as Note[] | undefined;
  const settings = useQuery(api.userSettings.getMe, {}) as
    | { hasPin?: boolean }
    | null
    | undefined;

  const createNote = useMutation(api.notes.create);
  const updateNote = useMutation(api.notes.update);
  const removeNote = useMutation(api.notes.remove);
  const setImportant = useMutation(api.notes.setImportant);
  const getUploadUrl = useMutation(api.notes.generateUploadUrl);
  const setPinHash = useMutation(api.userSettings.setPinHash);
  const verifyPin = useMutation(api.userSettings.verifyPin);
  const removePin = useMutation(api.userSettings.removePin);

  const [view, setView] = useState<ViewMode>('day');
  const [cursor, setCursor] = useState<Date>(() => new Date());

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editNote, setEditNote] = useState<Note | null>(null);

  const [pinOpen, setPinOpen] = useState(false);
  const [pinMode, setPinMode] = useState<'set' | 'check'>('check');
  const [pinError, setPinError] = useState('');
  const pinResolve = useRef<((ok: boolean) => void) | null>(null);

  const [searchOpen, setSearchOpen] = useState(false);
  const [viewer, setViewer] = useState<{ list: string[]; index: number } | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  const allNotes = useMemo(() => notes ?? [], [notes]);

  const activeTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const note of allNotes) {
      if (note.isLocked || (note.important && !unlocked)) continue;
      const tags = note.tags ?? [];
      for (const tag of tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([tag]) => tag);
  }, [allNotes, unlocked]);

  useEffect(() => {
    if (selectedTag && !activeTags.includes(selectedTag)) {
      setSelectedTag(null);
    }
  }, [activeTags, selectedTag]);

  const visibleNotes = useMemo(() => {
    if (!selectedTag) return allNotes;
    return allNotes.filter((n) => !n.isLocked && n.tags?.includes(selectedTag));
  }, [allNotes, selectedTag]);

  const shift = useCallback(
    (d: number) => {
      setCursor((c) => {
        const n = new Date(c);
        if (view === 'day') n.setDate(n.getDate() + d);
        else if (view === 'month') n.setMonth(n.getMonth() + d);
        else if (view === 'year') n.setFullYear(n.getFullYear() + d);
        return n;
      });
    },
    [view]
  );

  const drill = useCallback((v: ViewMode, date?: Date) => {
    if (date) setCursor(date);
    setView(v);
  }, []);

  const askPin = useCallback(
    (mode: 'set' | 'check'): Promise<boolean> => {
      if (unlocked) return Promise.resolve(true);
      setPinMode(mode);
      setPinError('');
      setPinOpen(true);
      return new Promise((res) => {
        pinResolve.current = res;
      });
    },
    [unlocked]
  );

  const closePin = (ok: boolean) => {
    setPinOpen(false);
    pinResolve.current?.(ok);
    pinResolve.current = null;
  };

  const submitPin = async (pinValue: string) => {
    if (!userId) return;
    if (pinMode === 'set') {
      if (pinValue.length < 4) {
        setPinError('4 characters or more.');
        return;
      }
      const hash = await hashPin(userId, pinValue);
      await setPinHash({ pinHash: hash });
      setActivePinHash(hash);
      setUnlocked(true);
      closePin(true);
      return;
    }
    const hash = await hashPin(userId, pinValue);
    const ok = await verifyPin({ pinHash: hash });
    if (ok) {
      setActivePinHash(hash);
      setUnlocked(true);
      closePin(true);
    } else {
      setPinError('Wrong PIN.');
    }
  };

  const needPin = useCallback(async (): Promise<boolean> => {
    if (unlocked) return true;
    if (!settings?.hasPin) return askPin('set');
    return askPin('check');
  }, [unlocked, settings, askPin]);

  const openImportant = async () => {
    if (view === 'important') {
      setView('day');
      return;
    }
    if (await needPin()) setView('important');
  };

  const toggleStar = async (note: Note) => {
    if ((note.isLocked || !note.important || !unlocked) && !(await needPin())) return;
    await setImportant({
      id: note._id as any,
      important: !note.important,
      pinHash: activePinHash ?? undefined,
    });
  };

  const handleOpenNote = async (n: Note) => {
    if (n.isLocked || (n.important && !unlocked)) {
      const ok = await needPin();
      if (!ok) return;
      const fresh = allNotes.find((item) => item._id === n._id && !item.isLocked);
      if (fresh) n = fresh;
    }
    setEditNote(n);
    setSheetOpen(true);
  };

  useEffect(() => {
    if (!sheetOpen || !editNote) return;
    const current = allNotes.find((n) => n._id === editNote._id);
    if (current && !current.isLocked && editNote.isLocked) {
      setEditNote(current);
    }
  }, [allNotes, editNote, sheetOpen]);

  const uploadDrafts = async (drafts: DraftPhoto[]): Promise<string[]> => {
    const ids: string[] = [];
    for (const p of drafts) {
      if (p.kind === 'stored') {
        ids.push(p.storageId);
      } else {
        const url = (await getUploadUrl({})) as string;
        const response = await fetch(p.uri);
        const blob = await response.blob();
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': p.mimeType || blob.type || 'image/jpeg' },
          body: blob,
        });
        if (!res.ok) throw new Error('Upload failed');
        const { storageId } = (await res.json()) as { storageId: string };
        ids.push(storageId);
      }
    }
    return ids;
  };

  const handleSaveNote = async (
    body: string,
    draftPhotos: DraftPhoto[],
    editId: string | null
  ) => {
    const photoIds = (await uploadDrafts(draftPhotos)) as any;
    if (editId) {
      await updateNote({
        id: editId as any,
        body,
        photoIds,
        pinHash: activePinHash ?? undefined,
      });
    } else {
      const base = sameDay(cursor, new Date())
        ? Date.now()
        : startOfDay(cursor).getTime() + new Date().getHours() * 3600000;
      await createNote({ body, photoIds, createdAt: base });
    }
  };

  const handleDeleteNote = async (id: string) => {
    await removeNote({
      id: id as any,
      pinHash: activePinHash ?? undefined,
    });
  };

  const handleSignOut = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => signOut() },
    ]);
  };

  if (!isLoaded) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!isSignedIn) {
    return <AuthView />;
  }

  const dayNotes = visibleNotes
    .filter((n) => sameDay(new Date(n.createdAt), cursor))
    .sort((a, b) => a.createdAt - b.createdAt);

  const importantNotes = visibleNotes
    .filter((n) => n.important)
    .sort((a, b) => b.createdAt - a.createdAt);

  const offToday = !(sameDay(cursor, new Date()) && view === 'day');

  const dateHeading =
    view === 'day'
      ? cursor.toDateString()
      : view === 'month'
      ? `${MONTHS_FULL[cursor.getMonth()]} ${cursor.getFullYear()}`
      : view === 'year'
      ? String(cursor.getFullYear())
      : `Important · ${importantNotes.length}`;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <View style={styles.topRow}>
          <View style={styles.breadcrumb}>
            <TouchableOpacity onPress={() => setView('year')} hitSlop={6}>
              <Text style={[styles.breadText, { color: colors.textSecondary }]}>
                {cursor.getFullYear()}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.breadSlash, { color: colors.textSecondary }]}>/</Text>
            <TouchableOpacity onPress={() => setView('month')} hitSlop={6}>
              <Text style={[styles.breadText, { color: colors.textSecondary }]}>
                {MONTHS[cursor.getMonth()]}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.breadSlash, { color: colors.textSecondary }]}>/</Text>
            <TouchableOpacity onPress={() => setView('day')} hitSlop={6}>
              <Text style={[styles.breadText, { color: colors.textSecondary }]}>
                {cursor.getDate()}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.userButton, { backgroundColor: colors.backgroundElement }]}
            onPress={handleSignOut}
            hitSlop={6}
          >
            <Feather name="user" size={14} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.bottomRow}>
          <View style={styles.actionGroup}>
            {view !== 'important' && view !== 'year' && (
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.backgroundElement }]}
                onPress={() => drill(view === 'day' ? 'month' : 'year')}
                hitSlop={6}
              >
                <Feather name="arrow-up" size={16} color={colors.text} />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor:
                    view === 'important' ? colors.primary : colors.backgroundElement,
                },
              ]}
              onPress={openImportant}
              hitSlop={6}
            >
              {view === 'important' ? (
                <FontAwesome name="star" size={15} color={colors.primaryForeground} />
              ) : (
                <Feather name="star" size={15} color={colors.text} />
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.iconButton,
                {
                  backgroundColor:
                    searchOpen ? colors.primary : colors.backgroundElement,
                },
              ]}
              onPress={() => setSearchOpen(true)}
              hitSlop={6}
            >
              <Feather
                name="search"
                size={15}
                color={searchOpen ? colors.primaryForeground : colors.text}
              />
            </TouchableOpacity>
          </View>

          <Text
            numberOfLines={1}
            style={[styles.dateHeading, { color: colors.textSecondary }]}
          >
            {dateHeading}
          </Text>

          <View style={styles.actionGroup}>
            {view === 'important' ? (
              <TouchableOpacity
                style={[styles.iconButton, { backgroundColor: colors.backgroundElement }]}
                onPress={() => {
                  setActivePinHash(null);
                  setUnlocked(false);
                  setView('day');
                }}
                hitSlop={6}
              >
                <Feather name="lock" size={16} color={colors.text} />
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.iconButton, { backgroundColor: colors.backgroundElement }]}
                  onPress={() => shift(-1)}
                  hitSlop={6}
                >
                  <Feather name="chevron-left" size={16} color={colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.iconButton, { backgroundColor: colors.backgroundElement }]}
                  onPress={() => shift(1)}
                  hitSlop={6}
                >
                  <Feather name="chevron-right" size={16} color={colors.text} />
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        {activeTags.length > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tagBar}
          >
            <TouchableOpacity
              style={[
                styles.tagPill,
                {
                  backgroundColor:
                    selectedTag === null ? colors.primary : colors.backgroundElement,
                  borderColor: colors.border,
                },
              ]}
              onPress={() => setSelectedTag(null)}
            >
              <Text
                style={[
                  styles.tagText,
                  {
                    color:
                      selectedTag === null
                        ? colors.primaryForeground
                        : colors.textSecondary,
                  },
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            {activeTags.map((tag) => {
              const active = selectedTag === tag;
              return (
                <TouchableOpacity
                  key={tag}
                  style={[
                    styles.tagPill,
                    {
                      backgroundColor: active ? colors.primary : colors.backgroundElement,
                      borderColor: colors.border,
                    },
                  ]}
                  onPress={() => setSelectedTag(active ? null : tag)}
                >
                  <Text
                    style={[
                      styles.tagText,
                      {
                        color: active ? colors.primaryForeground : colors.textSecondary,
                        fontWeight: active ? '600' : '500',
                      },
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Main Content View */}
      {notes === undefined ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <View style={styles.content}>
          {view === 'day' && (
            <DayRail
              notes={dayNotes}
              cursor={cursor}
              onStar={toggleStar}
              onOpen={handleOpenNote}
              onViewer={(list, i) => setViewer({ list, index: i })}
              unlocked={unlocked}
              onSelectTag={(t) => setSelectedTag(t)}
            />
          )}
          {view === 'month' && (
            <MonthView
              cursor={cursor}
              notes={visibleNotes}
              onDrill={(d) => drill('day', d)}
              unlocked={unlocked}
            />
          )}
          {view === 'year' && (
            <YearView
              cursor={cursor}
              notes={visibleNotes}
              onDrill={(d) => drill('month', d)}
              unlocked={unlocked}
            />
          )}
          {view === 'important' && (
            <ImportantView
              notes={importantNotes}
              onStar={toggleStar}
              onOpen={handleOpenNote}
              onViewer={(list, i) => setViewer({ list, index: i })}
              unlocked={unlocked}
              onSelectTag={(t) => setSelectedTag(t)}
            />
          )}
        </View>
      )}

      {/* Back to today floating button */}
      {offToday && view !== 'important' && (
        <TouchableOpacity
          style={[styles.backToday, { backgroundColor: colors.primary }]}
          onPress={() => {
            setCursor(new Date());
            setView('day');
          }}
          activeOpacity={0.8}
        >
          <Text style={[styles.backTodayText, { color: colors.primaryForeground }]}>
            Back to today
          </Text>
        </TouchableOpacity>
      )}

      {/* Floating Add Note button */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          setEditNote(null);
          setSheetOpen(true);
        }}
        activeOpacity={0.8}
      >
        <Feather name="plus" size={24} color={colors.primaryForeground} />
      </TouchableOpacity>

      {/* Note Compose / Edit Sheet */}
      <NoteSheet
        visible={sheetOpen}
        editNote={editNote}
        cursor={cursor}
        onClose={() => setSheetOpen(false)}
        onSave={handleSaveNote}
        onDelete={handleDeleteNote}
      />

      {/* PIN Dialog */}
      <PinDialog
        visible={pinOpen}
        mode={pinMode}
        error={pinError}
        onCancel={() => closePin(false)}
        onSubmit={submitPin}
      />

      {/* Search Dialog */}
      <SearchDialog
        visible={searchOpen}
        notes={allNotes}
        unlocked={unlocked}
        onClose={() => setSearchOpen(false)}
        onSelectNote={async (n) => {
          setSearchOpen(false);
          if (n.important && !unlocked) {
            const ok = await needPin();
            if (!ok) return;
          }
          setCursor(new Date(n.createdAt));
          setView('day');
        }}
      />

      {/* Photo Viewer Lightbox */}
      {viewer && (
        <PhotoViewer
          list={viewer.list}
          index={viewer.index}
          onClose={() => setViewer(null)}
          onNav={(i) => setViewer((v) => (v ? { ...v, index: i } : v))}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breadText: {
    fontSize: 13,
    fontWeight: '600',
  },
  breadSlash: {
    fontSize: 12,
    opacity: 0.4,
  },
  userButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateHeading: {
    fontSize: 13,
    fontWeight: '600',
  },
  tagBar: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: Spacing.two,
    paddingBottom: 2,
  },
  tagPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 9999,
    borderWidth: 1,
  },
  tagText: {
    fontSize: 12,
  },
  content: {
    flex: 1,
    paddingTop: Spacing.two,
  },
  backToday: {
    position: 'absolute',
    bottom: 90,
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backTodayText: {
    fontSize: 13,
    fontWeight: '700',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
});
