/**
 * Standard API Success Response Structure
 * Format:
 * {
 *   "success": true,
 *   "statusCode": 200,
 *   "message": "Success message",
 *   "data": { ... }
 * }
 */
class ApiResponse {
  constructor(statusCode, data = null, message = "Success") {
    this.statusCode = statusCode;
    this.statuscode = statusCode; // backward-compatibility
    this.data = data;
    this.message = message;
    this.success = statusCode < 400;
  }
}

export { ApiResponse };
export default ApiResponse;