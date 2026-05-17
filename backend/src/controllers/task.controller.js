import prisma from '../utils/prisma.js';
import asyncHandler from '../utils/asyncHandler.js';

// @desc    Get all tasks for user's workspaces
// @route   GET /api/tasks
// @access  Private
export const getTasks = asyncHandler(async (req, res) => {
  const { status, priority, sortBy, sortOrder, page = 1, limit = 10 } = req.query;
  
  const where = {
    workspace: {
      members: {
        some: { userId: req.user.id }
      }
    }
  };
  
  if (status) where.status = status;
  if (priority) where.priority = priority;
  
  const orderBy = {};
  if (sortBy) {
     orderBy[sortBy] = sortOrder === 'asc' ? 'asc' : 'desc';
  } else {
     orderBy.createdAt = 'desc';
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [total, tasks] = await prisma.$transaction([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        creator: { select: { id: true, name: true } },
        attachments: true,
        _count: { select: { comments: true, attachments: true } }
      },
      orderBy,
      skip,
      take
    })
  ]);

  res.json({ 
      success: true, 
      count: tasks.length,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / take),
      data: tasks 
  });
});

// @desc    Create a task
// @route   POST /api/tasks
// @access  Private
export const createTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, workspaceId, assigneeId } = req.body;

  // Verify workspace access
  const workspaceInfo = await prisma.workspaceMember.findUnique({
    where: {
      userId_workspaceId: {
        userId: req.user.id,
        workspaceId
      }
    }
  });

  if (!workspaceInfo) {
    res.status(403);
    throw new Error('Not authorized to create tasks in this workspace');
  }

  const task = await prisma.task.create({
    data: {
      title,
      description,
      status: status || 'TODO',
      priority: priority || 'MEDIUM',
      dueDate: dueDate ? new Date(dueDate) : null,
      workspaceId,
      creatorId: req.user.id,
      assigneeId
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } }
    }
  });

  // Basic Audit Log
  await prisma.auditLog.create({
    data: {
      action: 'TASK_CREATED',
      entity: 'Task',
      entityId: task.id,
      userId: req.user.id
    }
  });

  res.status(201).json({ success: true, data: task });
});

// @desc    Update a task
// @route   PUT /api/tasks/:id
// @access  Private
export const updateTask = asyncHandler(async (req, res) => {
  const { title, description, status, priority, dueDate, assigneeId } = req.body;
  const taskId = req.params.id;

  const task = await prisma.task.findUnique({ where: { id: taskId } });
  
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const updatedTask = await prisma.task.update({
    where: { id: taskId },
    data: {
      title,
      description,
      status,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      assigneeId
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } }
    }
  });

  res.json({ success: true, data: updatedTask });
});

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
export const deleteTask = asyncHandler(async (req, res) => {
  const taskId = req.params.id;
  await prisma.task.delete({ where: { id: taskId } });
  res.json({ success: true, message: 'Task deleted' });
});

// @desc    Get user workspaces
// @route   GET /api/workspaces
// @access  Private
export const getWorkspaces = asyncHandler(async (req, res) => {
  const workspaces = await prisma.workspace.findMany({
    where: {
      members: {
        some: { userId: req.user.id }
      }
    }
  });
  res.json({ success: true, data: workspaces });
});

// @desc    Upload an attachment
// @route   POST /api/tasks/:id/attachments
// @access  Private
export const uploadAttachment = asyncHandler(async (req, res) => {
  const taskId = req.params.id;
  const file = req.file;

  if (!file) {
    res.status(400);
    throw new Error('Please upload a file');
  }

  // Find task
  const task = await prisma.task.findUnique({ 
      where: { id: taskId },
      include: { _count: { select: { attachments: true } } }
  });
  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }
  
  if (task._count.attachments >= 3) {
      res.status(400);
      throw new Error('Maximum of 3 attachments allowed per task');
  }

  const attachment = await prisma.attachment.create({
    data: {
      filename: file.originalname,
      url: `/uploads/${file.filename}`,
      mimetype: file.mimetype,
      size: file.size,
      taskId: taskId,
      uploaderId: req.user.id
    }
  });

  res.status(201).json({ success: true, data: attachment });
});
