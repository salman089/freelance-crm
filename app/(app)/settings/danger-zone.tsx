"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteAccount, type SettingsFormState } from "./actions";

export function DangerZone() {
  const [confirmation, setConfirmation] = useState("");
  const [state, formAction, pending] = useActionState<
    SettingsFormState,
    FormData
  >(deleteAccount, undefined);

  return (
    <Card className="border-destructive/30">
      <CardContent className="space-y-3">
        <div>
          <p className="font-medium text-destructive">Delete account</p>
          <p className="text-sm text-muted-foreground">
            Permanently deletes your account and every client, project, and
            time entry you&apos;ve logged. This can&apos;t be undone.
          </p>
        </div>
        <AlertDialog>
          <AlertDialogTrigger render={<Button variant="destructive" />}>
            Delete account
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete your account?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes all your clients, projects, and time
                entries. Type <span className="font-mono">DELETE</span> to
                confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <form action={formAction} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="confirmation" className="sr-only">
                  Confirmation
                </Label>
                <Input
                  id="confirmation"
                  name="confirmation"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  autoComplete="off"
                  placeholder="DELETE"
                />
              </div>
              {state?.error && (
                <p role="alert" className="text-sm text-destructive">
                  {state.error}
                </p>
              )}
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  type="submit"
                  variant="destructive"
                  disabled={confirmation !== "DELETE" || pending}
                >
                  {pending ? "Deleting…" : "Delete account"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </form>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
