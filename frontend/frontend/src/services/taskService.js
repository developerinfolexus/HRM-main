import api from './api';

// Utility: Check if task is overdue
export const isOverdue = (task) => {
    if (!task.dueDate || task.status === 'Completed' || task.status === 'Cancelled') return false;
    return new Date(task.dueDate) < new Date();
};

// Create Task (Team Lead) - supports multipart/form-data
export const createTask = async (formData) => {
    const isFormData = formData instanceof FormData;
    const response = await api.post('/tasks', formData, {
        headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {}
    });
    return response.data;
};

// Get All Tasks (Admin/Manager) - supports filters, search, pagination
export const getAllTasks = async (filters = {}) => {
    // Build query params, exclude empty values
    const params = {};
    Object.keys(filters).forEach(key => {
        if (filters[key] !== '' && filters[key] !== null && filters[key] !== undefined) {
            params[key] = filters[key];
        }
    });
    const response = await api.get('/tasks', { params });
    const data = response.data;

    // Normalize so callers get data.tasks, data.statistics, data.pagination
    if (data.success) {
        const tasks = data.data?.tasks || data.data || [];
        const total = data.data?.total ?? (Array.isArray(tasks) ? tasks.length : 0);
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 10;

        const arr = Array.isArray(tasks) ? tasks : [];
        const statistics = {
            total: arr.length,
            inProgress: arr.filter(t => t.status === 'In Progress').length,
            completed: arr.filter(t => t.status === 'Completed').length,
            overdue: arr.filter(t => isOverdue(t)).length
        };

        const pagination = {
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: page,
            limit
        };

        return {
            success: true,
            data: { tasks: arr, statistics, pagination }
        };
    }
    return data;
};

// Alias for getTasks (backward compat)
export const getTasks = getAllTasks;

// Get My Tasks (Employee view) - reuses getAllTasks with myTasks flag
export const getMyTasks = async (filters = {}) => {
    const myParams = { myTasks: 'true' };
    if (filters.status) myParams.status = filters.status;
    if (filters.priority) myParams.priority = filters.priority;
    // Merge any additional filter keys
    Object.keys(filters).forEach(key => {
        if (!['status', 'priority'].includes(key)) {
            myParams[key] = filters[key];
        }
    });
    const response = await api.get('/tasks', { params: myParams });
    const data = response.data;
    if (data.success) {
        const tasks = data.data?.tasks || data.data || [];
        const arr = Array.isArray(tasks) ? tasks : [];
        const statistics = {
            total: arr.length,
            inProgress: arr.filter(t => t.status === 'In Progress').length,
            completed: arr.filter(t => t.status === 'Completed').length,
            overdue: arr.filter(t => isOverdue(t)).length
        };
        return { success: true, data: { tasks: arr, statistics } };
    }
    return data;
};

// Get Task by ID
export const getTaskById = async (taskId) => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
};

// Update Task (full update - for edit form)
export const updateTask = async (taskId, taskData) => {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
};

// Update Task Status (for Employee/TL)
export const updateTaskStatus = async (taskId, statusData) => {
    const response = await api.patch(`/tasks/${taskId}/status`, statusData);
    return response.data;
};

// Get Tasks by Project
export const getTasksByProject = async (projectId) => {
    const response = await api.get('/tasks', { params: { projectId } });
    const data = response.data;
    return {
        success: data.success,
        data: { tasks: data.data?.tasks || data.data || [] }
    };
};

// Get Tasks by Module
export const getTasksByModule = async (moduleId) => {
    const response = await api.get('/tasks', { params: { moduleId } });
    const data = response.data;
    return {
        success: data.success,
        data: { tasks: data.data?.tasks || data.data || [] }
    };
};

// Delete Task
export const deleteTask = async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
};

// Utility: Get icon for task type
export const getTaskTypeIcon = (type) => {
    const icons = {
        'Bug': '🐛',
        'Feature': '✨',
        'Task': '📋',
        'Improvement': '🛠️',
        'Research': '🔬',
        'Meeting': '📅',
        'Admin': '⚙️',
        'Testing': '🧪',
        'Documentation': '📝'
    };
    return icons[type] || '📋';
};

// Utility: Format date for display
export const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
    });
};

// Update Progress (maps to status update)
export const updateProgress = async (taskId, progressData) => {
    const response = await api.patch(`/tasks/${taskId}/status`, {
        status: progressData.progressPercent === 100 ? 'Completed' : 'In Progress',
        comment: progressData.comment
    });
    return response.data;
};

// Update Task Result (maps to status update)
export const updateTaskResult = async (taskId, resultData) => {
    let status = 'In Progress';
    if (resultData.taskResult === 'Success') status = 'Completed';
    else if (resultData.taskResult === 'Failed' || resultData.taskResult === 'Delayed') status = 'Review';
    else if (resultData.taskResult === 'Reassigned') status = 'To Do';

    const response = await api.patch(`/tasks/${taskId}/status`, {
        status,
        comment: resultData.employeeNotes || resultData.delayReason || ''
    });
    return response.data;
};

export default {
    createTask,
    getAllTasks,
    getTasks,
    getMyTasks,
    getTaskById,
    updateTask,
    updateTaskStatus,
    getTasksByProject,
    getTasksByModule,
    deleteTask,
    isOverdue,
    getTaskTypeIcon,
    formatDate,
    updateProgress,
    updateTaskResult
};
