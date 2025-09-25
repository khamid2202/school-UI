import { makePostRequest, makeGetRequest } from "./RequestMaker.jsx";
import { endpoints } from "./Endpoints";

//fetch the user from the backend and store it in local storage
export const fetchUser = async () => {
  const result = await makeGetRequest(endpoints.USER);
  if (result.error) {
    console.log("Error fetching user:", result.error);
    return null;
  } else {
    localStorage.setItem("userr", JSON.stringify(result));
    return result;
  }
};

export const login = async ({ username, password, onSuccess, onFail }) => {
  const result = await makePostRequest(endpoints.SIGN_IN, {
    username,
    password,
  });
  if (result.error) {
    onFail(result.error);
  } else {
    onSuccess();
    fetchUser();
    console.log("Login successful");
  }
};

export const authToken = async ({ onSuccess, onFail, onConnectionError }) => {
  try {
    const result = await makeGetRequest(endpoints.VALIDATE);
    if (result.ok) {
      const { user } = result;
      onSuccess();
    } else {
      onFail();
    }
  } catch (error) {
    onConnectionError();
  }
};
