import { useState, useCallback, useMemo, useEffect, useRef, useLayoutEffect } from "react";
import EmployeeLayout from "../EmployeeLayout";
import { useUser, useProjects, useUpdateProject } from "../../Use-auth";
import ProjectList from "../../ui/ProjectList";
import TaskEmployees from "../../ui/TaskEmployees";
import TaskPriority from "../../ui/TaskPriority";
import { useDateRange } from "../DateRangeContext";
import { Calendar, Flag, CircleStop, Users, CircleDot, X, ClockFading, ChevronRight, CircleCheck } from "lucide-react";
import CommentsSection from "../../ui/CommentsSection ";
import TaskDetails from "../../ui/TaskDetails ";
import TaskTimeline from "../../ui/TaskTimeline ";

const getStatusColor = (status) => {
  const colors = [
    "bg-gray-600 text-white",
    "bg-blue-600 text-white",
    "bg-green-600 text-white",
    "bg-orange-600 text-white",
    "bg-purple-600 text-white",
    "bg-pink-600 text-white",
    "bg-teal-600 text-white",
    "bg-yellow-500 text-black",
    "bg-red-600 text-white",
  ];

  let hash = 0;
  for (let i = 0; i < status.length; i++) {
    hash = status.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

export default function EmployeeProject() {
  const { start, end } = useDateRange();
  const { data: user } = useUser();
  const { data: projects = [], refetch } = useProjects();
  const updateProject = useUpdateProject();
  const [collapsedStatuses, setCollapsedStatuses] = useState({});
  const [showDescriptionPopup, setShowDescriptionPopup] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [status, setStatus] = useState([]);
  const [projectStatuses, setProjectStatuses] = useState([]);
  const [editData, setEditData] = useState({
    title: "",
    description: [
      {
        storeLink: "",
        referenceLink: "",
        referenceLinkEnabled: false,
        figmaLink: "",
        figmaLinkDisabled: false,
        taskdescription: [],
        files: [],
      },
    ],
    priority: "",
    status: status,
    assignedEmployees: [],
    dueDate: null
  });
  const [showStatusDropdownFor, setShowStatusDropdownFor] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState({});
  const textareaRef = useRef(null);

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [editData.title]);

  // Close status dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (showStatusDropdownFor) {
        const dropdown = document.getElementById(`status-dropdown-${showStatusDropdownFor}`);
        if (dropdown && !dropdown.contains(event.target)) {
          setShowStatusDropdownFor(null);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showStatusDropdownFor]);

  useEffect(() => {
    if (!projects.length || !activeProjectId) {
      setStatus([]);
      return;
    }

    const activeProject = projects.find(
      (p) => p._id === activeProjectId
    );

    if (!activeProject?.statusTask) {
      setStatus([]);
      return;
    }

    setStatus(Object.keys(activeProject.statusTask));
  }, [projects, activeProjectId]);

  const handleOpenTask = (task) => {
    setCurrentTask(task);

    const data = {
      title: task.title || "",
      description: task.description || "",
      priority: task.priority || "",
      status: task.status || "",
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      assignedEmployees: task.assignedEmployees || [],
      comments: task.comments || [],
      timeline: task.timeline || []
    };
    setEditData(data);
    setShowDescriptionPopup(true);
  };

  const localProjects = useMemo(() => projects || [], [projects]);

  const handleBulkStatusUpdate = useCallback(
    (newStatus, singleTask = null) => {
      const currentUserName = user?.fullName || "Unknown";

      const selectedTaskObjects = singleTask
        ? [singleTask]
        : Object.values(selectedTasks)
          .flat()
          .map((id) => {
            for (const project of localProjects) {
              const task = Object.values(project.statusTask || {})
                .flat()
                .find((t) => t._id === id);
              if (task) return { ...task, projectId: project._id };
            }
            return null;
          })
          .filter(Boolean);

      const uniqueTasks = Array.from(
        new Map(selectedTaskObjects.map((t) => [t._id, t])).values()
      );

      uniqueTasks.forEach((task) => {
        const project = localProjects.find((p) => p._id === task.projectId);
        if (!project) return;

        const latestTask = Object.values(project.statusTask || {})
          .flat()
          .find((t) => t._id === task._id);

        if (!latestTask) return;

        const updatedComments = Array.isArray(latestTask.comments)
          ? [...latestTask.comments]
          : [];

        if (latestTask.status !== newStatus) {
          const commentText = `${currentUserName} changed status from ${latestTask.status} to ${newStatus}`;

          const isDuplicate = updatedComments.some((c) => c.text === commentText);
          if (!isDuplicate) {
            updatedComments.push({
              text: commentText,
              createdBy: currentUserName,
              createdAt: new Date(),
            });
          }
        }

        updateProject.mutate(
          {
            id: task.projectId,
            taskId: task._id,
            status: newStatus,
            comments: updatedComments,
          },
          {
            onSuccess: () => console.log("Task updated:", task._id),
            onError: (err) => console.error("Error updating task:", task._id, err),
          }
        );
      });

      setSelectedTasks({});
      refetch();
    },
    [selectedTasks, user, updateProject, refetch, localProjects]
  );

  const handleTimelineUpdate = useCallback(
    async (task, type) => {
      if (!user?.userId) return;

      const running = task.timeline?.find(
        (t) => t.employeeId === user.userId && !t.endTime
      );

      try {
        let timelineUpdate = {};
        let commentText = "";

        if (type === "start" && !running) {
          timelineUpdate = {
            employeeId: user.userId,
            startTime: new Date(),
          };
          commentText = `${user.fullName} started working on the task`;
        } else if (type === "stop" && running) {
          timelineUpdate = {
            employeeId: user.userId,
            endTime: new Date(),
          };
          commentText = `${user.fullName} stopped working on the task`;
        }

        if (!timelineUpdate.employeeId) return;

        const updatedComments = Array.isArray(task.comments)
          ? [...task.comments]
          : [];

        if (!updatedComments.some((c) => c.text === commentText)) {
          updatedComments.push({
            text: commentText,
            createdBy: user.fullName,
            createdAt: new Date(),
          });
        }

        await updateProject.mutateAsync({
          id: task.projectId,
          taskId: task._id,
          status: task.status,
          timelineUpdate,
          comments: updatedComments,
        });

        refetch();
      } catch (err) {
        console.error("Timeline update failed:", err);
      }
    },
    [user, updateProject, refetch]
  );

  const renderTasks = useCallback(
    (status) => {
      let allTasks = [];
      localProjects.forEach((project) => {
        if (new Date(project.createdAt) >= start && new Date(project.createdAt) <= end) {
          const tasks = project.statusTask?.[status] || [];
          tasks.forEach((task) => {
            allTasks.push({
              ...task,
              projectId: project._id,
              projectName: project.projectName,
              status,
            });
          });
        }
      });

      if (activeProjectId) {
        allTasks = allTasks.filter((t) => t.projectId === activeProjectId);
      }

      if (!allTasks.length) return null;

      return (
        <div className="space-y-2">
          <div className="flex px-3 py-2 mt-[10px] rounded-md font-medium text-gray-500 text-[14px]">
            <div className="w-2/5">Name</div>
            <div className="w-1/5">Assigned</div>
            <div className="w-1/5">Due Date</div>
            <div className="w-1/5">Priority</div>
            <div className="w-1/5">Status</div>
            <div className="w-1/5">Track time</div>
          </div>

          {allTasks.map((task) => (
            <div
              key={task._id}
              className="flex items-center justify-between text-[14px] bg-white px-3 py-2 rounded-md shadow-sm hover:bg-gray-50 cursor-pointer mb-2"
            >
              <div className="flex items-center justify-center rounded-full bg-[#299764] text-white mr-[10px]">
                <CircleCheck size={16} />
              </div>
              <div
                className="w-2/5 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] text-gray-800 hover:text-blue-700 hover:underline"
                title={task.title}
                onClick={() => handleOpenTask(task)}
              >
                {task.title || "-"}
              </div>

              <div className="w-1/5">
                <TaskEmployees
                  selected={task.assignedEmployees?.map((e) => e._id) || []}
                  employees={task.assignedEmployees || []}
                  showDropdown={false}
                  onChange={() => { }}
                />
              </div>

              <div className="w-1/5 text-[14px] text-gray-600">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
              </div>
              <div className="w-1/5">
                <TaskPriority value={task.priority} showclear={false} />
              </div>

              <div className="w-1/5 relative">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (task.status !== "completed") {
                      setShowStatusDropdownFor((prev) => (prev === task._id ? null : task._id));
                    }
                  }}
                  className="inline-block"
                >
                  {task.status || "-"}
                </div>
                {showStatusDropdownFor === task._id && (
                  <div
                    id={`status-dropdown-${task._id}`}
                    className="absolute left-0 mt-2 bg-white border rounded shadow p-2 z-50 min-w-[120px]"
                  >
                    {projectStatuses.map((s) => {
                      const isActive = s === task.status;
                      return (
                        <div
                          key={s}
                          onClick={() => {
                            handleBulkStatusUpdate(s, task);
                            setShowStatusDropdownFor(null);
                          }}
                          className={`cursor-pointer font-normal text-sm px-2 py-1 rounded mt-2 ${getStatusColor(s)} ${isActive ? "ring-2 ring-offset-1 ring-blue-400" : ""
                            }`}
                        >
                          {s}
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
              <div className="w-1/5 flex">
                <div className="inline-flex gap-[10px] items-center">
                  <TaskTimeline task={task} user={user} handleTimelineUpdate={handleTimelineUpdate} showControls={true}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    },
    [localProjects, start, end, activeProjectId, status, showStatusDropdownFor, handleBulkStatusUpdate]
  );

  const toggleStatus = (status) => {
    setCollapsedStatuses((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  const renderSection = (status) => {
    const tasks = localProjects
      .find(p => p._id === activeProjectId)
      ?.statusTask?.[status] || [];

    if (!tasks.length) return null;

    return (
      <div className="mt-[30px]">
        <div className="flex items-center gap-2">
          <ChevronRight
            size={18}
            color="grey"
            className={`cursor-pointer transition-transform duration-200 ${collapsedStatuses[status] ? "" : "rotate-90"
              }`}
            onClick={() => toggleStatus(status)}
          />
          <h2
            className={`cursor-pointer font-normal inline-block text-sm px-2 py-1 rounded ${getStatusColor(status)}`}
          >
            {status.toUpperCase()}
          </h2>
        </div>
        {!collapsedStatuses[status] && renderTasks(status)}
      </div>
    );
  };


  useEffect(() => {
    if (!activeProjectId || !projects.length) {
      setProjectStatuses([]);
      return;
    }

    const activeProject = projects.find(
      (p) => p._id?.toString() === activeProjectId?.toString()
    );

    if (!activeProject?.statusTask) {
      setProjectStatuses([]);
      return;
    }

    const statuses = Object.keys(activeProject.statusTask);
    setProjectStatuses(statuses);
  }, [projects, activeProjectId]);

  return (
    <EmployeeLayout>
      <div className="relative h-[90.7vh]">
        <div className="absolute w-full h-[100%] opacity-[0.1] bg-[url('https://www.hubsyntax.com/uploads/prodcutpages.webp')] bg-cover bg-center rounded-xl shadow-md border border-gray-200"></div>
        <div className="relative z-20 h-full overflow-y-auto p-6">
          <ProjectList
            projects={projects}
            activeProjectId={activeProjectId}
            setActiveProjectId={setActiveProjectId}
            currentUser={user}
          />

          {activeProjectId &&
            projectStatuses.map((s) => (
              <div key={s}>{renderSection(s)}</div>
            ))}
          {showDescriptionPopup && currentTask && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded p-6 w-[90%] h-[90vh] shadow-lg relative overflow-y-auto max-w-[90%]">
                <div className="w-full mx-auto flex justify-between h-[100%] border border-gray-300">
                  <div className="w-[70%] border-r border-gray-400 p-[40px] overflow-auto scrollbar-hide">
                    <h2 className="mb-4 text-gray-500 font-light inline-flex gap-[5px] items-center justify-center text-[16px] p-[5px] w-[80px] border border-gray-300 rounded-md">
                      <CircleDot size={12} /> Task
                    </h2>
                    <textarea
                      ref={textareaRef}
                      className="w-full rounded px-2 py-1 mb-4 text-[25px] border-gray-400 outline-none focus:ring-1 focus:ring-gray-200 resize-none overflow-hidden"
                      value={editData.title}
                      rows={1}
                      placeholder="Enter text..."
                    />

                    {/* Task metadata */}
                    <div className="text-[14px]">
                      <div className="flex items-center gap-[50px] mb-4">
                        <span className="flex items-center gap-[5px] min-w-[150px]">
                          <CircleStop size={16} />
                          <span className="font-medium text-gray-700">Status</span>
                        </span>
                        <span className={`px-2 py-1 rounded text-sm font-semibold uppercase ${getStatusColor(editData.status || "")}`}>
                          {editData.status || "-"}
                        </span>
                      </div>

                      <div className="flex items-center gap-[50px] mb-4">
                        <span className="flex items-center gap-[5px] min-w-[150px]">
                          <Calendar size={16} />
                          <span className="font-medium text-gray-700">Dates</span>
                        </span>
                        <div className="relative date-filter">
                          <div className="w-full border rounded px-2 py-1 cursor-pointer hover:bg-gray-50">
                            {editData.dueDate ? new Date(editData.dueDate).toLocaleDateString() : "Select due date"}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-[50px] mb-4">
                        <span className="flex items-center gap-[5px] min-w-[150px]">
                          <Flag size={16} />
                          <span className="font-medium text-gray-700">Priority</span>
                        </span>
                        <div className="relative">
                          <TaskPriority value={editData.priority} onChange={({})} showclear={false} />
                        </div>
                      </div>

                      <div className="flex items-center gap-[50px] mb-4">
                        <span className="flex items-center gap-[5px] min-w-[150px]">
                          <Users size={16} />
                          <span className="font-medium text-gray-700">Assigned</span>
                        </span>
                        <div className="relative flex items-center gap-[10px]">
                          <TaskEmployees
                            selected={editData.assignedEmployees?.map((e) => e._id) || []}
                            employees={editData.assignedEmployees || []}
                            showDropdown={false}
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-[50px] mb-4">
                        <span className="flex items-center gap-[5px] min-w-[150px]">
                          <ClockFading size={16} />
                          <span className="font-medium text-gray-700">Track time</span>
                        </span>
                        <div className="relative flex items-center gap-[10px]">
                          <TaskTimeline
                            task={currentTask}
                            user={user}
                            handleTimelineUpdate={handleTimelineUpdate}
                            showControls={false}
                          />
                        </div>
                      </div>

                    </div>

                    <div className="w-full mx-auto mt-10">
                      <TaskDetails editData={editData} setEditData={setEditData} user={user} />
                    </div>

                    <button onClick={() => setShowDescriptionPopup(false)} className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold transition-colors">
                      <X size={18} />
                    </button>
                  </div>

                  <div className="w-[30%]">
                    <div className="p-[20px] border-b border-gray-400 text-sm font-medium">Activity</div>
                    <div className="p-[20px] text-[12px] bg-[#f9f9f9]">
                      <CommentsSection comments={editData.comments || []} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}
