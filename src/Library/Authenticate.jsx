import { makePostRequest, makeGetRequest } from "./RequestMaker.jsx";
import { endpoints } from "./Endpoints";

const setUser = (user) => localStorage.setItem("user", JSON.stringify(user));
export const getUser = () => JSON.parse(localStorage.getItem("user"));

export const login = async ({ username, password, onSuccess, onFail }) => {
  const result = await makePostRequest(endpoints.auth.login, {
    username,
    password,
  });
  if (result.error) {
    onFail(result.error);
  } else {
    setUser(result.user);
    onSuccess();
  }
};

export const authToken = async ({ onSuccess, onFail, onConnectionError }) => {
  try {
    const result = await makeGetRequest(endpoints.auth.token);
    if (result.ok) {
      const { user } = result;
      setUser(user);
      onSuccess();
    } else {
      onFail();
    }
  } catch (error) {
    onConnectionError();
  }
};
