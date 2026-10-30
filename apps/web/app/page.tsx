"use client"
import { LandingPage } from "@/components/landing-page"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/convex/api"
import { useAuth, SignInButton, UserButton } from "@clerk/nextjs"
import {
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ImagePlus,
  KeyRound,
  Lock,
  Plus,
  Search,
  Star,
  X,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@workspace/ui/components/dialog"
import { Sheet, SheetContent, SheetTitle } from "@workspace/ui/components/sheet"
import { hashPin } from "@/lib/pin"

type View = "day" | "month" | "year" | "important"

type Note = {
  _id: string
  body: string
  photoIds: string[]
  photoUrls: string[]
  important: boolean
  createdAt: number
  ownerId: string
  isLocked?: boolean
}

type DraftPhoto =
  | { kind: "stored"; storageId: string; url: string }
  | { kind: "new"; file: File; url: string }

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
]
const MONTHS_FULL = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]
const DOW = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"]
const DOW_FULL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
]

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate()

const fmtHour = (h: number) =>
  h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`

const startOfDay = (d: Date) => {
  const c = new Date(d)
  c.setHours(0, 0, 0, 0)
  return c
}

const hasClerkSession = () => {
  if (typeof document === "undefined") return false
  return (
    /(?:^|;\s*)(?:__session|__client_uat|__clerk_db_jwt)\s*=\s*([^;]+)/.test(
      document.cookie
    ) && !/(?:^|;\s*)__client_uat\s*=\s*0(?:;|$)/.test(document.cookie)
  )
}

export default function Page() {
  const { isLoaded, isSignedIn, userId } = useAuth()
  const [activePinHash, setActivePinHash] = useState<string | null>(null)
  const unlocked = Boolean(activePinHash)
  const notes = useQuery(
    api.notes.listMine,
    activePinHash ? { pinHash: activePinHash } : {}
  ) as Note[] | undefined
  const settings = useQuery(api.userSettings.getMe, {}) as
    | {
        hasPin: boolean
      }
    | null
    | undefined
  const createNote = useMutation(api.notes.create)
  const updateNote = useMutation(api.notes.update)
  const removeNote = useMutation(api.notes.remove)
  const setImportant = useMutation(api.notes.setImportant)
  const getUploadUrl = useMutation(api.notes.generateUploadUrl)
  const setPinHash = useMutation(api.userSettings.setPinHash)
  const removePin = useMutation(api.userSettings.removePin)
  const verifyPin = useMutation(api.userSettings.verifyPin)

  const [view, setView] = useState<View>("day")
  const [cursor, setCursor] = useState<Date>(() => new Date())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [draftBody, setDraftBody] = useState("")
  const [draftPhotos, setDraftPhotos] = useState<DraftPhoto[]>([])
  const [saving, setSaving] = useState(false)
  const [pinOpen, setPinOpen] = useState(false)
  const [pinMode, setPinMode] = useState<"set" | "check" | "reset" | "manage">(
    "check"
  )
  const [pinValue, setPinValue] = useState("")
  const [pinError, setPinError] = useState("")
  const pinResolve = useRef<((ok: boolean) => void) | null>(null)
  const [viewer, setViewer] = useState<{
    list: string[]
    index: number
  } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const replaceIdx = useRef(-1)
  const blobUrlsRef = useRef<Set<string>>(new Set())
  const touchX = useRef(0)
  const [searchOpen, setSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const searchInputRef = useRef<HTMLInputElement>(null)

  const all = useMemo(() => notes ?? [], [notes])

  const dayNotesRaw = useMemo(
    () =>
      all
        .filter((n) => sameDay(new Date(n.createdAt), cursor))
        .sort((a, b) => a.createdAt - b.createdAt),
    [all, cursor]
  )

  const importantNotesRaw = useMemo(
    () => all.filter((n) => n.important).sort((a, b) => b.createdAt - a.createdAt),
    [all]
  )

  const activeNoteIds = useMemo(() => {
    const visibleNotes =
      view === "day"
        ? dayNotesRaw
        : view === "important"
          ? importantNotesRaw
          : []
    const ids = visibleNotes
      .filter((n) => !n.isLocked && (!n.important || unlocked) && n.photoIds.length > 0)
      .map((n) => n._id)
    if (editId) {
      const editing = all.find((n) => n._id === editId)
      if (
        editing &&
        !editing.isLocked &&
        (!editing.important || unlocked) &&
        editing.photoIds.length > 0
      ) {
        ids.push(editing._id)
      }
    }
    return Array.from(new Set(ids))
  }, [view, dayNotesRaw, importantNotesRaw, editId, all, unlocked])

  const photoUrlMap = (useQuery(
    api.notes.getPhotoUrls,
    activeNoteIds.length
      ? {
          noteIds: activeNoteIds as any,
          pinHash: activePinHash ?? undefined,
        }
      : "skip"
  ) ?? {}) as Record<string, string>

  const dayNotes = useMemo(
    () =>
      dayNotesRaw.map((n) => ({
        ...n,
        photoUrls: n.photoIds
          .map((id) => photoUrlMap[id])
          .filter((u): u is string => Boolean(u)),
      })),
    [dayNotesRaw, photoUrlMap]
  )

  const importantNotes = useMemo(
    () =>
      importantNotesRaw.map((n) => ({
        ...n,
        photoUrls: n.photoIds
          .map((id) => photoUrlMap[id])
          .filter((u): u is string => Boolean(u)),
      })),
    [importantNotesRaw, photoUrlMap]

  const matchingNotes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return []
    return all
      .filter((n) => !n.isLocked && n.body.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt - a.createdAt)
  }, [all, searchQuery])

  const shift = useCallback(
    (d: number) => {
      setCursor((c) => {
        const n = new Date(c)
        if (view === "day") n.setDate(n.getDate() + d)
        else if (view === "month") n.setMonth(n.getMonth() + d)
        else if (view === "year") n.setFullYear(n.getFullYear() + d)
        return n
      })
    },
    [view]
  )

  const drill = useCallback((v: View, date?: Date) => {
    if (date) setCursor(date)
    setView(v)
  }, [])

  // Arrow keys shift cursor, skipped while typing or viewer/PIN open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (viewer || pinOpen || sheetOpen || searchOpen) return
      const t = document.activeElement
      if (t && /INPUT|TEXTAREA/.test(t.tagName)) return
      if (e.key === "ArrowRight") shift(1)
      if (e.key === "ArrowLeft") shift(-1)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [shift, viewer, pinOpen, sheetOpen, searchOpen])

  // Search shortcuts: '/' or Cmd+K / Ctrl+K opens search dialog.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (viewer || pinOpen || sheetOpen) return
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault()
        setSearchOpen((prev) => !prev)
        return
      }
      const t = document.activeElement
      if (t && /INPUT|TEXTAREA/.test(t.tagName)) return
      if (e.key === "/" && !searchOpen) {
        e.preventDefault()
        setSearchOpen(true)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [viewer, pinOpen, sheetOpen, searchOpen])

  useEffect(() => {
    if (searchOpen) {
      const timer = setTimeout(() => searchInputRef.current?.focus(), 50)
      return () => clearTimeout(timer)
    } else {
      setSearchQuery("")
    }
  }, [searchOpen])

  // Switching views starts at the top. Day/Month/Year lists then jump to
  // the current hour/day/month when it is visible, which runs after this.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [view])

  const askPin = useCallback(
    (mode: "set" | "check" | "reset" | "manage"): Promise<boolean> => {
      if (mode === "check" && unlocked) return Promise.resolve(true)
      setPinMode(mode)
      setPinValue("")
      setPinError("")
      setPinOpen(true)
      return new Promise((res) => {
        pinResolve.current = res
      })
    },
    [unlocked]
  )

  const closePin = (ok: boolean) => {
    setPinOpen(false)
    pinResolve.current?.(ok)
    pinResolve.current = null
  }

  const submitPin = async () => {
    if (!userId) return
    if (pinMode === "set" || pinMode === "reset" || pinMode === "manage") {
      if (pinValue.length < 4) {
        setPinError("4 characters or more.")
        return
      }
      const hash = await hashPin(userId, pinValue)
      await setPinHash({ pinHash: hash })
      setActivePinHash(hash)
      closePin(true)
      return
    }
    const hash = await hashPin(userId, pinValue)
    const ok = await verifyPin({ pinHash: hash })
    if (ok) {
      setActivePinHash(hash)
      closePin(true)
    } else {
      setPinError("Wrong PIN.")
    }
  }

  const handleRemovePin = async () => {
    try {
      await removePin({ pinHash: activePinHash ?? undefined })
      setActivePinHash(null)
      if (view === "important") {
        setView("day")
      }
      closePin(true)
    } catch {
      setPinError("Failed to remove PIN.")
    }
  }

  const openManagePin = () => {
    askPin("manage")
  }

  const needPin = useCallback(async (): Promise<boolean> => {
    if (unlocked) return true
    if (!settings?.hasPin) return askPin("set")
    return askPin("check")
  }, [unlocked, settings, askPin])

  const openImportant = async () => {
    if (view === "important") {
      setView("day")
      return
    }
    if (await needPin()) setView("important")
  }

  const toggleStar = async (note: Note) => {
    if ((note.isLocked || !note.important || !unlocked) && !(await needPin())) return
    await setImportant({
      id: note._id as any,
      important: !note.important,
      pinHash: activePinHash ?? undefined,
    })
  }

  const revokeBlobUrl = useCallback((url: string) => {
    if (blobUrlsRef.current.has(url)) {
      URL.revokeObjectURL(url)
      blobUrlsRef.current.delete(url)
    }
  }, [])

  const revokeAllBlobs = useCallback(() => {
    blobUrlsRef.current.forEach((url) => URL.revokeObjectURL(url))
    blobUrlsRef.current.clear()
  }, [])

  const openNew = () => {
    revokeAllBlobs()
    setEditId(null)
    setDraftBody("")
    setDraftPhotos([])
    setSheetOpen(true)
  }

  const openEdit = async (note: Note) => {
    if (note.isLocked || (note.important && !unlocked)) {
      const ok = await needPin()
      if (!ok) return
      const fresh = all.find((n) => n._id === note._id && !n.isLocked)
      if (fresh) note = fresh
    }
    revokeAllBlobs()
    setEditId(note._id)
    setDraftBody(note.body)
    setDraftPhotos(
      note.photoIds.map((id) => ({
        kind: "stored" as const,
        storageId: id,
        url: photoUrlMap[id] ?? "",
      }))
    )
    setSheetOpen(true)
  }

  const pickPhotos = (replace: number) => {
    replaceIdx.current = replace
    if (fileRef.current) {
      fileRef.current.multiple = replace < 0
      fileRef.current.click()
    }
  }

  const onFiles = (files: FileList | null) => {
    if (!files?.length) return
    const made: DraftPhoto[] = Array.from(files).map((file) => {
      const url = URL.createObjectURL(file)
      blobUrlsRef.current.add(url)
      return {
        kind: "new" as const,
        file,
        url,
      }
    })
    setDraftPhotos((prev) => {
      if (replaceIdx.current >= 0 && made[0]) {
        const target = prev[replaceIdx.current]
        if (target?.kind === "new") {
          revokeBlobUrl(target.url)
        }
        for (let i = 1; i < made.length; i++) {
          const extra = made[i]
          if (extra) revokeBlobUrl(extra.url)
        }
        const next = prev.slice()
        next[replaceIdx.current] = made[0]
        return next
      }
      return prev.concat(made)
    })
    replaceIdx.current = -1
    if (fileRef.current) fileRef.current.value = ""
  }

  const removeDraftPhoto = (index: number) => {
    setDraftPhotos((prev) => {
      const target = prev[index]
      if (target?.kind === "new") {
        revokeBlobUrl(target.url)
      }
      return prev.filter((_, j) => j !== index)
    })
  }

  const uploadDrafts = async (): Promise<string[]> => {
    const ids: string[] = []
    for (const p of draftPhotos) {
      if (p.kind === "stored") {
        ids.push(p.storageId)
      } else {
        const url = (await getUploadUrl({})) as string
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": p.file.type || "image/jpeg" },
          body: p.file,
        })
        if (!res.ok) throw new Error("Upload failed")
        const { storageId } = (await res.json()) as { storageId: string }
        ids.push(storageId)
      }
    }
    return ids
  }

  useEffect(() => {
    if (!sheetOpen || !editId) return
    const current = all.find((n) => n._id === editId)
    if (current && !current.isLocked && !draftBody && !draftPhotos.length) {
      setDraftBody(current.body)
      setDraftPhotos(
        current.photoIds.map((id) => ({
          kind: "stored" as const,
          storageId: id,
          url: photoUrlMap[id] ?? "",
        }))
      )
    }
  }, [all, editId, sheetOpen, draftBody, draftPhotos.length, photoUrlMap])

  useEffect(() => {
    if (!sheetOpen || !editId) return
    setDraftPhotos((prev) => {
      let changed = false
      const next = prev.map((p) => {
        if (p.kind === "stored" && !p.url && photoUrlMap[p.storageId]) {
          changed = true
          return { ...p, url: photoUrlMap[p.storageId]! }
        }
        return p
      })
      return changed ? next : prev
    })
  }, [photoUrlMap, sheetOpen, editId])

  useEffect(() => {
    if (!sheetOpen) {
      revokeAllBlobs()
      setDraftPhotos((prev) => (prev.length ? [] : prev))
    }
  }, [sheetOpen, revokeAllBlobs])

  useEffect(() => {
    return () => {
      revokeAllBlobs()
    }
  }, [revokeAllBlobs])

  const saveNote = async () => {
    const body = draftBody.trim()
    if ((!body && !draftPhotos.length) || saving) return
    setSaving(true)
    try {
      const photoIds = (await uploadDrafts()) as any
      if (editId) {
        await updateNote({
          id: editId as any,
          body,
          photoIds,
          pinHash: activePinHash ?? undefined,
        })
      } else {
        const base = sameDay(cursor, new Date())
          ? Date.now()
          : startOfDay(cursor).getTime() +
            (Date.now() - startOfDay(new Date()).getTime())
        await createNote({ body, photoIds, createdAt: base })
      }
      setSheetOpen(false)
    } finally {
      setSaving(false)
    }
  }

  const deleteNote = async () => {
    if (editId && confirm("Delete this note.")) {
      await removeNote({
        id: editId as any,
        pinHash: activePinHash ?? undefined,
      })
      setSheetOpen(false)
    }
  }

  // ponytail: avoids flashing app skeleton to unauthenticated visitors before Clerk loads.
  if (!isLoaded) {
    if (hasClerkSession()) return <PageSkeleton />
    return <LandingPage />
  }
  if (!isSignedIn) return <LandingPage />

  const offToday = !(sameDay(cursor, new Date()) && view === "day")

  return (
    <div className="mx-auto w-full max-w-[1000px] pb-30">
      <header className="sticky top-0 z-5 border-b border-border bg-background px-4 pt-3 pb-1 sm:px-6">
        <nav className="flex items-center justify-between gap-1 text-[13px] font-semibold">
          <span className="flex items-baseline gap-1">
            <button
              className="cursor-pointer px-0.5 text-muted-foreground"
              onClick={() => setView("year")}
            >
              {cursor.getFullYear()}
            </button>
            <span className="text-xs text-muted-foreground opacity-30">/</span>
            <button
              className="cursor-pointer px-0.5 text-muted-foreground"
              onClick={() => setView("month")}
            >
              <span className="sm:hidden">{MONTHS[cursor.getMonth()]}</span>
              <span className="hidden sm:inline">
                {MONTHS_FULL[cursor.getMonth()]}
              </span>
            </button>
            <span className="text-xs text-muted-foreground opacity-30">/</span>
            <button
              className="cursor-pointer px-0.5 text-muted-foreground"
              onClick={() => setView("day")}
            >
              {cursor.getDate()}
            </button>
          </span>
          <div className="flex items-center gap-1.5">
            <UserButton appearance={{ elements: { avatarBox: "size-7" } }} />
          </div>
        </nav>
        <div className="flex items-center justify-between py-2">
          <span className="flex gap-1.5">
            {view !== "important" && view !== "year" && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => drill(view === "day" ? "month" : "year")}
                aria-label="go up a level"
              >
                <ArrowUp className="size-4" />
              </Button>
            )}
            <Button
              size="sm"
              variant={view === "important" ? "default" : "secondary"}
              onClick={openImportant}
              aria-label="important notes"
            >
              <Star
                className="size-4"
                fill={view === "important" ? "currentColor" : "none"}
              />
            </Button>
            <Button
              size="sm"
              variant={searchOpen ? "default" : "secondary"}
              onClick={() => setSearchOpen(true)}
              aria-label="search notes"
            >
              <Search className="size-4" />
            </Button>
          </span>
          <span className="text-[13px] font-semibold text-muted-foreground">
            {view === "day" ? (
              cursor.toDateString()
            ) : view === "month" ? (
              <>
                <span className="sm:hidden">{MONTHS[cursor.getMonth()]}</span>
                <span className="hidden sm:inline">
                  {MONTHS_FULL[cursor.getMonth()]}
                </span>
                {` ${cursor.getFullYear()}`}
              </>
            ) : view === "year" ? (
              cursor.getFullYear()
            ) : (
              `Important · ${importantNotes.length}`
            )}
          </span>
          <span className="flex gap-1.5">
            {view === "important" ? (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setActivePinHash(null)
                    setView("day")
                  }}
                  title="Lock notes"
                  aria-label="lock notes"
                >
                  <Lock className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={openManagePin}
                  title="PIN Settings"
                  aria-label="pin settings"
                >
                  <KeyRound className="size-4" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => shift(-1)}
                  aria-label="previous"
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => shift(1)}
                  aria-label="next"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </>
            )}
          </span>
        </div>
      </header>

      <main
        className="px-4 py-2 sm:px-6"
        onTouchStart={(e) => {
          touchX.current = e.changedTouches[0]?.clientX ?? 0
        }}
        onTouchEnd={(e) => {
          const dx = (e.changedTouches[0]?.clientX ?? 0) - touchX.current
          if (Math.abs(dx) > 48 && view !== "important") shift(dx < 0 ? 1 : -1)
        }}
      >
        {notes === undefined ? (
          <TimelineSkeleton />
        ) : (
          <>
            {view === "day" && (
              <DayRail
                notes={dayNotes}
                cursor={cursor}
                onStar={toggleStar}
                onOpen={openEdit}
                onViewer={(l, i) => setViewer({ list: l, index: i })}
                unlocked={unlocked}
              />
            )}
            {view === "month" && (
              <MonthView
                cursor={cursor}
                notes={all}
                onDrill={(d) => drill("day", d)}
                unlocked={unlocked}
              />
            )}
            {view === "year" && (
              <YearView
                cursor={cursor}
                notes={all}
                onDrill={(d) => drill("month", d)}
                unlocked={unlocked}
              />
            )}
            {view === "important" && (
              <ImportantView
                notes={importantNotes}
                onStar={toggleStar}
                onOpen={openEdit}
                onViewer={(l, i) => setViewer({ list: l, index: i })}
                unlocked={unlocked}
              />
            )}
          </>
        )}
      </main>

      {offToday && view !== "important" && (
        <button
          className="fixed bottom-24 left-1/2 z-15 flex -translate-x-1/2 items-center gap-2 rounded-full bg-primary px-4 py-2 text-[13px] font-bold text-primary-foreground shadow-lg"
          onClick={() => {
            setCursor(new Date())
            setView("day")
          }}
        >
          Back to today
        </button>
      )}

      <div className="pointer-events-none fixed inset-x-0 bottom-6 mx-auto w-full max-w-[1000px]">
        <Button
          className="pointer-events-auto float-right mr-4 size-14 rounded-full"
          onClick={openNew}
          aria-label="add note"
        >
          <Plus className="size-6" />
        </Button>
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent>
          <SheetTitle className="text-[13px] font-bold text-muted-foreground">
            {editId ? "Edit note" : "New note"}
          </SheetTitle>
          <textarea
            className="mt-3 min-h-24 w-full rounded-xl border border-border bg-card p-3 text-[15px] outline-none"
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
              <div
                key={`${p.url}-${i}`}
                className="relative h-13 w-13 flex-none overflow-hidden rounded-lg border"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt=""
                  className="h-full w-full object-cover"
                  onClick={() => pickPhotos(i)}
                />
                <button
                  className="absolute top-0.5 right-0.5 flex size-5 items-center justify-center rounded-full bg-black/65 text-white"
                  onClick={() => removeDraftPhoto(i)}
                  aria-label="remove photo"
                >
                  <X className="size-3" />
                </button>
              </div>
            ))}
          </div>
          <button
            className="mt-2 flex items-center gap-1.5 text-[12.5px] font-semibold text-muted-foreground"
            onClick={() => pickPhotos(-1)}
          >
            <ImagePlus className="size-4" />
            {draftPhotos.length ? `${draftPhotos.length}` : "Photos"}
          </button>
          <Button className="mt-3 w-full" onClick={saveNote} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
          {editId && (
            <button
              className="mt-1 w-full py-1 text-[13px] font-semibold text-destructive opacity-75"
              onClick={deleteNote}
            >
              Delete note
            </button>
          )}
        </SheetContent>
      </Sheet>

      <Dialog open={pinOpen} onOpenChange={(o) => !o && closePin(false)}>
        <DialogContent>
          <DialogTitle className="text-sm">
            {pinMode === "set"
              ? "Set a PIN"
              : pinMode === "check"
                ? "Enter PIN"
                : pinMode === "reset"
                  ? "Reset PIN"
                  : "PIN Settings"}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {pinMode === "set"
              ? "First time. 4 characters or more."
              : pinMode === "check"
                ? "Type your PIN."
                : pinMode === "reset"
                  ? "Reset your PIN. 4 characters or more, or remove it."
                  : settings?.hasPin
                    ? "Enter a new PIN to change it, or remove PIN protection."
                    : "Set a PIN (4 characters or more)."}
          </p>
          <input
            type="password"
            inputMode="numeric"
            className="mt-2 w-full rounded-xl border border-border bg-card p-2.5 text-base outline-none"
            placeholder={pinMode === "check" ? "PIN" : "New PIN (min 4 chars)"}
            value={pinValue}
            onChange={(e) => setPinValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submitPin()}
            autoFocus
          />
          {pinError && (
            <p className="mt-1 text-xs text-destructive">{pinError}</p>
          )}
          {pinMode === "check" && (
            <div className="mt-1 flex justify-end">
              <button
                type="button"
                className="cursor-pointer text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
                onClick={() => {
                  setPinMode("reset")
                  setPinValue("")
                  setPinError("")
                }}
              >
                Forgot PIN?
              </button>
            </div>
          )}
          <div className="mt-2 flex gap-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={() => {
                if (pinMode === "reset") {
                  setPinMode("check")
                  setPinValue("")
                  setPinError("")
                } else {
                  closePin(false)
                }
              }}
            >
              {pinMode === "reset" ? "Back" : "Cancel"}
            </Button>
            {(pinMode === "reset" ||
              (pinMode === "manage" && settings?.hasPin)) && (
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleRemovePin}
              >
                Remove PIN
              </Button>
            )}
            <Button className="flex-1" onClick={submitPin}>
              {pinMode === "reset" || pinMode === "manage" ? "Save" : "OK"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="w-[min(540px,94%)] max-w-lg gap-0 overflow-hidden rounded-[24px] border border-border p-0 shadow-[var(--card-shadow)]">
          <DialogTitle className="sr-only">Search notes</DialogTitle>
          <div className="border-b border-border p-2.5">
            <div className="flex items-center gap-2 rounded-full bg-surface-inset px-3.5 py-2">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                ref={searchInputRef}
                autoFocus
                type="text"
                className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                placeholder="Search notes... (Esc to close)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="cursor-pointer p-0.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchQuery("")}
                  aria-label="clear search"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {!searchQuery.trim() ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                Type to search notes
              </div>
            ) : matchingNotes.length === 0 ? (
              <div className="p-6 text-center text-xs text-muted-foreground">
                No matching notes found
              </div>
            ) : (
              <div className="space-y-1">
                {matchingNotes.map((note) => {
                  const isLocked = Boolean(
                    note.isLocked ?? (note.important && !unlocked)
                  )
                  const d = new Date(note.createdAt)
                  const timeStr = `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} · ${fmtHour(d.getHours())}`
                  return (
                    <div
                      key={note._id}
                      onClick={async () => {
                        if (isLocked) {
                          setSearchOpen(false)
                          const ok = await needPin()
                          if (!ok) return
                          setCursor(new Date(note.createdAt))
                          setView("day")
                          return
                        }
                        setCursor(new Date(note.createdAt))
                        setView("day")
                        setSearchOpen(false)
                      }}
                      className="group flex cursor-pointer flex-col gap-1 rounded-xl p-2.5 text-left transition-colors hover:bg-surface"
                    >
                      <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                        <span>{timeStr}</span>
                        <div className="flex items-center gap-1.5">
                          {note.photoIds.length > 0 && (
                            <span className="flex items-center gap-0.5 text-[11px]">
                              <ImagePlus className="size-3" />
                              {note.photoIds.length}
                            </span>
                          )}
                          {note.important && (
                            <span className="flex items-center text-amber-mineral">
                              {isLocked ? (
                                <Lock className="size-3" />
                              ) : (
                                <Star className="size-3 fill-current" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="line-clamp-2 text-[13px] leading-snug">
                        {isLocked ? (
                          <span className="flex items-center gap-1 text-muted-foreground italic">
                            <Lock className="inline size-3" /> Locked note
                          </span>
                        ) : (
                          note.body || (
                            <span className="text-muted-foreground italic">
                              Photo note
                            </span>
                          )
                        )}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {viewer && (
        <Viewer
          list={viewer.list}
          index={viewer.index}
          onClose={() => setViewer(null)}
          onNav={(i) => setViewer((v) => (v ? { ...v, index: i } : v))}
        />
      )}
    </div>
  )
}

function TimelineSkeleton() {
  return (
    <div
      className="relative ml-13 border-l border-border"
      aria-label="loading notes"
      aria-busy="true"
    >
      {Array.from({ length: 8 }, (_, h) => (
        <div key={h} className="relative min-h-11 rounded-xl py-1.5 pr-3 pl-4">
          <span className="absolute top-2.5 -left-11 h-3 w-7 animate-pulse rounded bg-muted" />
          <span className="absolute top-2.5 -left-1.5 size-3 animate-pulse rounded-full bg-muted" />
          {h % 3 === 0 ? (
            <div className="my-1.5 animate-pulse rounded-xl border border-border p-3">
              <div className="h-3.5 w-3/4 rounded bg-muted" />
              <div className="mt-2 h-3.5 w-1/2 rounded bg-muted" />
              <div className="mt-2 h-2.5 w-24 rounded bg-muted" />
            </div>
          ) : (
            <div className="text-xs text-muted-foreground opacity-60">—</div>
          )}
        </div>
      ))}
    </div>
  )
}

function PageSkeleton() {
  return (
    <div className="mx-auto w-full max-w-[1000px] pb-30">
      <header className="sticky top-0 z-5 bg-background/80 px-4 pt-3 pb-1 sm:px-6">
        <nav className="flex items-center justify-between gap-1">
          <div className="h-4 w-28 animate-pulse rounded bg-muted" />
          <div className="size-7 animate-pulse rounded-full bg-muted" />
        </nav>
        <div className="flex items-center justify-between py-2">
          <div className="flex gap-1.5">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          </div>
          <div className="h-4 w-32 animate-pulse rounded bg-muted" />
          <div className="flex gap-1.5">
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
            <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
          </div>
        </div>
      </header>
      <main className="px-4 py-2 sm:px-6">
        <TimelineSkeleton />
      </main>
    </div>
  )
}

function NoteCard({
  note,
  onStar,
  onOpen,
  onViewer,
  unlocked,
}: {
  note: Note
  onStar: (n: Note) => void
  onOpen: (n: Note) => void
  onViewer: (list: string[], i: number) => void
  unlocked: boolean
}) {
  const isLocked = Boolean(note.isLocked ?? (note.important && !unlocked))
  return (
    <Card className="my-1.5 cursor-pointer p-3" onClick={() => onOpen(note)}>
      <div className="flex items-start justify-between gap-2">
        <span className="min-w-0 text-sm">
          {isLocked ? (
            <span className="flex items-center gap-1 italic text-muted-foreground">
              <Lock className="inline size-3" /> Locked note
            </span>
          ) : note.body.trim() ? (
            note.body
          ) : (
            "photo"
          )}
        </span>
        <button
          className={`flex-none pl-1 text-sm ${note.important ? "text-amber-mineral opacity-100" : "text-muted-foreground opacity-45"}`}
          onClick={(e) => {
            e.stopPropagation()
            onStar(note)
          }}
          aria-label="toggle important"
        >
          {isLocked ? (
            <Lock className="size-3.5 text-muted-foreground" />
          ) : (
            <Star
              className="size-3.5"
              fill={note.important ? "currentColor" : "none"}
            />
          )}
        </button>
      </div>
      {!isLocked &&
        note.photoUrls.map((u, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={`${note._id}-${i}`}
            src={u}
            alt=""
            loading="lazy"
            className="mt-2 max-h-64 w-full cursor-zoom-in rounded-lg object-cover"
            onClick={(e) => {
              e.stopPropagation()
              onViewer(note.photoUrls, i)
            }}
          />
        ))}
      <small className="mt-1 block text-[11px] text-muted-foreground">
        {new Date(note.createdAt).toLocaleDateString([], {
          month: "short",
          day: "numeric",
        })}{" "}
        ·{" "}
        {new Date(note.createdAt).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        })}
        {!isLocked && note.photoIds.length
          ? ` · ${note.photoIds.length} photo${note.photoIds.length > 1 ? "s" : ""}`
          : ""}
      </small>
    </Card>
  )
}

function DayRail({
  notes,
  cursor,
  onStar,
  onOpen,
  onViewer,
  unlocked,
}: {
  notes: Note[]
  cursor: Date
  onStar: (n: Note) => void
  onOpen: (n: Note) => void
  onViewer: (list: string[], i: number) => void
  unlocked: boolean
}) {
  const nowH = new Date().getHours()
  const isToday = sameDay(cursor, new Date())
  const nowRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    nowRef.current?.scrollIntoView({ block: "center" })
  }, [cursor])
  return (
    <div className="relative ml-13 border-l border-border">
      {Array.from({ length: 24 }, (_, h) => {
        const list = notes.filter((n) => new Date(n.createdAt).getHours() === h)
        const isNow = isToday && h === nowH
        return (
          <div
            key={h}
            ref={isNow ? nowRef : undefined}
            className={`relative min-h-11 scroll-mt-28 rounded-xl py-1.5 pr-3 pl-4 ${isNow ? "bg-muted/50" : ""}`}
          >
            <span className="absolute top-2 -left-13 w-9 text-right text-[11px] font-semibold text-muted-foreground tabular-nums">
              {fmtHour(h)}
            </span>
            <span
              className={`absolute top-2.5 -left-1.5 size-3 rounded-full border-2 border-border ${
                list.length || isNow ? "border-primary bg-primary" : "bg-muted"
              }`}
            />
            {isNow && <span className="sr-only">Current hour</span>}
            {!list.length && (
              <div className="text-xs text-muted-foreground opacity-60">—</div>
            )}
            {list.map((n) => (
              <NoteCard
                key={n._id}
                note={n}
                onStar={onStar}
                onOpen={onOpen}
                onViewer={onViewer}
                unlocked={unlocked}
              />
            ))}
          </div>
        )
      })}
    </div>
  )
}

function CountDots({ count }: { count: number }) {
  return (
    <span className="mt-1.5 flex items-center gap-1">
      {Array.from({ length: Math.min(Math.max(count, 3), 5) }, (_, i) => (
        <i
          key={i}
          className={`block size-1.5 rounded-full ${i < count ? "bg-primary" : "bg-border"}`}
        />
      ))}
    </span>
  )
}

function MonthView({
  cursor,
  notes,
  onDrill,
  unlocked,
}: {
  cursor: Date
  notes: Note[]
  onDrill: (d: Date) => void
  unlocked: boolean
}) {
  const y = cursor.getFullYear()
  const m = cursor.getMonth()
  const days = new Date(y, m + 1, 0).getDate()
  const todayRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    todayRef.current?.scrollIntoView({ block: "center" })
  }, [cursor])
  return (
    <div className="relative ml-13 border-l border-border sm:ml-28">
      {Array.from({ length: days }, (_, k) => {
        const d = k + 1
        const dt = new Date(y, m, d)
        const list = notes
          .filter((n) => sameDay(new Date(n.createdAt), dt))
          .sort((a, b) => a.createdAt - b.createdAt)
        const isToday = sameDay(dt, new Date())
        return (
          <button
            key={d}
            ref={isToday ? todayRef : undefined}
            className={`relative flex min-h-14 w-full cursor-pointer scroll-mt-28 flex-col justify-center rounded-xl py-2 pr-3 pl-4 text-left ${isToday ? "bg-muted/50" : ""}`}
            onClick={() => onDrill(dt)}
          >
            <span className="absolute top-2 -left-13 w-9 text-right sm:-left-28 sm:w-24">
              <span className="block text-lg leading-none font-bold tabular-nums">
                {d}
              </span>
              <small className="mt-0.5 block text-[10px] font-semibold text-muted-foreground">
                <span className="sm:hidden">{DOW[dt.getDay()] ?? ""}</span>
                <span className="hidden sm:inline">
                  {DOW_FULL[dt.getDay()] ?? ""}
                </span>
              </small>
            </span>
            <span
              className={`absolute top-2.5 -left-1.5 size-3 rounded-full border-2 border-border ${
                list.length || isToday
                  ? "border-primary bg-primary"
                  : "bg-muted"
              }`}
            />
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-[13px] text-muted-foreground max-sm:truncate sm:line-clamp-3">
                  {list.length
                    ? list[0]?.isLocked || (list[0]?.important && !unlocked)
                      ? "🔒 Locked note"
                      : list[0]?.body.trim()
                        ? list[0]?.body
                        : "photo"
                    : "—"}
                </span>
                <CountDots count={list.length} />
              </span>
              {list.length ? (
                <span className="mt-0.5 shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground tabular-nums">
                  {list.length} {list.length === 1 ? "note" : "notes"}
                </span>
              ) : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function YearView({
  cursor,
  notes,
  onDrill,
  unlocked,
}: {
  cursor: Date
  notes: Note[]
  onDrill: (d: Date) => void
  unlocked: boolean
}) {
  const yr = cursor.getFullYear()
  const counts = MONTHS.map(
    (_, i) =>
      notes.filter((n) => {
        const d = new Date(n.createdAt)
        return d.getFullYear() === yr && d.getMonth() === i
      }).length
  )
  const curM = new Date().getFullYear() === yr ? new Date().getMonth() : -1
  const nowRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    nowRef.current?.scrollIntoView({ block: "center" })
  }, [cursor])
  return (
    <div className="relative ml-13 border-l border-border sm:ml-28">
      {MONTHS.map((nm, i) => {
        const monthNotes = notes
          .filter((n) => {
            const d = new Date(n.createdAt)
            return d.getFullYear() === yr && d.getMonth() === i
          })
          .sort((a, b) => a.createdAt - b.createdAt)
        const days = new Set(
          monthNotes.map((n) => new Date(n.createdAt).getDate())
        ).size
        const isNow = i === curM
        return (
          <button
            key={nm}
            ref={isNow ? nowRef : undefined}
            className={`relative w-full cursor-pointer scroll-mt-28 rounded-xl py-1.5 pr-3 pl-4 text-left ${isNow ? "bg-muted/50" : ""}`}
            onClick={() => onDrill(new Date(yr, i, 1))}
          >
            <span className="absolute top-2 -left-13 w-9 text-right sm:-left-28 sm:w-24">
              <span className="block text-[13px] font-bold">
                <span className="sm:hidden">{nm}</span>
                <span className="hidden sm:inline">{MONTHS_FULL[i] ?? nm}</span>
              </span>
              <span className="block text-[10px] font-semibold text-muted-foreground">
                {String(yr).slice(2)}
              </span>
            </span>
            <span
              className={`absolute top-2.5 -left-1.5 size-3 rounded-full border-2 border-border ${
                monthNotes.length || isNow
                  ? "border-primary bg-primary"
                  : "bg-muted"
              }`}
            />
            <span className="flex items-start justify-between gap-3">
              <span className="min-w-0">
                <span className="block text-[13px] text-muted-foreground max-sm:truncate sm:line-clamp-3">
                  {monthNotes.length
                    ? monthNotes[0]?.isLocked || (monthNotes[0]?.important && !unlocked)
                      ? "🔒 Locked note"
                      : monthNotes[0]?.body.trim()
                        ? monthNotes[0]?.body
                        : "photo"
                    : "—"}
                </span>
                <CountDots count={counts[i] ?? 0} />
                <span className="mt-1 block text-[11px] text-muted-foreground tabular-nums">
                  {(counts[i] ?? 0)
                    ? `${days} ${days === 1 ? "day" : "days"} · ${counts[i]} ${counts[i] === 1 ? "note" : "notes"}`
                    : "empty"}
                </span>
              </span>
              {(counts[i] ?? 0) ? (
                <span className="mt-0.5 shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground tabular-nums">
                  {counts[i]} {counts[i] === 1 ? "note" : "notes"}
                </span>
              ) : null}
            </span>
          </button>
        )
      })}
    </div>
  )
}

function ImportantView({
  notes,
  onStar,
  onOpen,
  onViewer,
  unlocked,
}: {
  notes: Note[]
  onStar: (n: Note) => void
  onOpen: (n: Note) => void
  onViewer: (list: string[], i: number) => void
  unlocked: boolean
}) {
  if (!notes.length)
    return (
      <div className="text-xs text-muted-foreground">
        No important notes yet. Tap the star on a note to mark it.
      </div>
    )
  return (
    <div>
      {notes.map((n) => (
        <NoteCard
          key={n._id}
          note={n}
          onStar={onStar}
          onOpen={onOpen}
          onViewer={onViewer}
          unlocked={unlocked}
        />
      ))}
    </div>
  )
}

function Viewer({
  list,
  index,
  onClose,
  onNav,
}: {
  list: string[]
  index: number
  onClose: () => void
  onNav: (i: number) => void
}) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState<[number, number]>([0, 0])
  const pts = useRef(new Map<number, [number, number]>())
  const pinchD = useRef(0)
  const lastTap = useRef(0)
  const src = list[index] ?? ""

  useEffect(() => {
    setZoom(1)
    setPan([0, 0])
    pts.current.clear()
    pinchD.current = 0
  }, [index, list])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") onNav((index + 1) % list.length)
      if (e.key === "ArrowLeft") onNav((index - 1 + list.length) % list.length)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [index, list.length, onClose, onNav])

  return (
    <div
      className="fixed inset-0 z-50 flex touch-none flex-col bg-black/90 p-4 backdrop-blur-sm sm:p-10"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <button
        className="absolute top-3 right-3 z-10 flex size-9 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white"
        onClick={onClose}
        aria-label="close viewer"
      >
        <X className="size-4" />
      </button>
      {list.length > 1 && (
        <>
          <button
            className="absolute top-1/2 left-2.5 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white"
            onClick={(e) => {
              e.stopPropagation()
              onNav((index - 1 + list.length) % list.length)
            }}
            aria-label="previous photo"
          >
            <ChevronLeft className="size-5" />
          </button>
          <button
            className="absolute top-1/2 right-2.5 z-10 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white"
            onClick={(e) => {
              e.stopPropagation()
              onNav((index + 1) % list.length)
            }}
            aria-label="next photo"
          >
            <ChevronRight className="size-5" />
          </button>
        </>
      )}
      <div
        className="flex min-h-0 flex-1 items-center justify-center"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose()
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          draggable={false}
          className="max-h-[82vh] max-w-[92vw] rounded-lg object-contain shadow-2xl select-none sm:max-w-[78vw]"
          style={{
            transform: `translate(${pan[0]}px,${pan[1]}px) scale(${zoom})`,
          }}
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={() => {
            setZoom((z) => (z > 1 ? 1 : 2.5))
            setPan([0, 0])
          }}
          onWheel={(e) => {
            setZoom((z) =>
              Math.min(4, Math.max(1, z + (e.deltaY < 0 ? 0.25 : -0.25)))
            )
          }}
          onTouchEnd={() => {
            const t = Date.now()
            if (t - lastTap.current < 300) {
              setZoom((z) => (z > 1 ? 1 : 2.5))
              setPan([0, 0])
            }
            lastTap.current = t
          }}
          onPointerDown={(e) => {
            ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
            pts.current.set(e.pointerId, [e.clientX, e.clientY])
            if (pts.current.size === 2) {
              const p = Array.from(pts.current.values())
              const a = p[0]!
              const b = p[1]!
              pinchD.current = Math.hypot(a[0] - b[0], a[1] - b[1])
            }
          }}
          onPointerMove={(e) => {
            if (!pts.current.has(e.pointerId)) return
            const prev = pts.current.get(e.pointerId)!
            pts.current.set(e.pointerId, [e.clientX, e.clientY])
            if (pts.current.size === 2) {
              const p = Array.from(pts.current.values())
              const a = p[0]!
              const b = p[1]!
              const d = Math.hypot(a[0] - b[0], a[1] - b[1])
              if (pinchD.current)
                setZoom((z) =>
                  Math.min(4, Math.max(1, (z * d) / pinchD.current))
                )
              pinchD.current = d
            } else if (zoom > 1) {
              setPan(([x, y]) => [
                x + e.clientX - prev[0],
                y + e.clientY - prev[1],
              ])
            }
          }}
          onPointerUp={(e) => {
            pts.current.delete(e.pointerId)
            if (pts.current.size < 2) pinchD.current = 0
          }}
          onPointerCancel={(e) => {
            pts.current.delete(e.pointerId)
            if (pts.current.size < 2) pinchD.current = 0
          }}
        />
      </div>
      <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 text-xs text-white/70 tabular-nums">
        {list.length > 1 ? `${index + 1} / ${list.length}` : ""}
      </div>
    </div>
  )
}
