import axios from "axios";
axios.defaults.withCredentials = true;

const api = axios.create({
  baseURL: "http://localhost:5000", // put your backend base URL
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auto-attach token if using JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ✅ GET
export const makeGetRequest = async (url) => {
  try {
    const { data } = await api.get(url);
    return data;
  } catch (error) {
    console.error("Get Request Error", error);
    return { error };
  }
};

// ✅ POST
export const makePostRequest = async (url, payload) => {
  try {
    const { data } = await api.post(url, payload);
    return data;
  } catch (error) {
    console.error("Post Request Error", error);
    return { error };
  }
};

// (Same pattern for PUT, PATCH, DELETE…)
