import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ReactNode } from "react";

type FormDialogProps = {
  title: string;
  description: string;
  triggerLabel: string;
  children: ReactNode;
};

export function FormDialog({ title, description, triggerLabel, children }: FormDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button">{triggerLabel}</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}
