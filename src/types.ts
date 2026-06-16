/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Department {
  id: string;
  department_name: string;
  hod?: string;
  year?: string;
}

export interface Student {
  id: string;
  roll_no: string;
  student_name: string;
  department: string;
  year: number; // e.g., 1, 2, 3, 4
  section: string; // e.g., 'A', 'B'
}

export interface Faculty {
  id: string;
  name: string;
  email: string;
  department: string;
  approved: boolean;
  active: boolean;
}

export interface Subject {
  id: string;
  subject_code: string;
  subject_name: string;
  department: string;
  year: number;
  semester: number;
}

export interface FacultyAssignment {
  id: string;
  faculty_id: string;
  subject_id: string;
  department: string;
  year: number;
  section: string;
}

export interface Attendance {
  id: string;
  attendance_date: string; // YYYY-MM-DD
  student_id: string;
  faculty_id: string;
  subject_id: string;
  status: 'Present' | 'Absent';
}

export interface DetailedAssignment extends FacultyAssignment {
  facultyName?: string;
  subjectCode?: string;
  subjectName?: string;
}

export interface DetailedAttendance extends Attendance {
  studentName?: string;
  studentRollNo?: string;
  subjectCode?: string;
  subjectName?: string;
  facultyName?: string;
  department?: string;
  year?: number;
  section?: string;
}

export type UserRole = 'admin' | 'faculty';

export interface UserSession {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department?: string;
}
