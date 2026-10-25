"use client"

import { useState } from "react"
import Image from "next/image"
import { SignInButton } from "@clerk/nextjs"
import {
  ArrowRight,
  Calendar,
  Check,
  Clock,
  ImagePlus,
  Lock,
  Shield,
  Star,
  Layers,
  ChevronRight,
  Search,
} from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Card, CardContent } from "@workspace/ui/components/card"

export function LandingPage() {
  const [activeTab, setActiveTab] = useState<"day" | "month" | "year" | "important">("day")

  return (
    <div className="relative min-h-screen bg-background text-foreground antialiased selection:bg-muted selection:text-foreground">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="memoflows"
              width={26}
              height={26}
              className="size-6.5 rounded-md object-contain"
              priority
            />
            <span className="text-base font-semibold tracking-tight">memoflows</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm" className="text-xs sm:text-sm font-medium">
                Sign in
              </Button>
            </SignInButton>

            <SignInButton mode="modal">
              <Button size="sm" className="gap-1.5 text-xs sm:text-sm font-medium shadow-xs">
                <span>Get started</span>
                <ArrowRight className="size-3.5" />
              </Button>
            </SignInButton>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="mx-auto max-w-5xl px-4 pt-14 pb-20 sm:px-6 sm:pt-20">
        <div className="flex flex-col items-center text-center">
          {/* Main heading */}
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl md:text-6xl text-balance">
            Your life in a continuous flow of moments.
          </h1>

          {/* Subtitle */}
          <p className="mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground text-balance leading-relaxed">
            A minimalist timeline journal built for clarity. Log thoughts through
            the day, browse chronological rails across months and years, and keep
            sensitive notes securely locked behind your personal PIN.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <SignInButton mode="modal">
              <Button size="lg" className="w-full sm:w-auto gap-2 px-6 font-medium shadow-sm">
                <span>Start your journal free</span>
                <ArrowRight className="size-4" />
              </Button>
            </SignInButton>

            <a href="#preview" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto gap-2">
                <span>Explore the interface</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Button>
            </a>
          </div>

          {/* Feature highlights line */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Check className="size-3.5 text-muted-foreground" />
              <span>No clutter or social feeds</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="size-3.5 text-muted-foreground" />
              <span>PIN-protected important notes</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="size-3.5 text-muted-foreground" />
              <span>Fast photo attachments</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Check className="size-3.5 text-muted-foreground" />
              <span>Real-time cloud sync</span>
            </div>
          </div>
        </div>

        {/* Interactive App Preview Section */}
        <section id="preview" className="mt-16 sm:mt-24 scroll-mt-20">
          <div className="relative mx-auto max-w-4xl rounded-[24px] border border-border bg-card p-2 sm:p-4 shadow-[var(--card-shadow)]">
            {/* Window bar mockup */}
            <div className="mb-3 flex items-center justify-between border-b border-border pb-2.5 px-2">
              <div className="flex items-center gap-2">
                <span className="size-2.5 rounded-full bg-border" />
                <span className="size-2.5 rounded-full bg-border" />
                <span className="size-2.5 rounded-full bg-border" />
                <span className="ml-2 text-xs font-mono text-muted-foreground hidden sm:inline">
                  memoflows.app / timeline
                </span>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground font-mono">
                Interactive Preview
              </div>
            </div>

            {/* Inner App Container Mock */}
            <div className="rounded-[16px] border border-border bg-surface p-4 sm:p-6">
              {/* Timeline Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                <div className="flex items-baseline gap-1.5 text-sm font-semibold">
                  <span className="text-muted-foreground">2026</span>
                  <span className="text-muted-foreground opacity-30">/</span>
                  <span className="text-muted-foreground">October</span>
                  <span className="text-muted-foreground opacity-30">/</span>
                  <span className="text-foreground">22</span>
                </div>

                {/* View switcher tabs */}
                <div className="flex items-center gap-1 rounded-full bg-surface-inset p-1 text-xs border border-border">
                  <button
                    onClick={() => setActiveTab("day")}
                    className={`rounded-full px-2.5 py-1 font-medium transition-all cursor-pointer ${
                      activeTab === "day"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Day Rail
                  </button>
                  <button
                    onClick={() => setActiveTab("month")}
                    className={`rounded-full px-2.5 py-1 font-medium transition-all cursor-pointer ${
                      activeTab === "month"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => setActiveTab("year")}
                    className={`rounded-full px-2.5 py-1 font-medium transition-all cursor-pointer ${
                      activeTab === "year"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Year
                  </button>
                  <button
                    onClick={() => setActiveTab("important")}
                    className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-medium transition-all cursor-pointer ${
                      activeTab === "important"
                        ? "bg-card text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Star className="size-3 text-amber-mineral" fill={activeTab === "important" ? "currentColor" : "none"} />
                    <span>Important</span>
                  </button>
                </div>
              </div>

              {/* View Content Showcase */}
              <div className="mt-6">
                {activeTab === "day" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between text-xs text-muted-foreground font-mono">
                      <span>Thursday, October 22, 2026</span>
                      <span>3 notes recorded</span>
                    </div>

                    {/* Timeline rail notes */}
                    <div className="relative pl-6 sm:pl-8 before:absolute before:left-2 sm:before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-border">
                      {/* Note 1 */}
                      <div className="relative mb-6">
                        <div className="absolute -left-6 sm:-left-8 top-1.5 size-2 rounded-full border border-background bg-foreground" />
                        <Card className="border-border bg-card transition-colors">
                          <CardContent className="p-3.5 sm:p-4">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                              <span className="font-mono font-medium">08:45 AM</span>
                              <span className="text-[11px] text-muted-foreground font-mono">reflection</span>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground">
                              Started the day reviewing architecture principles. Keeping things fast, linear, and unencumbered by unnecessary state. Everything feels light.
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Note 2 - Important / Locked */}
                      <div className="relative mb-6">
                        <div className="absolute -left-6 sm:-left-8 top-1.5 size-2 rounded-full border border-background bg-muted-foreground" />
                        <Card className="border-border bg-surface-inset border-dashed">
                          <CardContent className="p-3.5 sm:p-4">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                              <span className="font-mono font-medium">02:15 PM</span>
                              <div className="flex items-center gap-1 text-amber-mineral font-medium text-[11px]">
                                <Lock className="size-3" />
                                <span>PIN Protected</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 py-2 text-muted-foreground">
                              <div className="flex size-8 items-center justify-center rounded-xl bg-card border border-border">
                                <Lock className="size-4 text-muted-foreground" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-foreground">Sensitive thought locked behind PIN</p>
                                <p className="text-[11px] text-muted-foreground">Unlock with PIN to view contents</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Note 3 */}
                      <div className="relative">
                        <div className="absolute -left-6 sm:-left-8 top-1.5 size-2 rounded-full border border-background bg-foreground" />
                        <Card className="border-border bg-card transition-colors">
                          <CardContent className="p-3.5 sm:p-4">
                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                              <span className="font-mono font-medium">07:30 PM</span>
                              <span className="text-[11px] text-muted-foreground">1 photo attached</span>
                            </div>
                            <p className="text-sm leading-relaxed text-foreground mb-3">
                              Dusk walk by the waterfront. Crisp autumn air and gold reflections on the water.
                            </p>
                            <div className="flex items-center gap-2 rounded-xl border border-border bg-surface-inset p-2 max-w-xs text-xs text-muted-foreground">
                              <ImagePlus className="size-4 text-muted-foreground" />
                              <span className="truncate">autumn-waterfront-evening.jpg</span>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "month" && (
                  <div className="space-y-4 text-center py-6">
                    <p className="text-xs font-mono text-muted-foreground">October 2026 Overview</p>
                    <div className="grid grid-cols-7 gap-2 max-w-md mx-auto text-xs font-mono">
                      {["SU", "MO", "TU", "WE", "TH", "FR", "SA"].map((d) => (
                        <div key={d} className="font-semibold text-muted-foreground py-1">{d}</div>
                      ))}
                      {Array.from({ length: 31 }).map((_, i) => {
                        const day = i + 1
                        const isToday = day === 22
                        const hasNotes = [3, 8, 14, 18, 20, 22].includes(day)
                        return (
                          <div
                            key={i}
                            className={`flex flex-col items-center justify-center rounded-lg p-2 border transition-all ${
                              isToday
                                ? "border-foreground bg-foreground/10 text-foreground font-bold"
                                : hasNotes
                                ? "border-border bg-card text-foreground"
                                : "border-transparent text-muted-foreground opacity-40"
                            }`}
                          >
                            <span>{day}</span>
                            {hasNotes && (
                              <span className={`size-1 rounded-full mt-1 ${isToday ? "bg-foreground" : "bg-muted-foreground"}`} />
                            )}
                          </div>
                        )
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-4">
                      Drill into any date to inspect its 24-hour day rail
                    </p>
                  </div>
                )}

                {activeTab === "year" && (
                  <div className="space-y-4 py-6 text-center">
                    <p className="text-xs font-mono text-muted-foreground">2026 Year Grid</p>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-w-lg mx-auto">
                      {["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].map((m, idx) => (
                        <div
                          key={m}
                          className={`rounded-lg border p-3 text-xs text-left transition-colors ${
                            idx === 9
                              ? "border-foreground/40 bg-muted/40 text-foreground font-semibold"
                              : "border-border/60 bg-card/40 text-muted-foreground"
                          }`}
                        >
                          <div className="font-medium text-foreground">{m}</div>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {idx <= 9 ? `${12 + idx * 3} notes` : "—"}
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Survey entire years at a glance and jump into any month
                    </p>
                  </div>
                )}

                {activeTab === "important" && (
                  <div className="space-y-4 py-6 text-center">
                    <div className="mx-auto flex size-10 items-center justify-center rounded-lg border border-border bg-muted/40 text-foreground mb-2">
                      <Lock className="size-4 text-muted-foreground" />
                    </div>
                    <h3 className="text-sm font-semibold">Important Notes Vault</h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                      All notes marked as important are locked behind your private PIN. Enter your PIN once per session to reveal confidential thoughts.
                    </p>
                    <div className="flex justify-center gap-1.5 pt-2">
                      <div className="size-2 rounded-full bg-border" />
                      <div className="size-2 rounded-full bg-border" />
                      <div className="size-2 rounded-full bg-border" />
                      <div className="size-2 rounded-full bg-border" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Feature Highlights Grid - Strictly Minimalist Monochrome */}
        <section className="mt-24 sm:mt-32">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Thoughtful design for continuous memory.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-xl mx-auto">
              Every feature exists to help you capture, recall, and protect what matters — without distractions.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Card 1 */}
            <Card className="border-border bg-card transition-colors hover:border-border">
              <CardContent className="p-6">
                <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground mb-4">
                  <Clock className="size-4" />
                </div>
                <h3 className="text-sm font-semibold">The 24-Hour Day Rail</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Log notes naturally as your day unfolds. A vertical timeline gives you a clean, chronological perspective of your thoughts and activities.
                </p>
              </CardContent>
            </Card>

            {/* Card 2 */}
            <Card className="border-border bg-card transition-colors hover:border-border">
              <CardContent className="p-6">
                <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground mb-4">
                  <Shield className="size-4" />
                </div>
                <h3 className="text-sm font-semibold">PIN-Protected Privacy</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Flag sensitive thoughts as Important. They are secured behind your personal PIN and remain concealed until you deliberately unlock them.
                </p>
              </CardContent>
            </Card>

            {/* Card 3 */}
            <Card className="border-border bg-card transition-colors hover:border-border">
              <CardContent className="p-6">
                <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground mb-4">
                  <Calendar className="size-4" />
                </div>
                <h3 className="text-sm font-semibold">Effortless Drill-Down</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Navigate seamlessly between day, month, and year views. Revisit memories from last week or last year with instant breadcrumb jumps.
                </p>
              </CardContent>
            </Card>

            {/* Card 4 */}
            <Card className="border-border bg-card transition-colors hover:border-border">
              <CardContent className="p-6">
                <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground mb-4">
                  <ImagePlus className="size-4" />
                </div>
                <h3 className="text-sm font-semibold">Visual Memories</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Attach snapshots to your notes effortlessly. Full-screen lightbox viewer and fast uploads keep your visual moments close at hand.
                </p>
              </CardContent>
            </Card>

            {/* Card 5 */}
            <Card className="border-border bg-card transition-colors hover:border-border">
              <CardContent className="p-6">
                <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground mb-4">
                  <Search className="size-4" />
                </div>
                <h3 className="text-sm font-semibold">Zero Noise & Clutter</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  No public feeds, no likes, no algorithms. A solitary space strictly between you and your personal log.
                </p>
              </CardContent>
            </Card>

            {/* Card 6 */}
            <Card className="border-border bg-card transition-colors hover:border-border">
              <CardContent className="p-6">
                <div className="flex size-9 items-center justify-center rounded-xl border border-border bg-surface text-foreground mb-4">
                  <Layers className="size-4" />
                </div>
                <h3 className="text-sm font-semibold">Instant Cloud Sync</h3>
                <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Powered by modern reactive cloud storage. Your notes and PIN hashes are kept perfectly synchronized across devices.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How it works 3-step section */}
        <section className="mt-24 sm:mt-32 border-t border-border pt-16">
          <div className="text-center">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Three steps to a clearer mind.
            </h2>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-4">
              <div className="flex size-10 items-center justify-center rounded-full border border-border bg-surface font-mono text-xs font-semibold mb-4">
                01
              </div>
              <h3 className="text-sm font-semibold">Jot down moments</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Add text and photos anytime during your day. Each note is automatically timestamped on your day rail.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="flex size-10 items-center justify-center rounded-full border border-border bg-surface font-mono text-xs font-semibold mb-4">
                02
              </div>
              <h3 className="text-sm font-semibold">Browse the timeline</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Zoom out to see your month or year. Search past notes instantly with fast keyword filtering.
              </p>
            </div>

            <div className="flex flex-col items-center text-center p-4">
              <div className="flex size-10 items-center justify-center rounded-full border border-border bg-surface font-mono text-xs font-semibold mb-4">
                03
              </div>
              <h3 className="text-sm font-semibold">Protect what matters</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Star sensitive thoughts to place them under your personal PIN. Confidential notes stay private.
              </p>
            </div>
          </div>
        </section>

        {/* Call to Action Banner */}
        <section className="mt-24 sm:mt-32">
          <div className="relative overflow-hidden rounded-[24px] border border-border bg-card p-8 sm:p-12 text-center shadow-[var(--card-shadow)]">
            <div className="mx-auto max-w-xl">
              <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Ready to begin your personal journal?
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                Join Memoflows today. Sign in securely in seconds and start capturing your timeline.
              </p>
              <div className="mt-7 flex justify-center">
                <SignInButton mode="modal">
                  <Button size="lg" className="gap-2 px-7 font-medium shadow-xs">
                    <span>Sign in to get started</span>
                    <ArrowRight className="size-4" />
                  </Button>
                </SignInButton>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 text-xs text-muted-foreground">
        <div className="mx-auto flex max-w-5xl flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="memoflows"
              width={18}
              height={18}
              className="size-4 rounded-xs object-contain"
            />
            <span className="font-medium text-foreground">memoflows</span>
            <span>—</span>
            <span>Personal timeline journal</span>
          </div>
          <div>
            <span>Private · Minimalist · Encrypted</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
