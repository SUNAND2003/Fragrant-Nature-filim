import { formatZodError } from "../lib/validate.js";

export function notFound(req, res) {
  res.status(404).json({ error: "Not found" });
}

function duplicateKeyMessage(err) {
  const fields = Object.keys(err.keyValue || {}).map((key) => `"${key}"`);
  return fields.length
    ? `${fields.join(", ")} already exists`
    : "Duplicate value for a unique field";
}

function mapError(err) {
  if (err.name === "ZodError") {
    return { status: 400, message: formatZodError(err) };
  }
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((issue) => issue.message)
      .join("; ");
    return { status: 400, message };
  }
  if (err.name === "CastError") {
    return { status: 400, message: `Invalid value for "${err.path}"` };
  }
  if (err.name === "MulterError") {
    const message = err.code === "LIMIT_FILE_SIZE" ? "File exceeds the 10 MB limit" : err.message;
    return { status: 400, message };
  }
  if (err.code === 11000) {
    return { status: 400, message: duplicateKeyMessage(err) };
  }
  const status = Number(err.status || err.statusCode) || 500;
  return {
    status,
    message: status >= 500 ? "Internal Server Error" : err.message,
  };
}

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);
  const { status, message } = mapError(err);
  if (status >= 500) console.error(err);
  res.status(status).json({ error: message });
}
