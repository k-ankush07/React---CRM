import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import EmployeeLayout from "../EmployeeLayout";
import { useUser, useProjects, useUpdateProject } from "../../Use-auth";
import ProjectList from "../../ui/ProjectList";
import TaskEmployees from "../../ui/TaskEmployees";
import TaskPriority from "../../ui/TaskPriority";
import { useDateRange } from "../DateRangeContext";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import {
  Calendar, Flag, CircleStop, Users, GripVertical, X,
} from "lucide-react";
import { CSS } from "@dnd-kit/utilities";
import CommentsSection from "../../ui/CommentsSection ";

export default function EmployeeProject() {
  const { start, end } = useDateRange();
  const { data: user } = useUser();
  const { data: projects = [], refetch } = useProjects();
  const updateProject = useUpdateProject();
  const [showDescriptionPopup, setShowDescriptionPopup] = useState(false);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [currentTask, setCurrentTask] = useState(null);
  const [editData, setEditData] = useState({
    title: "",
    description: "",
    priority: "",
    dueDate: null,
    assignedEmployees: [],
  });
  const [statuses, setStatuses] = useState([]);
  const [status, setStatus] = useState([]);
  const [taskOrder, setTaskOrder] = useState(() => {
    const stored = localStorage.getItem("taskOrder");
    return stored
      ? JSON.parse(stored)
      : { upcoming: [], progress: [], completed: [] };
  });
  const [showStatusDropdownFor, setShowStatusDropdownFor] = useState(null);
  const [selectedTasks, setSelectedTasks] = useState({});

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
    const activeProject = projects.find((p) => p._id === activeProjectId);
    if (!activeProject) {
      setStatus([]);
      return;
    }

    const activeStatuses = Object.keys(activeProject.statusTask || {});

    setStatus(activeStatuses);
  }, [projects, activeProjectId]);

  // Configure drag sensors for smooth drag interaction
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Open task details popup with all task information
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
    };

    setEditData(data);
    setShowDescriptionPopup(true);
  };

  const localProjects = useMemo(() => projects || [], [projects]);

const handleBulkStatusUpdate = useCallback(
  (newStatus, singleTask = null) => {
    const currentUserName = user?.fullName || "Unknown";

    // Gather tasks to update
    const selectedTaskObjects = singleTask
      ? [singleTask]
      : Object.values(selectedTasks)
          .flat()
          .map(id => {
            for (const project of localProjects) {
              const task = Object.values(project.statusTask || {})
                .flat()
                .find(t => t._id === id);
              if (task) return { ...task, projectId: project._id };
            }
            return null;
          })
          .filter(Boolean);

    // Deduplicate tasks
    const uniqueTasks = Array.from(
      new Map(selectedTaskObjects.map(t => [t._id, t])).values()
    );

    uniqueTasks.forEach((task) => {
      const project = localProjects.find(p => p._id === task.projectId);
      if (!project) return;

      const latestTask = Object.values(project.statusTask || {})
        .flat()
        .find(t => t._id === task._id);

      if (!latestTask) return;

      const updatedComments = Array.isArray(latestTask.comments)
        ? [...latestTask.comments]
        : [];

      if (latestTask.status !== newStatus) {
        const commentText = `${currentUserName} changed status from ${latestTask.status} to ${newStatus}`;

        const isDuplicate = updatedComments.some(
          (c) => c.text === commentText
        );

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

    setSelectedTasks((prev) => {
      const updated = { upcoming: [], progress: [], completed: [] };
      Object.keys(prev).forEach((status) => {
        updated[status] = prev[status].filter(
          (id) => !uniqueTasks.some((t) => t._id === id)
        );
      });
      return updated;
    });

    refetch();
  },
  [selectedTasks, user, updateProject, refetch, localProjects]
);

// Draggable task component with sorting support
const SortableTask = ({ task }) => {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: task._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="flex items-center justify-between text-[14px] bg-white px-3 py-2 rounded-md shadow-sm hover:bg-gray-50 cursor-pointer mb-2"
    >
      <div
        className="w-[30px] flex items-center justify-center rounded-full bg-[#c4c4c4] text-white mr-[10px]"
        {...listeners}
      >
        <GripVertical size={16} />
      </div>

      <div
        className="w-2/5 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] text-gray-800  hover:text-blue-700 hover:underline"
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
              setShowStatusDropdownFor(prev =>
                prev === task._id ? null : task._id
              );
            }
          }}
        >
          {task.status || "-"}
        </div>
        {showStatusDropdownFor === task._id && (
          <div
            id={`status-dropdown-${task._id}`}
            className="absolute left-0 mt-1 bg-white border rounded shadow p-2 z-50 min-w-[120px]"
          >
            {status.map((status) => {
              const isActive = status === task.status;
              return (
                <div
                  key={status}
                  onClick={() => {
                     handleBulkStatusUpdate(status, task);
                    setShowStatusDropdownFor(null);
                  }}
                  className="pt-[5px]"
                >
                  {status}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// Toggle task selection for bulk operations
const toggleTaskSelection = useCallback((status, id) => {
  setSelectedTasks((prev) => {
    const exists = prev[status].includes(id);
    return {
      ...prev,
      [status]: exists
        ? prev[status].filter((t) => t !== id)
        : [...prev[status], id],
    };
  });
}, []);

// Memoize projects to optimize performance

// Handle drag end event and save new order to localStorage
const handleDragEnd = useCallback(
  (status, event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const current = taskOrder[status];
    const oldIndex = current.indexOf(active.id);
    const newIndex = current.indexOf(over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(current, oldIndex, newIndex);

    // Update state and persist to localStorage
    setTaskOrder((prev) => {
      const updated = { ...prev, [status]: reordered };
      localStorage.setItem("taskOrder", JSON.stringify(updated));
      return updated;
    });
  },
  [taskOrder]
);

// Render all tasks for a given status with filtering and sorting
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
            status, // keep track of status
          });
        });
      }
    });

    if (activeProjectId) {
      allTasks = allTasks.filter((t) => t.projectId === activeProjectId);
    }

    if (!allTasks.length) return null;

    const currentOrder = taskOrder[status] || [];
    const ids = allTasks.map((t) => t._id);

    const mergedOrder = [
      ...currentOrder,
      ...ids.filter((id) => !currentOrder.includes(id)),
    ];

    if (mergedOrder.length !== currentOrder.length) {
      setTaskOrder((prev) => {
        const updated = { ...prev, [status]: mergedOrder };
        localStorage.setItem("taskOrder", JSON.stringify(updated));
        return updated;
      });
    }

    return (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={(e) => handleDragEnd(status, e)}
      >
        <SortableContext items={mergedOrder} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {/* Table header */}
            <div className="flex px-3 py-2 mt-[10px] rounded-md font-medium text-gray-500 text-[14px]">
              <div className="w-2/5">Name</div>
              <div className="w-1/5">Assigned</div>
              <div className="w-1/5">Due Date</div>
              <div className="w-1/5">Priority</div>
              <div className="w-1/5">Status</div>
            </div>

            {/* Render each task in order */}
            {mergedOrder.map((id) => {
              const task = allTasks.find((t) => t._id === id);
              return task ? (
                <SortableTask
                  key={task._id}
                  task={task}
                  status={status}
                  toggleTaskSelection={toggleTaskSelection}
                  selectedTasks={selectedTasks}
                />
              ) : null;
            })}
          </div>
        </SortableContext>
      </DndContext>
    );
  },
  [localProjects, start, end, activeProjectId, taskOrder, sensors, selectedTasks]
);


// Render section with status header and tasks
const renderSection = (status) => (
  <div className="mt-[30px]">
    <h2
    >
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </h2>

    {renderTasks(status)}
  </div>
);

useEffect(() => {
  const allStatuses = new Set();
  projects.forEach((project) => {
    Object.values(project.statusTask || {}).forEach((tasks) => {
      tasks.forEach((task) => allStatuses.add(task.status));
    });
  });
  setStatuses(Array.from(allStatuses));
}, [projects]);


console.log(editData)
return (
  <EmployeeLayout>
    <div className="relative h-[90.7vh]">
      <div
        className="absolute w-full h-[100%] opacity-[0.1] bg-[url('https://www.hubsyntax.com/uploads/prodcutpages.webp')] bg-cover bg-center rounded-xl shadow-md border border-gray-200"
      ></div>
      <div className="relative z-20 h-full overflow-y-auto p-6">
        {/* Project list for filtering */}
        <ProjectList
          projects={projects}
          activeProjectId={activeProjectId}
          setActiveProjectId={setActiveProjectId}
          currentUser={user}
        />

        {/* Display tasks organized by status when project is selected */}
        {activeProjectId && (
          <>
            {statuses.map((status) => (
              <div key={status}>{renderSection(status)}</div>
            ))}

          </>
        )}

        {/* Task details modal popup */}
        {showDescriptionPopup && currentTask && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded p-6 w-[90%] h-[90vh] shadow-lg relative overflow-y-auto max-w-[90%] z-[999999999]">
              <div className="w-full mx-auto flex justify-between h-[100%] border border-gray-300">
                {/* Left panel - Task details */}
                <div className="w-[70%] border-r border-gray-400 p-[40px]">
                  {/* Task title */}
                  <h2 className="mb-4 text-gray-500 font-light inline-block text-[16px] p-[3px] border border-gray-300 rounded-md">
                    Task
                  </h2>
                  <textarea
                    className="w-full rounded px-2 py-1 mb-4 text-[25px] border-gray-400 outline-none focus:ring-1 focus:ring-gray-200 resize-none"
                    value={editData.title}
                    placeholder="Enter text..."
                    readOnly
                  />

                  {/* Task metadata section */}
                  <div>
                    {/* Status */}
                    <div className="flex items-center gap-[50px] mb-4">
                      <span className="flex items-center gap-[5px] min-w-[150px]">
                        <CircleStop size={16} />
                        <span className="font-medium text-gray-700">
                          Status
                        </span>
                      </span>
                      <span
                      >
                        {editData.status || "-"}
                      </span>
                    </div>

                    {/* Due date */}
                    <div className="flex items-center gap-[50px] mb-4">
                      <span className="flex items-center gap-[5px] min-w-[150px]">
                        <Calendar size={16} />
                        <span className="font-medium text-gray-700">
                          Dates
                        </span>
                      </span>
                      <div className="relative date-filter">
                        <div
                          className="w-full border rounded px-2 py-1 cursor-pointer hover:bg-gray-50" >
                          {editData.dueDate
                            ? new Date(editData.dueDate).toLocaleDateString()
                            : "Select due date"}
                        </div>
                      </div>
                    </div>

                    {/* Priority */}
                    <div className="flex items-center gap-[50px] mb-4">
                      <span className="flex items-center gap-[5px] min-w-[150px]">
                        <Flag size={16} />
                        <span className="font-medium text-gray-700">
                          Priority
                        </span>
                      </span>
                      <div className="relative">
                        <TaskPriority
                          value={editData.priority}
                          onChange={({})}
                          showclear={false}
                        />
                      </div>
                    </div>

                    {/* Assigned employees */}
                    <div className="flex items-center gap-[50px] mb-4">
                      <span className="flex items-center gap-[5px] min-w-[150px]">
                        <Users size={16} />
                        <span className="font-medium text-gray-700">
                          Assigned
                        </span>
                      </span>
                      <div className="relative flex items-center gap-[10px]">
                        <TaskEmployees
                          selected={editData.assignedEmployees?.map((e) => e._id) || []}
                          employees={editData.assignedEmployees || []}
                          showDropdown={false}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Task description section */}
                  <div className="w-full mx-auto mt-10">
                    <h3 className="text-sm mb-2 font-medium">
                      Task Description
                    </h3>
                     
                  </div>

                  {/* Close button */}
                  <button onClick={() => setShowDescriptionPopup(false)}
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold transition-colors"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Right panel - Activity/Comments section */}
                <div className="w-[30%]">
                  <div className="p-[20px] border-b border-gray-400 text-sm font-medium">
                    Activity
                  </div>
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