import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useLocation } from "wouter"
import { api } from "../lib/api";
const BASE_URL = "http://localhost:5000";

export function useUser() {
  return useQuery({
    queryKey: [api.auth.me.path],
    queryFn: async () => {
      const res = await fetch(api.auth.me.path, {
        credentials: "include",
      })

      if (res.status === 401) return null
      if (!res.ok) throw new Error("Failed to fetch user")

      return api.auth.me.responses[200].parse(await res.json())
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  const [, setLocation] = useLocation()

  return useMutation({
    mutationFn: async (credentials) => {
      const res = await fetch(api.auth.login.path, {
        method: api.auth.login.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
        credentials: "include",
      })

      if (!res.ok) {
        if (res.status === 401) {
          throw new Error("Invalid username or password")
        }
        throw new Error("Login failed")
      }

      return api.auth.login.responses[200].parse(await res.json())
    },
    onSuccess: (user) => {
      queryClient.setQueryData([api.auth.me.path], user)

      if (user.role === "admin") setLocation("/admin")
      else if (user.role === "management") setLocation("/management")
      else setLocation("/dashboard")
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const [, setLocation] = useLocation()

  return useMutation({
    mutationFn: async () => {
      await fetch(api.auth.logout.path, {
        method: api.auth.logout.method,
        credentials: "include",
      })
    },
    onSuccess: () => {
      queryClient.setQueryData([api.auth.me.path], null)
      queryClient.clear()
      setLocation("/login")
    },
  })
}

export function useUserDetails() {
  return useQuery({
    queryKey: [api.auth.userDetails.path],
    queryFn: async () => {
      const res = await fetch(api.auth.userDetails.path, {
        credentials: "include",
      });

      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch user details");

      return api.auth.userDetails.responses[200].parse(await res.json());
    },
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}

export function useEmployees() {
  return useQuery({
    queryKey: ["employees"],
    queryFn: async () => {
      const res = await fetch(api.auth.employees.path, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch employees");
      return res.json();
    },
  });
}

export function useTotalStaff() {
  return useQuery({
    queryKey: ["total-staff"],
    queryFn: async () => {
      const res = await fetch(api.auth.totalStaff.path, {
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to fetch total staff");
      return res.json();
    },
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(api.auth.projects.create.path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create project");
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(["projects"]);
    },
    onError: (err) => {
      console.error("Error creating project:", err);
    },
  });
}

export function useProjects(status) {
  return useQuery({
    queryKey: ["projects", status],
    queryFn: async () => {
      const url = status ? `${api.auth.getprojects.path}?status=${status}` : api.auth.getprojects.path;
      const res = await fetch(url, { credentials: "include" });

      if (res.status === 401) return null;
      if (!res.ok) throw new Error("Failed to fetch projects");

      return api.auth.getprojects.responses[200].parse(await res.json());
    },
    staleTime: 0,
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...body }) => {
      const res = await fetch(api.auth.projects.update.path(id), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update project");
      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries(["projects"]);
    },
  });
}

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (email) => {
      const res = await fetch(api.auth.forgotPassword.path, {
        method: api.auth.forgotPassword.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      return data;
    },
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: async ({ token, password }) => {
      const res = await fetch(api.auth.resetPassword.path(token), {
        method: api.auth.resetPassword.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (!res.ok) {
        console.error("Reset password error:", data);
        throw new Error(data.message || "Failed to reset password");
      }
      return data;
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData) => {
      const res = await fetch(api.auth.createUser.path, {
        method: api.auth.createUser.method,
        credentials: "include",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to create user");
      }

      return data;
    },

    onSuccess: () => {
      queryClient.invalidateQueries(["employees"]);
    },
  });
}

export function useHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const res = await fetch(api.auth.holiday.path, {
        method: api.auth.holiday.method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create holiday");
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(["holidays"]),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, taskId }) => {
      const res = await fetch(`${BASE_URL}/api/projects/${projectId}/tasks/${taskId}`, {
        method: "DELETE",
        credentials: "include",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Failed to delete task");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["projects"]);
    },
    onError: (err) => {
      console.error("Error deleting task:", err);
    },
  });
}
