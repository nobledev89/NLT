import { z } from 'zod';

/**
 * Standard result shape returned by every server action used with
 * `useActionState`. `fieldErrors` maps field name -> first error message.
 */
export interface ActionResult {
  ok: boolean;
  message?: string;
  fieldErrors?: Record<string, string>;
  /** optional redirect target the client can navigate to on success */
  redirectTo?: string;
  /** arbitrary success payload (e.g. created id) */
  data?: Record<string, unknown>;
}

export const initialActionState: ActionResult = { ok: false };

/** Flatten a ZodError into a { field: message } map (first error per field). */
export function zodFieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form';
    if (!out[key]) out[key] = issue.message;
  }
  return out;
}

export function fail(message: string, fieldErrors?: Record<string, string>): ActionResult {
  return { ok: false, message, fieldErrors };
}

export function succeed(message?: string, extra?: Partial<ActionResult>): ActionResult {
  return { ok: true, message, ...extra };
}
