// Centralized API Base URL configuration
// Dynamically resolves to the current EC2 IPv4 host / domain on port 8080,
// or uses VITE_API_BASE_URL if explicitly provided at build time.
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  if (typeof window !== 'undefined' && window.location.hostname) {
    const hostname = window.location.hostname;
    // When visiting http://<EC2-IPv4> or http://localhost, point API calls to port 8080
    return `http://${hostname}:8080`;
  }
  return 'http://localhost:8080';
};

export const API_BASE_URL = getApiBaseUrl();
