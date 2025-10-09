// src/Library/endpoints.jsx

import Teachers from "../Pages/admin/Teachers/Teachers";

export const endpoints = {
  // Auth
  SIGN_IN: `/auth/signin`,
  SIGN_UP: `/auth/signup`,
  VALIDATE: `/auth/validate`,
  USER: `/users/me`,
  REVOKE: `/auth/revoke`,
  GROUPS: `/groups?academic_year=2024-2025`,
  TEACHERS: `/users`,
};
