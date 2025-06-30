import { NextResponse } from "next/server"
import { validateAndChecksumAddress } from "./utils"

/**
 * Validates request body and required fields
 * @param request - Request object
 * @param requiredFields - Array of required field names
 * @param addressFields - Array of field names that contain addresses
 * @returns Parsed and validated body with checksummed addresses
 */
export async function validateAndParseRequestBody(
  request: Request,
  requiredFields: string[] = [],
  addressFields: string[] = ['user_address', 'address']
): Promise<Record<string, any>> {
  // Check if request has content
  const contentLength = request.headers.get('content-length');
  if (!contentLength || contentLength === '0') {
    throw new Error("Request body is required");
  }

  // Check content type
  const contentType = request.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error("Content-Type must be application/json");
  }

  const body = await request.json();
  
  // Validate body structure
  if (!body || typeof body !== 'object') {
    throw new Error("Invalid request body");
  }

  // Validate required fields
  for (const field of requiredFields) {
    if (!body[field] || typeof body[field] !== 'string' || body[field].trim() === '') {
      throw new Error(`${field} must be a non-empty string`);
    }
  }

  // Checksum addresses
  const processedBody = { ...body }
  for (const field of addressFields) {
    if (processedBody[field]) {
      try {
        processedBody[field] = validateAndChecksumAddress(processedBody[field])
      } catch (error) {
        throw new Error(`Invalid ${field}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }
  
  return processedBody
}

/**
 * Validates and checksums addresses in request body (legacy)
 * @param body - Request body object
 * @param addressFields - Array of field names that contain addresses
 * @returns Modified body with checksummed addresses
 */
export function validateAndChecksumRequestBody(
  body: Record<string, any>,
  addressFields: string[] = ['user_address', 'address']
): Record<string, any> {
  const processedBody = { ...body }
  
  for (const field of addressFields) {
    if (processedBody[field]) {
      try {
        processedBody[field] = validateAndChecksumAddress(processedBody[field])
      } catch (error) {
        throw new Error(`Invalid ${field}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }
  
  return processedBody
}

/**
 * Validates and checksums address from URL search params
 * @param searchParams - URLSearchParams object
 * @param paramName - Name of the address parameter (default: 'address')
 * @returns Checksummed address
 */
export function validateAndChecksumURLParam(
  searchParams: URLSearchParams,
  paramName: string = 'address'
): string {
  const address = searchParams.get(paramName)
  
  if (!address) {
    throw new Error(`${paramName} parameter is required`)
  }
  
  return validateAndChecksumAddress(address)
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
  const message = error instanceof Error ? error.message : error
  return NextResponse.json({ error: message }, { status })
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
      return await handler(...args)
    } catch (error) {
      if (error instanceof Error && error.message.includes('address')) {
        return createErrorResponse(error, 400)
      }
      throw error
    }
  }
} 