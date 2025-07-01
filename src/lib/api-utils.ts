import { NextResponse } from "next/server";
import { validateAndChecksumAddress } from "./utils";

/**
 * Validates request body and required fields
 * @param request - Request object
 * @param requiredFields - Array of required field names (assumes string type)
 * @param addressFields - Array of field names that contain addresses
 * @param numberFields - Array of field names that should be numbers
 * @param optionalFields - Array of field names that are optional
 * @param arrayFields - Array of field names that should be arrays
 * @returns Parsed and validated body with checksummed addresses (if any)
 */
export async function validateAndParseRequestBody(
  request: Request,
  requiredFields: string[] = [],
  addressFields: string[] = ["user_address", "address"],
  numberFields: string[] = [],
  optionalFields: string[] = [],
  arrayFields: string[] = []
): Promise<Record<string, any>> {
  // Check if request has content
  const contentLength = request.headers.get("content-length");
  if (!contentLength || contentLength === "0") {
    throw new Error("Request body is required");
  }

  // Check content type
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Content-Type must be application/json");
  }

  const body = await request.json();

  // Validate body structure
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }

  // Validate required string fields
  for (const field of requiredFields) {
    // Skip validation if this field is meant to be an array
    if (arrayFields.includes(field)) continue;

    if (
      !body[field] ||
      typeof body[field] !== "string" ||
      body[field].trim() === "" ||
      Array.isArray(body[field]) ||
      body[field] === null
    ) {
      throw new Error(`${field} must be a non-empty string`);
    }
  }

  // Validate array fields
  for (const field of arrayFields) {
    if (body[field] !== undefined && body[field] !== null) {
      if (!Array.isArray(body[field])) {
        throw new Error(`${field} must be an array`);
      }
      // Optional: validate that array is not empty if it's required
      if (!optionalFields.includes(field) && body[field].length === 0) {
        throw new Error(`${field} must not be an empty array`);
      }
    } else if (!optionalFields.includes(field)) {
      throw new Error(`${field} is required and must be an array`);
    }
  }

  // Validate number fields
  for (const field of numberFields) {
    if (body[field] !== undefined && body[field] !== null) {
      if (typeof body[field] !== "number" || isNaN(body[field])) {
        throw new Error(`${field} must be a valid number`);
      }
    } else if (!optionalFields.includes(field)) {
      throw new Error(`${field} is required and must be a number`);
    }
  }

  // Checksum addresses if any exist
  const processedBody = { ...body };
  for (const field of addressFields) {
    if (processedBody[field]) {
      try {
        processedBody[field] = validateAndChecksumAddress(processedBody[field]);
      } catch (error) {
        throw new Error(
          `Invalid ${field}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  }

  return processedBody;
}

/**
 * Validates and checksums address from URL search params
 * @param searchParams - URLSearchParams object
 * @param paramName - Name of the address parameter (default: 'address')
 * @param required - Whether the parameter is required (default: true)
 * @returns Checksummed address if exists, null if not required and missing
 */
export function validateAndChecksumURLParam(
  searchParams: URLSearchParams,
  paramName?: string,
  required?: true
): string;
export function validateAndChecksumURLParam(
  searchParams: URLSearchParams,
  paramName: string,
  required: false
): string | null;
export function validateAndChecksumURLParam(
  searchParams: URLSearchParams,
  paramName: string = "address",
  required: boolean = true
): string | null {
  const address = searchParams.get(paramName);

  if (!address) {
    if (required) {
      throw new Error(`${paramName} parameter is required`);
    }
    return null;
  }

  return validateAndChecksumAddress(address);
}

/**
 * Creates a standardized error response for API routes
 * @param error - Error object or string
 * @param status - HTTP status code (default: 400)
 * @returns NextResponse with error
 */
export function createErrorResponse(
  error: Error | string,
  status: number = 400
): NextResponse {
  const message = error instanceof Error ? error.message : error;
  return NextResponse.json({ error: message }, { status });
}

/**
 * Wrapper function to handle address validation errors in API routes
 * @param handler - The actual API route handler
 * @returns Wrapped handler with error handling
 */
export function withAddressValidation<T extends any[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof Error && error.message.includes("address")) {
        return createErrorResponse(error, 400);
      }
      throw error;
    }
  };
}

/**
 * Simple validation that allows mixed field types
 * @param request - Request object
 * @param requiredStringFields - Array of required string field names
 * @param addressFields - Array of field names that contain addresses
 * @param skipValidationFields - Array of fields to skip validation for
 * @returns Parsed and validated body with checksummed addresses (if any)
 */
export async function validateMixedRequestBody(
  request: Request,
  requiredStringFields: string[] = [],
  addressFields: string[] = ["user_address", "address"],
  skipValidationFields: string[] = []
): Promise<Record<string, any>> {
  // Check if request has content
  const contentLength = request.headers.get("content-length");
  if (!contentLength || contentLength === "0") {
    throw new Error("Request body is required");
  }

  // Check content type
  const contentType = request.headers.get("content-type");
  if (!contentType || !contentType.includes("application/json")) {
    throw new Error("Content-Type must be application/json");
  }

  const body = await request.json();

  // Validate body structure
  if (!body || typeof body !== "object") {
    throw new Error("Invalid request body");
  }

  // Validate required string fields (skip those in skipValidationFields)
  for (const field of requiredStringFields) {
    if (skipValidationFields.includes(field)) continue;

    if (
      !body[field] ||
      typeof body[field] !== "string" ||
      body[field].trim() === ""
    ) {
      throw new Error(`${field} must be a non-empty string`);
    }
  }

  // Checksum addresses if any exist
  const processedBody = { ...body };
  for (const field of addressFields) {
    if (processedBody[field]) {
      try {
        processedBody[field] = validateAndChecksumAddress(processedBody[field]);
      } catch (error) {
        throw new Error(
          `Invalid ${field}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      }
    }
  }

  return processedBody;
}
