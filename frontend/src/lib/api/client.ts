import axios from "axios";

/**
 * All requests go to same-origin "/api/v1/...". next.config.ts rewrites
 * that path server-side to NEXT_PUBLIC_API_BASE_URL. This is deliberate:
 * the deployed gateway sends no CORS headers, so a direct browser call to
 * http://34.228.56.9:8080 from a different origin would be blocked. This
 * proxy is frontend-only plumbing and never touches backend code.
 */
export const apiClient = axios.create({
  baseURL: "/api/v1",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});
