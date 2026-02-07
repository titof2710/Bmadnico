/**
 * API Configuration
 */

// Use environment variable if available, fallback to localhost for development
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper function to build API URLs
export function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}
