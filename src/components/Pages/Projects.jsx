import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import SucessToast from "../ui/SucessToast";
import ManagementLayout from "./ManagementLayout";
import {
  useEmployees, useUser, useCreateProject, useProjects, useUpdateProject, useDeleteTask, useRenameProjectStatus,
  useDragDropTask
} from "../Use-auth";
import SmartDatePicker from "../ui/SmartDatePicker";
import TaskPriority from "../ui/TaskPriority";
import TaskEmployees from "../ui/TaskEmployees";
import { useDateRange } from "./DateRangeContext";
import {
  Calendar, Plus, CircleCheck, Trash, Copy, Flag, CircleStop, Users, GripVertical, X, SendHorizontal,
  CircleDot, ChevronRight, Ellipsis
} from "lucide-react";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, } from "@dnd-kit/core";
import {
  arrayMove, SortableContext, verticalListSortingStrategy, useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ProjectList from "../ui/ProjectList";
import CommentsSection from "../ui/CommentsSection ";
import { Input } from "../ui/Input";
import TaskDetails from "../ui/TaskDetails ";
import { Button } from "../ui/Button";

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

export default function Projects() {
  const { start, end } = useDateRange();
  const { data: currentUser } = useUser();
  const { data: employees = [], isLoading, error } = useEmployees();
  const createProject = useCreateProject();
  const { data: projects = [], refetch } = useProjects();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteTask();
  const dragDropTaskMutation = useDragDropTask();
  const renameStatusMutation = useRenameProjectStatus();
  const [statuses, setStatuses] = useState(["todo"]);
  const [newStatusName, setNewStatusName] = useState("");
  // State management
  const initStatusObject = (value) =>
    Object.fromEntries(statuses.map((s) => [s, value]));
  const [editingStatus, setEditingStatus] = useState(null);
  const [taskInput, setTaskInput] = useState(() => initStatusObject(""));
  const [selectedEmployees, setSelectedEmployees] = useState(() => initStatusObject([]));
  const [priority, setPriority] = useState(() => initStatusObject(""));
  const [selectedTasks, setSelectedTasks] = useState(() => initStatusObject([]));
  const [dueDate, setDueDate] = useState(() => initStatusObject(null));
  const [projectName, setProjectName] = useState("");
  const [activeProjectId, setActiveProjectId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");
  const [showDescriptionPopup, setShowDescriptionPopup] = useState(false);
  const [currentTask, setCurrentTask] = useState(null);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showAddProjectInput, setShowAddProjectInput] = useState(false);
  const [editData, setEditData] = useState({
    title: "",
    description: [
      {
        storeLink: "",
        referenceLink: "",
        figmaLink: "",
        taskdescription: [],
        files: []
      },
    ],
    priority: "",
    status: statuses,
    assignedEmployees: [],
    dueDate: null
  });
  const [collapsedStatuses, setCollapsedStatuses] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(null);
  const [bulkDueDate, setBulkDueDate] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [commentEmployees, setCommentEmployees] = useState([]);
  const [editingStatusName, setEditingStatusName] = useState(null);
  const [renameInput, setRenameInput] = useState("");
  const [openMenuStatus, setOpenMenuStatus] = useState(null);

  // Refs
  const addTaskRef = useRef(null);
  const statusRef = useRef(null);
  const textareaRef = useRef(null);
  const newStatusRef = useRef(null);
  const menuRef = useRef(null);

  // Project order state with persistence
  const [projectOrder] = useState(() => {
    const stored = localStorage.getItem("projectsOrder");
    return stored ? JSON.parse(stored) : [];
  });

  // Task order state with persistence
  const [taskOrder, setTaskOrder] = useState(() => {
    const stored = localStorage.getItem("taskOrder");
    if (stored) return JSON.parse(stored);

    const initialOrder = {};
    statuses.forEach((s) => {
      initialOrder[s] = [];
    });
    return initialOrder;
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
    setTaskInput((p) => ({ ...initStatusObject(""), ...p }));
    setSelectedEmployees((p) => ({ ...initStatusObject([]), ...p }));
    setPriority((p) => ({ ...initStatusObject(""), ...p }));
    setSelectedTasks((p) => ({ ...initStatusObject([]), ...p }));
    setDueDate((p) => ({ ...initStatusObject(null), ...p }));
  }, [statuses]);

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
     
        if (menuRef.current && !menuRef.current.contains(event.target)) {
          setOpenMenuStatus(null); 
        }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (statusRef.current && !statusRef.current.contains(event.target)) {
        if (editingStatusName) handleRenameStatus(editingStatusName);
      }

      if (newStatusRef.current && !newStatusRef.current.contains(event.target)) {
        const trimmed = newStatusName.trim();
        if (trimmed && !statuses.includes(trimmed)) {
          setStatuses((prev) => [...prev, trimmed]);
          setNewStatusName("");
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingStatusName, renameInput, newStatusName, statuses]);

  const allSelectedTasks = useMemo(
    () => Object.values(selectedTasks).flat(),
    [selectedTasks]
  );

  const selectedTaskObjects = useMemo(() =>
    projects.flatMap(project =>
      Object.values(project.statusTask || {})
        .flat()
        .filter(task => allSelectedTasks.includes(task._id))
        .map(task => ({
          ...task,
          projectId: project._id,
          projectName: project.projectName,
        }))
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

  const handleRenameStatus = (oldStatusLocal) => {
    const newStatus = renameInput.trim().toLowerCase();
    if (!newStatus || statuses.includes(newStatus)) {
      setEditingStatusName(null);
      return;
    }

    setStatuses((prev) => prev.map((s) => (s === oldStatusLocal ? newStatus : s)));

    setTaskOrder((prev) => {
      const updated = { ...prev };
      if (updated[oldStatusLocal]) {
        updated[newStatus] = updated[oldStatusLocal];
        delete updated[oldStatusLocal];
      }
      return updated;
    });

    projects.forEach((project) => {
      if (project.statusTask?.[oldStatusLocal]) {
        renameStatusMutation.mutate({
          id: project._id,
          oldStatus: oldStatusLocal,
          newStatus,
        });
      }
    });

    setEditingStatusName(null);
  };

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
    if (!selectedTaskObjects.length) {
      console.log("No tasks selected for copying.");
      return;
    }

    selectedTaskObjects.forEach((task) => {
      const duplicateTask = {
        taskTitle: task.title + " (Copy)",
        description: task.description,
        assignedEmployees: task.assignedEmployees?.map((e) => e._id) || [],
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
          onSuccess: (res) => {
            setToastMessage(`Task "${task.title}" copied successfully!`);
            setToastType("success");
            refetch();
          },
          onError: (err) => {
            console.error("Error copying task:", err);
            setToastMessage("Error copying task: " + err.message);
            setToastType("error");
          },
        }
      );
    });

  }, [selectedTaskObjects, updateProject, refetch]);


  // delete task //

  const handleDeleteTasks = useCallback(() => {
    if (!selectedTaskObjects.length) {
      console.log("No tasks selected for deletion.");
      return;
    }

    console.log("Deleting selected tasks:", selectedTaskObjects);

    selectedTaskObjects.forEach((task) => {
      console.log(`Deleting task: ${task._id} (${task.title}) from project: ${task.projectId}`);

      deleteProject.mutate(
        { projectId: task.projectId, taskId: task._id },
        {
          onSuccess: (res) => {
            console.log(`Task "${task.title}" deleted successfully! Response:`, res);
            setToastMessage(`Task "${task.title}" deleted successfully!`);
            setToastType("success");
            refetch();
          },
          onError: (err) => {
            console.error(`Error deleting task "${task.title}":`, err);
            setToastMessage("Error deleting task: " + err.message);
            setToastType("error");
          },
        }
      );
    });

    console.log("Finished initiating delete for all selected tasks.");
  }, [selectedTaskObjects, deleteProject, refetch]);


  // add comment in  task //
  const generateComments = useCallback(
    (taskToUpdate, editDataParam, currentUserParam) => {
      const comments = [];
      const currentUserName = currentUserParam?.username || "Unknown";

      const normalizeDate = (date) =>
        date ? new Date(date).setHours(0, 0, 0, 0) : null;

      if (!taskToUpdate) {
        comments.push({
          text: `${currentUserName} created this task`,
          createdBy: currentUserName,
          createdAt: new Date(),
        });
        return comments;
      }

      if (taskToUpdate.title !== editDataParam.title) {
        comments.push({
          text: `${currentUserName} updated the title to "${editDataParam.title}"`,
          createdBy: currentUserName,
          createdAt: new Date(),
        });
      }

      if (
        JSON.stringify(taskToUpdate.description) !==
        JSON.stringify(editDataParam.description)
      ) {
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

      const oldDue = normalizeDate(taskToUpdate.dueDate);
      const newDue = normalizeDate(editDataParam.dueDate);

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

      const oldAssigned =
        (taskToUpdate.assignedEmployees || [])
          .map((e) => e._id)
          .sort()
          .join(",") || "";

      const newAssigned =
        (editDataParam.assignedEmployees || []).sort().join(",") || "";

      if (oldAssigned !== newAssigned) {
        comments.push({
          text: `${currentUserName} updated assigned users`,
          createdBy: currentUserName,
          createdAt: new Date(),
        });
      }

      return comments;
    },
    []
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
          storeLink: desc.storeLink || "",
          referenceLink: desc.referenceLink || "",
          referenceLinkDisabled: !!desc.referenceLinkDisabled,
          figmaLink: desc.figmaLink || "",
          figmaLinkDisabled: !!desc.figmaLinkDisabled,
          taskdescription: Array.isArray(desc?.taskdescription)
            ? desc.taskdescription
            : [],
          files: Array.isArray(desc?.files)
            ? desc.files.map((file) => ({
              name: file.name || "",
              url: file.url || "",
              type: file.type || "",
            }))
            : [],
        };

        return formatted;
      })
      : [
        {
          storeLink: "",
          referenceLink: "",
          referenceLinkDisabled: false,
          figmaLink: "",
          figmaLinkDisabled: false,
          taskdescription: [],
          file: []
        },
      ];

    const newComments = generateComments(
      currentTask,
      editData,
      currentUser
    );

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
        comments: newComments,
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
          status: task.status,
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
      if (!selectedTaskObjects.length) {
        console.log("No tasks selected. Exiting.");
        return;
      }

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
        }, {
          onSuccess: (res) => console.log("Task updated successfully:", task._id, res),
          onError: (err) => console.error("Error updating task:", task._id, err),
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

    const selectedTaskObjectsTemp = projects.flatMap((project) =>
      Object.values(project.statusTask)
        .flat()
        .filter((task) => allSelectedTasks.includes(task._id))
        .map((task) => ({
          ...task,
          projectId: project._id,
          projectName: project.projectName,
        }))
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
          status: task.status,
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
        description: Array.isArray(task.description)
          ? task.description
          : [{ storeLink: "", referenceLink: "", figmaLink: "" }],
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
    statuses.forEach((status) => {
      const tasks = localProjects.flatMap((p) =>
        Object.entries(p.statusTask || {})
          .flatMap(([statusKey, tasksArray]) =>
            statusKey === status ? tasksArray.map((t) => t._id) : []
          )
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
  }, [statuses, localProjects]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // drag and drop//
  const handleDragEnd = useCallback(
    async (status, event) => {
      const { active, over } = event;

      if (!over || active.id === over.id) {
        console.log("No valid drop or same position. Exiting.");
        return;
      }
      const oldIndex = taskOrder[status].indexOf(active.id);
      const newIndex = taskOrder[status].indexOf(over.id);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
        console.warn("Active or Over ID not found, or indexes are same. Exiting.");
        return;
      }

      const newTaskOrder = arrayMove(taskOrder[status], oldIndex, newIndex);

      setTaskOrder(prev => {
        const updated = { ...prev, [status]: newTaskOrder };
        localStorage.setItem("taskOrder", JSON.stringify(updated));
        return updated;
      });

      localProjects.forEach(project => {
        const tasksInStatus = project.statusTask?.[status] || [];
        const taskMap = new Map(tasksInStatus.map(t => [t._id.toString(), t]));
        const reorderedTasks = newTaskOrder
          .map(id => taskMap.get(id))
          .filter(Boolean);

        if (reorderedTasks.length) {
          dragDropTaskMutation.mutate({
            projectId: project._id,
            status,
            taskOrder: reorderedTasks.map(t => t._id),
          });
        }
      });

    },
    [taskOrder, localProjects, dragDropTaskMutation]
  );

  useEffect(() => {
    if (!projects.length) return;

    const taskStatuses = new Set();

    projects.forEach((project) => {
      Object.keys(project.statusTask || {}).forEach((statusKey) => {
        if (project.statusTask[statusKey].length > 0)
          taskStatuses.add(statusKey);
      });
    });

    setStatuses((prev) => {
      const merged = new Set([...prev, ...taskStatuses]);
      return Array.from(merged);
    });
  }, [projects]);

  const toggleStatus = (status) => {
    setCollapsedStatuses((prev) => ({
      ...prev,
      [status]: !prev[status],
    }));
  };

  //renderTasks all task //
  const renderTasks = useCallback(
    (status) => {
      let allTasks = [];

      localProjects.forEach((project) => {
        Object.entries(project.statusTask || {}).forEach(([statusKey, tasksArray]) => {
          tasksArray.forEach(task => {
            allTasks.push({
              ...task,
              status: statusKey,
              projectId: project._id,
              projectName: project.projectName,
            });
          });
        });
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

  const tasksByStatus = useMemo(() => {
    const map = {};

    projects?.forEach((project) => {
      const statusTask = project.statusTask || {};

      Object.entries(statusTask).forEach(([status, tasks]) => {
        if (!map[status]) {
          map[status] = [];
        }
        map[status].push(...tasks);
      });
    });

    return map;
  }, [projects]);

  const getTaskCount = (status) => tasksByStatus[status]?.length || 0;
  //renderSections all task //
  const renderSection = useCallback(
    (status) => (
      <div className="mb-8">
        <div>
          {editingStatusName === status ? (
            <div className="inline-flex items-center gap-2" ref={statusRef}>
              <input
                type="text"
                value={renameInput}
                onChange={(e) => setRenameInput(e.target.value.toLowerCase())}
                className="px-2 py-1 border rounded text-sm outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleRenameStatus(status);
                  }
                  if (e.key === "Escape") setEditingStatusName(null);
                }}
                autoFocus
              />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <ChevronRight
                size={18}
                color="grey"
                className={`cursor-pointer transition-transform duration-200 ${collapsedStatuses[status] ? "" : "rotate-90"
                  }`}
                onClick={() => toggleStatus(status)}
              />
              <h2
                onDoubleClick={() => {
                  setEditingStatusName(status);
                  setRenameInput(status);
                }}
                className={`cursor-pointer font-normal inline-block text-sm px-2 py-1 rounded ${getStatusColor(status)}`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </h2> <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-gray-200 text-gray-700">
                {getTaskCount(status)}
              </span>
              <div className="relative">
                <Ellipsis
                  size={18}
                  color="grey"
                  className="cursor-pointer"
                  onClick={() =>
                    setOpenMenuStatus(openMenuStatus === status ? null : status)
                  }
                />
                {openMenuStatus === status && (
                  <div ref={menuRef}  className="absolute mt-2 left-0 bg-white shadow-lg rounded  z-50 w-40">
                    <Button
                      className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                      onClick={() => {
                        setEditingStatusName(status);
                        setRenameInput(status);
                        setOpenMenuStatus(null);
                      }}
                    >
                      Rename Status
                    </Button>
                  </div>
                )}
              </div>

            </div>

          )}
        </div>

        {!collapsedStatuses[status] && renderTasks(status)}
        {!collapsedStatuses[status] && (editingStatus !== status ? (
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
            <div className="w-[50%]">
              <Input
                type="text"
                className="flex w-[50%] px-2 py-1 outline-none text-[14px]"
                placeholder="Task Name or type for commands"
                value={taskInput[status]}
                onChange={(e) =>
                  setTaskInput((prev) => ({ ...prev, [status]: e.target.value }))
                }
              />
            </div>
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
        ))}
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
                  className="flex items-center px-3 py-1 bg-green-600 text-white rounded cursor-pointer hover:bg-green-700 transition-colors"
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
              {statuses.includes("todo") && (
                <div key="todo">{renderSection("todo")}</div>
              )}

              {statuses
                .filter((s) => s !== "todo")
                .map((status) => (
                  <div key={status}>{renderSection(status)}</div>
                ))}

              <div className="status-input mt-6 flex items-center gap-2 border border-input bg-[white] p-[3px] rounded-[6px]">
                <Plus size={14} color="grey" />
                <Input
                  ref={newStatusRef}
                  value={newStatusName}
                  onChange={(e) => setNewStatusName(e.target.value.toLowerCase())}
                  placeholder="Add new status"
                  className="p-[0] border-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0"
                />
              </div>
            </>
          )}
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
                      className="w-full rounded px-2 py-1 mb-4 text-[25px] border-gray-400 outline-none focus:ring-1 focus:ring-gray-200 resize-none"
                      value={editData.title}
                      onChange={handleInput}
                      rows={1}
                      placeholder="Enter text..."
                    />
                    <div>
                      <div className="flex items-center gap-[50px] mb-4">
                        <span className="flex items-center gap-[5px] min-w-[150px]">
                          <CircleStop size={16} />
                          <span className="font-medium text-gray-700">
                            Status
                          </span>
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-sm font-semibold uppercase ${getStatusColor(editData.status || "")}`}
                        >
                          {editData.status || "-"}
                        </span>
                      </div>
                      <div className="flex items-center gap-[50px] mb-4 date-popup">
                        <span className="flex items-center gap-[5px] min-w-[150px]">
                          <Calendar size={16} />
                          <span className="font-medium text-gray-700">
                            Dates
                          </span>
                        </span>
                        <div className="relative date-filter">
                          <div
                            className="w-full border rounded px-2 py-1 cursor-pointer hover:bg-gray-50"
                            onClick={() => setShowDatePicker("edit")}
                          >
                            {editData.dueDate
                              ? new Date(editData.dueDate).toLocaleDateString()
                              : "Select due date"}
                          </div>
                          {showDatePicker === "edit" && (
                            <SmartDatePicker
                              open={true}
                              setOpen={() => setShowDatePicker(null)}
                              selected={
                                editData.dueDate
                                  ? new Date(editData.dueDate)
                                  : null
                              }
                              setSelected={(d) => {
                                setEditData((prev) => ({
                                  ...prev,
                                  dueDate: d,
                                }));
                                setShowDatePicker(null);
                              }}
                            />
                          )}
                        </div>
                      </div>
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
                            onChange={(level) =>
                              setEditData((d) => ({
                                ...d,
                                priority: level,
                              }))
                            }
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-[50px] mb-4">
                        <span className="flex items-center gap-[5px] min-w-[150px]">
                          <Users size={16} />
                          <span className="font-medium text-gray-700">
                            Assigned
                          </span>
                        </span>
                        <div className="relative flex items-center gap-[10px]">
                          <TaskEmployees
                            selected={editData.assignedEmployees}
                            onChange={(arr) =>
                              setEditData((d) => ({
                                ...d,
                                assignedEmployees: arr,
                              }))
                            }
                            employees={employees}
                          />
                          {editData.assignedEmployees
                            .map(
                              (id) =>
                                employees.find((e) => e._id === id)?.fullName ||
                                employees.find((e) => e._id === id)?.username
                            )
                            .filter(Boolean)
                            .join(", ")}
                        </div>
                      </div>
                    </div>
                    <div className="w-full mx-auto mt-10">
                      <TaskDetails editData={editData} setEditData={setEditData} />
                    </div>
                    <button
                      className="absolute top-2 right-2 text-gray-500 hover:text-gray-800 text-xl font-bold transition-colors"
                      onClick={handleClosePopup}
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="w-[30%]">
                    <div className="p-[20px] border-b border-gray-400 text-sm font-medium">
                      Activity
                    </div>
                    <div className="p-[20px] text-[12px] bg-[#f9f9f9]">
                      <CommentsSection comments={editData.comments || []} />
                      <div className="flex gap-2 mt-2">
                        <Input
                          type="text"
                          className="flex-1 outline-none border border-gray-300 rounded px-3 py-2 focus:border-blue-500"
                          placeholder="Add a comment"
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              handleAddComment();
                            }
                          }}
                        />
                        <div>
                          <TaskEmployees
                            employees={employees}
                            selected={commentEmployees}
                            onChange={(arr) => {
                              setCommentEmployees(arr);
                            }}
                            className="comment-dropdown"
                          />
                        </div>
                        <button
                          className="bg-blue-500 text-white p-2 rounded hover:bg-blue-600 transition-colors flex justify-center h-[35px] w-[35px]"
                          onClick={handleAddComment}
                        >
                          <SendHorizontal size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div
            className={`
          fixed bottom-4 left-1/2 -translate-x-[40%] w-[100%] max-w-6xl 
          p-3 bg-[#202020] text-white text-[14px] font-light border rounded gap-4
          transition-transform duration-300 ease-in-out
          ${allSelectedTasks.length > 0
                ? "translate-y-0 opacity-100"
                : "translate-y-[120%] opacity-0 pointer-events-none"
              }
          `}
          >
            <div className="flex items-center justify-between">
              <span className="text-[14px]">
                {allSelectedTasks.length} Task
                {allSelectedTasks.length > 1 ? "s" : ""} selected
              </span>
              <div className="flex items-center gap-[10px]" ref={statusRef}>
                <div className="px-2 py-1 cursor-pointer flex items-center gap-[5px] relative">
                  <div
                    className="flex items-center gap-[5px]"
                    onClick={() => setShowStatusDropdown((prev) => !prev)}
                  >
                    <CircleStop size={16} />
                    <span>Status</span>
                  </div>

                  {showStatusDropdown && (
                    <div className="absolute bottom-full left-0 mb-4 w-32 bg-white border rounded shadow-lg z-50">
                      {[...new Set(statuses)]
                        .filter((status) => status !== "todo")
                        .map((status) => {
                          const isActive = selectedTaskObjects.every(
                            (task) => task.status === status
                          );
                          return (
                            <div
                              key={status}
                              className={`px-3 py-2 cursor-pointer text-gray-800  ${isActive ? "bg-[#7df0fd] text-white font-semibold" : ""
                                }`}
                              onClick={() => handleBulkStatusUpdate(status)}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
                <div className="px-2 py-1 cursor-pointer flex items-center gap-[5px] hover:bg-white hover:bg-opacity-20 rounded transition-colors">
                  <TaskEmployees
                    selected={commonAssignees}
                    onChange={handleBulkAssigneeUpdate}
                    employees={employees}
                    className="task-dropdown"
                  />
                </div>

                <div className="px-2 py-1 cursor-pointer flex items-center gap-[5px] relative text-white hover:bg-white hover:bg-opacity-20 rounded transition-colors">
                  <div className="bulkdate-calender flex">
                    <SmartDatePicker
                      open={showDatePicker === "bulk"}
                      setOpen={(v) =>
                        setShowDatePicker(v ? "bulk" : null)
                      }
                      selected={bulkDueDate}
                      setSelected={(d) => {
                        setBulkDueDate(d);
                        handleBulkDateUpdate(d);
                        setShowDatePicker(null);
                      }}
                    />
                  </div>
                </div>

                <div
                  className="px-2 py-1 cursor-pointer hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                  onClick={handleCopyTasks}
                >
                  <Copy size={16} />
                </div>
                <div
                  className="px-2 py-1 text-red-600 cursor-pointer hover:bg-white hover:bg-opacity-20 rounded transition-colors"
                  onClick={handleDeleteTasks}
                >
                  <Trash size={16} />
                </div>
              </div>
            </div>
          </div>

          {toastMessage && (
            <SucessToast type={toastType} message={toastMessage} />
          )}
        </div>
      </div>
    </ManagementLayout>
  );
}