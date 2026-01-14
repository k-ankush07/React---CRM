import { useDateRange } from "../Pages/DateRangeContext";

const ProjectList = ({ projects = [], activeProjectId, setActiveProjectId, currentUser }) => {
  const { start, end } = useDateRange();

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

  return (
    <div className="flex gap-3 flex-wrap">
      {filteredProjects.map((project) => (
        <div
          key={project._id}
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
      )
      )}
    </div>
  );
};

export default ProjectList;