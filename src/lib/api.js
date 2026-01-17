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
      renameStatus: {
        path: (id) => `${BASE_URL}/api/projects/${id}/rename-status`,
        method: "PUT",
      },
      dragDrop: {
        path: (id) => `${BASE_URL}/api/projects/${id}/task-order`,
        method: "PUT",
      },
      addStatus: {
        path: `${BASE_URL}/api/project/add-status`,
        method: "POST",
      },
      deleteStatus: {
        path: `${BASE_URL}/api/project/delete-status`,
        method: "DELETE",
      },
      projectName: {
        path: (id) => `${BASE_URL}/api/projectName/${id}`,
        method: "PUT",
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
    deleteUser: {
      path: (id) => `${BASE_URL}/api/delete-user/${id}`,
      method: "DELETE",
    },
    editUser: {
      path: (id) => `${BASE_URL}/api/edit-user/${id}`,
      method: "PUT",
    },
    holiday: {
      create: { path: `${BASE_URL}/api/holiday`, method: "POST" },
      list: { path: `${BASE_URL}/api/get/holiday`, method: "GET" },
      update: (id) => ({
        path: `${BASE_URL}/api/holiday/${id}`,
        method: "PUT",
      }),
      delete: (id) => ({
        path: `${BASE_URL}/api/holiday/${id}`,
        method: "DELETE",
      }),
    },
    contracts: {
      create: {
        path: `${BASE_URL}/api/contracts`,
        method: "POST",
      },
      list: { path: `${BASE_URL}/api/contracts`, method: "GET" },
      update: {
        path: (id) => `${BASE_URL}/api/contracts/${id}`,
        method: "PUT",
      },
      delete: {
        path: (id) => `${BASE_URL}/api/contracts/${id}`,
        method: "DELETE",
      },
    },
    upload: {
      path: `${BASE_URL}/api/upload`,
      method: "POST",
    },
    permissions: {
      create: {
        path: `${BASE_URL}/api/permission`,
        method: "POST",
      },
      getByAdmin: {
        path: `${BASE_URL}/api/permission`,
        method: "GET",
      },
      update: {
        path: (id) => `${BASE_URL}/api/permission/${id}`,
        method: "PUT",
      },
    },
  },
};
