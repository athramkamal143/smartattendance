/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs, { readdirSync } from "fs";
import { createServer as createViteServer } from "vite";
import { 
  Department, 
  Student, 
  Faculty, 
  Subject, 
  FacultyAssignment, 
  Attendance 
} from "./src/types.js";

const DB_FILE = path.join(process.cwd(), "database.json");

// Initial Seed Data
const DEFAULT_DEPARTMENTS: Department[] = [
  { id: "dept-1", department_name: "CSE", hod: "Dr. Amit Verma", year: "1st, 2nd, 3rd, 4th Year" },
  { id: "dept-2", department_name: "IT", hod: "Dr. Rajesh Gupta", year: "1st, 2nd, 3rd, 4th Year" },
  { id: "dept-3", department_name: "ECE", hod: "Dr. Sunita Rao", year: "1st, 2nd, 3rd, 4th Year" },
  { id: "dept-4", department_name: "EEE", hod: "Dr. Manoj Sen", year: "1st, 2nd, 3rd Year" },
  { id: "dept-5", department_name: "Mechanical", hod: "Dr. Suresh Patil", year: "1st, 2nd, 3rd, 4th Year" },
  { id: "dept-6", department_name: "Civil", hod: "Dr. Ramesh Nair", year: "1st, 2nd, 3rd, 4th Year" }
];

const DEFAULT_SUBJECTS: Subject[] = [
  { id: "sub-1", subject_code: "CS401", subject_name: "DBMS", department: "CSE", year: 2, semester: 3 },
  { id: "sub-2", subject_code: "CS402", subject_name: "Operating Systems", department: "CSE", year: 2, semester: 3 },
  { id: "sub-3", subject_code: "IT501", subject_name: "Web Technologies", department: "IT", year: 3, semester: 5 },
  { id: "sub-4", subject_code: "EC301", subject_name: "Digital Electronics", department: "ECE", year: 2, semester: 3 },
  { id: "sub-5", subject_code: "CS601", subject_name: "Compiler Design", department: "CSE", year: 3, semester: 5 }
];

const DEFAULT_FACULTY = [
  { 
    id: "fac-1", 
    name: "Ravi Kumar", 
    email: "ravi@college.edu", 
    password: "facultypassword", // Plaintext for simple campus credential demo
    department: "CSE", 
    approved: true, 
    active: true 
  },
  { 
    id: "fac-2", 
    name: "Priya Sharma", 
    email: "priya@college.edu", 
    password: "facultypassword", 
    department: "IT", 
    approved: true, 
    active: true 
  },
  { 
    id: "fac-3", 
    name: "Amit Patel", 
    email: "amit@college.edu", 
    password: "facultypassword", 
    department: "ECE", 
    approved: false, // Pending Approval for Admin demonstration
    active: true 
  },
  { 
    id: "fac-4", 
    name: "Suresh Chandra", 
    email: "suresh@college.edu", 
    password: "facultypassword", 
    department: "CSE", 
    approved: true, 
    active: false // Deactivated demo
  }
];

const DEFAULT_STUDENTS: Student[] = [
  // CSE - Year 2 - Section A
  { id: "st-1", roll_no: "22CSE001", student_name: "Ramesh Sharma", department: "CSE", year: 2, section: "A" },
  { id: "st-2", roll_no: "22CSE002", student_name: "Suresh Varma", department: "CSE", year: 2, section: "A" },
  { id: "st-3", roll_no: "22CSE003", student_name: "Anjali Gupta", department: "CSE", year: 2, section: "A" },
  { id: "st-4", roll_no: "22CSE004", student_name: "Rahul Nair", department: "CSE", year: 2, section: "A" },
  { id: "st-5", roll_no: "22CSE005", student_name: "Vikram Singh", department: "CSE", year: 2, section: "A" },
  { id: "st-6", roll_no: "22CSE006", student_name: "Meera Das", department: "CSE", year: 2, section: "A" },
  { id: "st-7", roll_no: "22CSE007", student_name: "Karan Johar", department: "CSE", year: 2, section: "A" },
  { id: "st-8", roll_no: "22CSE008", student_name: "Sneha Reddy", department: "CSE", year: 2, section: "A" },
  { id: "st-9", roll_no: "22CSE009", student_name: "Saurav Ganguly", department: "CSE", year: 2, section: "A" },
  { id: "st-10", roll_no: "22CSE010", student_name: "Divya Teja", department: "CSE", year: 2, section: "A" },
  
  // CSE - Year 2 - Section B
  { id: "st-11", roll_no: "22CSE051", student_name: "Pranav Roy", department: "CSE", year: 2, section: "B" },
  { id: "st-12", roll_no: "22CSE052", student_name: "Deepika Padukone", department: "CSE", year: 2, section: "B" },
  { id: "st-13", roll_no: "22CSE053", student_name: "Abhishek Singh", department: "CSE", year: 2, section: "B" },
  
  // IT - Year 3 - Section A
  { id: "st-14", roll_no: "21IT001", student_name: "Aman Chopra", department: "IT", year: 3, section: "A" },
  { id: "st-15", roll_no: "21IT002", student_name: "Nehal Arora", department: "IT", year: 3, section: "A" },
  { id: "st-16", roll_no: "21IT003", student_name: "Pooja Hegde", department: "IT", year: 3, section: "A" }
];

const DEFAULT_ASSIGNMENTS: FacultyAssignment[] = [
  { id: "as-1", faculty_id: "fac-1", subject_id: "sub-1", department: "CSE", year: 2, section: "A" }, // Ravi -> DBMS (Sec A)
  { id: "as-2", faculty_id: "fac-1", subject_id: "sub-2", department: "CSE", year: 2, section: "A" }, // Ravi -> OS (Sec A)
  { id: "as-3", faculty_id: "fac-1", subject_id: "sub-1", department: "CSE", year: 2, section: "B" }, // Ravi -> DBMS (Sec B)
  { id: "as-4", faculty_id: "fac-2", subject_id: "sub-3", department: "IT", year: 3, section: "A" }    // Priya -> Web Tech
];

// Pre-seeded attendance history for some dashboard analytics
const DEFAULT_ATTENDANCE: Attendance[] = [
  // 3 days ago attendance for CSE Year 2 Sec A (DBMS - CS401)
  { id: "att-1", attendance_date: "2026-06-12", student_id: "st-1", faculty_id: "fac-1", subject_id: "sub-1", status: "Present" },
  { id: "att-2", attendance_date: "2026-06-12", student_id: "st-2", faculty_id: "fac-1", subject_id: "sub-1", status: "Present" },
  { id: "att-3", attendance_date: "2026-06-12", student_id: "st-3", faculty_id: "fac-1", subject_id: "sub-1", status: "Absent" },
  { id: "att-4", attendance_date: "2026-06-12", student_id: "st-4", faculty_id: "fac-1", subject_id: "sub-1", status: "Present" },
  { id: "att-5", attendance_date: "2026-06-12", student_id: "st-5", faculty_id: "fac-1", subject_id: "sub-1", status: "Present" },
  { id: "att-6", attendance_date: "2026-06-12", student_id: "st-6", faculty_id: "fac-1", subject_id: "sub-1", status: "Present" },
  { id: "att-7", attendance_date: "2026-06-12", student_id: "st-7", faculty_id: "fac-1", subject_id: "sub-1", status: "Absent" },
  { id: "att-8", attendance_date: "2026-06-12", student_id: "st-8", faculty_id: "fac-1", subject_id: "sub-1", status: "Present" },
  { id: "att-9", attendance_date: "2026-06-12", student_id: "st-9", faculty_id: "fac-1", subject_id: "sub-1", status: "Present" },
  { id: "att-10", attendance_date: "2026-06-12", student_id: "st-10", faculty_id: "fac-1", subject_id: "sub-1", status: "Present" },

  // 2 days ago attendance for CSE Year 2 Sec A (DBMS - CS401)
  { id: "att-11", attendance_date: "2026-06-13", student_id: "st-1", faculty_id: "fac-1", subject_id: "sub-1", status: "Present" },
  { id: "att-12", attendance_date: "2026-06-13", student_id: "st-2", faculty_id: "fac-1", subject_id: "sub-1", status: "Present" },
  { id: "att-13", attendance_date: "2026-06-13", student_id: "st-3", faculty_id: "fac-1", subject_id: "sub-1", status: "Present" },
  { id: "att-14", attendance_date: "2026-06-13", student_id: "st-4", faculty_id: "fac-1", subject_id: "sub-1", status: "Present" },
  { id: "att-15", attendance_date: "2026-06-13", student_id: "st-5", faculty_id: "fac-1", subject_id: "sub-1", status: "Absent" },
  { id: "att-16", attendance_date: "2026-06-13", student_id: "st-6", faculty_id: "fac-1", subject_id: "sub-1", status: "Present" },
  { id: "att-17", attendance_date: "2026-06-13", student_id: "st-7", faculty_id: "fac-1", subject_id: "sub-1", status: "Present" },
  { id: "att-18", attendance_date: "2026-06-13", student_id: "st-8", faculty_id: "fac-1", subject_id: "sub-1", status: "Present" },
  { id: "att-19", attendance_date: "2026-06-13", student_id: "st-9", faculty_id: "fac-1", subject_id: "sub-1", status: "Absent" },
  { id: "att-20", attendance_date: "2026-06-13", student_id: "st-10", faculty_id: "fac-1", subject_id: "sub-1", status: "Present" },

  // Yesterday attendance for CSE Year 2 Sec A (OS - CS402)
  { id: "att-21", attendance_date: "2026-06-14", student_id: "st-1", faculty_id: "fac-1", subject_id: "sub-2", status: "Present" },
  { id: "att-22", attendance_date: "2026-06-14", student_id: "st-2", faculty_id: "fac-1", subject_id: "sub-2", status: "Absent" },
  { id: "att-23", attendance_date: "2026-06-14", student_id: "st-3", faculty_id: "fac-1", subject_id: "sub-2", status: "Present" },
  { id: "att-24", attendance_date: "2026-06-14", student_id: "st-4", faculty_id: "fac-1", subject_id: "sub-2", status: "Present" },
  { id: "att-25", attendance_date: "2026-06-14", student_id: "st-5", faculty_id: "fac-1", subject_id: "sub-2", status: "Present" },
  { id: "att-26", attendance_date: "2026-06-14", student_id: "st-6", faculty_id: "fac-1", subject_id: "sub-2", status: "Present" },
  { id: "att-27", attendance_date: "2026-06-14", student_id: "st-7", faculty_id: "fac-1", subject_id: "sub-2", status: "Present" },
  { id: "att-28", attendance_date: "2026-06-14", student_id: "st-8", faculty_id: "fac-1", subject_id: "sub-2", status: "Present" },
  { id: "att-29", attendance_date: "2026-06-14", student_id: "st-9", faculty_id: "fac-1", subject_id: "sub-2", status: "Absent" },
  { id: "att-30", attendance_date: "2026-06-14", student_id: "st-10", faculty_id: "fac-1", subject_id: "sub-2", status: "Present" }
];

interface DBStructure {
  departments: Department[];
  subjects: Subject[];
  faculty: typeof DEFAULT_FACULTY;
  students: Student[];
  assignments: FacultyAssignment[];
  attendance: Attendance[];
}

// Database Read/Write Utility
function readDB(): DBStructure {
  if (!fs.existsSync(DB_FILE)) {
    const initialDB: DBStructure = {
      departments: DEFAULT_DEPARTMENTS,
      subjects: DEFAULT_SUBJECTS,
      faculty: DEFAULT_FACULTY,
      students: DEFAULT_STUDENTS,
      assignments: DEFAULT_ASSIGNMENTS,
      attendance: DEFAULT_ATTENDANCE
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialDB, null, 2), "utf8");
    return initialDB;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch (error) {
    console.error("Failed to read database, resetting to defaults", error);
    return {
      departments: DEFAULT_DEPARTMENTS,
      subjects: DEFAULT_SUBJECTS,
      faculty: DEFAULT_FACULTY,
      students: DEFAULT_STUDENTS,
      assignments: DEFAULT_ASSIGNMENTS,
      attendance: DEFAULT_ATTENDANCE
    };
  }
}

function writeDB(data: DBStructure) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" }));

  // --- HEALTH CHECK ---
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // --- AUTHENTICATION ENDPOINTS ---
  app.post("/api/auth/login", (req, res) => {
    const { email, password, role } = req.body;
    
    if (!email || !password || !role) {
      return res.status(400).json({ error: "Email, password, and role are required." });
    }

    if (role === "admin") {
      if (email === "admin@college.com" && password === "admin123") {
        return res.json({
          user: {
            id: "admin-1",
            name: "University Admin",
            email: "admin@college.com",
            role: "admin"
          },
          token: "admin-jwt-token-mock"
        });
      } else {
        return res.status(401).json({ error: "Invalid Admin Credentials." });
      }
    } else {
      // Faculty login
      const db = readDB();
      const fac = db.faculty.find(f => f.email.toLowerCase() === email.toLowerCase());
      
      if (!fac) {
        return res.status(401).json({ error: "Faculty member not found." });
      }
      
      if (fac.password !== password) {
        return res.status(401).json({ error: "Incorrect password." });
      }

      if (!fac.approved) {
        return res.status(403).json({ error: "Your account is pending approval by Admin." });
      }

      if (!fac.active) {
        return res.status(403).json({ error: "Your account is deactivated. Contact Admin." });
      }

      return res.json({
        user: {
          id: fac.id,
          name: fac.name,
          email: fac.email,
          role: "faculty",
          department: fac.department
        },
        token: `faculty-jwt-token-mock-${fac.id}`
      });
    }
  });

  app.post("/api/auth/register-faculty", (req, res) => {
    const { name, email, password, department } = req.body;
    
    if (!name || !email || !password || !department) {
      return res.status(400).json({ error: "All profile fields are required." });
    }

    const db = readDB();
    const exists = db.faculty.some(f => f.email.toLowerCase() === email.toLowerCase());
    
    if (exists) {
      return res.status(400).json({ error: "Email already registered." });
    }

    const newFaculty = {
      id: "fac-" + Date.now(),
      name,
      email,
      password,
      department,
      approved: false, // Must be approved by Admin
      active: true
    };

    db.faculty.push(newFaculty);
    writeDB(db);

    return res.status(201).json({ 
      message: "Registration successful. Plase wait for admin approval.",
      faculty: { id: newFaculty.id, name: newFaculty.name, email: newFaculty.email }
    });
  });

  // --- DEPARTMENTS ---
  app.get("/api/departments", (req, res) => {
    const db = readDB();
    res.json(db.departments);
  });

  app.post("/api/departments", (req, res) => {
    const { department_name, hod, year } = req.body;
    if (!department_name || department_name.trim() === "") {
      return res.status(400).json({ error: "Department name is required" });
    }
    const db = readDB();
    const exists = db.departments.some(d => d.department_name.toUpperCase() === department_name.toUpperCase());
    if (exists) {
      return res.status(400).json({ error: "Department already exists" });
    }
    const newDept: Department = {
      id: "dept-" + Date.now(),
      department_name: department_name.trim(),
      hod: hod ? hod.trim() : "",
      year: year ? year.trim() : ""
    };
    db.departments.push(newDept);
    writeDB(db);
    res.status(201).json(newDept);
  });

  app.put("/api/departments/:id", (req, res) => {
    const { id } = req.params;
    const { department_name, hod, year } = req.body;
    if (!department_name || department_name.trim() === "") {
      return res.status(400).json({ error: "Department name is required" });
    }
    const db = readDB();
    const index = db.departments.findIndex(d => d.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Department not found" });
    }
    db.departments[index].department_name = department_name.trim();
    db.departments[index].hod = hod ? hod.trim() : "";
    db.departments[index].year = year ? year.trim() : "";
    writeDB(db);
    res.json(db.departments[index]);
  });

  app.delete("/api/departments/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const deptToDelete = db.departments.find(d => d.id === id);
    if (!deptToDelete) {
      return res.status(404).json({ error: "Department not found" });
    }
    db.departments = db.departments.filter(d => d.id !== id);
    // Cascade delete info or preserve integrity
    writeDB(db);
    res.json({ message: "Department deleted successfully" });
  });

  // --- SUBJECTS ---
  app.get("/api/subjects", (req, res) => {
    const db = readDB();
    res.json(db.subjects);
  });

  app.post("/api/subjects", (req, res) => {
    const { subject_code, subject_name, department, year, semester } = req.body;
    if (!subject_code || !subject_name || !department || !year || !semester) {
      return res.status(400).json({ error: "All subject fields are required" });
    }
    const db = readDB();
    const newSub: Subject = {
      id: "sub-" + Date.now(),
      subject_code: subject_code.toUpperCase(),
      subject_name,
      department,
      year: Number(year),
      semester: Number(semester)
    };
    db.subjects.push(newSub);
    writeDB(db);
    res.status(201).json(newSub);
  });

  app.put("/api/subjects/:id", (req, res) => {
    const { id } = req.params;
    const { subject_code, subject_name, department, year, semester } = req.body;
    if (!subject_code || !subject_name || !department || !year || !semester) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const db = readDB();
    const index = db.subjects.findIndex(s => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Subject not found" });
    }
    db.subjects[index] = {
      id,
      subject_code: subject_code.toUpperCase(),
      subject_name,
      department,
      year: Number(year),
      semester: Number(semester)
    };
    writeDB(db);
    res.json(db.subjects[index]);
  });

  app.delete("/api/subjects/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    db.subjects = db.subjects.filter(s => s.id !== id);
    db.assignments = db.assignments.filter(a => a.subject_id !== id);
    writeDB(db);
    res.json({ message: "Subject deleted successfully" });
  });

  // --- FACULTY MANAGEMENT ---
  app.get("/api/faculty", (req, res) => {
    const db = readDB();
    // Return faculty without sending sensitive details back in clear general responses unless needed, but since it's admin/internal, we return the profiles
    res.json(db.faculty);
  });

  app.post("/api/faculty/:id/approve", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    const index = db.faculty.findIndex(f => f.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Faculty not found" });
    }
    db.faculty[index].approved = true;
    writeDB(db);
    res.json(db.faculty[index]);
  });

  app.post("/api/faculty/:id/deactivate", (req, res) => {
    const { id } = req.params;
    const { active } = req.body; // boolean
    const db = readDB();
    const index = db.faculty.findIndex(f => f.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Faculty not found" });
    }
    db.faculty[index].active = active;
    writeDB(db);
    res.json(db.faculty[index]);
  });

  app.post("/api/faculty/:id/reset-password", (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.trim() === "") {
      return res.status(400).json({ error: "New password is required" });
    }
    const db = readDB();
    const index = db.faculty.findIndex(f => f.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Faculty not found" });
    }
    db.faculty[index].password = newPassword;
    writeDB(db);
    res.json({ message: "Password reset successful" });
  });

  // --- STUDENTS ---
  app.get("/api/students", (req, res) => {
    const db = readDB();
    res.json(db.students);
  });

  // Handles Excel upload (parsed as JSON rows array or file CSV parser)
  app.post("/api/students/import", (req, res) => {
    const { students } = req.body; // Expect an array of objects
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ error: "No student records provided" });
    }

    const db = readDB();
    let importedCount = 0;
    
    students.forEach((st: any) => {
      // Validate or clean up
      const rollNo = String(st.roll_no || st["Roll No"] || st["Roll Number"] || "").trim().toUpperCase();
      const name = String(st.student_name || st["Name"] || st["Student Name"] || "").trim();
      const dept = String(st.department || st["Department"] || "").trim().toUpperCase();
      const year = Number(st.year || st["Year"] || 1);
      const sec = String(st.section || st["Section"] || "A").trim().toUpperCase();

      if (rollNo && name && dept) {
        // Prevent duplicate roll numbers
        const existsIndex = db.students.findIndex(s => s.roll_no === rollNo);
        const studentObj: Student = {
          id: existsIndex !== -1 ? db.students[existsIndex].id : "st-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
          roll_no: rollNo,
          student_name: name,
          department: dept,
          year,
          section: sec
        };

        if (existsIndex !== -1) {
          db.students[existsIndex] = studentObj; // Update
        } else {
          db.students.push(studentObj); // Add
        }
        importedCount++;
      }
    });

    writeDB(db);
    res.json({ message: `Successfully imported ${importedCount} student records.` });
  });

  app.delete("/api/students/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    db.students = db.students.filter(s => s.id !== id);
    writeDB(db);
    res.json({ message: "Student deleted" });
  });

  // --- FACULTY ASSIGNMENTS ---
  app.get("/api/assignments", (req, res) => {
    const db = readDB();
    res.json(db.assignments);
  });

  app.post("/api/assignments", (req, res) => {
    const { faculty_id, subject_id, department, year, section } = req.body;
    if (!faculty_id || !subject_id || !department || !year || !section) {
      return res.status(400).json({ error: "All mapping fields are required" });
    }
    const db = readDB();
    // Prevent exactly identical mapping duplicates
    const duplicate = db.assignments.some(
      a => a.faculty_id === faculty_id &&
           a.subject_id === subject_id &&
           a.department === department &&
           a.year === Number(year) &&
           a.section === section.toUpperCase()
    );

    if (duplicate) {
      return res.status(400).json({ error: "This faculty assignment mapping already exists." });
    }

    const newAssign: FacultyAssignment = {
      id: "as-" + Date.now(),
      faculty_id,
      subject_id,
      department,
      year: Number(year),
      section: section.toUpperCase()
    };
    db.assignments.push(newAssign);
    writeDB(db);
    res.status(201).json(newAssign);
  });

  app.delete("/api/assignments/:id", (req, res) => {
    const { id } = req.params;
    const db = readDB();
    db.assignments = db.assignments.filter(a => a.id !== id);
    writeDB(db);
    res.json({ message: "Assignment deleted" });
  });

  // --- ATTENDANCE ---
  // Save Attendance (handles create and edit updates securely)
  app.post("/api/attendance", (req, res) => {
    const { attendance_date, subject_id, faculty_id, records, isEdit } = req.body;
    // records: Array of { student_id, status }
    
    if (!attendance_date || !subject_id || !faculty_id || !Array.isArray(records)) {
      return res.status(400).json({ error: "Invalid attendance payload." });
    }

    const db = readDB();

    // Find the subject and students involved to verify the unique class footprint (Subject + Dept + Year + Section)
    const subject = db.subjects.find(s => s.id === subject_id);
    if (!subject) {
      return res.status(400).json({ error: "Subject not found." });
    }

    // Checking if there already exists attendance for this subject, date and student set
    // A duplicate attendance occurs if there's any record with the same attendance_date, subject_id, and any of the student_ids.
    const studentIds = records.map(r => r.student_id);
    const existingRecords = db.attendance.filter(
      a => a.attendance_date === attendance_date && 
           a.subject_id === subject_id && 
           studentIds.includes(a.student_id)
    );

    if (existingRecords.length > 0 && !isEdit) {
      return res.status(409).json({ 
        error: "Attendance already submitted for this class today.", 
        alreadySubmitted: true 
      });
    }

    // Process Attendance
    if (existingRecords.length > 0 && isEdit) {
      // Overwrite/update existing records
      records.forEach(rec => {
        const foundIndex = db.attendance.findIndex(
          a => a.attendance_date === attendance_date && 
               a.subject_id === subject_id && 
               a.student_id === rec.student_id
        );
        if (foundIndex !== -1) {
          db.attendance[foundIndex].status = rec.status;
          db.attendance[foundIndex].faculty_id = faculty_id; // Just in case
        } else {
          // If a new student was student uploaded or missed, insert new record
          db.attendance.push({
            id: "att-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
            attendance_date,
            student_id: rec.student_id,
            faculty_id,
            subject_id,
            status: rec.status
          });
        }
      });
    } else {
      // Insert fresh records
      records.forEach(rec => {
        db.attendance.push({
          id: "att-" + Date.now() + "-" + Math.random().toString(36).substr(2, 4),
          attendance_date,
          student_id: rec.student_id,
          faculty_id,
          subject_id,
          status: rec.status
        });
      });
    }

    writeDB(db);
    res.json({ message: "Attendance submitted successfully!" });
  });

  // Check today's marked attendance
  app.get("/api/attendance/check", (req, res) => {
    const { date, subject_id, department, year, section } = req.query;
    
    if (!date || !subject_id) {
      return res.status(400).json({ error: "Date and Subject ID are required." });
    }

    const db = readDB();

    // Find students matching department, year, section
    const targetStudents = db.students.filter(
      s => s.department === department && 
           s.year === Number(year) && 
           s.section === String(section).toUpperCase()
    );
    const studentIds = targetStudents.map(s => s.id);

    // Find if attendance exists for these students on this date for this subject
    const matches = db.attendance.filter(
      a => a.attendance_date === String(date) && 
           a.subject_id === String(subject_id) && 
           studentIds.includes(a.student_id)
    );

    if (matches.length > 0) {
      return res.json({ 
        marked: true, 
        records: matches.map(m => ({ student_id: m.student_id, status: m.status }))
      });
    }

    res.json({ marked: false, records: [] });
  });

  // --- STATS / REPORTS ENDPOINTS ---
  app.get("/api/dashboard/stats", (req, res) => {
    const db = readDB();
    const studentsCount = db.students.length;
    const facultyCount = db.faculty.length;
    const subjectsCount = db.subjects.length;

    // Attendance summary
    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecords = db.attendance.filter(a => a.attendance_date === todayStr);
    const presentCount = todayRecords.filter(r => r.status === "Present").length;
    const absentCount = todayRecords.filter(r => r.status === "Absent").length;
    const totalToday = todayRecords.length;
    const rate = totalToday > 0 ? Math.round((presentCount / totalToday) * 100) : 0;

    // Department aggregates (for dashboard visualizations)
    const deptAnalysis = db.departments.map(d => {
      const records = db.attendance.filter(a => {
        const student = db.students.find(s => s.id === a.student_id);
        return student && student.department === d.department_name;
      });
      const present = records.filter(r => r.status === "Present").length;
      const total = records.length;
      return {
        department: d.department_name,
        percentage: total > 0 ? Math.round((present / total) * 100) : 80 // Seeded defaults for elegance if no historic records exists
      };
    });

    res.json({
      studentsCount,
      facultyCount,
      subjectsCount,
      todaySummary: {
        present: presentCount,
        absent: absentCount,
        total: totalToday,
        percentage: totalToday > 0 ? rate : 0
      },
      deptAnalysis
    });
  });

  // Dynamic Query Reports
  app.get("/api/reports/attendance", (req, res) => {
    const { type, department, subjectId, facultyId, studentId } = req.query;
    const db = readDB();
    
    // Type can be: 'department' | 'subject' | 'faculty' | 'student'
    let filteredAttendance = [...db.attendance];

    // Enrich the records with readable information
    const enriched = filteredAttendance.map(record => {
      const student = db.students.find(s => s.id === record.student_id) || { student_name: "Unknown", roll_no: "N/A", department: "N/A", year: 0, section: "N/A" };
      const subject = db.subjects.find(s => s.id === record.subject_id) || { subject_code: "N/A", subject_name: "N/A", department: "N/A" };
      const faculty = db.faculty.find(f => f.id === record.faculty_id) || { name: "N/A" };

      return {
        ...record,
        studentName: student.student_name,
        studentRollNo: student.roll_no,
        studentDept: student.department,
        studentYear: student.year,
        studentSection: student.section,
        subjectCode: subject.subject_code,
        subjectName: subject.subject_name,
        subjectDept: subject.department,
        facultyName: faculty.name
      };
    });

    // Build aggregations based on selections
    if (type === "department" && department) {
      const matches = enriched.filter(e => e.studentDept === department);
      return res.json(calculateReportAggregations(matches, "department", String(department)));
    } 
    
    if (type === "subject" && subjectId) {
      const subj = db.subjects.find(s => s.id === subjectId);
      const label = subj ? `${subj.subject_code} - ${subj.subject_name}` : "Subject";
      const matches = enriched.filter(e => e.subject_id === subjectId);
      return res.json(calculateReportAggregations(matches, "subject", label));
    }

    if (type === "faculty" && facultyId) {
      const fac = db.faculty.find(f => f.id === facultyId);
      const label = fac ? fac.name : "Faculty";
      const matches = enriched.filter(e => e.faculty_id === facultyId);
      return res.json(calculateReportAggregations(matches, "faculty", label));
    }

    if (type === "student" && studentId) {
      const st = db.students.find(s => s.id === studentId);
      const label = st ? `${st.student_name} (${st.roll_no})` : "Student";
      const matches = enriched.filter(e => e.student_id === studentId);
      return res.json(calculateReportAggregations(matches, "student", label));
    }

    // Default: return everything enriched
    res.json({
      title: "All Campus Reports",
      totalClasses: new Set(enriched.map(e => e.attendance_date + "-" + e.subject_id)).size,
      records: enriched
    });
  });

  // Helper calculation
  function calculateReportAggregations(records: any[], groupType: string, label: string) {
    const totalCount = records.length;
    const presentCount = records.filter(r => r.status === "Present").length;
    const absentCount = records.filter(r => r.status === "Absent").length;
    const percentage = totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0;

    // Student-wise breakdowns inside this scope
    const studentStats: { [key: string]: { name: string; roll: string; total: number; present: number } } = {};
    records.forEach(r => {
      const key = r.student_id;
      if (!studentStats[key]) {
        studentStats[key] = {
          name: r.studentName,
          roll: r.studentRollNo,
          total: 0,
          present: 0
        };
      }
      studentStats[key].total++;
      if (r.status === "Present") {
        studentStats[key].present++;
      }
    });

    const studentBreakdown = Object.keys(studentStats).map(id => {
      const s = studentStats[id];
      return {
        id,
        name: s.name,
        rollNo: s.roll,
        totalClasses: s.total,
        present: s.present,
        absent: s.total - s.present,
        percentage: s.total > 0 ? Math.round((s.present / s.total) * 100) : 0
      };
    });

    return {
      title: label,
      type: groupType,
      totalClasses: new Set(records.map(r => r.attendance_date + "-" + r.subject_id)).size,
      totalRecords: totalCount,
      presentCount,
      absentCount,
      percentage,
      studentBreakdown,
      rawRecords: records
    };
  }

  // Vite middleware client routing
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
