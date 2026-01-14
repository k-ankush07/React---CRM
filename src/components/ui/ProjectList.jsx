import { useState } from "react";
import { Trash, Pencil, X } from "lucide-react";
import { useDateRange } from "../Pages/DateRangeContext";
import { useUpdateProjectName, useDeleteProject } from "../Use-auth";
import { Input } from "./Input";

const ProjectList = ({ projects = [], activeProjectId, setActiveProjectId, currentUser }) => {
  const { start, end } = useDateRange();
  const [editingProject, setEditingProject] = useState(null); 
  const [newProjectName, setNewProjectName] = useState("");

  const updateProjectNameMutation = useUpdateProjectName();
  const deleteProjectMutation = useDeleteProject();

  if (!currentUser) return null;
  const isEmployee = currentUser.role === "employee";

  const filteredProjects = projects
    .filter((p) => {
      const createdAt = new Date(p.createdAt);
      return createdAt >= start && createdAt <= end;
    })
    .filter((project) => {
      if (!isEmployee) return true;
      const allTasks = Object.values(project.statusTask || {}).flat();
      return allTasks.some((task) =>
        task.assignedEmployees?.some(
          (emp) => emp.username === currentUser.fullName
        )
      );
    });

  const handleRenameClick = (project) => {
    setEditingProject(project);
    setNewProjectName(project.projectName || "");
  };

  const handleRenameSubmit = () => {
    if (!newProjectName.trim() || !editingProject) return;

    updateProjectNameMutation.mutate({
      projectId: editingProject._id,
      projectName: newProjectName,
    });

    setEditingProject(null);
  };

  const handleDelete = (projectId) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      deleteProjectMutation.mutate({ projectId });
    }
  };

  return (
    <div className="flex gap-3 flex-wrap">
      {filteredProjects.map((project) => (
        <div key={project._id} className="relative">
          <div className="absolute top-1 right-1 flex gap-1">
            <Trash
              size={16}
              className="cursor-pointer text-red-500 hover:text-red-700"
              onClick={() => handleDelete(project._id)}
            />
            <Pencil
              size={16}
              className="cursor-pointer text-blue-500 hover:text-blue-700"
              onClick={() => handleRenameClick(project)}
            />
          </div>

          <div
            className={`px-10 py-10 rounded cursor-pointer inline-block w-[200px] min-w-[190px] shadow-md transition-all hover:shadow-lg
              ${activeProjectId === project._id
                ? "bg-gray-200 ring-2 text-[#61a3c9]"
                : "bg-gray-100 hover:bg-gray-200"
              }`}
            onClick={() => setActiveProjectId(project._id)}
            role="button"
            tabIndex={0}
          >
            {project.projectName || "-"}
          </div>
        </div>
      ))}

      {editingProject && (
       <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-[20%] text-[14px] relative">
            <h2 className="text-lg font-semibold mb-4">Rename Project</h2>
            <Input
              type="text"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              className="w-full px-2 py-1 rounded border border-gray-400"
            />
            <div className="mt-4 flex justify-end gap-2">
              <div
                className="text-gray-500 underline text-sm cursor-pointer hover:text-gray-700 absolute top-[3px] right-[3px]"
                onClick={() => setEditingProject(null)}
              >
                <X />
              </div>
              <div
                className="flex items-center px-3 py-1 bg-green-600 text-white rounded cursor-pointer hover:bg-green-700 transition-colors"
                onClick={handleRenameSubmit}
              >
                Save
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectList;
