import prisma from '../utils/prisma.js';
import asyncHandler from '../utils/asyncHandler.js';
import bcrypt from 'bcrypt';

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
export const getUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  const [total, users] = await prisma.$transaction([
    prisma.user.count(),
    prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, createdAt: true },
      skip,
      take
    })
  ]);

  res.json({
    success: true,
    total,
    page: parseInt(page),
    totalPages: Math.ceil(total / take),
    data: users
  });
});

// @desc    Create user (Admin)
// @route   POST /api/users
// @access  Private/Admin
export const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  
  const userExists = await prisma.user.findUnique({ where: { email } });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  const user = await prisma.user.create({
    data: { name, email, password: hashedPassword, role: role || 'USER' },
    select: { id: true, name: true, email: true, role: true }
  });

  res.status(201).json({ success: true, data: user });
});

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private/Admin
export const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role } = req.body;
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });

  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }

  const updatedUser = await prisma.user.update({
    where: { id: req.params.id },
    data: { name, email, role },
    select: { id: true, name: true, email: true, role: true }
  });

  res.json({ success: true, data: updatedUser });
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
export const deleteUser = asyncHandler(async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ success: true, message: 'User deleted' });
});