import axios from "axios";

const baseUrl = import.meta.env?.VITE_API_BASE_URL || "http://localhost:3000";

// Custom params serializer: arrays become repeated keys (group_ids=1&group_ids=2)
// instead of bracket notation (group_ids[]=1) which NestJS may reject.
function serializeParams(params) {
  const parts = [];
  for (const key in params) {
    const value = params[key];
    if (value === undefined || value === null) continue;
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== undefined && v !== null) {
          parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(v)}`);
        }
      });
    } else if (typeof value === "object") {
      // For objects like filter/sort, JSON-stringify them
      parts.push(
        `${encodeURIComponent(key)}=${encodeURIComponent(
          JSON.stringify(value)
        )}`
      );
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
    }
  }
  return parts.join("&");
}

const requestMaker = axios.create({
  baseURL: baseUrl,
  withCredentials: true,
  paramsSerializer: serializeParams,
});

// Helper to merge optional headers / config
const withConfig = (config = {}) => ({
  ...config,
  headers: {
    "Content-Type": "application/json",
    ...(config?.headers || {}),
  },
});

export const api = {
  get: (url, params, config) =>
    // console.log(
    //   "Making GET request to:",
    //   url,
    //   "with params:",
    //   params,
    //   "and config:",
    //   config
    // ) || // For debugging purposes
    requestMaker.get(url, { params, ...withConfig(config) }),

  post: (url, data, config) => requestMaker.post(url, data, withConfig(config)),

  // Form uploads: allow Axios to set multipart boundaries automatically.
  // Do NOT set Content-Type here.
  postForm: (url, formData, config) =>
    requestMaker.post(url, formData, {
      ...(config || {}),
      headers: {
        ...(config?.headers || {}),
      },
    }),

  put: (url, data, config) => requestMaker.put(url, data, withConfig(config)),

  patch: (url, data, config) =>
    requestMaker.patch(url, data, withConfig(config)),

  delete: (url, config) => requestMaker.delete(url, withConfig(config)),
};
