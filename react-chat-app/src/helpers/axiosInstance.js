import axios from 'axios';
import config from '../configs/app';

const baseURL = config.baseURL;
const axiosInstance = axios.create({
  baseURL: baseURL,
  withCredentials: true, // Ensures cookies are sent with requests
});

// Request interceptor to attach Authorization header
axiosInstance.interceptors.request.use((config) => {
    const accessToken = localStorage.getItem('accessToken');    
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle expired access tokens
axiosInstance.interceptors.response.use((response) => response, async (error) => {
    const originalRequest = error.config;
    if (error.response && error.response.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      // Refresh the token
      try {
        const res = await axios.post(`${baseURL}/auth/refresh-token`, {}, { withCredentials: true });
        const newAccessToken = res.data.accessToken;

        // Store the new token
        localStorage.setItem('accessToken', newAccessToken);

        // Set the new token in Axios headers
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newAccessToken}`;
        originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;

        return axiosInstance(originalRequest);
      } catch (err) {
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
