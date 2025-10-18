// src/Library/endpoints.jsx

import Teachers from "../Pages/admin/Teachers/Teachers";

export const endpoints = {
  // Auth
  SIGN_IN: `/auth/signin`,
  SIGN_UP: `/auth/signup`,
  VALIDATE: `/auth/validate`,
  USER: `/users/me`,
  REVOKE: `/auth/revoke`,
  GROUPS: `/groups?academic_year=2025-2026`,
  TEACHERS: `/users`,
  STUDENTS: `/students`,
  CREATE_STUDENT: `/students`,
  ASSIGN_STUDENT_GROUP: `/students/assign-group`,
  GET_STUDENT_WITH_PAYMENTS: `/students?academic_year=2025-2026&include_payments=1&include_group=1&include_billings=1&include_wallet=1`,
};
