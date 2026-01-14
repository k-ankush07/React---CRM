import { useState, useRef, useEffect, useMemo, useCallback, useLayoutEffect } from "react";
import SucessToast from "../ui/SucessToast";
import ManagementLayout from "./ManagementLayout";
import {
  useEmployees, useUser, useCreateProject, useProjects, useUpdateProject, useDeleteTask, useRenameProjectStatus,
  useDragDropTask, useAddProjectStatus, useDeleteStatus
} from "../Use-auth";
import SmartDatePicker from "../ui/SmartDatePicker";
import TaskPriority from "../ui/TaskPriority";
import TaskEmployees from "../ui/TaskEmployees";
import { useDateRange } from "./DateRangeContext";
import {
  Calendar, Plus, CircleCheck, Flag, CircleStop, Users, GripVertical, X, SendHorizontal,
  CircleDot, ChevronRight, Ellipsis, ClockFading
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
import TaskTimeline from "../ui/TaskTimeline ";
import BulkActionsBar from "../ui/BulkActionsBar ";
import TaskDescriptionPopup from "../ui/TaskDescriptionPopup ";
import TeamDetialis from "../ui/TeamProject";
import ProjectTab from "../ui/ProjectTab";
import ProjectCalender from "../ui/ProjectCalender";

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
  const addStatusMutation = useAddProjectStatus();
  const deleteStatusMutation = useDeleteStatus();
  const [statuses, setStatuses] = useState([]);
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
        referenceLinkEnabled: false,
        figmaLink: "",
        figmaLinkDisabled: false,
        taskdescription: [],
        files: [],
      },
    ],
    priority: "",
    status: [],
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
  const [active, setActive] = useState("list");

  // Refs
  const addTaskRef = useRef(null);
  const statusRef = useRef(null);
  const textareaRef = useRef(null);
  const menuRef = useRef(null);
  const newStatusWrapperRef = useRef(null);

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
    if (active === "team") {
      setSelectedTasks({});
    }
    if (active === "calendar") {
      setSelectedTasks({});
    }
  }, [active]);

  useEffect(() => {
    localStorage.setItem("projectsOrder", JSON.stringify(projectOrder));
  }, [projectOrder]);

  const handleInput = (e) => {
    setEditData((d) => ({ ...d, title: e.target.value }));
  };

  useLayoutEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [editData.title]);

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

  const handleClickOutside = useCallback(
    (e) => {
      if (
        !newStatusWrapperRef.current ||
        newStatusWrapperRef.current.contains(e.target)
      ) {
        return;
      }

      const trimmed = newStatusName.trim().toLowerCase();

      if (!trimmed) return;
      if (statuses.includes(trimmed)) {
        setNewStatusName("");
        return;
      }
      if (!activeProjectId) return;
      if (addStatusMutation.isLoading) return;

      addStatusMutation.mutate(
        { projectId: activeProjectId, status: trimmed },
        {
          onSuccess: () => {
            setNewStatusName("");
            refetch();
          },
          onError: (err) => {
            console.error("Add status failed:", err);
            setToastMessage(err.message || "Failed to add status");
            setToastType("error");
          },
        }
      );
    },
    [
      newStatusName,
      statuses,
      activeProjectId,
      addStatusMutation,
      refetch,
    ]
  );

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [handleClickOutside]);

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
          createdByTask: {
            userId: currentUser?.userId || "Unknown",
            fullName: currentUser?.fullName || "Unknown",
            email: currentUser?.email || "unknown@hubsyntax.com",
          },
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
    const createdByTask = {
      userId: currentUser?.userId || "Unknown",
      fullName: currentUser?.fullName || "Unknown",
      email: currentUser?.email || "unknown@hubsyntax.com",
    };
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
          createdByTask
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
  const handleDeleteTasks = useCallback(async () => {
    if (!selectedTaskObjects.length) return;

    try {
      for (const task of selectedTaskObjects) {
        await deleteProject.mutateAsync({
          projectId: activeProjectId,
          taskId: task._id,
        });
      }
      setSelectedTasks({});
      setToastMessage("Selected tasks deleted successfully!");
      setToastType("success");
      refetch();
    } catch (err) {
      console.error("Delete failed:", err);
      setToastMessage("Error deleting tasks");
      setToastType("error");
    }
  }, [selectedTaskObjects, deleteProject, refetch, activeProjectId]);

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

    const createdByTask = {
      userId: currentUser?.userId || "Unknown",
      fullName: currentUser?.fullName || "Unknown",
      email: currentUser?.email || "unknown@hubsyntax.com",
    };
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
        createdByTask
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
      createdAt: new Date().toISOString(),
    };

    setEditData((prev) => ({
      ...prev,
      comments: prev.comments
        ? [...prev.comments, newComment]
        : [newComment],
    }));

    setCommentText("");
    setCommentEmployees([]);

    if (currentTask?._id && currentTask.projectId) {
      updateProject.mutate(
        {
          id: currentTask.projectId,
          taskId: currentTask._id,
          status: currentTask.status || "",
          comments: [newComment],
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
  }, [
    commentText,
    commentEmployees,
    currentTask,
    currentUser,
    employees,
    updateProject,
    refetch,
  ]);

  useEffect(() => {
    if (!allSelectedTasks.length) {
      if (bulkDueDate !== null) setBulkDueDate(null);
      return;
    }

    const relevantTasks = projects.flatMap((project) =>
      Object.values(project.statusTask || {}).flatMap((tasks) =>
        tasks.map((task) => ({
          id: task._id,
          dueDate: task.dueDate ? new Date(task.dueDate).getTime() : null,
        }))
      )
    );

    const selectedTasksDates = relevantTasks
      .filter((t) => allSelectedTasks.includes(t.id))
      .map((t) => t.dueDate)
      .filter(Boolean);

    const allSame =
      selectedTasksDates.length > 0 &&
      selectedTasksDates.every((d) => d === selectedTasksDates[0]);

    const newBulkDate = allSame ? new Date(selectedTasksDates[0]) : null;

    if (bulkDueDate?.getTime() !== newBulkDate?.getTime()) {
      setBulkDueDate(newBulkDate);
    }
  }, [allSelectedTasks, bulkDueDate, projects.length]);

  // bulk date update  functions//
  const handleBulkDateUpdate = useCallback(
    (date) => {
      const currentUserName = currentUser?.username || "Unknown";
      const createdByTask = {
        userId: currentUser?.userId || "Unknown",
        fullName: currentUser?.fullName || "Unknown",
        email: currentUser?.email || "unknown@hubsyntax.com",
      };

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
          createdByTask,
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
        description: Array.isArray(task.description) && task.description.length
          ? task.description
          : [
            {
              storeLink: "",
              referenceLink: "",
              referenceLinkEnabled: false,
              figmaLink: "",
              figmaLinkDisabled: false,
              taskdescription: [],
              files: []
            }
          ],
        priority: task.priority || "",
        status: task.status || "",
        employeesName: task.assignedEmployees?.map((e) => e.username) || [],
        dueDate: task.dueDate ? new Date(task.dueDate) : null,
        assignedEmployees: task.assignedEmployees?.map((e) => e._id) || [],
        comments: task.comments || [],
        timeline: task.timeline || []
      });

      setShowDescriptionPopup(true);
    }, [task, activeProjectId]);

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className="group flex items-center justify-between bg-white px-3 py-2 rounded-md shadow-sm hover:bg-gray-50 cursor-pointer mb-2"      >
        <div
          className="flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          {...listeners}
        >
          <GripVertical size={16} className="text-gray-500" />
        </div>

        <div className="w-[30px] flex items-center justify-center">
          <input
            type="checkbox"
            className={`
      cursor-pointer transition-opacity
      ${selectedTasksProp[status]?.includes(task._id)
                ? "opacity-100"
                : "opacity-0 group-hover:opacity-100"
              }
    `}
            checked={selectedTasksProp[status]?.includes(task._id)}
            onChange={() => toggleTask(status, task._id)}
          />
        </div>
        <div className="flex items-center justify-center rounded-full bg-[#299764] text-white mr-[10px]">
          <CircleCheck size={16} />
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

  const activeProject = useMemo(
    () => projects.find((p) => p._id === activeProjectId),
    [projects, activeProjectId]
  );

  useEffect(() => {
    if (!activeProject) {
      setStatuses((prev) => (prev.length ? [] : prev));
      return;
    }

    const nextStatuses = Object.keys(activeProject.statusTask || {});
    setStatuses((prev) =>
      prev.length === nextStatuses.length &&
        prev.every((s, i) => s === nextStatuses[i])
        ? prev
        : nextStatuses
    );
  }, [activeProject]);

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
                <div className="w-2/5 ">Name</div>
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

  const dhandle = (statusToDelete) => {
    if (!activeProjectId) return;

    if (!window.confirm(`Delete status "${statusToDelete}" and all its tasks?`)) {
      return;
    }

    deleteStatusMutation.mutate(
      {
        projectId: activeProjectId,
        status: statusToDelete,
      },
      {
        onSuccess: () => {
          setOpenMenuStatus(null);
          refetch();
        },
        onError: (err) => {
          console.error(err);
          setToastMessage(err.message || "Failed to remove status");
          setToastType("error");
        },
      }
    );
  };

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
                  if (e.key === "Escape") {
                    setEditingStatusName(null);
                  }
                }}
                onBlur={() => handleRenameStatus(status)}
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
                {status.toUpperCase()}
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
                  <div ref={menuRef} className="absolute mt-2 flex flex-wrap gap-[2px] p-[5px] left-0 bg-white shadow-lg rounded  z-50 w-40">
                    <Button
                      className="btn-wrap block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                      onClick={() => {
                        setEditingStatusName(status);
                        setRenameInput(status);
                        setOpenMenuStatus(null);
                      }}
                    >
                      Rename Status
                    </Button>
                    <Button
                      className="btn-wrap block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                      onClick={() => dhandle(status)}
                    >
                      Remove Status
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
            className="flex items-center gap-2  p-2 bg-white mt-[10px] rounded-md shadow-sm hover:bg-gray-50 cursor-pointer mb-2"
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
  const timelineArray = useMemo(() => {
    if (!editData?.timeline) return [];
    return Array.isArray(editData.timeline)
      ? editData.timeline
      : [editData.timeline];
  }, [editData?.timeline]);

  if (isLoading) return <p className="p-6"></p>;
  if (error)
    return <p className="p-6 text-red-600"></p>;

  return (
    <ManagementLayout>
      <div className="relative h-[90.7vh]">
        <div
          className="absolute w-full h-[100%] opacity-[0.1] bg-[url('https://www.hubsyntax.com/uploads/prodcutpages.webp')] bg-cover bg-center rounded-xl shadow-md border border-gray-200"
        ></div>
        <div className="relative z-20 h-full overflow-y-auto p-6">
          <ProjectTab
            setActive={setActive}
            active={active}
          />
          {renderProjectTasks()}

          {active === "calendar" &&
            <ProjectCalender
              project={projects}
              activeProjectId={activeProjectId}
              getStatusColor={getStatusColor}
            />}

          {active === "team" && (
            <TeamDetialis
              project={projects}
              activeProjectId={activeProjectId}
              statuses={statuses}
              user={currentUser}
            />
          )}
          <div>
            {active === "list" && (
              <>
                {activeProjectId && (
                  <>
                    {statuses.map((status) => (
                      <div key={status}>{renderSection(status)}</div>
                    ))}

                    <div className="status-input w-[50%] mt-6 flex items-center gap-2 border border-input bg-[white] pl-[10px] pt-[3px] rounded-[6px]">
                      <Plus size={14} color="grey" />
                      <div
                        className="w-[100%]"
                        ref={newStatusWrapperRef} >
                        <Input
                          value={newStatusName}
                          onChange={(e) =>
                            setNewStatusName(e.target.value.toLowerCase())
                          }
                          placeholder="Add new status (e.g. review)"
                          className="p-[0] border-0 outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0"
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
          <TaskDescriptionPopup
            showDescriptionPopup={showDescriptionPopup}
            currentTask={currentTask}
            CircleDot={CircleDot}
            textareaRef={textareaRef}
            editData={editData}
            setEditData={setEditData}
            handleInput={handleInput}
            CircleStop={CircleStop}
            setShowDatePicker={setShowDatePicker}
            Calendar={Calendar}
            showDatePicker={showDatePicker}
            Flag={Flag}
            Users={Users}
            TaskPriority={TaskPriority}
            TaskEmployees={TaskEmployees}
            ClockFading={ClockFading}
            TaskTimeline={TaskTimeline}
            TaskDetails={TaskDetails}
            X={X}
            handleClosePopup={handleClosePopup}
            CommentsSection={CommentsSection}
            handleAddComment={handleAddComment}
            setCommentText={setCommentText}
            commentText={commentText}
            setCommentEmployees={setCommentEmployees}
            SendHorizontal={SendHorizontal}
            getStatusColor={getStatusColor}
            SmartDatePicker={SmartDatePicker}
            employees={employees}
            timelineArray={timelineArray}
            commentEmployees={commentEmployees}
            Input={Input}
            currentUser={currentUser}
          />

          <BulkActionsBar
            allSelectedTasks={allSelectedTasks}
            selectedTaskObjects={selectedTaskObjects}
            statuses={statuses}
            showStatusDropdown={showStatusDropdown}
            setShowStatusDropdown={setShowStatusDropdown}
            commonAssignees={commonAssignees}
            handleBulkAssigneeUpdate={handleBulkAssigneeUpdate}
            employees={employees}
            showDatePicker={showDatePicker}
            setShowDatePicker={setShowDatePicker}
            bulkDueDate={bulkDueDate}
            setBulkDueDate={setBulkDueDate}
            handleBulkDateUpdate={handleBulkDateUpdate}
            handleBulkStatusUpdate={handleBulkStatusUpdate}
            handleCopyTasks={handleCopyTasks}
            handleDeleteTasks={handleDeleteTasks}
            statusRef={statusRef}
          />
          {toastMessage && (
            <SucessToast type={toastType} message={toastMessage} />
          )}
        </div>
      </div>
    </ManagementLayout>
  );
}