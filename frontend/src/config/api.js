// Centralized API Base URL configuration
// - In local Vite development (npm run dev on port 5173): uses 'http://localhost:8080'
// - In production (built for EC2 / Docker): uses '' (relative path)
//   This ensures all API calls (e.g. /api/auth/register) go to Port 80 on the EC2 server (http://3.88.100.25/api/...),
//   where Nginx proxies them to the backend container on port 8080.
//   This eliminates all CORS and 'localhost' loopback connection errors!
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:8080' : '');
