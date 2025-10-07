import axios from "axios";

const baseUrl = import.meta.env?.VITE_API_BASE_URL || "http://localhost:3000";

const requestMaker = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
});

// Helper to merge optional headers / config
const withConfig = (config = {}) => ({
  ...config,
  headers: {
    "Content-Type": "application/json",
    ...(config.headers || {}),
  },
});

export const api = {
  get: (url, params, config) =>
    requestMaker.get(url, { params, ...withConfig(config) }),

  post: (url, data, config) => requestMaker.post(url, data, withConfig(config)),

  put: (url, data, config) => requestMaker.put(url, data, withConfig(config)),

  patch: (url, data, config) =>
    requestMaker.patch(url, data, withConfig(config)),

  delete: (url, config) => requestMaker.delete(url, withConfig(config)),
};
