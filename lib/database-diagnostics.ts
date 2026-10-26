export type DatabaseOperation =
  | "describe-table"
  | "create-table"
  | "wait-for-table"
  | "validate-table"
  | "put-visit";

export class DatabaseOperationError extends Error {
  readonly operation: DatabaseOperation;

  constructor(operation: DatabaseOperation, cause: unknown) {
    // Keep the backend exception as a cause for classification, never include
    // its arbitrary message in the public response or application logs.
    super(`Database operation failed: ${operation}`, { cause });
    this.name = "DatabaseOperationError";
    this.operation = operation;
  }
}

export class DatabaseSchemaMismatchError extends Error {
  constructor() {
    super("Existing visit table key schema does not match the application");
    this.name = "DatabaseSchemaMismatchError";
  }
}

function record(value: unknown): Record<string, unknown> | undefined {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : undefined;
}

function errorReason(name: string, message: string): string {
  if (name === "DatabaseSchemaMismatchError") return "key-schema-mismatch";
  if (/key.*(?:schema|type)|(?:schema|type).*key/i.test(message))
    return "key-schema-mismatch";
  if (
    name === "ResourceNotFoundException" ||
    /(?:table|path).*(?:not found|does not exist|doesn't exist)/i.test(message)
  )
    return "table-not-found";
  if (
    name === "AccessDeniedException" ||
    /permission|unauthoriz/i.test(message)
  )
    return "access-denied";
  if (/expression|reserved keyword/i.test(message)) return "invalid-expression";
  if (/attribute.*(?:type|value)|(?:type|value).*attribute/i.test(message))
    return "invalid-attribute";
  if (/required|missing parameter/i.test(message)) return "missing-parameter";
  if (/not supported|unsupported/i.test(message))
    return "unsupported-operation";
  if (name === "ValidationException") return "invalid-request";
  return "database-error";
}

/** Fixed categories only: no payload, endpoint, key values or raw SDK message. */
export function databaseErrorDetails(
  error: unknown,
  fallbackOperation: DatabaseOperation
) {
  const operation =
    error instanceof DatabaseOperationError
      ? error.operation
      : fallbackOperation;
  const source = record(
    error instanceof DatabaseOperationError ? error.cause : error
  );
  const errorName =
    typeof source?.name === "string" &&
    /^[A-Za-z][A-Za-z0-9_]{0,79}$/.test(source.name)
      ? source.name
      : "UnknownError";
  const message = typeof source?.message === "string" ? source.message : "";
  const metadata = record(source?.$metadata);
  const httpStatus = metadata?.httpStatusCode;
  const requestId = metadata?.requestId;
  return {
    operation,
    errorName,
    reason: errorReason(errorName, message),
    ...(typeof httpStatus === "number" &&
    Number.isInteger(httpStatus) &&
    httpStatus >= 100 &&
    httpStatus <= 599
      ? { httpStatus }
      : {}),
    ...(typeof requestId === "string" && /^[A-Za-z0-9-]{1,128}$/.test(requestId)
      ? { requestId }
      : {}),
  };
}
