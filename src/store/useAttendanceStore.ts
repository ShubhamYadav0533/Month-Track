import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Employee,
  Shift,
  AttendanceRecord,
  BreakRecord,
  LeaveRequest,
  Holiday,
  AttendanceStatus,
  AttendanceStats,
} from '../types';

import { generateId } from '../utils/generateId';
import { useFinanceStore } from './useFinanceStore';
import {
  saveAttendanceToSupabase,
  fetchAttendanceFromSupabase,
} from '../services/supabaseService';

// ─────────────────────────────────────────────────
// Helper Utilities
// ─────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function nowISO(): string {
  return new Date().toISOString();
}

function uuid(): string {
  return generateId();
}

/** Parse "09:00 AM" or "18:00" → minutes since midnight */
function parseTimeToMinutes(timeStr: string): number {
  const cleaned = timeStr.trim().toUpperCase();
  const ampm = cleaned.match(/(AM|PM)$/);
  const numeric = cleaned.replace(/(AM|PM)/i, '').trim();
  const [h, m] = numeric.split(':').map(Number);
  if (ampm) {
    const isPM = ampm[1] === 'PM';
    const hour24 = isPM ? (h === 12 ? 12 : h + 12) : h === 12 ? 0 : h;
    return hour24 * 60 + (m || 0);
  }
  return h * 60 + (m || 0);
}

/** Minutes since midnight for current time */
function currentMinutesSinceMidnight(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

/** Difference in minutes between two ISO timestamps */
function minutesBetween(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
}

/** Format minutes to "Xh Ym" */
export function formatMinutesToHM(mins: number): string {
  if (mins <= 0) return '0h 0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

// ─────────────────────────────────────────────────
// Store Type
// ─────────────────────────────────────────────────

interface AttendanceState {
  // Employee Profile
  employee: Employee;
  shift: Shift;

  // Attendance Data
  attendanceHistory: AttendanceRecord[];
  todayRecord: AttendanceRecord | null;
  activeBreak: BreakRecord | null;

  // Leave Data
  leaveRequests: LeaveRequest[];
  holidays: Holiday[];

  // Leave Balances
  leaveBalances: { casual: number; sick: number; paid: number; unpaid: number };

  // Setup & Lock
  isHrmsSetupComplete: boolean;
  isHrmsLocked: boolean;

  // Actions — Employee
  updateEmployeeProfile: (updates: Partial<Employee>) => void;
  updateShift: (updates: Partial<Shift>) => void;
  completeHrmsSetup: (emp: Partial<Employee>, shift: Partial<Shift>) => void;

  // Actions — Attendance
  checkIn: (notes?: string) => void;
  startBreak: (breakType: BreakRecord['breakType']) => void;
  resumeWork: () => void;
  checkOut: (notes?: string) => void;
  loadAttendanceFromSupabase: () => Promise<void>;

  // Actions — Leave
  applyLeave: (leave: Omit<LeaveRequest, 'id' | 'employeeId' | 'status' | 'createdAt'>) => void;
  cancelLeave: (leaveId: string) => void;
  addHoliday: (name: string, date: string, isOptional: boolean) => void;

  // Computed Getters
  getStats: () => AttendanceStats;
  getTodayStatus: () => AttendanceStatus;
  getLiveWorkingMinutes: () => number;
  getLiveBreakMinutes: () => number;

  // Lock
  lockHrms: () => void;
  unlockHrms: () => void;
}

// ─────────────────────────────────────────────────
// Default Values
// ─────────────────────────────────────────────────

const DEFAULT_EMPLOYEE: Employee = {
  id: 'emp_default',
  employeeCode: 'EMP001',
  fullName: '',
  email: '',
  department: 'General',
  designation: 'Employee',
  joiningDate: todayStr(),
  shiftId: 'shift_general',
  officeLocation: '',
  managerName: '',
  isSetupComplete: false,
};

const DEFAULT_SHIFT: Shift = {
  id: 'shift_general',
  shiftName: 'General Shift',
  startTime: '09:00 AM',
  endTime: '06:00 PM',
  requiredHours: 8,
  breakMinutes: 45,
  graceMinutes: 15,
};

// ─────────────────────────────────────────────────
// Store Implementation
// ─────────────────────────────────────────────────

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      // ── State ──
      employee: DEFAULT_EMPLOYEE,
      shift: DEFAULT_SHIFT,
      attendanceHistory: [],
      todayRecord: null,
      activeBreak: null,
      leaveRequests: [],
      holidays: [],
      leaveBalances: { casual: 12, sick: 12, paid: 15, unpaid: 999 },
      isHrmsSetupComplete: false,
      isHrmsLocked: false,

      // ── Employee Actions ──
      updateEmployeeProfile: (updates) =>
        set((s) => ({ employee: { ...s.employee, ...updates } })),

      updateShift: (updates) =>
        set((s) => ({ shift: { ...s.shift, ...updates } })),

      completeHrmsSetup: (emp, shift) =>
        set((s) => ({
          employee: { ...s.employee, ...emp, isSetupComplete: true },
          shift: { ...s.shift, ...shift },
          isHrmsSetupComplete: true,
        })),

      // ── Check In ──
      checkIn: (notes) =>
        set((s) => {
          const now = new Date();
          const shiftStartMins = parseTimeToMinutes(s.shift.startTime);
          const currentMins = currentMinutesSinceMidnight();
          const lateMinutes = Math.max(0, currentMins - shiftStartMins - s.shift.graceMinutes);
          const status: AttendanceStatus = lateMinutes > 0 ? 'Late' : 'Present';

          const record: AttendanceRecord = {
            id: uuid(),
            employeeId: s.employee.id,
            attendanceDate: todayStr(),
            checkIn: now.toISOString(),
            totalWorkMinutes: 0,
            breakMinutes: 0,
            overtimeMinutes: 0,
            lateMinutes,
            earlyLeaveMinutes: 0,
            status,
            notes: notes || '',
            breaks: [],
            createdAt: now.toISOString(),
          };

          const userId = useFinanceStore.getState().profile.id;
          saveAttendanceToSupabase(userId, record);

          return { todayRecord: record };
        }),

      // ── Start Break ──
      startBreak: (breakType) =>
        set((s) => {
          if (!s.todayRecord || s.activeBreak) return {};

          const br: BreakRecord = {
            id: uuid(),
            attendanceId: s.todayRecord.id,
            breakStart: nowISO(),
            durationMinutes: 0,
            breakType,
          };

          const updatedRec = {
            ...s.todayRecord,
            status: 'On Break' as AttendanceStatus,
            breaks: [...(s.todayRecord.breaks || []), br],
          };

          const userId = useFinanceStore.getState().profile.id;
          saveAttendanceToSupabase(userId, updatedRec);

          return {
            activeBreak: br,
            todayRecord: updatedRec,
          };
        }),

      // ── Resume Work ──
      resumeWork: () =>
        set((s) => {
          if (!s.todayRecord || !s.activeBreak) return {};

          const duration = minutesBetween(s.activeBreak.breakStart, nowISO());
          const finishedBreak: BreakRecord = {
            ...s.activeBreak,
            breakEnd: nowISO(),
            durationMinutes: duration,
          };

          const updatedBreaks = [...(s.todayRecord.breaks || []).filter(b => b.id !== finishedBreak.id), finishedBreak];
          const totalBreakMins = updatedBreaks.reduce((acc, b) => acc + b.durationMinutes, 0);

          const updatedRec = {
            ...s.todayRecord,
            status: (s.todayRecord.lateMinutes > 0 ? 'Late' : 'Present') as AttendanceStatus,
            breaks: updatedBreaks,
            breakMinutes: totalBreakMins,
          };

          const userId = useFinanceStore.getState().profile.id;
          saveAttendanceToSupabase(userId, updatedRec);

          return {
            activeBreak: null,
            todayRecord: updatedRec,
          };
        }),

      // ── Check Out ──
      checkOut: (notes) =>
        set((s) => {
          if (!s.todayRecord || !s.todayRecord.checkIn) return {};

          // If on break, auto-resume first
          let record = { ...s.todayRecord };
          let allBreaks = [...(record.breaks || [])];

          if (s.activeBreak) {
            const duration = minutesBetween(s.activeBreak.breakStart, nowISO());
            allBreaks.push({
              ...s.activeBreak,
              breakEnd: nowISO(),
              durationMinutes: duration,
            });
          }

          const totalBreakMins = allBreaks.reduce((acc, b) => acc + b.durationMinutes, 0);
          const totalElapsed = minutesBetween(record.checkIn || nowISO(), nowISO());
          const netWorkMins = Math.max(0, totalElapsed - totalBreakMins);
          const requiredMins = s.shift.requiredHours * 60;
          const overtimeMins = Math.max(0, netWorkMins - requiredMins);

          // Early leave detection
          const shiftEndMins = parseTimeToMinutes(s.shift.endTime);
          const currentMins = currentMinutesSinceMidnight();
          const earlyLeaveMins = Math.max(0, shiftEndMins - currentMins);

          // Determine final status
          let finalStatus: AttendanceStatus = record.lateMinutes > 0 ? 'Late' : 'Present';
          if (netWorkMins < requiredMins / 2) {
            finalStatus = 'Half Day';
          }

          const finalRecord: AttendanceRecord = {
            ...record,
            checkOut: nowISO(),
            totalWorkMinutes: netWorkMins,
            breakMinutes: totalBreakMins,
            overtimeMinutes: overtimeMins,
            earlyLeaveMinutes: earlyLeaveMins,
            status: finalStatus,
            notes: notes ? `${record.notes || ''} | ${notes}` : record.notes || '',
            breaks: allBreaks,
          };

          const userId = useFinanceStore.getState().profile.id;
          saveAttendanceToSupabase(userId, finalRecord);

          return {
            todayRecord: null,
            activeBreak: null,
            attendanceHistory: [...s.attendanceHistory.filter(r => r.id !== finalRecord.id), finalRecord],
          };
        }),

      loadAttendanceFromSupabase: async () => {
        const userId = useFinanceStore.getState().profile.id;
        const res = await fetchAttendanceFromSupabase(userId);
        if (res.success && res.data && res.data.length > 0) {
          const today = todayStr();
          const todayRec = res.data.find((r) => r.attendanceDate === today && !r.checkOut) || null;
          const activeBr = todayRec?.breaks?.find((b: BreakRecord) => !b.breakEnd) || null;
          set({
            attendanceHistory: res.data.filter((r) => r.checkOut),
            todayRecord: todayRec || get().todayRecord,
            activeBreak: activeBr || get().activeBreak,
          });
        } else {
          const currentRecord = get().todayRecord;
          if (currentRecord) {
            saveAttendanceToSupabase(userId, currentRecord);
          }
        }
      },

      
      applyLeave: (leave) =>
        set((s) => {
          const request: LeaveRequest = {
            id: uuid(),
            employeeId: s.employee.id,
            ...leave,
            status: 'Pending',
            createdAt: nowISO(),
          };

          // Deduct leave balance
          const balances = { ...s.leaveBalances };
          const typeKey = leave.leaveType.toLowerCase() as keyof typeof balances;
          if (typeKey in balances) {
            balances[typeKey] = Math.max(0, balances[typeKey] - leave.totalDays);
          }

          return {
            leaveRequests: [...s.leaveRequests, request],
            leaveBalances: balances,
          };
        }),

      // ── Cancel Leave ──
      cancelLeave: (leaveId) =>
        set((s) => {
          const leave = s.leaveRequests.find((l) => l.id === leaveId);
          if (!leave || leave.status !== 'Pending') return {};

          // Restore balance
          const balances = { ...s.leaveBalances };
          const typeKey = leave.leaveType.toLowerCase() as keyof typeof balances;
          if (typeKey in balances) {
            balances[typeKey] += leave.totalDays;
          }

          return {
            leaveRequests: s.leaveRequests.filter((l) => l.id !== leaveId),
            leaveBalances: balances,
          };
        }),

      // ── Add Holiday ──
      addHoliday: (name, date, isOptional) =>
        set((s) => ({
          holidays: [
            ...s.holidays,
            { id: uuid(), holidayName: name, holidayDate: date, isOptional },
          ],
        })),

      // ── Get Stats (computed) ──
      getStats: () => {
        const s = get();
        const history = s.attendanceHistory;
        const thisMonth = todayStr().slice(0, 7); // "YYYY-MM"
        const monthRecords = history.filter((r) => r.attendanceDate.startsWith(thisMonth));

        const presentDays = monthRecords.filter(
          (r) => r.status === 'Present' || r.status === 'Late' || r.status === 'Work From Home'
        ).length;
        const absentDays = monthRecords.filter((r) => r.status === 'Absent').length;
        const leaveDays = monthRecords.filter((r) => r.status === 'Leave' || r.status === 'Half Day').length;
        const lateDays = monthRecords.filter((r) => r.status === 'Late').length;

        const totalWorkMins = monthRecords.reduce((a, r) => a + r.totalWorkMinutes, 0);
        const totalOvertimeMins = monthRecords.reduce((a, r) => a + r.overtimeMinutes, 0);

        // Working days so far this month (Mon-Fri)
        const today = new Date();
        const year = today.getFullYear();
        const month = today.getMonth();
        let workingDaysSoFar = 0;
        for (let d = 1; d <= today.getDate(); d++) {
          const day = new Date(year, month, d).getDay();
          if (day !== 0 && day !== 6) workingDaysSoFar++;
        }

        const attendancePct = workingDaysSoFar > 0 ? (presentDays / workingDaysSoFar) * 100 : 0;
        const avgDailyHours = monthRecords.length > 0 ? totalWorkMins / monthRecords.length / 60 : 0;

        const pendingLeaves = s.leaveRequests.filter((l) => l.status === 'Pending').length;
        const totalLeaveBalance =
          s.leaveBalances.casual + s.leaveBalances.sick + s.leaveBalances.paid;

        return {
          monthlyAttendancePct: Math.round(attendancePct * 10) / 10,
          totalWorkingHours: Math.round((totalWorkMins / 60) * 10) / 10,
          overtimeHours: Math.round((totalOvertimeMins / 60) * 10) / 10,
          lateArrivalsCount: lateDays,
          leavesRemaining: totalLeaveBalance,
          pendingLeaveRequests: pendingLeaves,
          presentDaysCount: presentDays,
          absentDaysCount: absentDays,
          leaveDaysCount: leaveDays,
          averageDailyHours: Math.round(avgDailyHours * 10) / 10,
        };
      },

      // ── Today Status ──
      getTodayStatus: () => {
        const s = get();
        if (s.todayRecord) {
          if (s.activeBreak) return 'On Break';
          return s.todayRecord.status;
        }
        // Check if already checked out today
        const todayDone = s.attendanceHistory.find((r) => r.attendanceDate === todayStr());
        if (todayDone) return todayDone.status;
        return 'Absent';
      },

      // ── Live Working Minutes ──
      getLiveWorkingMinutes: () => {
        const s = get();
        if (!s.todayRecord?.checkIn) return 0;
        const elapsed = minutesBetween(s.todayRecord.checkIn, nowISO());
        const breakMins = s.todayRecord.breakMinutes || 0;
        // If currently on break, add live break time
        const liveBreakExtra = s.activeBreak
          ? minutesBetween(s.activeBreak.breakStart, nowISO())
          : 0;
        return Math.max(0, elapsed - breakMins - liveBreakExtra);
      },

      // ── Live Break Minutes ──
      getLiveBreakMinutes: () => {
        const s = get();
        const baseMins = s.todayRecord?.breakMinutes || 0;
        const liveMins = s.activeBreak ? minutesBetween(s.activeBreak.breakStart, nowISO()) : 0;
        return baseMins + liveMins;
      },

      // ── Lock/Unlock ──
      lockHrms: () => set({ isHrmsLocked: true }),
      unlockHrms: () => set({ isHrmsLocked: false }),
    }),
    {
      name: 'attendance-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
