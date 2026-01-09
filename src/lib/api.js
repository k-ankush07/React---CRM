const BASE_URL = "http://localhost:5000";

export const api = {
  auth: {
    me: {
      path: `${BASE_URL}/api/user`,
      responses: {
        200: { parse: (data) => data },
      },
    },
    login: {
      path: `${BASE_URL}/api/login`,
      method: "POST",
      responses: {
        200: { parse: (data) => data },
      },
    },
    logout: {
      path: `${BASE_URL}/api/logout`,
      method: "POST",
    },
    userDetails: {
      path: `${BASE_URL}/api/user-details`,
      responses: {
        200: { parse: (data) => data },
      },
    },
    employees: {
      path: `${BASE_URL}/api/employees`,
    },
    totalStaff: {
      path: `${BASE_URL}/api/total-staff`,
    },
    projects: {
      create: {
        path: `${BASE_URL}/api/projects`,
        method: "POST",
      },
      update: {
        path: (id) => `${BASE_URL}/api/projects/${id}`,
        method: "PUT",
      },
      delete: {
        path: (id) => `${BASE_URL}/api/projects/${id}`,
        method: "DELETE",
      },
    },
    getprojects: {
      path: `${BASE_URL}/api/get-projects`,
      responses: {
        200: { parse: (data) => data },
      },
    },
    forgotPassword: {
      path: `${BASE_URL}/api/forgot-password`,
      method: "POST",
    },

    resetPassword: {
      path: (token) => `${BASE_URL}/api/reset-password/${token}`,
      method: "POST",
    },
    createUser: {
      path: `${BASE_URL}/api/create-user`,
      method: "POST",
    },
    holiday: {
      path: `${BASE_URL}/api/holiday`,
      method: "POST",
    },
  },
};
