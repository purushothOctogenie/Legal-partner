import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import {
  CheckSquare,
  AlertCircle,
  Plus,
  Calendar,
  Users,
  Tag,
  MoreVertical,
  Trash2,
  Mail,
  User,
  X,
  Loader2,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useMongoDB } from "../../hooks/useMongoDB";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../contexts/AuthContext";
import { format } from "date-fns";
import axios from "axios";

interface Assignee {
  email: string;
  name: string;
}

interface Task {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: Date;
  assignedTo: Array<{ email: string; name: string }>;
  assignedBy: { email: string; name: string };
  caseId: string;
  clientId: string;
  category: string;
  notes: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskForm: React.FC<{
  onSubmit: (data: Partial<Task>) => void;
  initialData?: Partial<Task>;
  onCancel: () => void;
  isAdmin?: boolean;
}> = ({ onSubmit, initialData, onCancel, isAdmin }) => {
  const [formData, setFormData] = useState<Partial<Task>>(
    initialData || {
      title: "",
      description: "",
      priority: "medium",
      status: "pending",
      dueDate: new Date(),
      assignedTo: [],
      caseId: "",
      clientId: "",
      category: "Legal Research",
      notes: "",
    }
  );
  const [newAssignee, setNewAssignee] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const [employees, setEmployees] = useState<
    Array<{ email: string; name: string }>
  >([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);

  // Fetch employees if user is admin
  useEffect(() => {
    const fetchEmployees = async () => {
      if (user?.userType === "admin") {
        setLoadingEmployees(true);
        try {
          const response = await axios.get("/api/firm/users", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
            },
          });

          if (Array.isArray(response.data)) {
            const employeeList = response.data
              .filter(
                (emp: any) =>
                  emp.userType !== "admin" && emp.status === "approved"
              )
              .map((emp: any) => ({
                email: emp.email,
                name: `${emp.firstName} ${emp.lastName}`,
              }));
            setEmployees(employeeList);
          }
        } catch (error) {
          console.error("Error fetching employees:", error);
        } finally {
          setLoadingEmployees(false);
        }
      }
    };

    fetchEmployees();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("You must be logged in to update a task");
      return;
    }

    try {
      setIsSubmitting(true);

      // For non-admin users, only send status update
      const taskData = isAdmin ? formData : { status: formData.status };

      await onSubmit(taskData);
    } catch (err) {
      console.error("Error submitting task:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit task";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddAssignee = () => {
    if (!newAssignee.trim()) return;

    if (user?.userType === "admin") {
      // For admin users, find the selected employee
      const selectedEmployee = employees.find(
        (emp) => emp.email === newAssignee
      );
      if (selectedEmployee) {
        setFormData((prev) => ({
          ...prev,
          assignedTo: [...(prev.assignedTo || []), selectedEmployee],
        }));
      }
    } else {
      // For non-admin users, only allow self-assignment
      if (newAssignee.toLowerCase() === "self") {
        if (!user || !user.email) {
          alert("Cannot assign to self: user email not found");
          return;
        }
        const assignee: Assignee = { email: user.email, name: "Self" };
        setFormData((prev) => ({
          ...prev,
          assignedTo: [...(prev.assignedTo || []), assignee],
        }));
      } else {
        alert("You can only assign tasks to yourself");
      }
    }
    setNewAssignee("");
  };

  const handleRemoveAssignee = (email: string) => {
    setFormData((prev) => ({
      ...prev,
      assignedTo: prev.assignedTo?.filter((a) => a.email !== email) || [],
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {isAdmin ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-300">
              Task Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.title || ""}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Status <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.status || "pending"}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
              required
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="on-hold">On Hold</option>
              <option value="review">Under Review</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Category <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.category || ""}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
              className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
              required
            >
              <option value="Legal Research">Legal Research</option>
              <option value="Document Review">Document Review</option>
              <option value="Court Filing">Court Filing</option>
              <option value="Client Meeting">Client Meeting</option>
              <option value="Case Analysis">Case Analysis</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Priority <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.priority || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  priority: e.target.value as
                    | "low"
                    | "medium"
                    | "high"
                    | "urgent",
                })
              }
              className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
              required
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300">
              Due Date <span className="text-red-400">*</span>
            </label>
            <input
              type="date"
              value={
                formData.dueDate
                  ? new Date(formData.dueDate).toISOString().split("T")[0]
                  : ""
              }
              onChange={(e) =>
                setFormData({ ...formData, dueDate: new Date(e.target.value) })
              }
              className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300">
              Description
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300">
              Related Case <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.caseId || ""}
              onChange={(e) =>
                setFormData({ ...formData, caseId: e.target.value })
              }
              className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
              placeholder="Enter case ID or reference"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300">
              Related Client <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.clientId || ""}
              onChange={(e) =>
                setFormData({ ...formData, clientId: e.target.value })
              }
              className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
              placeholder="Enter client ID or reference"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300">
              Notes
            </label>
            <textarea
              value={formData.notes || ""}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              rows={3}
              className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
              placeholder="Add any additional notes or comments"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300">
              Assign Task
            </label>
            <div className="mt-1 flex space-x-2">
              {user?.userType === "admin" ? (
                <select
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                >
                  <option value="">Select an employee</option>
                  {loadingEmployees ? (
                    <option value="" disabled>
                      Loading employees...
                    </option>
                  ) : (
                    employees.map((emp) => (
                      <option key={emp.email} value={emp.email}>
                        {emp.name} ({emp.email})
                      </option>
                    ))
                  )}
                </select>
              ) : (
                <input
                  type="text"
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  placeholder="Enter 'self' to assign to yourself"
                  className="flex-1 bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
                />
              )}
              <button
                type="button"
                onClick={handleAddAssignee}
                className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600"
              >
                Add
              </button>
            </div>
            {formData.assignedTo && formData.assignedTo.length > 0 && (
              <div className="mt-2 space-y-2">
                {formData.assignedTo.map((assignee, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-gray-800/50 p-2 rounded-md"
                  >
                    <div className="flex items-center space-x-2">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">
                        {assignee.email}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAssignee(assignee.email)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-sm font-medium text-gray-300">
            Status <span className="text-red-400">*</span>
          </label>
          <select
            value={formData.status || "pending"}
            onChange={(e) =>
              setFormData({ ...formData, status: e.target.value })
            }
            className="mt-1 block w-full bg-gray-800 border border-gray-700 rounded-md shadow-sm py-2 px-3 text-white"
            required
          >
            <option value="pending">Pending</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="on-hold">On Hold</option>
            <option value="review">Under Review</option>
          </select>
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-700 rounded-md text-gray-300 hover:bg-gray-800"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600 flex items-center space-x-2"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Updating...</span>
            </>
          ) : (
            <span>Update Status</span>
          )}
        </button>
      </div>
    </form>
  );
};

const Tasks = () => {
  const { user } = useAuth();
  const {
    data: tasks = [],
    loading,
    error,
    addItem,
    deleteItem,
    updateItem,
  } = useMongoDB("tasks");
  const { t } = useTranslation();
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    priority: "",
    status: "",
    category: "",
  });

  // Process and normalize task data
  const processTaskData = useCallback((task: any): Task => {
    return {
      id: task._id,
      title: task.title,
      description: task.description || "",
      status: task.status || "pending",
      priority: task.priority || "medium",
      dueDate: task.dueDate ? new Date(task.dueDate) : new Date(),
      assignedTo: task.assignedTo || [],
      assignedBy: {
        email: task.assignedBy?.email || task.userId || "",
        name: task.assignedBy?.name || "Unknown",
      },
      caseId: task.caseId || "",
      clientId: task.clientId || "",
      category: task.category || "Legal Research",
      notes: task.notes || "",
      userId: task.userId,
      createdAt: task.createdAt ? new Date(task.createdAt) : new Date(),
      updatedAt: task.updatedAt ? new Date(task.updatedAt) : new Date(),
    };
  }, []);

  // Update local tasks when MongoDB data changes
  useEffect(() => {
    if (tasks && Array.isArray(tasks)) {
      const processedTasks = tasks.map(processTaskData);
      setLocalTasks(processedTasks);
    }
  }, [tasks, processTaskData]);

  const handleSubmit = async (formData: Partial<Task>) => {
    try {
      setIsSubmitting(true);

      if (!formData.title?.trim() || !formData.dueDate) {
        throw new Error("Please fill in all required fields");
      }

      const taskData = {
        ...formData,
        userId: user?.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        status: formData.status || "pending",
        priority: formData.priority || "medium",
        assignedTo: formData.assignedTo || [],
        caseId: formData.caseId || "",
        clientId: formData.clientId || "",
        notes: formData.notes || "",
        dueDate: new Date(formData.dueDate),
        category: formData.category || "Legal Research",
        assignedBy: {
          email: user?.email || "",
          name:
            user?.firstName && user?.lastName
              ? `${user.firstName} ${user.lastName}`
              : user?.email || "Unknown",
        },
      };

      const result = await addItem(taskData);
      if (result) {
        const processedTask = processTaskData(result);
        setLocalTasks((prev) => [...prev, processedTask]);
      }
      setIsAddingTask(false);
    } catch (err) {
      console.error("Error submitting task:", err);
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit task";
      alert(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTask = async (taskId: string, updates: any) => {
    try {
      // For non-admin users, only allow status updates
      if (user?.userType !== "admin") {
        updates = { status: updates.status };
      }

      const response = await axios.put(`/api/tasks/${taskId}`, updates, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("auth_token")}`,
        },
      });

      if (response.data) {
        const updatedTask = processTaskData(response.data);
        setLocalTasks((prev) =>
          prev.map((task) => (task.id === taskId ? updatedTask : task))
        );
        setIsDetailsModalOpen(false);
        alert("Task updated successfully");
      }
    } catch (error) {
      console.error("Error updating task:", error);
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          alert("Your session has expired. Please log in again.");
          // Optionally redirect to login page
        } else if (error.response?.status === 403) {
          alert("You don't have permission to update this task.");
        } else {
          alert(
            error.response?.data?.error ||
              "Failed to update task. Please try again."
          );
        }
      } else {
        alert("Failed to update task. Please try again.");
      }
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!deleteItem) return;
    try {
      const confirmDelete = window.confirm(
        "Are you sure you want to delete this task?"
      );
      if (confirmDelete) {
        await deleteItem(taskId);
        setIsDetailsModalOpen(false);
      }
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "high":
        return "bg-red-500/20 text-red-400";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400";
      case "low":
        return "bg-green-500/20 text-green-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "completed":
        return "bg-green-500/20 text-green-400";
      case "in-progress":
        return "bg-blue-500/20 text-blue-400";
      case "pending":
        return "bg-yellow-500/20 text-yellow-400";
      case "cancelled":
        return "bg-red-500/20 text-red-400";
      case "on-hold":
        return "bg-purple-500/20 text-purple-400";
      case "review":
        return "bg-orange-500/20 text-orange-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      if (typeof date === "string") {
        date = new Date(date);
      }
      return format(date, "MMM dd, yyyy");
    } catch (e) {
      console.error("Error formatting date:", e);
      return "Invalid date";
    }
  };

  // Filter tasks based on user role, assignments, and active tab
  const filteredTasks = useMemo(() => {
    if (!localTasks) return [];

    return localTasks.filter((task) => {
      // First filter by user role and assignments
      const isVisibleToUser =
        user?.userType === "admin" ||
        task.assignedTo.some(
          (assignee: { email: string }) => assignee.email === user?.email
        );

      if (!isVisibleToUser) return false;

      // Then filter by active tab
      switch (activeTab.toLowerCase()) {
        case "all":
          return true;
        case "pending":
          return task.status.toLowerCase() === "pending";
        case "in progress":
          return task.status.toLowerCase() === "in-progress";
        case "completed":
          return task.status.toLowerCase() === "completed";
        default:
          return true;
      }
    });
  }, [localTasks, user, activeTab]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Task Management</h1>
        <p className="mt-2 text-gray-300">
          Organize and track case-related tasks
        </p>
        <button
          onClick={() => setIsAddingTask(true)}
          className="mt-4 flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add New Task</span>
        </button>
      </div>

      {isAddingTask && (
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 p-6">
          <TaskForm
            onSubmit={handleSubmit}
            onCancel={() => setIsAddingTask(false)}
            isAdmin={user?.userType === "admin"}
          />
        </div>
      )}

      <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden">
        <div className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-6">
            <div className="flex space-x-4">
              {[
                { id: "all", label: "All" },
                { id: "pending", label: "Pending" },
                { id: "in progress", label: "In Progress" },
                { id: "completed", label: "Completed" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-md text-sm font-medium ${
                    activeTab === tab.id
                      ? "bg-primary-500 text-white"
                      : "text-gray-300 hover:bg-gray-800"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              </div>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="p-2 hover:bg-gray-800 rounded-md"
              >
                <Filter className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mb-6 p-4 bg-gray-800/50 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Priority
                  </label>
                  <select
                    value={filters.priority}
                    onChange={(e) =>
                      setFilters({ ...filters, priority: e.target.value })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  >
                    <option value="">All Priorities</option>
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Status
                  </label>
                  <select
                    value={filters.status}
                    onChange={(e) =>
                      setFilters({ ...filters, status: e.target.value })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  >
                    <option value="">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) =>
                      setFilters({ ...filters, category: e.target.value })
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-white"
                  >
                    <option value="">All Categories</option>
                    <option value="legal research">Legal Research</option>
                    <option value="document review">Document Review</option>
                    <option value="court filing">Court Filing</option>
                    <option value="client meeting">Client Meeting</option>
                    <option value="case analysis">Case Analysis</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary-400" />
              <span className="ml-2 text-gray-300">Loading tasks...</span>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center py-8 text-red-400">
              <AlertCircle className="w-8 h-8" />
              <span className="ml-2">Error: {error}</span>
            </div>
          ) : filteredTasks.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No tasks found</p>
              <p className="text-sm mt-1">
                Create your first task by clicking "Add New Task"
              </p>
            </div>
          ) : (
            <div className="flex flex-col space-y-4">
              {filteredTasks.map((task, index) => (
                <motion.div
                  key={task.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-gray-800/50 hover:bg-gray-800/70 rounded-lg p-4 border border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="p-2 bg-primary-500/20 rounded-lg">
                        <CheckSquare className="w-6 h-6 text-primary-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-white">
                          {task.title}
                        </h3>
                        <div className="flex items-center mt-1 space-x-2">
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getPriorityColor(
                              task.priority
                            )}`}
                          >
                            {task.priority}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${getStatusColor(
                              task.status
                            )}`}
                          >
                            {task.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => {
                          setSelectedTask(task);
                          setIsDetailsModalOpen(true);
                        }}
                        className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                  <p className="mt-2 text-gray-300">{task.description}</p>
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm">
                        Due: {formatDate(task.dueDate)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Users className="w-4 h-4" />
                      <div className="flex flex-col">
                        <span className="text-sm">
                          {task.assignedTo?.length || 0} Assigned
                        </span>
                        {task.assignedTo?.length > 0 && (
                          <div className="text-xs text-gray-400">
                            {task.assignedTo.map((a, i) => (
                              <span key={i} className="mr-2">
                                {a.name === "Self" ? "You" : a.email}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 text-gray-300">
                      <Tag className="w-4 h-4" />
                      <span className="text-sm">{task.category}</span>
                    </div>
                    {task.assignedBy && (
                      <div className="flex items-center space-x-2 text-gray-300">
                        <User className="w-4 h-4" />
                        <span className="text-sm">
                          Assigned by: {task.assignedBy.name}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Task Details Modal */}
      {isDetailsModalOpen && selectedTask && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-gray-900/90 rounded-xl border border-gray-800 p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">
                {selectedTask.title}
              </h2>
              <div className="flex items-center space-x-2">
                {user?.userType === "admin" && (
                  <button
                    onClick={() => handleDeleteTask(selectedTask.id)}
                    className="p-2 text-red-400 hover:bg-red-500/10 border border-red-500 rounded-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="p-2 hover:bg-gray-800 rounded-lg"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>
            </div>

            <TaskForm
              onSubmit={(updates) => handleUpdateTask(selectedTask.id, updates)}
              initialData={selectedTask}
              onCancel={() => setIsDetailsModalOpen(false)}
              isAdmin={user?.userType === "admin"}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
