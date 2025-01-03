// services/axiosInstance.js

import axios from 'axios';

const axiosInstance = axios.create({
    baseURL: 'https://x8ki-letl-twmt.n7.xano.io/api:WVrFdUAc/cassandra_leaves', // Base URL for your API
    headers: {
        'Content-Type': 'application/json',
        // Add any other default headers here, like Authorization if needed
    },
    timeout: 10000, // Optional: set timeout for requests
});

// Example of using an interceptor (if you need to handle request/response globally)
axiosInstance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Handle errors globally, like showing a message
        console.error('API error:', error);
        return Promise.reject(error);
    }
);

export default axiosInstance;
