"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { importData, type SettingsFormState } from "./actions";

export function ImportForm() {
  const [state, formAction, pending] = useActionState<
    SettingsFormState,
    FormData
  >(importData, undefined);

  return (
    <form action={formAction} className="max-w-sm space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="file">Data file (.json)</Label>
        <Input id="file" name="file" type="file" accept="application/json" required />
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-destructive">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-muted-foreground">{state.success}</p>
      )}
      <Button type="submit" disabled={pending} variant="outline">
        {pending ? "Importing…" : "Import"}
      </Button>
    </form>
  );
}
