// src/services/api.js
// Basic API utility for frontend
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export default api;
