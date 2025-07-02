import { Request, Response } from 'express';
import { PrismaClient, RosterStatus } from '@prisma/client';

const prisma = new PrismaClient();

// POST /api/rosters - Create a new roster (admin only)
export const createRoster = async (req: Request, res: Response) => {
  try {
    // Auth: Only admins can create
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can create rosters.' });
    }

    const { weekStart, status } = req.body;
    if (!weekStart) {
      return res.status(400).json({ error: 'weekStart is required.' });
    }

    // Check for duplicate roster for the same week
    const existing = await prisma.roster.findFirst({
      where: { weekStart: new Date(weekStart) }
    });
    if (existing) {
      return res.status(409).json({ error: 'A roster for this week already exists.' });
    }

    // Create the roster
    const roster = await prisma.roster.create({
      data: {
        weekStart: new Date(weekStart),
        status: status || 'DRAFT',
        createdById: user.id,
      },
      include: { shifts: true }
    });

    console.log(`Roster created for week starting ${weekStart} by admin ${user.email}`);
    return res.status(201).json({ roster });
  } catch (error) {
    console.error('Create roster error:', error);
    return res.status(500).json({ error: 'Error creating roster.' });
  }
};

// GET /api/rosters - List all rosters (admin only)
export const getRosters = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can view rosters.' });
    }

    const rosters = await prisma.roster.findMany({
      orderBy: { weekStart: 'desc' },
      include: {
        _count: { select: { shifts: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    // Map to clean output
    const result = rosters.map((r: any) => ({
      id: r.id,
      weekStart: r.weekStart,
      status: r.status,
      createdBy: r.createdBy,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      shiftCount: r._count.shifts,
    }));

    return res.json({ rosters: result });
  } catch (error) {
    console.error('Get rosters error:', error);
    return res.status(500).json({ error: 'Error fetching rosters.' });
  }
};

// GET /api/rosters/:id - Get a single roster with shifts (admin only)
export const getRosterById = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can view rosters.' });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Roster id is required.' });
    }

    const roster = await prisma.roster.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        shifts: {
          include: {
            staff: { select: { id: true, name: true, email: true, role: true } }
          },
          orderBy: { startTime: 'asc' }
        }
      }
    });

    if (!roster) {
      return res.status(404).json({ error: 'Roster not found.' });
    }

    return res.json({ roster });
  } catch (error) {
    console.error('Get roster by id error:', error);
    return res.status(500).json({ error: 'Error fetching roster.' });
  }
};

// POST /api/rosters/:rosterId/shifts - Add a shift to a roster (admin only)
export const createShift = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can add shifts.' });
    }

    const { rosterId } = req.params;
    const { staffId, date, startTime, endTime, role, notes } = req.body;
    if (!rosterId || !staffId || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'rosterId, staffId, date, startTime, and endTime are required.' });
    }

    // Auto-break logic: 30 min break if shift > 6 hours
    const start = new Date(startTime);
    const end = new Date(endTime);
    const shiftLengthHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const breakMinutes = shiftLengthHours > 6 ? 30 : 0;

    const shift = await prisma.shift.create({
      data: {
        rosterId,
        staffId,
        date: new Date(date),
        startTime: start,
        endTime: end,
        role,
        notes,
        breakMinutes,
      },
      include: {
        staff: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    return res.status(201).json({ shift });
  } catch (error) {
    console.error('Create shift error:', error);
    return res.status(500).json({ error: 'Error creating shift.' });
  }
};

// PUT /api/shifts/:id - Edit a shift (admin only)
export const updateShift = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can edit shifts.' });
    }

    const { id } = req.params;
    const { staffId, date, startTime, endTime, role, notes } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Shift id is required.' });
    }

    // Fetch the existing shift
    const existing = await prisma.shift.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Shift not found.' });
    }

    // Determine if startTime or endTime are being updated
    let breakMinutes = existing.breakMinutes;
    let newStart = startTime ? new Date(startTime) : existing.startTime;
    let newEnd = endTime ? new Date(endTime) : existing.endTime;
    if (startTime || endTime) {
      const shiftLengthHours = (newEnd.getTime() - newStart.getTime()) / (1000 * 60 * 60);
      breakMinutes = shiftLengthHours > 6 ? 30 : 0;
    }

    const updated = await prisma.shift.update({
      where: { id },
      data: {
        staffId: staffId ?? existing.staffId,
        date: date ? new Date(date) : existing.date,
        startTime: newStart,
        endTime: newEnd,
        role: role ?? existing.role,
        notes: notes ?? existing.notes,
        breakMinutes,
      },
      include: {
        staff: { select: { id: true, name: true, email: true, role: true } }
      }
    });

    return res.json({ shift: updated });
  } catch (error) {
    console.error('Update shift error:', error);
    return res.status(500).json({ error: 'Error updating shift.' });
  }
};

// DELETE /api/shifts/:id - Delete a shift (admin only)
export const deleteShift = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can delete shifts.' });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Shift id is required.' });
    }

    // Check if shift exists
    const existing = await prisma.shift.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Shift not found.' });
    }

    await prisma.shift.delete({ where: { id } });
    return res.json({ message: 'Shift deleted successfully.', id });
  } catch (error) {
    console.error('Delete shift error:', error);
    return res.status(500).json({ error: 'Error deleting shift.' });
  }
};

// PUT /api/rosters/:id - Update a roster (admin only)
export const updateRoster = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can update rosters.' });
    }

    const { id } = req.params;
    const { status, weekStart } = req.body;
    if (!id) {
      return res.status(400).json({ error: 'Roster id is required.' });
    }

    // Fetch the existing roster
    const existing = await prisma.roster.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Roster not found.' });
    }

    // Validate allowed status values
    const allowedStatuses = ["DRAFT", "APPROVED", "ARCHIVED"];
    if (status && !allowedStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status value." });
    }

    // If approving, ensure roster has at least one shift
    if (status === "APPROVED") {
      const shiftCount = await prisma.shift.count({ where: { rosterId: id } });
      if (shiftCount === 0) {
        return res.status(400).json({ error: "Cannot approve a roster with no shifts." });
      }
    }

    const updated = await prisma.roster.update({
      where: { id },
      data: {
        status: status ?? existing.status,
        weekStart: weekStart ? new Date(weekStart) : existing.weekStart,
      },
      include: {
        _count: { select: { shifts: true } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    return res.json({
      roster: {
        id: updated.id,
        weekStart: updated.weekStart,
        status: updated.status,
        createdBy: updated.createdBy,
        createdAt: updated.createdAt,
        updatedAt: updated.updatedAt,
        shiftCount: updated._count.shifts,
      }
    });
  } catch (error) {
    console.error('Update roster error:', error);
    return res.status(500).json({ error: 'Error updating roster.' });
  }
};

// DELETE /api/rosters/:id - Delete a roster (admin only)
export const deleteRoster = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can delete rosters.' });
    }

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Roster id is required.' });
    }

    // Check if roster exists
    const existing = await prisma.roster.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Roster not found.' });
    }

    await prisma.roster.delete({ where: { id } });
    return res.json({ message: 'Roster deleted successfully.', id });
  } catch (error) {
    console.error('Delete roster error:', error);
    return res.status(500).json({ error: 'Error deleting roster.' });
  }
};

// GET /api/rosters/:id/shifts - List all shifts for a specific roster (admin only)
export const getRosterShifts = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can view shifts.' });
    }
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Roster id is required.' });
    }
    const shifts = await prisma.shift.findMany({
      where: { rosterId: id },
      include: {
        staff: { select: { id: true, name: true, email: true, role: true } }
      },
      orderBy: { startTime: 'asc' }
    });
    return res.json({ shifts });
  } catch (error) {
    console.error('Get roster shifts error:', error);
    return res.status(500).json({ error: 'Error fetching shifts.' });
  }
};

// GET /api/shifts/:id - Get a single shift's details (admin or assigned staff)
export const getShiftById = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (!id) {
      return res.status(400).json({ error: 'Shift id is required.' });
    }
    const shift = await prisma.shift.findUnique({
      where: { id },
      include: {
        staff: { select: { id: true, name: true, email: true, role: true } }
      }
    });
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found.' });
    }
    // Only admins or the assigned staff can access
    if (user.role !== 'ADMIN' && user.id !== shift.staffId) {
      return res.status(403).json({ error: 'Forbidden.' });
    }
    return res.json({ shift });
  } catch (error) {
    console.error('Get shift by id error:', error);
    return res.status(500).json({ error: 'Error fetching shift.' });
  }
};

// POST /api/rosters/:id/copy - Copy a previous week's roster (admin only)
export const copyRoster = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Only admins can copy rosters.' });
    }
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ error: 'Roster id is required.' });
    }
    // Find the source roster and its shifts
    const source = await prisma.roster.findUnique({
      where: { id },
      include: { shifts: true }
    });
    if (!source) {
      return res.status(404).json({ error: 'Source roster not found.' });
    }
    // Calculate next week's start date
    const nextWeekStart = new Date(source.weekStart);
    nextWeekStart.setDate(nextWeekStart.getDate() + 7);
    // Check for duplicate
    const existing = await prisma.roster.findFirst({ where: { weekStart: nextWeekStart } });
    if (existing) {
      return res.status(409).json({ error: 'A roster for the next week already exists.' });
    }
    // Create the new roster
    const newRoster = await prisma.roster.create({
      data: {
        weekStart: nextWeekStart,
        status: 'DRAFT',
        createdById: user.id,
        shifts: {
          create: source.shifts.map((shift: any) => ({
            staffId: shift.staffId,
            date: new Date(new Date(shift.date).getTime() + 7 * 24 * 60 * 60 * 1000),
            startTime: new Date(new Date(shift.startTime).getTime() + 7 * 24 * 60 * 60 * 1000),
            endTime: new Date(new Date(shift.endTime).getTime() + 7 * 24 * 60 * 60 * 1000),
            role: shift.role,
            breakMinutes: shift.breakMinutes,
            notes: shift.notes,
          }))
        }
      },
      include: {
        shifts: {
          include: {
            staff: { select: { id: true, name: true, email: true, role: true } }
          },
          orderBy: { startTime: 'asc' }
        }
      }
    });
    return res.status(201).json({ roster: newRoster });
  } catch (error) {
    console.error('Copy roster error:', error);
    return res.status(500).json({ error: 'Error copying roster.' });
  }
};

// GET /api/rosters/my - Staff can view their approved rosters with their shifts
export const getMyRosters = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || user.role !== 'STAFF') {
      return res.status(403).json({ error: 'Only staff can view their rosters.' });
    }
    // Find all approved rosters with at least one shift for this staff member
    const rosters = await prisma.roster.findMany({
      where: {
        status: RosterStatus.PUBLISHED,
        shifts: {
          some: { staffId: user.id }
        }
      },
      include: {
        shifts: {
          where: { staffId: user.id },
          include: { staff: { select: { id: true, name: true, email: true } } }
        }
      },
      orderBy: { weekStart: 'desc' }
    });
    return res.json({ rosters });
  } catch (error) {
    console.error('Get my rosters error:', error);
    return res.status(500).json({ error: 'Error fetching rosters.' });
  }
}; 