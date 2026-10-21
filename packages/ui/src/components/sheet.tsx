"use client";

import * as React from "react";
import * as DialogPrimitive from "radix-ui";
import { cn } from "cn";

function Sheet(props: React.ComponentProps<typeof DialogPrimitive.Dialog.Root>) {
  return <DialogPrimitive.Dialog.Root data-slot="sheet" {...props} />;
}

function SheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Dialog.Content>) {
  return (
    <DialogPrimitive.Dialog.Portal>
      <DialogPrimitive.Dialog.Overlay
        data-slot="sheet-overlay"
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[3px]"
      />
      <DialogPrimitive.Dialog.Content
        data-slot="sheet-content"
        className={cn(
          "bg-popover text-popover-foreground fixed inset-x-0 bottom-0 z-50 mx-auto w-[min(390px,100%)] rounded-t-[20px] border-t p-4 pb-6",
          "sm:top-1/2 sm:bottom-auto sm:w-[min(480px,94%)] sm:-translate-y-1/2 sm:rounded-2xl sm:border",
          className,
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Dialog.Content>
    </DialogPrimitive.Dialog.Portal>
  );
}

function SheetTitle(props: React.ComponentProps<typeof DialogPrimitive.Dialog.Title>) {
  return <DialogPrimitive.Dialog.Title {...props} />;
}

export { Sheet, SheetContent, SheetTitle };
