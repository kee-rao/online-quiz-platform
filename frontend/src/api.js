import axios from 'axios';

// Base URL of your backend
const API = axios.create({ baseURL: 'http://localhost:5000/api' });

// Add a token to headers for protected routes (optional, for later use)
API.interceptors.request.use((req) => {
  if (localStorage.getItem('token')) {
    req.headers.Authorization = `Bearer ${localStorage.getItem('token')}`;
  }
  return req;
});

// API Endpoints
export const registerUser = (userData) => API.post('/auth/register', userData);
export const loginUser = (userData) => API.post('/auth/login', userData);
export const fetchDefaultQuizzes = () => API.get('/default-quizzes');