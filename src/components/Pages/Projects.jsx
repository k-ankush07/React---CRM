import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import SucessToast from "../ui/SucessToast";
import ManagementLayout from "./ManagementLayout";
import {
  useEmployees, useUser, useCreateProject, useProjects, useUpdateProject, useDeleteTask,
} from "../Use-auth";
import SmartDatePicker from "../ui/SmartDatePicker";
import TaskPriority from "../ui/TaskPriority";
import TaskEmployees from "../ui/TaskEmployees";
import { useDateRange } from "./DateRangeContext";
import {
  Calendar, Plus, CircleCheck, Trash, Copy, Flag, CircleStop, Users, GripVertical, X, SendHorizontal, CircleDot
} from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, } from "@dnd-kit/core";
import {
  arrayMove, SortableContext, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ProjectList from "../ui/ProjectList";
import CommentsSection from "../ui/CommentsSection ";
import { Input } from "../ui/Input";

const statusColors = {
  completed: "bg-[#299764] text-white",
  progress: "bg-orange-600 text-white",
  upcoming: "bg-blue-600 text-white",
};
const STATUS_OPTIONS = ["completed", "progress", "upcoming"];

export default function Projects() {
  const { start, end } = useDateRange();
  const { data: currentUser } = useUser();
  const { data: employees = [], isLoading, error } = useEmployees();
  const createProject = useCreateProject();
  const { data: projects = [], refetch } = useProjects();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteTask();

  // State management
  const [editingStatus, setEditingStatus] = useState(null);
  const [taskInput, setTaskInput] = useState({
    completed: "",
    progress: "",
    upcoming: "",
  });
  const [selectedEmployees, setSelectedEmployees] = useState({
    completed: [],
    progress: [],
    upcoming: [],
  });
  const [priority, setPriority] = useState({
    completed: "",
    progress: "",
    upcoming: "",
  });
  const [selectedTasks, setSelectedTasks] = useState({
    completed: [],
    progress: [],
    upcoming: [],
  });
  const [projectName, setProjectName] = useState("");
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [dueDate, setDueDate] = useState({
    completed: null,
    progress: null,
    upcoming: null,
  });
  const [showDescriptionPopup, setShowDescriptionPopup] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAddProjectInput, setShowAddProjectInput] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    description: [
      { taskLinks: [""], storeLink: "", referenceLink: "", figmaLink: "", taskdescription: [""], }
    ],
    priority: "",
    status: "upcoming",
    assignedEmployees: [],
    dueDate: null
  });

  const [showDatePicker, setShowDatePicker] = useState(null);
  const [bulkDueDate, setBulkDueDate] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentEmployees, setCommentEmployees] = useState([]);

  // Refs
  const addTaskRef = useRef(null);
  const statusRef = useRef(null);
  const textareaRef = useRef(null);

  // Project order state with persistence
  const [projectOrder] = useState(() => {
    const stored = localStorage.getItem("projectsOrder");
    return stored ? JSON.parse(stored) : [];
  });

  // Task order state with persistence
  const [taskOrder, setTaskOrder] = useState(() => {
    const stored = localStorage.getItem("taskOrder");
    if (stored) return JSON.parse(stored);
    return { upcoming: [], progress: [], completed: [] };
  });

  useEffect(() => {
    localStorage.setItem("projectsOrder", JSON.stringify(projectOrder));
  }, [projectOrder]);

  const handleInput = useCallback((e) => {
    setEditData((d) => ({ ...d, title: e.target.value }));
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, []);

  // hide Outside click //
  useEffect(() => {
    function handleClickOutside(event) {
      if (statusRef.current && !statusRef.current.contains(event.target)) {
        setShowStatusDropdown(false);
      }
      if (addTaskRef.current && !addTaskRef.current.contains(event.target)) {
        setEditingStatus(null);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const allSelectedTasks = useMemo(
    () => Object.values(selectedTasks).flat(),
    [selectedTasks]
  );

  const selectedTaskObjects = useMemo(
    () =>
      projects.flatMap(
        (project) =>
          project.tasks
            ?.filter((task) => allSelectedTasks.includes(task._id))
            .map((task) => ({
              ...task,
              projectId: project._id,
              projectName: project.projectName,
            })) || []
      ),
    [projects, allSelectedTasks]
  );

  const commonAssignees = useMemo(
    () =>
      selectedTaskObjects.length
        ? selectedTaskObjects
          .map((t) => t.assignedEmployees?.map((e) => e._id) || [])
          .reduce((a, b) => a.filter((id) => b.includes(id)))
        : [],
    [selectedTaskObjects]
  );

  // update database Project asign user //
  const handleUpdateProject = useCallback(
    (status) => {
      if (!taskInput[status]?.trim()) {
        setToastMessage("Task cannot be empty");
        setToastType("error");
        return;
      }

      const taskToUpdate = selectedTaskObjects.find((t) => t.status === status);
      const assignedUsers = employees
        .filter((emp) => selectedEmployees[status]?.includes(emp._id))
        .map((emp) => ({
          _id: emp._id,
          userId: emp.userId,
          username: emp.fullName,
          role: emp.role,
          email: emp.email,
        }));

      const comments = [];
      const currentUserName = currentUser?.username || "Unknown";

      if (!taskToUpdate) {
        comments.push({
          text: `${currentUserName} created this task`,
          createdBy: currentUserName,
          createdAt: new Date(),
        });

        if (status) {
          comments.push({
            text: `${currentUserName} set status to ${status}`,
            createdBy: currentUserName,
            createdAt: new Date(),
          });
        }
      } else if (taskToUpdate.status !== status) {
        comments.push({
          text: `${currentUserName} changed status from ${taskToUpdate.status} to ${status}`,
          createdBy: currentUserName,
          createdAt: new Date(),
        });
      }

      if (assignedUsers.length > 0) {
        const assignedNames = assignedUsers.map((u) => u.username).join(", ");
        comments.push({
          text: `${currentUserName} assigned to: ${assignedNames}`,
          createdBy: currentUserName,
          createdAt: new Date(),
        });
      }

      if (dueDate[status]) {
        const formattedDate = new Date(dueDate[status]).toLocaleDateString();
        comments.push({
          text: `${currentUserName} set the due date to ${formattedDate}`,
          createdBy: currentUserName,
          createdAt: new Date(),
        });
      }

      if (priority[status]) {
        comments.push({
          text: `${currentUserName} set priority to ${priority[status]}`,
          createdBy: currentUserName,
          createdAt: new Date(),
        });
      }

      updateProject.mutate(
        {
          id: activeProjectId,
          taskId: taskToUpdate?._id,
          taskTitle: taskInput[status],
          assignedEmployees: assignedUsers,
          createdBy: currentUser?.username || "Unknown",
          status: status,
          priority: priority[status],
          dueDate: dueDate[status]
            ? new Date(dueDate[status]).toISOString()
            : null,
          comments,
        },
        {
          onSuccess: () => {
            setTaskInput((prev) => ({ ...prev, [status]: "" }));
            setSelectedEmployees((prev) => ({ ...prev, [status]: [] }));
            setPriority((prev) => ({ ...prev, [status]: "" }));
            setDueDate((prev) => ({ ...prev, [status]: null }));
            setEditingStatus(null);
            setToastMessage(
              taskToUpdate
                ? "Task updated successfully!"
                : "Task added successfully!"
            );
            setToastType("success");
            refetch();
          },
          onError: (err) => {
            setToastMessage("Error updating task: " + err.message);
            setToastType("error");
          },
        }
      );
    },
    [
      taskInput,
      selectedTaskObjects,
      selectedEmployees,
      employees,
      currentUser,
      dueDate,
      priority,
      activeProjectId,
      updateProject,
      refetch,
    ]
  );

  // copy task //
  const handleCopyTasks = useCallback(() => {
    if (!selectedTaskObjects.length) return;

    selectedTaskObjects.forEach((task) => {
      const duplicateTask = {
        taskTitle: task.title + " (Copy)",
        description: task.description,
        assignedEmployees: task.assignedEmployees.map((e) => e._id),
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        comments: task.comments ? [...task.comments] : [],
      };

      updateProject.mutate(
        {
          id: task.projectId,
          ...duplicateTask,
        },
        {
          onSuccess: () => {
            setToastMessage(`Task "${task.title}" copied successfully!`);
            setToastType("success");
            refetch();
          },
          onError: (err) => {
            setToastMessage("Error copying task: " + err.message);
            setToastType("error");
          },
        }
      );
    });

    setSelectedTasks({
      completed: [],
      progress: [],
      upcoming: [],
    });
  }, [selectedTaskObjects, updateProject, refetch]);

  // delete task //

  const handleDeleteTasks = useCallback(() => {
    if (!selectedTaskObjects.length) return;

    selectedTaskObjects.forEach((task) => {
      deleteProject.mutate(
        { projectId: task.projectId, taskId: task._id },
        {
          onSuccess: () => {
            setToastMessage(`Task "${task.title}" deleted successfully!`);
            setToastType("success");
            refetch();
          },
          onError: (err) => {
            setToastMessage("Error deleting task: " + err.message);
            setToastType("error");
          },
        }
      );
    });

    setSelectedTasks({
      completed: [],
      progress: [],
      upcoming: [],
    });
  }, [selectedTaskObjects, deleteProject, refetch]);

  // add comment in  task //
  const generateComments = useCallback(
    (taskToUpdate, editDataParam, currentUserParam) => {
      const comments = [];
      const currentUserName = currentUserParam?.username || "Unknown";
      const assignedUsers = (editDataParam.assignedEmployees || [])
        .map((empId) => employees.find((e) => e._id === empId))
        .filter(Boolean)
        .map((emp) => ({
          _id: emp._id,
          userId: emp.userId,
          username: emp.fullName || emp.username,
          role: emp.role,
          email: emp.email,
        }));

      if (!taskToUpdate) {
        comments.push({
          text: `${currentUserName} created this task`,
          createdBy: currentUserName,
          createdAt: new Date(),
        });
      } else {
        if (taskToUpdate.title !== editDataParam.title) {
          comments.push({
            text: `${currentUserName} updated the title to "${editDataParam.title}"`,
            createdBy: currentUserName,
            createdAt: new Date(),
          });
        }

        if (taskToUpdate.description !== editDataParam.description) {
          comments.push({
            text: `${currentUserName} updated the description`,
            createdBy: currentUserName,
            createdAt: new Date(),
          });
        }

        if (taskToUpdate.priority !== editDataParam.priority) {
          comments.push({
            text: `${currentUserName} set priority to ${editDataParam.priority}`,
            createdBy: currentUserName,
            createdAt: new Date(),
          });
        }

        const oldDue = taskToUpdate.dueDate
          ? new Date(taskToUpdate.dueDate).toISOString()
          : null;
        const newDue = editDataParam.dueDate
          ? new Date(editDataParam.dueDate).toISOString()
          : null;

        if (oldDue !== newDue) {
          const formattedDate = newDue
            ? new Date(newDue).toLocaleDateString()
            : "none";
          comments.push({
            text: `${currentUserName} set the due date to ${formattedDate}`,
            createdBy: currentUserName,
            createdAt: new Date(),
          });
        }

        const oldAssigned = (taskToUpdate.assignedEmployees || [])
          .map((e) => e._id)
          .sort()
          .join(",") || "";
        const newAssigned = (assignedUsers || [])
          .map((e) => e._id)
          .sort()
          .join(",") || "";

        if (oldAssigned !== newAssigned) {
          const assignedNames = assignedUsers
            .map((u) => u.username)
            .join(", ") || "none";
          comments.push({
            text: `${currentUserName} assigned to: ${assignedNames}`,
            createdBy: currentUserName,
            createdAt: new Date(),
          });
        }
      }

      return comments;
    },
    [employees]
  );

  // close Popup  than all save database data in  task //
  const handleClosePopup = useCallback(() => {
    if (!currentTask?.projectId) {
      console.error("No projectId found in currentTask");
      return;
    }

    const formattedDescription = Array.isArray(editData.description)
      ? editData.description.map((desc, idx) => {
        const formatted = {
          taskLinks: Array.isArray(desc.taskLinks) ? desc.taskLinks : [],
          storeLink: desc.storeLink || "",
          referenceLink: desc.referenceLink || "",
          figmaLink: desc.figmaLink || "",
          taskdescription: Array.isArray(desc.taskdescription) ? desc.taskdescription : [],
        };

        console.log(`Formatted description[${idx}]:`, formatted);
        return formatted;
      })
      : [
        {
          taskLinks: [],
          storeLink: "",
          referenceLink: "",
          figmaLink: "",
        },
      ];

    console.log("Full formattedDescription:", formattedDescription);
    const newComments = generateComments(currentTask, editData, currentUser);
    console.log("New comments:", newComments);

    updateProject.mutate(
      {
        id: currentTask.projectId,
        taskId: currentTask._id,
        taskTitle: editData.title,
        description: formattedDescription,
        priority: editData.priority,
        status: editData.status,
        dueDate: editData.dueDate
          ? new Date(editData.dueDate).toISOString()
          : null,
        assignedEmployees: editData.assignedEmployees,
        comments: [...(currentTask.comments || []), ...newComments],
      },
      {
        onSuccess: () => {
          setShowDescriptionPopup(false);
          refetch();
          setToastMessage("Task updated successfully!");
          setToastType("success");
        },
        onError: (err) => {
          console.error("ERROR UPDATING TASK:", err);
          setToastMessage("Error updating task: " + err.message);
          setToastType("error");
        },
      }
    );
  }, [currentTask, editData, currentUser, generateComments, updateProject, refetch]);


  // choose task  in checkbox//
  const toggleTaskSelection = useCallback((status, taskId) => {
    setSelectedTasks((prev) => {
      const current = prev[status] || [];
      const updatedStatus = current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId];

      return { ...prev, [status]: updatedStatus };
    });
  }, []);

  // bulk assign task update //
  const handleBulkAssigneeUpdate = useCallback(
    (newAssignees) => {
      const currentUserName = currentUser?.username || "Unknown";

      const getEmployeeName = (id) =>
        employees.find((e) => e._id === id)?.fullName || "Unknown";

      selectedTaskObjects.forEach((task) => {
        const assignedNames = newAssignees.map(getEmployeeName).join(", ");

        const newComment = {
          text: `${currentUserName} assigned to: ${assignedNames}`,
          createdBy: currentUserName,
          createdAt: new Date(),
        };

        const updatedComments = Array.isArray(task.comments)
          ? [...task.comments, newComment]
          : [newComment];

        updateProject.mutate({
          id: task.projectId,
          taskId: task._id,
          assignedEmployees: newAssignees,
          comments: updatedComments,
        });
      });

      setToastMessage("Assignees updated successfully");
      setToastType("success");
      refetch();
    },
    [selectedTaskObjects, currentUser, employees, updateProject, refetch]
  );

  // assign task update  status//
  const handleBulkStatusUpdate = useCallback(
    (newStatus) => {
      if (!selectedTaskObjects.length) return;

      const currentUserName = currentUser?.username || "Unknown";
      selectedTaskObjects.forEach((task) => {
        const updatedComments = Array.isArray(task.comments)
          ? [...task.comments]
          : [];

        if (task.status !== newStatus) {
          updatedComments.push({
            text: `${currentUserName} changed status from ${task.status} to ${newStatus}`,
            createdBy: currentUserName,
            createdAt: new Date(),
          });
        }

        updateProject.mutate({
          id: task.projectId,
          taskId: task._id,
          status: newStatus,
          comments: updatedComments,
        });
      });

      setSelectedTasks((prev) => {
        const updated = { completed: [], progress: [], upcoming: [] };
        Object.keys(prev).forEach((status) => {
          updated[status] = prev[status].filter(
            (id) => !selectedTaskObjects.some((t) => t._id === id)
          );
        });
        return updated;
      });

      setToastMessage("Status updated for selected tasks");
      setToastType("success");
      setShowStatusDropdown(false);
      refetch();
    },
    [selectedTaskObjects, currentUser, updateProject, refetch]
  );

  // comment functions//
  const handleAddComment = useCallback(() => {
    if (!commentText.trim()) return;

    const currentUserName = currentUser?.username || "Unknown";

    const assignedText = commentEmployees.length
      ? `${currentUserName} set comment: "${commentText}" assigned to: ${commentEmployees
        .map((id) => employees.find((e) => e._id === id)?.fullName || "Unknown")
        .join(", ")}`
      : commentText;

    const newComment = {
      _id: Date.now().toString(),
      text: assignedText,
      createdBy: currentUserName,
      createdAt: new Date(),
    };

    setEditData((prev) => ({
      ...prev,
      comments: prev.comments ? [...prev.comments, newComment] : [newComment],
    }));

    setCommentText("");
    setCommentEmployees([]);

    if (currentTask?._id && currentTask.projectId) {
      updateProject.mutate(
        {
          id: currentTask.projectId,
          taskId: currentTask._id,
          comments: editData.comments
            ? [...editData.comments, newComment]
            : [newComment],
        },
        {
          onSuccess: () => {
            setToastMessage("Comment added successfully!");
            setToastType("success");
            refetch();
          },
          onError: (err) => {
            setToastMessage("Error adding comment: " + err.message);
            setToastType("error");
          },
        }
      );
    }
  }, [commentText, commentEmployees, currentTask, editData, currentUser, employees, updateProject, refetch]);

  useEffect(() => {
    if (!allSelectedTasks.length) {
      if (bulkDueDate !== null) setBulkDueDate(null);
      return;
    }

    const selectedTaskObjectsTemp = projects.flatMap(
      (project) =>
        project.tasks
          ?.filter((task) => allSelectedTasks.includes(task._id))
          .map((task) => ({
            ...task,
            projectId: project._id,
            projectName: project.projectName,
          })) || []
    );

    const dates = selectedTaskObjectsTemp
      .map((t) => (t.dueDate ? new Date(t.dueDate) : null))
      .filter(Boolean);

    const allSame =
      dates.length > 0 && dates.every((d) => d.getTime() === dates[0].getTime());
    const newBulkDate = allSame ? dates[0] : null;

    if ((bulkDueDate?.getTime() || null) !== (newBulkDate?.getTime() || null)) {
      setBulkDueDate(newBulkDate);
    }
  }, [allSelectedTasks, projects, bulkDueDate]);

  // bulk date update  functions//
  const handleBulkDateUpdate = useCallback(
    (date) => {
      const currentUserName = currentUser?.username || "Unknown";

      selectedTaskObjects.forEach((task) => {
        const formattedDate = date.toLocaleDateString();

        const newComment = {
          text: `${currentUserName} set the due date to ${formattedDate}`,
          createdBy: currentUserName,
          createdAt: new Date(),
        };

        const updatedComments = Array.isArray(task.comments)
          ? [...task.comments, newComment]
          : [newComment];

        updateProject.mutate({
          id: task.projectId,
          taskId: task._id,
          dueDate: date.toISOString(),
          comments: updatedComments,
        });
      });

      setToastMessage("Due date updated for selected tasks");
      setToastType("success");
      refetch();
    },
    [selectedTaskObjects, currentUser, updateProject, refetch]
  );

  const SortableTask = ({
    task,
    status,
    toggleTaskSelection: toggleTask,
    selectedTasks: selectedTasksProp,
  }) => {
    const { attributes, listeners, setNodeRef, transform, transition } =
      useSortable({ id: task._id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
    };

    const handleTaskClick = useCallback(() => {
      const resolvedProjectId =
        task.projectId ||
        activeProjectId ||
        task?.project?._id ||
        null;
      setCurrentTask({
        ...task,
        projectId: resolvedProjectId,
      });

      setEditData({
        title: task.title || "",
        description: task.description || "",
        priority: task.priority || "",
        status: task.status || "",
        employeesName: task.assignedEmployees?.map((e) => e.username) || [],
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        assignedEmployees: task.assignedEmployees?.map((e) => e._id) || [],
        comments: task.comments || [],
      });
      setShowDescriptionPopup(true);
    }, [task, activeProjectId]);

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className="flex items-center justify-between bg-white px-3 py-2 rounded-md shadow-sm hover:bg-gray-50 cursor-pointer mb-2"
      >
        <div
          className="w-[30px] flex items-center justify-center rounded-full bg-[#c4c4c4] text-white mr-[10px]"
          {...listeners}
        >
          <GripVertical size={16} />
        </div>

        <div className="w-[30px] flex items-center justify-center">
          <input
            type="checkbox"
            className="cursor-pointer"
            checked={selectedTasksProp[status]?.includes(task._id)}
            onChange={() => toggleTask(status, task._id)}
          />
        </div>

        <div
          className="w-2/5 overflow-hidden text-ellipsis whitespace-nowrap text-[14px] text-gray-800 hover:text-blue-700 hover:underline transition-colors duration-200"
          title={task.title}
          onClick={handleTaskClick}
        >
          {task.title || "-"}
        </div>

        <div className="w-1/5">
          <TaskEmployees
            selected={task.assignedEmployees?.map((e) => e._id) || []}
            employees={task.assignedEmployees || []}
            onChange={() => { }}
            showDropdown={false}
          />
        </div>

        <div className="w-1/5 text-[14px] text-gray-600">
          {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
        </div>

        <div className="w-1/5">
          <TaskPriority value={task.priority} showclear={false} />
        </div>
      </div>
    );
  };

  const localProjects = useMemo(() => {
    if (!projects || !projects.length) return [];

    const projectsMap = Object.fromEntries(
      projects.map((p) => [p._id, p])
    );

    const orderedProjects = projectOrder
      .map((id) => projectsMap[id])
      .filter(Boolean);
    const newProjects = projects.filter((p) => !projectOrder.includes(p._id));

    return [...orderedProjects, ...newProjects];
  }, [projects, projectOrder]);

  useEffect(() => {
    STATUS_OPTIONS.forEach((status) => {
      const tasks = localProjects.flatMap((p) =>
        p.tasks?.filter((t) => t.status === status).map((t) => t._id) || []
      );

      setTaskOrder((prev) => {
        const missingTasks = tasks.filter((t) => !prev[status]?.includes(t));
        if (missingTasks.length === 0) return prev;
        const updated = {
          ...prev,
          [status]: [...(prev[status] || []), ...missingTasks],
        };
        localStorage.setItem("taskOrder", JSON.stringify(updated));
        return updated;
      });
    });
  }, [projects, localProjects]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // drag and drop//
  const handleDragEnd = useCallback((status, event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = taskOrder[status].indexOf(active.id);
    const newIndex = taskOrder[status].indexOf(over.id);

    if (oldIndex === newIndex) return;

    const newTaskOrder = arrayMove(taskOrder[status], oldIndex, newIndex);
    setTaskOrder((prev) => {
      const updated = { ...prev, [status]: newTaskOrder };
      localStorage.setItem("taskOrder", JSON.stringify(updated));
      return updated;
    });
  }, [taskOrder]);

  //renderTasks all task //
  const renderTasks = useCallback(
    (status) => {
      let allTasks = [];

      localProjects.forEach((project) => {
        if (
          new Date(project.createdAt) >= start &&
          new Date(project.createdAt) <= end
        ) {
          project.tasks?.forEach((task) => {
            allTasks.push({
              ...task,
              projectId: project._id,
              projectName: project.projectName,
            });
          });
        }
      });

      let filteredTasks = allTasks.filter((task) => task.status === status);

      if (activeProjectId) {
        filteredTasks = filteredTasks.filter((t) => t.projectId === activeProjectId);
      }

      if (!filteredTasks.length) return null;

      return (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={(e) => handleDragEnd(status, e)}
        >
          <SortableContext
            items={filteredTasks.map((t) => t._id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-2">
              <div className="flex px-3 py-2 mt-[10px] rounded-md font-medium text-gray-500 text-[14px]">
                <div className="w-2/5">Name</div>
                <div className="w-1/5">Assigned</div>
                <div className="w-1/5">Due Date</div>
                <div className="w-1/5">Priority</div>
              </div>

              {taskOrder[status]?.map((taskId) => {
                const task = filteredTasks.find((t) => t._id === taskId);
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
    [
      localProjects,
      start,
      end,
      activeProjectId,
      taskOrder,
      sensors,
      handleDragEnd,
      toggleTaskSelection,
      selectedTasks,
    ]
  );

  //renderSections all task //
  const renderSection = useCallback(
    (status) => (
      <div className="mb-8">
        <div>
          <h2
            className={`font-normal inline-block text-sm px-2 py-1 rounded ${statusColors[status]}`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </h2>
        </div>
        {renderTasks(status)}
        {editingStatus !== status ? (
          <div
            className="flex items-center gap-1 mt-[10px] cursor-pointer text-[14px] text-gray-500 border-b-0 hover:border-b hover:border-gray-300"
            onClick={() => setEditingStatus(status)}
          >
            <Plus size={14} />
            <span>Add Task</span>
          </div>
        ) : (
          <div
            ref={addTaskRef}
            className="flex items-center gap-2 border-t border-b p-2 bg-white mt-[10px]"
          >
            <div className="flex items-center justify-center rounded-full bg-[#299764] text-white">
              <CircleCheck size={16} />
            </div>
            <Input
              type="text"
              className="flex-1 px-2 py-1 outline-none text-[14px]"
              placeholder="Task Name or type for commands"
              value={taskInput[status]}
              onChange={(e) =>
                setTaskInput((prev) => ({ ...prev, [status]: e.target.value }))
              }
            />
            <div className="smart-date-task inline-flex">
              <SmartDatePicker
                open={showDatePicker === status}
                setOpen={(v) => setShowDatePicker(v ? status : null)}
                selected={dueDate[status]}
                setSelected={(d) => {
                  setDueDate((prev) => ({ ...prev, [status]: d }));
                  setShowDatePicker(null);
                }}
              />
            </div>

            <div className="relative inline-flex">
              <TaskPriority
                value={priority[status]}
                onChange={(level) =>
                  setPriority((prev) => ({ ...prev, [status]: level }))
                }
              />
            </div>
            <div className="taskEmployees-container">
              <TaskEmployees
                selected={selectedEmployees[status]}
                onChange={(arr) =>
                  setSelectedEmployees((prev) => ({ ...prev, [status]: arr }))
                }
                employees={employees}
                className="custom-dropdown"
              />
            </div>
            <button
              className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-[14px]"
              onClick={() => setEditingStatus(null)}
            >
              Cancel
            </button>
            <button
              className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-[14px]"
              onClick={() => handleUpdateProject(status)}
            >
              Save
            </button>
          </div>
        )}
      </div>
    ),
    [
      editingStatus,
      renderTasks,
      taskInput,
      showDatePicker,
      dueDate,
      priority,
      selectedEmployees,
      employees,
      handleUpdateProject,
    ]
  );

  //handleTaskAdd create new task //
  const handleTaskAdd = useCallback(() => {
    if (!projectName.trim()) {
      setToastMessage("Please enter Project Name first");
      setToastType("error");
      return;
    }
    createProject.mutate(
      {
        projectName: projectName,
        createdBy: currentUser?.username || "Unknown",
      },
      {
        onSuccess: (data) => {
          setToastMessage("Project created successfully");
          setToastType("success");
          setProjectName("");
          setActiveProjectId(data?._id);
          refetch();
        },
        onError: (err) => {
          setToastMessage("Error creating project: " + err.message);
          setToastType("error");
        },
      }
    );
  }, [projectName, currentUser, createProject, refetch]);

  const renderProjectTasks = useCallback(
    () => (
      <div className="space-y-2 mb-[20px]">
        <div
          className="px-3 py-1 bg-[#fbe5e9] text-black inline-block rounded cursor-pointer shadow-md hover:shadow-lg transition-shadow"
          onClick={() => setShowAddProjectInput((prev) => !prev)}
        >
          + New Project
        </div>

        {showAddProjectInput && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded shadow-lg w-[20%] text-[14px] relative">
              <h3 className="text-lg font-semibold mb-4">Add New Project</h3>
              <div className="flex gap-2 mb-4">
                <Input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleTaskAdd();
                      setShowAddProjectInput(false);
                    }
                  }}
                  placeholder="Enter Project Name"
                  className="flex-1 border px-2 py-1 rounded outline-none focus:border-blue-500"
                />
                <div
                  className="px-3 py-1 bg-green-600 text-white rounded cursor-pointer hover:bg-green-700 transition-colors"
                  onClick={() => {
                    handleTaskAdd();
                    setShowAddProjectInput(false);
                  }}
                >
                  Add
                </div>
              </div>
              <div
                className="text-gray-500 underline text-sm cursor-pointer hover:text-gray-700 absolute top-[3px] right-[3px]"
                onClick={() => setShowAddProjectInput(false)}
              >
                <X />
              </div>
            </div>
          </div>
        )}
        <ProjectList
          projects={projects}
          activeProjectId={activeProjectId}
          setActiveProjectId={setActiveProjectId}
          currentUser={currentUser}
        />
      </div>
    ),
    [
      showAddProjectInput,
      projectName,
      projects,
      activeProjectId,
      handleTaskAdd,
    ]
  );

  useEffect(() => {
    setEditData((prev) => ({
      ...prev,
      description: Array.isArray(prev.description) ? prev.description : [
        { taskLinks: [""], storeLink: "", referenceLink: "", figmaLink: "", taskdescription: [""] }
      ],
    }));
  }, []);

  if (isLoading) return <p className="p-6">Loading employees...</p>;
  if (error)
    return <p className="p-6 text-red-600">Error loading employees</p>;

  return (
    <ManagementLayout>
      <div className="relative h-[90.7vh]">
        <div
          className="absolute w-full h-[100%] opacity-[0.1] bg-[url('https://www.hubsyntax.com/uploads/prodcutpages.webp')] bg-cover bg-center rounded-xl shadow-md border border-gray-200"
        ></div>
        <div className="relative z-20 h-full overflow-y-auto p-6">
          {renderProjectTasks()}
          {activeProjectId && (
            <>
              {renderSection("upcoming")}
              {renderSection("progress")}
              {renderSection("completed")}
            </>
          )}

          {showDescriptionPopup && currentTask && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded p-6 w-[90%] h-[90vh] shadow-lg relative overflow-y-auto max-w-[90%]">
                <div className="w-full mx-auto flex justify-between h-[100%] border border-gray-300">
                  <div className="w-[70%] border-r border-gray-400 p-[40px]">
                    <h2 className="mb-4 text-gray-500 font-light inline-flex gap-[5px] items-center justify-center text-[16px] p-[5px] w-[80px] border border-gray-300 rounded-md">
                      <CircleDot size={12} /> Task
                    </h2>
                    <textarea
                      ref={textareaRef}
                      className="w-full rounded px-2 py-1 mb-4 text-[25px] border-gray-400 outline-none focus:ring-1 focus:ring-gray-200 resize-none"
                      value={editData.title}
                      onChange={handleInput}
                      rows={1}
                      placeholder="Enter text..."
                    />

                    <div className="w-full mx-auto mt-10">
                      <h3 className="text-sm mb-2 font-medium">Task Details</h3>
                      {editData.description && (
                        <div className="mb-4">
                          {editData.description?.map((desc, idx) => (
                            <div key={idx} className="mb-2">
                              <label className="text-gray-600 text-sm mb-1 block">Task Links</label>
                              {desc.taskLinks.map((link, linkIdx) => (
                                <div key={linkIdx} className="flex gap-2 items-center mb-1">
                                  <input
                                    type="text"
                                    className="flex-1 border rounded px-2 py-1 text-[14px]"
                                    value={link}
                                    placeholder="Enter task link..."
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setEditData((prev) => ({
                                        ...prev,
                                        description: prev.description.map((d, dIdx) =>
                                          dIdx === idx
                                            ? {
                                              ...d,
                                              taskLinks: d.taskLinks.map((l, lIdx) =>
                                                lIdx === linkIdx ? value : l
                                              ),
                                            }
                                            : d
                                        ),
                                      }));
                                    }}
                                  />
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditData((prev) => ({
                                        ...prev,
                                        description: prev.description.map((d, dIdx) =>
                                          dIdx === idx
                                            ? {
                                              ...d,
                                              taskLinks: d.taskLinks.filter((_, lIdx) => lIdx !== linkIdx),
                                            }
                                            : d
                                        ),
                                      }));
                                    }}
                                  >
                                    Remove
                                  </button>
                                </div>
                              ))}
                              <button
                                type="button"
                                onClick={() => {
                                  setEditData((prev) => ({
                                    ...prev,
                                    description: prev.description.map((d, dIdx) =>
                                      dIdx === idx
                                        ? { ...d, taskLinks: [...d.taskLinks, ""] }
                                        : d
                                    ),
                                  }));
                                }}
                                className="text-blue-500 text-sm mt-1"
                              >
                                + Add Link
                              </button>
                            </div>
                          ))}

                          {(editData.description[0]?.taskdescription || []).map((desc, idx) => (
                            <div key={idx} className="mb-2">
                              <label className="text-gray-600 text-sm block">Task Description {idx + 1}</label>
                              <input
                                type="text"
                                className="w-full border rounded px-2 py-1 text-[14px]"
                                value={desc}
                                onChange={(e) => {
                                  const newTaskDesc = [...(editData.description[0]?.taskdescription || [])];
                                  newTaskDesc[idx] = e.target.value;
                                  setEditData((prev) => ({
                                    ...prev,
                                    description: [
                                      { ...prev.description[0], taskdescription: newTaskDesc },
                                    ],
                                  }));
                                }}
                              />
                            </div>
                          ))}

                          <div className="mt-2 space-y-2">
                            <div>
                              <label className="text-gray-600 text-sm block">Store Link</label>
                              <input
                                type="text"
                                className="w-full border rounded px-2 py-1 text-[14px]"
                                value={editData.description[0]?.storeLink || ""}
                                onChange={(e) =>
                                  setEditData((prev) => ({
                                    ...prev,
                                    description: [
                                      {
                                        ...prev.description[0],
                                        storeLink: e.target.value,
                                      },
                                    ],
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-gray-600 text-sm block">Reference Link</label>
                              <input
                                type="text"
                                className="w-full border rounded px-2 py-1 text-[14px]"
                                value={editData.description[0]?.referenceLink || ""}
                                onChange={(e) =>
                                  setEditData((prev) => ({
                                    ...prev,
                                    description: [
                                      {
                                        ...prev.description[0],
                                        referenceLink: e.target.value,
                                      },
                                    ],
                                  }))
                                }
                              />
                            </div>
                            <div>
                              <label className="text-gray-600 text-sm block">Figma Link</label>
                              <input
                                type="text"
                                className="w-full border rounded px-2 py-1 text-[14px]"
                                value={editData.description[0]?.figmaLink || ""}
                                onChange={(e) =>
                                  setEditData((prev) => ({
                                    ...prev,
                                    description: [
                                      {
                                        ...prev.description[0],
                                        figmaLink: e.target.value,
                                      },
                                    ],
                                  }))
                                }
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold transition-colors"
                      onClick={handleClosePopup}
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {toastMessage && (
            <SucessToast type={toastType} message={toastMessage} />
          )}
        </div>
      </div>
    </ManagementLayout>
  );
}