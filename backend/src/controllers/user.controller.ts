import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// GET /api/staff - List all staff (admin only)
export const getStaff = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can view staff.' });
    }

    const staff = await prisma.user.findMany({
      where: {
        OR: [{ role: 'STAFF' }, { role: 'ADMIN' }],
        deleted: false
      },
      select: { id: true, name: true, email: true, role: true }
    });

    return res.json({ staff });
  } catch (error) {
    console.error('Get staff error:', error);
    return res.status(500).json({ error: 'Error fetching staff.' });
  }
};

// GET /api/users - List all users (admin only)
export const getUsers = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can view users.' });
    }

    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });

    return res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    return res.status(500).json({ error: 'Error fetching users.' });
  }
};

// GET /api/users/:id - Get a single user's details (admin or self)
export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    // Admins can access any user; staff can only access their own info
    if (user.role !== 'ADMIN' && user.id !== id) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    const found = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true, hourlyWage: true, createdAt: true, updatedAt: true }
    });
    if (!found) {
      return res.status(404).json({ error: 'User not found.' });
    }
    return res.json({ user: found });
  } catch (error) {
    console.error('Get user by id error:', error);
    return res.status(500).json({ error: 'Error fetching user.' });
  }
};

// PUT /api/users/:id - Update a user's details (admin or self)
export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { name, email, role, hourlyWage } = req.body;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    // Admins can update any user; staff can only update their own info
    if (user.role !== 'ADMIN' && user.id !== id) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    // Only admins can update role or hourlyWage
    const data: any = {};
    if (name) data.name = name;
    if (email) data.email = email;
    if (user.role === 'ADMIN') {
      if (role) data.role = role;
      if (hourlyWage !== undefined) data.hourlyWage = hourlyWage;
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update.' });
    }
    const updated = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, name: true, email: true, role: true, hourlyWage: true, createdAt: true, updatedAt: true }
    });
    return res.json({ user: updated });
  } catch (error) {
    console.error('Update user error:', error);
    return res.status(500).json({ error: 'Error updating user.' });
  }
};

// POST /api/users - Create a user (admin only)
export const createUser = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can create users.' });
    }
    const { name, email, password, role, hourlyWage } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required.' });
    }
    // Check for existing user
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'User with this email already exists.' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const created = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'STAFF',
        hourlyWage: hourlyWage ?? 0,
      },
      select: { id: true, name: true, email: true, role: true, hourlyWage: true, createdAt: true, updatedAt: true }
    });
    return res.status(201).json({ user: created });
  } catch (error) {
    console.error('Create user error:', error);
    return res.status(500).json({ error: 'Error creating user.' });
  }
};

// DELETE /api/users/:id - Soft delete a user (admin only)
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can delete users.' });
    }
    if (!id) {
      return res.status(400).json({ error: 'User id is required.' });
    }
    // Check if user exists
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'User not found.' });
    }
    await prisma.user.delete({ where: { id } });
    return res.json({ message: 'User deleted (soft delete) successfully.', id });
  } catch (error) {
    console.error('Delete user error:', error);
    return res.status(500).json({ error: 'Error deleting user.' });
  }
};

// GET /api/my-shifts - Staff can view their own upcoming shifts
export const getMyShifts = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'STAFF') {
      return res.status(403).json({ error: 'Only staff can view their shifts.' });
    }
    const now = new Date();
    const shifts = await prisma.shift.findMany({
      where: {
        staffId: user.id,
        startTime: { gte: now }
      },
      include: {
        roster: { select: { id: true, weekStart: true, status: true } }
      },
      orderBy: { startTime: 'asc' }
    });
    return res.json({ shifts });
  } catch (error) {
    console.error('Get my shifts error:', error);
    return res.status(500).json({ error: 'Error fetching shifts.' });
  }
};

// GET /api/my-clocklogs - Staff can view their own clock-in/out history
export const getMyClockLogs = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'STAFF') {
      return res.status(403).json({ error: 'Only staff can view their clock logs.' });
    }
    const logs = await prisma.clockLog.findMany({
      where: { staffId: user.id },
      include: {
        shift: {
          select: {
            id: true,
            date: true,
            startTime: true,
            endTime: true,
            role: true
          }
        }
      },
      orderBy: { clockIn: 'desc' }
    });
    return res.json({ clockLogs: logs });
  } catch (error) {
    console.error('Get my clock logs error:', error);
    return res.status(500).json({ error: 'Error fetching clock logs.' });
  }
}; 