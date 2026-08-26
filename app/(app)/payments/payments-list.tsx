import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatMoney } from "@/lib/money";
import { PaymentFormDialog } from "./payment-form-dialog";
import { PaymentStatusToggle } from "./payment-status-toggle";
import { DeletePaymentButton } from "./delete-payment-button";
import { updatePayment } from "./actions";

type Payment = {
  id: string;
  amount: number;
  currency: string;
  status: "PENDING" | "PAID";
  note: string | null;
  dueDate: Date | null;
};

export function PaymentsList({
  projectId,
  payments,
}: {
  projectId: string;
  payments: Payment[];
}) {
  if (payments.length === 0) {
    return <p className="text-sm text-muted-foreground">No payments logged yet.</p>;
  }

  return (
    <div className="space-y-3">
      {payments.map((payment) => (
        <Card key={payment.id}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-heading text-lg font-semibold">
                  {formatMoney(payment.amount, payment.currency)}
                </span>
                <Badge variant={payment.status === "PAID" ? "default" : "secondary"}>
                  {payment.status === "PAID" ? "Paid" : "Pending"}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {payment.note ?? "No note"}
                {payment.dueDate &&
                  ` · Due ${payment.dueDate.toLocaleDateString()}`}
              </p>
            </div>
            <div className="flex items-center gap-1">
              <PaymentStatusToggle paymentId={payment.id} status={payment.status} />
              <PaymentFormDialog
                action={updatePayment.bind(null, payment.id)}
                projectId={projectId}
                title="Edit payment"
                submitLabel="Save changes"
                defaultValues={{
                  amount: payment.amount,
                  currency: payment.currency,
                  note: payment.note,
                  dueDate: payment.dueDate,
                }}
                trigger={
                  <Button variant="ghost" size="sm">
                    Edit
                  </Button>
                }
              />
              <DeletePaymentButton paymentId={payment.id} />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
