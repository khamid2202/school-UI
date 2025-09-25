import axios from "axios";
axios.defaults.withCredentials = true;

export const makeGetRequest = async (url, options = {}) => {
  try {
    const response = await axios.get(url, {
      withCredentials: true,
      ...options,
    });
    return response.data;
  } catch (error) {
    console.error("Get Request Error", error);
    return { error: error.message };
  }
};

export const makeGetRequest2 = async (url) => {
  try {
    const response = await fetch(url, {
      method: "GET",
      mode: "cors",
      credentials: "include",
    });
    return response;
  } catch (error) {
    console.log("Get Request Error", error);
    return { error };
  }
};

export const makePostRequest = async (url, payload) => {
  try {
    const response = await axios.post(url, payload, {
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true, // <-- IMPORTANT for cookie auth
    });
    return response.data || null;
  } catch (error) {
    console.log("Post Request Error", error);
    return { error: error.message };
  }
};

export const makePatchRequest = async (url, data) => {
  try {
    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
      mode: "cors",
      credentials: "include",
    });
    const responseData = await response.json();
    if (!response.ok) {
      return { error: responseData, status: response.status };
    }
    return responseData;
  } catch (error) {
    console.log("Patch Request Error", error);
    return { error };
  }
};

export const makePutRequest = async (url, data, token) => {
  try {
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
      mode: "cors",
      credentials: "include",
    });
    return response;
  } catch (error) {
    console.log("Put Request Error", error);
    return { error };
  }
};

export const makeDeleteRequest = async (url, data) => {
  try {
    const response = await axios.delete(url, {
      data,
      headers: {
        "Content-Type": "application/json",
      },
    });
    const responseData = response.data || null;
    return responseData;
  } catch (error) {
    console.log("Delete Request Error", error);
    return { error };
  }
};
