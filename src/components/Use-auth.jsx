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
      const res = await fetch(api.auth.holiday.create.path, {
        method: api.auth.holiday.create.method,
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

export function useTotalHolidays() {
  return useQuery({
    queryKey: ["holidays"],
    queryFn: async () => {
      const res = await fetch(api.auth.holiday.list.path, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch holidays");
      return res.json();
    },
  });
}

export function useUpdateHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }) => {
      const res = await fetch(api.auth.holiday.update(id).path, {
        method: api.auth.holiday.update(id).method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update holiday");
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(["holidays"]),
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await fetch(api.auth.holiday.delete(id).path, {
        method: api.auth.holiday.delete(id).method,
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to delete holiday");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["holidays"]);
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, taskId }) => {
      const res = await fetch(
        `${api.auth.projects.update.path(projectId)}/tasks/${taskId}`, 
        {
          method: "DELETE",
          credentials: "include",
        }
      );

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

export function useCreateContracts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await fetch(api.auth.contracts.create.path, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to create contract");
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(["contracts"]),
  });
}

export function useTotalContracts() {
  return useQuery({
    queryKey: ["contracts"],
    queryFn: async () => {
      const res = await fetch(api.auth.contracts.list.path, {
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to fetch contracts");
      return res.json();
    },
  });
}

export function useUpdateContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contractData) => {
      const { id, ...payload } = contractData;
      const res = await fetch(api.auth.contracts.update.path(id), {
        method: api.auth.contracts.update.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update contract");
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(["contracts"]),
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await fetch(api.auth.contracts.delete.path(id), {
        method: api.auth.contracts.delete.method,
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete contract");
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(["contracts"]),
  });
}

export function useUpload() {
  const mutation = useMutation({
    mutationFn: async (file) => {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(api.auth.upload.path, {
        method: api.auth.upload.method,
        body: formData,
      });

      if (!res.ok) {
        throw new Error("File upload failed");
      }

      const data = await res.json();
      return data;
    },
  });

  return mutation;
}

export function useRenameProjectStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, oldStatus, newStatus }) => {
      const res = await fetch(api.auth.projects.renameStatus.path(id), {
        method: api.auth.projects.renameStatus.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ oldStatus, newStatus }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Failed to rename status");
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["projects"]);
    },
  });
}

export function useDragDropTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, status, taskOrder }) => {
      const res = await fetch(api.auth.projects.dragDrop.path(projectId), {
        method: api.auth.projects.dragDrop.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status, taskOrder }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update task order");
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(["projects"]),
  });
}

export const useAddProjectStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, status }) => {
      const res = await fetch(api.auth.projects.addStatus.path, {
        method: api.auth.projects.addStatus.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ projectId, status }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add status");
      }

      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries(["projects"]),
  });
};

export function useDeleteStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, status }) => {
      const res = await fetch(api.auth.projects.deleteStatus.path, {
        method: api.auth.projects.deleteStatus.method, 
        headers: {
          "Content-Type": "application/json", 
        },
        credentials: "include",
        body: JSON.stringify({ projectId, status }), 
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete status");
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(["projects"]), 
  });
}

export function useUpdateProjectName() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId, projectName }) => {
      const res = await fetch(api.auth.projects.projectName.path(projectId), {
        method: api.auth.projects.projectName.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ projectName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update project name");
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries(["projects"]),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ projectId }) => {
      const res = await fetch(api.auth.projects.delete.path(projectId), {
        method: api.auth.projects.delete.method,
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete project");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["projects"]);
    },
  });
}