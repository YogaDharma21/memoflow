"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { Badge } from "@workspace/ui/components/badge";
import { Dialog, DialogContent, DialogTitle } from "@workspace/ui/components/dialog";
import { Sheet, SheetContent, SheetTitle } from "@workspace/ui/components/sheet";
import { hashPin } from "@/lib/pin";

type View = "day" | "month" | "year" | "important";

type Note = {
  _id: string;
  body: string;
  photoIds: string[];
  photoUrls: string[];
  important: boolean;
  createdAt: number;
  ownerId: string;
};

type DraftPhoto =
  | { kind: "stored"; storageId: string; url: string }
  | { kind: "new"; file: File; url: string };

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const DOW = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const fmtHour = (h: number) =>
  h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`;

const startOfDay = (d: Date) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

export default function Page() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  const notes = useQuery("notes:listMine" as any, {}) as Note[] | undefined;
  const settings = useQuery("userSettings:getMe" as any, {}) as {
    pinHash?: string;
  } | null | undefined;
  const createNote = useMutation("notes:create" as any);
  const updateNote = useMutation("notes:update" as any);
  const removeNote = useMutation("notes:remove" as any);
  const setImportant = useMutation("notes:setImportant" as any);
  const getUploadUrl = useMutation("notes:generateUploadUrl" as any);
  const setPinHash = useMutation("userSettings:setPinHash" as any);

  const [view, setView] = useState<View>("day");
  const [cursor, setCursor] = useState<Date>(() => new Date());
  const [unlocked, setUnlocked] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [draftBody, setDraftBody] = useState("");
  const [draftPhotos, setDraftPhotos] = useState<DraftPhoto[]>([]);
  const [saving, setSaving] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pinMode, setPinMode] = useState<"set" | "check">("check");
  const [pinValue, setPinValue] = useState("");
  const [pinError, setPinError] = useState("");
  const pinResolve = useRef<((ok: boolean) => void) | null>(null);
  const [viewer, setViewer] = useState<{ list: string[]; index: number } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceIdx = useRef(-1);
  const touchX = useRef(0);

  const all = useMemo(() => notes ?? [], [notes]);

  const shift = useCallback(
    (d: number) => {
      setCursor((c) => {
        const n = new Date(c);
        if (view === "day") n.setDate(n.getDate() + d);
        else if (view === "month") n.setMonth(n.getMonth() + d);
        else if (view === "year") n.setFullYear(n.getFullYear() + d);
        return n;
      });
    },
    [view],
  );

  const drill = useCallback((v: View, date?: Date) => {
    if (date) setCursor(date);
    setView(v);
  }, []);

  // Arrow keys shift cursor, skipped while typing or viewer/PIN open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (viewer || pinOpen || sheetOpen) return;
      const t = document.activeElement;
      if (t && /INPUT|TEXTAREA/.test(t.tagName)) return;
      if (e.key === "ArrowRight") shift(1);
      if (e.key === "ArrowLeft") shift(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [shift, viewer, pinOpen, sheetOpen]);

  const askPin = useCallback(
    (mode: "set" | "check"): Promise<boolean> => {
      if (unlocked) return Promise.resolve(true);
      setPinMode(mode);
      setPinValue("");
      setPinError("");
      setPinOpen(true);
      return new Promise((res) => {
        pinResolve.current = res;
      });
    },
    [unlocked],
  );

  const closePin = (ok: boolean) => {
    setPinOpen(false);
    pinResolve.current?.(ok);
    pinResolve.current = null;
  };

  const submitPin = async () => {
    if (!userId) return;
    if (pinMode === "set") {
      if (pinValue.length < 4) {
        setPinError("4 characters or more.");
        return;
      }
      await setPinHash({ pinHash: await hashPin(userId, pinValue) });
      setUnlocked(true);
      closePin(true);
      return;
    }
    const hash = await hashPin(userId, pinValue);
    if (settings?.pinHash && hash === settings.pinHash) {
      setUnlocked(true);
      closePin(true);
    } else {
      setPinError("Wrong PIN.");
    }
  };

  const needPin = useCallback(async (): Promise<boolean> => {
    if (unlocked) return true;
    if (!settings?.pinHash) return askPin("set");
    return askPin("check");
  }, [unlocked, settings, askPin]);

  const openImportant = async () => {
    if (view === "important") {
      setView("day");
      return;
    }
    if (await needPin()) setView("important");
  };

  const toggleStar = async (note: Note) => {
    if (!note.important && !(await needPin())) return;
    await setImportant({ id: note._id as any, important: !note.important });
  };

  const openNew = () => {
    setEditId(null);
    setDraftBody("");
    setDraftPhotos([]);
    setSheetOpen(true);
  };

  const openEdit = (note: Note) => {
    setEditId(note._id);
    setDraftBody(note.body);
    setDraftPhotos(
      note.photoIds.map((id, i) => ({
        kind: "stored" as const,
        storageId: id,
        url: note.photoUrls[i] ?? "",
      })),
    );
    setSheetOpen(true);
  };

  const pickPhotos = (replace: number) => {
    replaceIdx.current = replace;
    if (fileRef.current) {
      fileRef.current.multiple = replace < 0;
      fileRef.current.click();
    }
  };

  const onFiles = (files: FileList | null) => {
    if (!files?.length) return;
    const made: DraftPhoto[] = Array.from(files).map((file) => ({
      kind: "new" as const,
      file,
      url: URL.createObjectURL(file),
    }));
    setDraftPhotos((prev) => {
      if (replaceIdx.current >= 0 && made[0]) {
        const next = prev.slice();
        next[replaceIdx.current] = made[0];
        return next;
      }
      return prev.concat(made);
    });
    replaceIdx.current = -1;
    if (fileRef.current) fileRef.current.value = "";
  };

  const uploadDrafts = async (): Promise<string[]> => {
    const ids: string[] = [];
    for (const p of draftPhotos) {
      if (p.kind === "stored") {
        ids.push(p.storageId);
      } else {
        const url = (await getUploadUrl({})) as string;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": p.file.type || "image/jpeg" },
          body: p.file,
        });
        if (!res.ok) throw new Error("Upload failed");
        const { storageId } = (await res.json()) as { storageId: string };
        ids.push(storageId);
      }
    }
    return ids;
  };

  const saveNote = async () => {
    const body = draftBody.trim();
    if ((!body && !draftPhotos.length) || saving) return;
    setSaving(true);
    try {
      const photoIds = (await uploadDrafts()) as any;
      if (editId) {
        await updateNote({ id: editId as any, body, photoIds });
      } else {
        const base = sameDay(cursor, new Date()) ? Date.now() : startOfDay(cursor).getTime() + new Date().getHours() * 3600000;
        await createNote({ body, photoIds, createdAt: base });
      }
      setSheetOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async () => {
    if (editId && confirm("Delete this note.")) {
      await removeNote({ id: editId as any });
      setSheetOpen(false);
    }
  };

  if (!isLoaded) return <div className="mx-auto w-full max-w-[1000px] p-6 text-sm">Loading...</div>;
  if (!isSignedIn)
    return (
      <div className="mx-auto flex w-full max-w-[1000px] flex-col items-center gap-3 p-6 text-sm">
        <h1 className="font-medium">memoflows</h1>
        <p className="text-muted-foreground">Sign in to see your notes.</p>
        <SignInButton mode="modal">
          <Button>Sign in</Button>
        </SignInButton>
      </div>
    );

  const dayNotes = all
    .filter((n) => sameDay(new Date(n.createdAt), cursor))
    .sort((a, b) => a.createdAt - b.createdAt);
  const importantNotes = all
    .filter((n) => n.important)
    .sort((a, b) => b.createdAt - a.createdAt);
  const offToday = !(sameDay(cursor, new Date()) && view === "day");

  return (
    <div className="mx-auto w-full max-w-[1000px] pb-30">
      <header className="bg-background/80 sticky top-0 z-5 border-b border-transparent px-4 pt-3 pb-1 backdrop-blur-md">
        <nav className="flex items-baseline gap-1 text-[13px] font-semibold">
          <button className="text-muted-foreground cursor-pointer px-0.5" onClick={() => setView("year")}>
            {cursor.getFullYear()}
          </button>
          <span className="text-muted-foreground text-xs opacity-30">/</span>
          <button className="text-muted-foreground cursor-pointer px-0.5" onClick={() => setView("month")}>
            {MONTHS[cursor.getMonth()]}
          </button>
          <span className="text-muted-foreground text-xs opacity-30">/</span>
          <button className="text-muted-foreground cursor-pointer px-0.5" onClick={() => setView("day")}>
            {cursor.getDate()}
          </button>
        </nav>
        <div className="flex items-center justify-between py-2">
          <span className="flex gap-1.5">
            <Button size="sm" variant="secondary" onClick={() => drill(view === "day" ? "month" : "year")}>
              Up
            </Button>
            <Button size="sm" variant={view === "important" ? "default" : "secondary"} onClick={openImportant} aria-label="important notes">
              Star
            </Button>
          </span>
          <span className="text-muted-foreground text-[13px] font-semibold">
            {view === "day"
              ? cursor.toDateString()
              : view === "month"
                ? `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`
                : view === "year"
                  ? cursor.getFullYear()
                  : `Important · ${importantNotes.length}`}
          </span>
          <span className="flex gap-1.5">
            {view !== "important" && (
              <>
                <Button size="sm" variant="secondary" onClick={() => shift(-1)}>‹</Button>
                <Button size="sm" variant="secondary" onClick={() => shift(1)}>›</Button>
              </>
            )}
          </span>
        </div>
      </header>

      <main
        className="px-4 py-2"
        onTouchStart={(e) => {
          touchX.current = e.changedTouches[0]?.clientX ?? 0;
        }}
        onTouchEnd={(e) => {
          const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current;
          if (Math.abs(dx) > 48 && view !== "important") shift(dx < 0 ? 1 : -1);
        }}
      >
        {view === "day" && <DayRail notes={dayNotes} cursor={cursor} onStar={toggleStar} onOpen={openEdit} onViewer={(l, i) => setViewer({ list: l, index: i })} />}
        {view === "month" && <MonthView cursor={cursor} notes={all} onDrill={(d) => drill("day", d)} />}
        {view === "year" && <YearView cursor={cursor} notes={all} onDrill={(d) => drill("month", d)} />}
        {view === "important" && <ImportantView notes={importantNotes} onStar={toggleStar} onOpen={openEdit} onViewer={(l, i) => setViewer({ list: l, index: i })} />}
      </main>

      {offToday && view !== "important" && (
        <button
          className="bg-primary text-primary-foreground fixed bottom-24 left-1/2 z-15 flex -translate-x-1/2 items-center gap-2 rounded-full px-4 py-2 text-[13px] font-bold shadow-lg"
          onClick={() => {
            setCursor(new Date());
            setView("day");
          }}
        >
          Back to today
        </button>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-6 mx-auto w-full max-w-[1000px]">
        <Button className="pointer-events-auto float-right mr-4 size-14 rounded-full text-2xl" onClick={openNew} aria-label="add note">
          +
        </Button>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetTitle className="text-muted-foreground text-[13px] font-bold">
            {editId ? "Edit note" : "New note"}
          </SheetTitle>
          <textarea
            className="bg-card mt-3 min-h-24 w-full rounded-xl border p-3 text-[15px] outline-none"
            placeholder="type a note"
            value={draftBody}
            onChange={(e) => setDraftBody(e.target.value)}
          />
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(e) => onFiles(e.target.files)}
          />
          <div className="mt-2 flex gap-2 overflow-x-auto">
            {draftPhotos.map((p, i) => (
              <div key={`${p.url}-${i}`} className="relative h-13 w-13 flex-none overflow-hidden rounded-lg border">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="h-full w-full object-cover" onClick={() => pickPhotos(i)} />
                <button
                  className="absolute top-0.5 right-0.5 size-5 rounded-full bg-black/65 text-xs text-white"
                  onClick={() => setDraftPhotos((prev) => prev.filter((_, j) => j !== i))}
                  aria-label="remove photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <button className="text-muted-foreground mt-2 text-[12.5px] font-semibold" onClick={() => pickPhotos(-1)}>
            {draftPhotos.length ? `Photos · ${draftPhotos.length}` : "Photos"}
          </button>
          <Button className="mt-3 w-full" onClick={saveNote} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          {editId && (
            <button className="text-destructive mt-1 w-full p-2 text-[13px] font-semibold opacity-75" onClick={deleteNote}>
              Delete note
            </button>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={pinOpen} onOpenChange={(o) => !o && closePin(false)}>
        <DialogContent>
          <DialogTitle className="text-sm">{pinMode === "set" ? "Set a PIN" : "Enter PIN"}</DialogTitle>
          <p className="text-muted-foreground text-xs">
            {pinMode === "set" ? "First time. 4 characters or more." : "Type your PIN."}
          </p>
          <input
            type="password"
            inputMode="numeric"
            className="bg-card mt-2 w-full rounded-lg border p-2.5 text-base outline-none"
            placeholder="PIN"
            value={pinValue}
            onChange={(e) => setPinValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitPin()}
          />
          {pinError && <p className="text-destructive mt-1 text-xs">{pinError}</p>}
          <div className="mt-2 flex gap-2">
            <Button variant="ghost" className="flex-1" onClick={() => closePin(false)}>
              Cancel
            </Button>
            <Button className="flex-1" onClick={submitPin}>
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {viewer && <Viewer list={viewer.list} index={viewer.index} onClose={() => setViewer(null)} onNav={(i) => setViewer((v) => (v ? { ...v, index: i } : v))} />}
    </div>
  );
}

function NoteCard({
  note,
  onStar,
  onOpen,
  onViewer,
}: {
  note: Note;
  onStar: (n: Note) => void;
  onOpen: (n: Note) => void;
  onViewer: (list: string[], i: number) => void;
}) {
  return (
    <Card className="my-1.5 cursor-pointer p-3" onClick={() => onOpen(note)}>
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 text-sm">{note.body.trim() ? note.body : "photo"}</span>
        <button
          className={`flex-none pl-1 text-sm ${note.important ? "opacity-100" : "text-muted-foreground opacity-45"}`}
          onClick={(e) => {
            e.stopPropagation();
            onStar(note);
          }}
          aria-label="toggle important"
        >
          {note.important ? "★" : "☆"}
        </button>
      </div>
      {note.photoUrls.map((u, i) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={`${note._id}-${i}`}
          src={u}
          alt=""
          loading="lazy"
          className="mt-2 w-full cursor-zoom-in rounded-lg"
          onClick={(e) => {
            e.stopPropagation();
            onViewer(note.photoUrls, i);
          }}
        />
      ))}
      <small className="text-muted-foreground mt-1 block text-[11px]">
        {new Date(note.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })} ·{" "}
        {new Date(note.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
        {note.photoUrls.length ? ` · ${note.photoUrls.length} photo${note.photoUrls.length > 1 ? "s" : ""}` : ""}
      </small>
    </Card>
  );
}

function DayRail({
  notes,
  cursor,
  onStar,
  onOpen,
  onViewer,
}: {
  notes: Note[];
  cursor: Date;
  onStar: (n: Note) => void;
  onOpen: (n: Note) => void;
  onViewer: (list: string[], i: number) => void;
}) {
  const nowH = new Date().getHours();
  const isToday = sameDay(cursor, new Date());
  return (
    <div className="border-border relative ml-13 border-l">
      {Array.from({ length: 24 }, (_, h) => {
        const list = notes.filter((n) => new Date(n.createdAt).getHours() === h);
        return (
          <div key={h} className="relative min-h-11 rounded-xl py-1.5 pr-0 pl-4">
            <span className="text-muted-foreground absolute top-2 -left-13 w-9 text-right text-[11px] font-semibold tabular-nums">
              {fmtHour(h)}
            </span>
            <span
              className={`border-border absolute top-2.5 -left-1.5 size-3 rounded-full border-2 ${
                list.length ? "bg-primary border-primary" : "bg-muted"
              } ${isToday && h === nowH ? "border-destructive bg-transparent" : ""}`}
            />
            {!list.length && (
              <div className="text-muted-foreground text-xs opacity-60">{h === nowH && isToday ? "now" : "—"}</div>
            )}
            {list.map((n) => (
              <NoteCard key={n._id} note={n} onStar={onStar} onOpen={onOpen} onViewer={onViewer} />
            ))}
          </div>
        );
      })}
    </div>
  );
}

function MonthView({ cursor, notes, onDrill }: { cursor: Date; notes: Note[]; onDrill: (d: Date) => void }) {
  const y = cursor.getFullYear();
  const m = cursor.getMonth();
  const days = new Date(y, m + 1, 0).getDate();
  return (
    <div>
      {Array.from({ length: days }, (_, k) => {
        const d = k + 1;
        const dt = new Date(y, m, d);
        const list = notes
          .filter((n) => sameDay(new Date(n.createdAt), dt))
          .sort((a, b) => a.createdAt - b.createdAt);
        return (
          <button
            key={d}
            className="border-border grid w-full cursor-pointer grid-cols-[34px_1fr_auto] items-start gap-3 border-b py-2.5 text-left last:border-b-0"
            onClick={() => onDrill(dt)}
          >
            <span className="text-right text-lg leading-none font-bold tabular-nums">
              {d}
              <small className="text-muted-foreground mt-0.5 block text-[10px] font-semibold">{DOW[dt.getDay()] ?? ""}</small>
            </span>
            <span className="min-w-0">
              <span className="text-muted-foreground block truncate text-[13px]">
                {list.length ? ((list[0]?.body.trim() ? list[0]?.body : "photo")) : "—"}
              </span>
              <span className="mt-1.5 flex items-center gap-1">
                {Array.from({ length: Math.min(Math.max(list.length, 3), 5) }, (_, i) => (
                  <i key={i} className={`block size-1.5 rounded-full ${i < list.length ? "bg-primary" : "bg-border"}`} />
                ))}
              </span>
            </span>
            <span className="text-muted-foreground text-[11px] tabular-nums">{list.length ? list.length : ""}</span>
          </button>
        );
      })}
    </div>
  );
}

function YearView({ cursor, notes, onDrill }: { cursor: Date; notes: Note[]; onDrill: (d: Date) => void }) {
  const yr = cursor.getFullYear();
  const counts = MONTHS.map(
    (_, i) => notes.filter((n) => { const d = new Date(n.createdAt); return d.getFullYear() === yr && d.getMonth() === i; }).length,
  );
  const peak = Math.max(1, ...counts);
  const curM = new Date().getFullYear() === yr ? new Date().getMonth() : -1;
  return (
    <div>
      {MONTHS.map((nm, i) => {
        const monthNotes = notes
          .filter((n) => { const d = new Date(n.createdAt); return d.getFullYear() === yr && d.getMonth() === i; })
          .sort((a, b) => a.createdAt - b.createdAt);
        const days = new Set(monthNotes.map((n) => new Date(n.createdAt).getDate())).size;
        return (
          <button
            key={nm}
            className="border-border grid w-full cursor-pointer grid-cols-[34px_1fr_auto] items-start gap-3 border-b py-2.5 text-left last:border-b-0"
            onClick={() => onDrill(new Date(yr, i, 1))}
          >
            <span className="text-right text-[13px] font-bold">
              {nm}
              <span className="text-muted-foreground block text-[10px] font-semibold">{String(yr).slice(2)}</span>
            </span>
            <span className="min-w-0">
              <span className="text-muted-foreground block truncate text-[13px]">
                {monthNotes.length ? ((monthNotes[0]?.body.trim() ? monthNotes[0]?.body : "photo")) : "—"}
              </span>
              <span className="bg-muted mt-2 block h-1 overflow-hidden rounded-full">
                <i className="bg-primary block h-full rounded-full" style={{ width: `${Math.round(((counts[i] ?? 0) / peak) * 100)}%` }} />
              </span>
              <span className="text-muted-foreground mt-1 block text-[11px] tabular-nums">
                {(counts[i] ?? 0) ? `${days}d, ${counts[i]}n` : "empty"}
              </span>
            </span>
            <span className="flex flex-col items-end gap-1">
              {i === curM && <span className="bg-destructive size-2 rounded-full" />}
              {(counts[i] ?? 0) ? <Badge variant="secondary">{counts[i]}</Badge> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function ImportantView({
  notes,
  onStar,
  onOpen,
  onViewer,
}: {
  notes: Note[];
  onStar: (n: Note) => void;
  onOpen: (n: Note) => void;
  onViewer: (list: string[], i: number) => void;
}) {
  if (!notes.length)
    return <div className="text-muted-foreground text-xs">No important notes yet. Tap the star on a note to mark it.</div>;
  return (
    <div>
      {notes.map((n) => (
        <NoteCard key={n._id} note={n} onStar={onStar} onOpen={onOpen} onViewer={onViewer} />
      ))}
    </div>
  );
}

function Viewer({ list, index, onClose, onNav }: { list: string[]; index: number; onClose: () => void; onNav: (i: number) => void }) {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<[number, number]>([0, 0]);
  const pts = useRef(new Map<number, [number, number]>());
  const pinchD = useRef(0);
  const lastTap = useRef(0);

  useEffect(() => {
    setZoom(1);
    setPan([0, 0]);
  }, [index, list]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNav((index + 1) % list.length);
      if (e.key === "ArrowLeft") onNav((index - 1 + list.length) % list.length);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, list.length, onClose, onNav]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/92 touch-none"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <button className="absolute top-3 right-3 size-9 rounded-full border border-white/25 bg-white/10 text-[17px] text-white" onClick={onClose} aria-label="close viewer">
        ×
      </button>
      {list.length > 1 && (
        <>
          <button
            className="absolute top-1/2 left-2.5 size-10 -translate-y-1/2 rounded-full border border-white/25 bg-white/10 text-lg text-white"
            onClick={(e) => {
              e.stopPropagation();
              onNav((index - 1 + list.length) % list.length);
            }}
            aria-label="previous photo"
          >
            ‹
          </button>
          <button
            className="absolute top-1/2 right-2.5 size-10 -translate-y-1/2 rounded-full border border-white/25 bg-white/10 text-lg text-white"
            onClick={(e) => {
              e.stopPropagation();
              onNav((index + 1) % list.length);
            }}
            aria-label="next photo"
          >
            ›
          </button>
        </>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={list[index]}
        alt=""
        className="max-h-full max-w-full object-contain"
        style={{ transform: `translate(${pan[0]}px,${pan[1]}px) scale(${zoom})` }}
        onDoubleClick={() => {
          setZoom((z) => (z > 1 ? 1 : 2.5));
          setPan([0, 0]);
        }}
        onWheel={(e) => {
          e.preventDefault();
          setZoom((z) => Math.min(4, Math.max(1, z + (e.deltaY < 0 ? 0.25 : -0.25))));
        }}
        onTouchEnd={() => {
          const t = Date.now();
          if (t - lastTap.current < 300) {
            setZoom((z) => (z > 1 ? 1 : 2.5));
            setPan([0, 0]);
          }
          lastTap.current = t;
        }}
        onPointerDown={(e) => {
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          pts.current.set(e.pointerId, [e.clientX, e.clientY]);
          if (pts.current.size === 2) {
            const p = Array.from(pts.current.values());
            const a = p[0]!;
            const b = p[1]!;
            pinchD.current = Math.hypot(a[0] - b[0], a[1] - b[1]);
          }
        }}
        onPointerMove={(e) => {
          if (!pts.current.has(e.pointerId)) return;
          const prev = pts.current.get(e.pointerId)!;
          pts.current.set(e.pointerId, [e.clientX, e.clientY]);
          if (pts.current.size === 2) {
            const p = Array.from(pts.current.values());
            const a = p[0]!;
            const b = p[1]!;
            const d = Math.hypot(a[0] - b[0], a[1] - b[1]);
            if (pinchD.current) setZoom((z) => Math.min(4, Math.max(1, (z * d) / pinchD.current)));
            pinchD.current = d;
          } else if (zoom > 1) {
            setPan(([x, y]) => [x + e.clientX - prev[0], y + e.clientY - prev[1]]);
          }
        }}
        onPointerUp={(e) => {
          pts.current.delete(e.pointerId);
          if (pts.current.size < 2) pinchD.current = 0;
        }}
        onPointerCancel={(e) => {
          pts.current.delete(e.pointerId);
          if (pts.current.size < 2) pinchD.current = 0;
        }}
      />
      <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 text-xs text-white/70 tabular-nums">
        {list.length > 1 ? `${index + 1} / ${list.length}` : ""}
      </div>
    </div>
  );
}
