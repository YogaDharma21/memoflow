# MemoFlows Design System

A specification for utilitarian, dark-first timeline journaling and memo capture interfaces across web and mobile applications.

---

## 1. Design Philosophy

- **Continuous timeline**: Life recorded as an unbroken flow of moments rather than isolated documents. Information is anchored to real time (day, hour, month, year).
- **Dark-first foundation**: Warm charcoal tones (`#08090b` canvas, `#121316` card surface). Never harsh pitch black (`#000000`).
- **Warm linen light mode**: Paper white (`#faf9f6`) cards resting on an alabaster/linen canvas (`#f2f1ed`).
- **Solid matte surfaces**: Solid card colors with 1px hairline borders (`rgba(255, 255, 255, 0.07)` dark / `rgba(21, 21, 20, 0.09)` light) and soft directional drop shadows. No gradient overlays or glossy highlights.
- **Muted mineral accents**: Accent colors are desaturated earthy minerals (sage emerald, terracotta crimson, warm amber, steel blue). Never neon or high-saturation primaries.
- **Frictionless capture**: Zero unnecessary chrome, bloated rich-text toolbars, or modal clutter. Opening the app immediately invites writing.

---

## 2. Color Palette & Tokens

### Dark theme (default)

| Token | Value | Description |
| :--- | :--- | :--- |
| `background` | `#08090b` | App canvas background. Warm charcoal. |
| `card` | `#121316` | Solid card and surface background. |
| `surface` | `#17181c` | Secondary surface, active rows, hover cards. |
| `surface-inset` | `rgba(255, 255, 255, 0.035)` | Recessed sections, search input tracks, view pill background. |
| `popover` | `#15161a` | Menus, dropdowns, dialogs. |
| `border` | `rgba(255, 255, 255, 0.07)` | Hairline container border. |
| `border-subtle` | `rgba(255, 255, 255, 0.04)` | Inset dividers, row separators, timeline ticks. |
| `foreground` | `#f4f4f2` | Primary text and strong icons. Warm off-white. |
| `muted-foreground` | `#8a8c92` | Secondary labels, descriptions, timestamps. |
| `subtle-foreground` | `#5f6065` | Inactive icons, placeholder text, hints. |
| `primary` | `#f2f1ec` | Inverted action buttons, high-emphasis triggers. |
| `primary-foreground`| `#0a0a0b` | Text on inverted primary buttons. |

### Light theme

| Token | Value | Description |
| :--- | :--- | :--- |
| `background` | `#f2f1ed` | Warm linen / alabaster canvas. |
| `card` | `#faf9f6` | Solid card surface, clean paper white. |
| `surface` | `#e8e6e0` | Hover rows, secondary containers. |
| `surface-inset` | `rgba(21, 21, 20, 0.035)` | Recessed chips, search input background. |
| `border` | `rgba(21, 21, 20, 0.09)` | Hairline container border. |
| `border-subtle` | `rgba(21, 21, 20, 0.05)` | Row dividers, subtle grid lines. |
| `foreground` | `#151514` | Primary text. Soft charcoal ink. |
| `muted-foreground` | `#6f6d67` | Secondary labels, timestamps, metadata. |
| `subtle-foreground` | `#9a9890` | Footers, placeholders, inactive states. |
| `primary` | `#171716` | Dark CTA buttons. |
| `primary-foreground`| `#f6f4ef` | Light text on primary buttons. |

### Semantic accents

| Tone | Dark value | Dark BG tint (12%) | Light value | Meaning |
| :--- | :--- | :--- | :--- | :--- |
| **Amber** | `#d2bd93` | `rgba(210, 189, 147, 0.12)` | `#8a6b34` | Starred memos, PIN vault, highlights |
| **Emerald** | `#a9bfa9` | `rgba(169, 191, 169, 0.12)` | `#4f7357` | Save confirmations, sync status, success |
| **Crimson** | `#c99a90` | `rgba(194, 133, 123, 0.13)` | `#a2544a` | Note deletion, PIN error, destructive actions |
| **Blue** | `#a6b0bd` | `rgba(166, 176, 189, 0.12)` | `#5c6b7a` | Links, informational badges, neutral tags |

---

## 3. Typography Scale

Default typeface: `Inter`, `SF Pro`, or system sans-serif.

| Role | Size | Weight | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Header Date** | 16px - 18px | 600 (Semibold) | `-0.025em` (`-0.5px`) | Top timeline date breadcrumb (`2026 / October / 22`) |
| **Memo Body** | 14px - 15px | 400 (Regular) | Normal, `leading-relaxed` | Note text, preserves line breaks (`whitespace-pre-wrap`) |
| **Timeline Hour** | 11px - 12px | 500 (Medium) | Normal | Vertical rail hour markers (`12am`, `9am`, `2pm`) |
| **Metadata / Timestamp** | 11px - 12px | 400 (Regular) | Normal | Card footer date/time, photo count (`Oct 22 · 3:45pm · 2 photos`) |
| **Input / Search Text** | 13px - 14px | 400 (Regular) | Normal | Composer textarea, search modal input |
| **Uppercase Label** | 10px | 600 (Semibold) | `+0.16em` (`+1.6px`) | Section category hints, view indicator subtitles |
| **Micro Counter** | 10px - 11px | 500 (Medium) | Normal | Lightbox image index (`1 / 4`), badge counts |

---

## 4. Content & Interaction Rules

- **No subtitle fluff**: Timeline headers only show dates and view controls. Omit decorative marketing subtitles in-app.
- **Preserve raw text formatting**: Note bodies preserve raw linebreaks and spacing (`whitespace-pre-wrap`) without forcing complex WYSIWYG formatting.
- **Privacy vault gating**: Starred/important memos require biometric or PIN authentication. Unverified sessions render masked states or a lock gate.
- **Border-free search**: Search inputs live inside a pill container (`borderRadius: 999`) with `surface-inset` background and zero border outline.
- **Concise actions**: Use short, direct verbs ("New memo", "Save", "Delete", "Add photo", "Unlock").

---

## 5. Elevation, Radii & Surfaces

### Corner radius hierarchy

- **Memo card container (`.card`)**: `24px` (`rounded-3xl` or `rounded-[24px]`)
- **Inset panels & dialog content (`.surface-inset`, `.dialog`)**: `16px` to `20px` (`rounded-2xl`)
- **Interactive buttons, form inputs, sheet triggers**: `10px` to `12px` (`rounded-xl` or `rounded-[10px]`)
- **View switcher pills & status badges**: `9999px` (`rounded-full`)
- **Photo thumbnails in cards**: `12px` to `14px` (`rounded-xl`), overflow hidden, cover fit

### Surface construction

Every memo card uses standard matte properties:

```css
/* Card Container */
background-color: var(--card); /* #121316 in dark mode, #faf9f6 in light mode */
border: 1px solid var(--border); /* rgba(255, 255, 255, 0.07) */
border-radius: 24px;
box-shadow: 0 28px 56px -40px rgba(0, 0, 0, 0.9); /* Subtle depth without harsh outlines */
```

---

## 6. Standard Components

### 1. NoteCard
Primary timeline entry presenting text thoughts and optional image attachments.

- **Structure**:
  - Top: Header containing note text body and star toggle button (Amber star if marked important).
  - Middle: Multi-photo preview row/grid. Images rendered with rounded corners and cover scaling. Click triggers lightbox viewer.
  - Bottom: Meta footer displaying formatted date, time, and photo attachment count.
- **Padding**: `16px` (`p-4`).
- **Surface**: Solid card background, 24px radius, 1px border.

### 2. Timeline Rail (Day View)
Vertical 24-hour stream for navigating notes throughout the day.

- **Structure**:
  - Left column: Time rail showing hour labels (`12am` to `11pm`) with hairline dividers. Current hour receives subtle accent highlight.
  - Right column: Hourly slot container. Populated slots display NoteCards; empty slots remain clean or reveal a quick-add trigger on hover/tap.
  - Auto-anchor: Scrolls automatically to the current active hour upon view load.

### 3. View Switcher (Day / Month / Year / Starred)
Pill-shaped segment control for shifting chronological granularity.

- **Structure**:
  - Outer pill container: `rounded-full`, `bg-surface-inset`, 1px hairline border.
  - Switcher items: `Day`, `Month`, `Year`, and `Starred` (vault icon).
  - Active tab: Solid card surface (`bg-card`), shadow elevation, primary foreground text.
  - Keyboard shortcuts: Arrow keys (`ArrowLeft` / `ArrowRight`) shift the timeline cursor backward/forward.

### 4. Note Composer Sheet
Bottom-sheet drawer (mobile) or slide-over drawer (web) for creating and editing memos.

- **Structure**:
  - Textarea: Borderless, auto-resizing, clean typography with placeholder prompt.
  - Photo strip: Thumbnail preview of attached images with individual remove buttons (`X`).
  - Action bar: Add photo button (`ImagePlus`), star toggle (`Star`), delete button (in edit mode), and primary Save button.

### 5. Search Modal
Quick keyboard-driven search dialog activated by `/` or `Cmd+K`.

- **Structure**:
  - Input: Pill container with `Search` icon, `surface-inset` background, border-free, auto-focused.
  - Results list: Chronologically ordered matching notes with highlighted query terms and timestamp links that navigate directly to the target day.

### 6. PIN Security Modal
Numeric security gate for creating, verifying, or resetting the vault PIN.

- **Structure**:
  - Centered dialog with `Lock` icon, masked digit inputs, clear feedback on incorrect PIN attempts, and cancel/submit triggers.
  - Client-side cryptographic hashing (`SHA-256`) ensures raw PINs are never transmitted in plaintext.

### 7. Photo Lightbox Viewer
Full-screen modal for inspecting attached images.

- **Structure**:
  - Dark backdrop with centered high-resolution image (`object-contain`).
  - Navigation controls: Previous/Next buttons, left/right keyboard listener, touch swipe support.
  - Header: Image index counter (`1 / 3`) and close button (`X`).

---

## 7. Anti-Patterns & Strict Rules

1. **No gradient card fills**: Never apply linear or radial gradients across memo cards. Cards are solid matte.
2. **No pitch black canvas**: Canvas must remain `#08090b` (dark) and `#f2f1ed` (light). Never use `#000000`.
3. **No bloated rich-text toolbars**: Avoid distracting formatting toolbars (bold, italic, headers, tables). Memos remain lightweight, fluid, and natural.
4. **No border outlines on search pills**: Inset search inputs must remain borderless with `surface-inset` background.
5. **No plaintext PIN exposure**: Security PINs must always pass through client-side SHA-256 hashing before query evaluation or storage.
6. **No neon accents**: Avoid saturated neon primaries. Use muted minerals (`#d2bd93`, `#a9bfa9`, `#c99a90`, `#a6b0bd`).
