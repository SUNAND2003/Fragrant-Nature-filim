import { z } from "zod";

// Coerces "true"/"false" query/body strings properly — z.coerce.boolean() would
// treat any non-empty string (including "false") as true.
export const boolish = z.preprocess(
  (value) => (value === "true" ? true : value === "false" ? false : value),
  z.boolean(),
);

export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    // Passed through as-is; the central error middleware knows how to format ZodError.
    throw Object.assign(result.error, { status: 400 });
  }
  return result.data;
}

export function badRequest(message) {
  return Object.assign(new Error(message), { status: 400 });
}

export function formatZodError(error) {
  return error.issues
    .map((issue) =>
      issue.path.length ? `${issue.path.join(".")}: ${issue.message}` : issue.message,
    )
    .join("; ");
}
