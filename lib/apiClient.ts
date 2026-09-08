import axios from 'axios';

// Pre-configured Axios instance as mandated by Project Architecture rules
const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || '',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Response interceptor for centralized error logging and payload extraction
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An unexpected error occurred';
    console.error('[API Client Error]:', message);
    return Promise.reject(new Error(message));
  }
);

export default apiClient;
