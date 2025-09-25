// src/Library/endpoints.jsx

const BASE_URL = "https://onedevapi.langapex.uz";

export const endpoints = {
  // Auth
  SIGN_IN: `${BASE_URL}/auth/signin`,
  SIGN_UP: `${BASE_URL}/auth/signup`,
  VALIDATE: `${BASE_URL}/auth/validate`,
  USER: `${BASE_URL}/users/me`,
};
