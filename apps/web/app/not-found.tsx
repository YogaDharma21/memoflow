import Link from "next/link";
import { Button } from "@workspace/ui/components/button";

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-[1000px] px-4 py-14 sm:px-6">
      <div className="border-border relative ml-13 border-l">
        <div className="relative min-h-11 rounded-xl py-1.5 pr-3 pl-4">
          <span className="text-muted-foreground absolute top-2 -left-13 w-9 text-right text-[11px] font-semibold tabular-nums">
            12am
          </span>
          <span className="bg-muted border-border absolute top-2.5 -left-1.5 size-3 rounded-full border-2" />
          <div className="text-muted-foreground text-xs opacity-60">—</div>
        </div>
        <div className="relative rounded-xl py-1.5 pr-3 pl-4">
          <span className="text-muted-foreground absolute top-2 -left-13 w-9 text-right text-[11px] font-semibold tabular-nums">
            Now
          </span>
          <span className="bg-primary border-primary absolute top-2.5 -left-1.5 size-3 rounded-full border-2" />
          <div className="border-border bg-card my-1.5 rounded-xl border p-5">
            <p className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase">404</p>
            <h1 className="mt-1 text-xl font-bold">Page not found</h1>
            <div className="mt-4 flex gap-2">
              <Button asChild>
                <Link href="/">Back to today</Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="relative min-h-11 rounded-xl py-1.5 pr-3 pl-4">
          <span className="text-muted-foreground absolute top-2 -left-13 w-9 text-right text-[11px] font-semibold tabular-nums">
            11pm
          </span>
          <span className="bg-muted border-border absolute top-2.5 -left-1.5 size-3 rounded-full border-2" />
          <div className="text-muted-foreground text-xs opacity-60">—</div>
        </div>
      </div>
    </div>
  );
}
