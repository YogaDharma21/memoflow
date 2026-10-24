"use client";

import * as React from "react";
import * as DialogPrimitive from "radix-ui";
import { cn } from "cn";

function Dialog(props: React.ComponentProps<typeof DialogPrimitive.Dialog.Root>) {
  return <DialogPrimitive.Dialog.Root data-slot="dialog" {...props} />;
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Dialog.Content>) {
  return (
    <DialogPrimitive.Dialog.Portal>
      <DialogPrimitive.Dialog.Overlay
        data-slot="dialog-overlay"
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[3px]"
      />
      <DialogPrimitive.Dialog.Content
        data-slot="dialog-content"
        className={cn(
          "bg-popover text-popover-foreground fixed top-1/2 left-1/2 z-50 w-[min(300px,86%)] -translate-x-1/2 -translate-y-1/2 rounded-[24px] border border-border p-4 shadow-[var(--card-shadow)]",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Dialog.Content>
    </DialogPrimitive.Dialog.Portal>
  );
}

function DialogTitle(props: React.ComponentProps<typeof DialogPrimitive.Dialog.Title>) {
  return <DialogPrimitive.Dialog.Title {...props} />;
}

export { Dialog, DialogContent, DialogTitle };
