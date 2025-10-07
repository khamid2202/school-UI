import { api } from "./RequestMaker.jsx";
import { endpoints } from "./Endpoints";

export const login = async ({ username, password, onSuccess, onFail }) => {
  try {
    const result = await api.post(endpoints.SIGN_IN, {
      username,
      password,
    });
    console.log("Login successfull", result);
    if (result.error) {
      console.log("Login error:", result.error);
      onFail(result.error);
    } else {
      onSuccess();
    }
  } catch (error) {
    console.log("Login error:", error);
    onFail(error?.response?.data?.message || error?.message || "Login failed");
  }
};

export const authToken = async ({ onSuccess, onFail }) => {
  try {
    const res = await api.get(endpoints.VALIDATE);
    if (res.data?.ok) {
      onSuccess();
    } else {
      onFail();
    }
  } catch (err) {
    onFail();
  }
};

export const sendLogoutRequest = async ({ onSuccess, onFail }) => {
  try {
    const res = await api.post(endpoints.REVOKE, {}, { withCredentials: true });
    if (res.data?.ok) {
      onSuccess();
    } else {
      onFail(res.error || "Logout failed");
    }
  } catch (err) {
    onFail(err?.response?.data?.message || err?.message || "Logout failed");
  }
};
