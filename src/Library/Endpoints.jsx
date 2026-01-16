// src/Library/endpoints.jsx

export const endpoints = {
  // Auth
  SIGN_IN: `/auth/signin`,
  SIGN_UP: `/auth/signup`,
  VALIDATE: `/auth/validate`,
  USER: `/users/me`,
  REVOKE: `/auth/revoke`,
  GROUPS: `/groups`,
  TEACHERS: `/users`,
  CREATE_USER: `/users/create`,
  UPDATE_USER: `/users/update`,
  STUDENTS_WITH_GROUPS: `/students?academic_year_id=1&include_group=1`,
  STUDENTS: `/students?academic_year_id=1&include_wallet=1&include_group=1`,
  CREATE_STUDENT: `/students`,
  ASSIGN_STUDENT_GROUP: `/students/assign-group`,
  GET_STUDENT_WITH_PAYMENTS: `/students?academic_year_id=1&include_invoices=1&include_group=1&include_billings=1&include_wallet=1&include_payments=1`,
  // Payments
  CREATE_PAYMENT: `/students/payments`,

  GET_BILLINGS: `/billings`,
  CREATE_INVOICE: `/students/invoices`,
  GET_SUBJECTS: `/subjects`,
  GET_STUDENTS_OF_A_CLASS: `/students?academic_year_id=1&include_group=1&filter=`,
  // Discounts
  DISCOUNTS: `/discounts`,

  // classes
  GET_CLASSES: `/groups?academic_year_id=1`,
  // Timetable
  TIMETABLE: `/timetable`,
  TIMETABLE_UPLOAD: `/timetable/upload`,
  TIMETABLE_MY_LESSONS: `/timetable/my-lessons`,

  //Dorm students
  GET_DORM_STUDENTS: `/students?academic_year_id=1&include_group=1&include_billings=1&filter={"billing_codes":["dorm/700"]}&sort=[{"field":"full_name"}]&include_wallet=1&include_invoices=1&include_payments=1`,
  ASSIGN_BILLING_CODE: `/students/assign-billings`,
  REMOVE_FROM_GROUP: `/students/remove-from-group`,

  //Subjects
  GET_DATA_FROM_TIMETABLE: `/timetable?academic_year_id=1`,

  // Scores and Points
  GET_LESSON_POINTS: `/students/points`,
  ACADEMIC_YEARS: `/academic-years`,
  SUBJECTS: `/subjects`,
  BILLING_CODES: `/billings`,

  //New payment endpoints
  GET_ALL_STUDENTS_FOR_PAYMENTS: `/students?academic_year_id=1&include_group=1&include_invoices=1&include_billings=1&include_wallet=1&include_payments=1&include_discounts=1&sort=[{"field":"last_payment_date", "order":"DESC"}]`,

  GET_DORM_STUDENTS_FOR_PAYMENTS: `/students?academic_year_id=1&include_group=1&include_invoices=1&include_billings=1&include_wallet=1&include_payments=1&filter={"billing_codes":["dorm/700"]}`,

  GET_ALL_STUDENTS_FOR_INVOICES: `/students?academic_year_id=1&include_group=1&include_billings=1&include_invoices=1`,

  GET_STUDENTS_TO_TEST: `/students?academic_year_id=1&include_group=1&include_billings=1&include_invoices=1&include_wallet=1&include_payments=1&include_discounts=1`,
};
