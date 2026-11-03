"use client";

import { createContext, useActionState, useContext, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormStatus } from "react-dom";
import { initialActionResult, type ActionResult } from "@/lib/validation/form";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Notice } from "@/components/ui/misc";
import { useToast } from "@/components/providers/toast-provider";
import { cn } from "@/lib/utils";

type FormAction = (prev: ActionResult, formData: FormData) => Promise<ActionResult>;

const FormStateContext = createContext<ActionResult>(initialActionResult);

/**
 * Client wrapper for admin forms. Server components can render the inputs as
 * children; this component handles submission state, toasts, field errors,
 * warnings and redirects returned by the Server Action.
 */
export function AdminForm({
  action,
  children,
  className,
  resetOnSuccess = false,
}: {
  action: FormAction;
  children: React.ReactNode;
  className?: string;
  resetOnSuccess?: boolean;
}) {
  const [state, formAction] = useActionState(action, initialActionResult);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!state.message && !state.redirectTo) return;
    if (state.ok) {
      toast({ tone: "success", title: state.message ?? "Saved" });
      if (state.redirectTo) router.push(state.redirectTo);
      else router.refresh();
    } else if (state.message) {
      toast({ tone: "error", title: "Not saved", description: state.message });
    }
  }, [state, router, toast]);

  return (
    <FormStateContext value={state}>
      <form
        action={formAction}
        className={cn("space-y-6", className)}
        onSubmit={(e) => {
          if (resetOnSuccess) {
            const form = e.currentTarget;
            setTimeout(() => form.reset(), 0);
          }
        }}
      >
        {children}
        {state.warnings && state.warnings.length > 0 && (
          <Notice tone="warning" title="Please review">
            <ul className="list-disc pl-4">
              {state.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </Notice>
        )}
        {!state.ok && state.message && <Notice tone="error">{state.message}</Notice>}
      </form>
    </FormStateContext>
  );
}

export function ErrorFor({ name }: { name: string }) {
  const state = useContext(FormStateContext);
  const errors = state.fieldErrors?.[name];
  if (!errors?.length) return null;
  return (
    <p className="mt-1.5 text-sm text-red-600" role="alert">
      {errors[0]}
    </p>
  );
}

export function SubmitButton({ children = "Save", pendingText = "Saving…", ...props }: ButtonProps & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} {...props}>
      {pending ? pendingText : children}
    </Button>
  );
}

/** Button that runs a server action after confirmation (deletes, status changes). */
export function ConfirmAction({
  action,
  confirm,
  children,
  variant = "outline",
  size = "sm",
  className,
}: {
  action: () => Promise<ActionResult>;
  confirm?: string;
  children: React.ReactNode;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
}) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const { toast } = useToast();
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={pending}
      onClick={() => {
        if (confirm && !window.confirm(confirm)) return;
        start(async () => {
          const result = await action();
          toast({ tone: result.ok ? "success" : "error", title: result.message ?? (result.ok ? "Done" : "Failed") });
          if (result.ok) {
            if (result.redirectTo) router.push(result.redirectTo);
            else router.refresh();
          }
        });
      }}
    >
      {pending ? "Working…" : children}
    </Button>
  );
}
