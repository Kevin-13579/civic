// Centralized API Base URL configuration
// - In local development (port 5173 / 3000): points to http://localhost:8080
// - On AWS EC2 production (port 80): returns '' (relative path) so requests like /api/auth/register
//   are proxied by Nginx on port 80 directly to backend on port 8080 with NO CORS or firewall issues!
// - If accessed on custom ports: points to http://<EC2-IPv4>:8080
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    const { hostname, port, protocol } = window.location;
    // Local Vite dev server
    if (port === '5173' || port === '3000') {
      return `http://${hostname}:8080`;
    }
    // Deployed on EC2 web server (Port 80/443 or default HTTP)
    if (!port || port === '80' || port === '443') {
      return ''; // Relative path uses Nginx reverse proxy on port 80
    }
    return `${protocol}//${hostname}:8080`;
  }
  return 'http://localhost:8080';
};

export const API_BASE_URL = getApiBaseUrl();
