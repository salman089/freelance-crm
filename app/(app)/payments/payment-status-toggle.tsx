"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { setPaymentStatus } from "./actions";

export function PaymentStatusToggle({
  paymentId,
  status,
}: {
  paymentId: string;
  status: "PENDING" | "PAID";
}) {
  const [isPending, startTransition] = useTransition();
  const nextStatus = status === "PAID" ? "PENDING" : "PAID";

  return (
    <Button
      type="button"
      variant={status === "PAID" ? "outline" : "default"}
      size="sm"
      disabled={isPending}
      onClick={() =>
        startTransition(() => {
          setPaymentStatus(paymentId, nextStatus);
        })
      }
    >
      {status === "PAID" ? "Mark pending" : "Mark paid"}
    </Button>
  );
}
