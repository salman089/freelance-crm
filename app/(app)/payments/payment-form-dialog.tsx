"use client";

import { useActionState, useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CURRENCIES, toMajorUnits } from "@/lib/money";
import type { PaymentFormState } from "./actions";

type PaymentFormDialogProps = {
  action: (
    state: PaymentFormState,
    formData: FormData
  ) => Promise<PaymentFormState>;
  projectId: string;
  trigger: ReactNode;
  title: string;
  submitLabel: string;
  defaultValues?: {
    amount: number;
    currency: string;
    note: string | null;
    dueDate: Date | null;
  };
};

export function PaymentFormDialog({
  action,
  projectId,
  trigger,
  title,
  submitLabel,
  defaultValues,
}: PaymentFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<
    PaymentFormState,
    FormData
  >(action, undefined);

  const currency = defaultValues?.currency ?? "USD";

  useEffect(() => {
    if (!pending && !state?.error && open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setOpen(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={trigger as React.ReactElement} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="projectId" value={projectId} />
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                defaultValue={
                  defaultValues
                    ? toMajorUnits(defaultValues.amount, currency)
                    : undefined
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Select
                name="currency"
                defaultValue={currency}
                items={Object.fromEntries(CURRENCIES.map((c) => [c, c]))}
              >
                <SelectTrigger id="currency" className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="note">Note</Label>
            <Input
              id="note"
              name="note"
              placeholder="e.g. Milestone 1"
              defaultValue={defaultValues?.note ?? ""}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="dueDate">Due date</Label>
            <Input
              id="dueDate"
              name="dueDate"
              type="date"
              defaultValue={
                defaultValues?.dueDate
                  ? defaultValues.dueDate.toISOString().slice(0, 10)
                  : undefined
              }
            />
          </div>
          {state?.error && (
            <p role="alert" className="text-sm text-destructive">
              {state.error}
            </p>
          )}
          <DialogFooter>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
