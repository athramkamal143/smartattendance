/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import FacultyAttendanceReports from "./components/FacultyAttendanceReports";
import {
  BookOpen,
  Users,
  GraduationCap,
  Calendar,
  CheckCircle,
  XCircle,
  Plus,
  Trash2,
  Edit2,
  LogOut,
  Moon,
  Sun,
  Download,
  Upload,
  UserCheck,
  Check,
  X,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Clock,
  Briefcase,
  TrendingUp,
  Star,
  Database,
  UserPlus,
  Copy
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  CartesianGrid
} from "recharts";
import {
  Department,
  Student,
  Faculty,
  Subject,
  FacultyAssignment,
  Attendance,
  DetailedAssignment,
  DetailedAttendance,
  UserSession
} from "./types.js";

export default function App() {
  // Theme State
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return (saved as "light" | "dark") || "light";
  });

  // Auth & Session State
  const [session, setSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem("session");
    return saved ? JSON.parse(saved) : null;
  });

  // Auth Inputs
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [roleInput, setRoleInput] = useState<"admin" | "faculty">("faculty");
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");

  // Faculty Register Inputs
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regDept, setRegDept] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Active Admin View State
  const [activeTab, setActiveTab] = useState<string>("dashboard");

  // Core Data Cache
  const [departments, setDepartments] = useState<Department[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [faculty, setFaculty] = useState<Faculty[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assignments, setAssignments] = useState<FacultyAssignment[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Local sync trigger
  const [syncKey, setSyncKey] = useState(0);

  // Form states
  const [showAddDept, setShowAddDept] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deptNameInput, setDeptNameInput] = useState("");
  const [deptHodInput, setDeptHodInput] = useState("");
  const [deptYearInput, setDeptYearInput] = useState("");

  const [showAddSubj, setShowAddSubj] = useState(false);
  const [editingSubj, setEditingSubj] = useState<Subject | null>(null);
  const [subCode, setSubCode] = useState("");
  const [subName, setSubName] = useState("");
  const [subDept, setSubDept] = useState("");
  const [subYear, setSubYear] = useState(1);
  const [subSem, setSubSem] = useState(1);

  const [showAddAssign, setShowAddAssign] = useState(false);
  const [assignFacultyId, setAssignFacultyId] = useState("");
  const [assignSubjectId, setAssignSubjectId] = useState("");
  const [assignDept, setAssignDept] = useState("");
  const [assignYear, setAssignYear] = useState(1);
  const [assignSec, setAssignSec] = useState("A");

  // Faculty Reset Password state
  const [resetFacultyId, setResetFacultyId] = useState<string | null>(null);
  const [newFacultyPassword, setNewFacultyPassword] = useState("");

  // Student Import States
  const [importStatus, setImportStatus] = useState("");

  // Single Student Add/Edit States
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentRollInput, setStudentRollInput] = useState("");
  const [studentNameInput, setStudentNameInput] = useState("");
  const [studentDeptInput, setStudentDeptInput] = useState("");
  const [studentYearInput, setStudentYearInput] = useState(1);
  const [studentSecInput, setStudentSecInput] = useState("A");
  const [studentFormError, setStudentFormError] = useState("");
  const [studentFormSuccess, setStudentFormSuccess] = useState("");

  // Copy Details Notification and Custom Delete Modal States
  const [copiedDetailsMessage, setCopiedDetailsMessage] = useState("");
  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    id: string;
    type: "department" | "subject" | "assignment" | "student" | "faculty";
    title: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (copiedDetailsMessage) {
      const timer = setTimeout(() => {
        setCopiedDetailsMessage("");
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [copiedDetailsMessage]);

  // Attendance Register (Faculty View)
  const [selectedAssignment, setSelectedAssignment] = useState<DetailedAssignment | null>(null);
  const [attendanceDate, setAttendanceDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [attendanceError, setAttendanceError] = useState("");
  const [attendanceSuccess, setAttendanceSuccess] = useState("");
  const [attendanceMarkedToday, setAttendanceMarkedToday] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState<{ [studentId: string]: "Present" | "Absent" }>({});
  const [registerStudents, setRegisterStudents] = useState<Student[]>([]);
  const [loadingRegister, setLoadingRegister] = useState(false);

  // Reports view states
  const [reportType, setReportType] = useState<"department" | "subject" | "faculty" | "student">("department");
  const [reportDept, setReportDept] = useState("");
  const [reportSubId, setReportSubId] = useState("");
  const [reportFacId, setReportFacId] = useState("");
  const [reportStId, setReportStId] = useState("");
  const [reportData, setReportData] = useState<any>(null);
  const [generatingReport, setGeneratingReport] = useState(false);

  // Pagination states
  const [studentSearch, setStudentSearch] = useState("");
  const [studentDeptFilter, setStudentDeptFilter] = useState("");
  const [studentYearFilter, setStudentYearFilter] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const studentsPerPage = 10;

  // Print Mode State (to show native-like beautiful preview)
  const [printReportMeta, setPrintReportMeta] = useState<any>(null);

  // Faculty Custom Reports States
  const [facultySubTab, setFacultySubTab] = useState<"register" | "reports">("register");
  const [facultyReportData, setFacultyReportData] = useState<any>(null);
  const [loadingFacultyReports, setLoadingFacultyReports] = useState(false);
  const [facultyReportsError, setFacultyReportsError] = useState("");

  // Sub-tab selection choices under the Reports component:
  // 1. Summary Dashboard
  // 2. Subject-wise
  // 3. Student-wise
  // 4. Date Range
  // 5. Defaulter list
  const [facultyRepActiveSection, setFacultyRepActiveSection] = useState<"summary" | "subject" | "student" | "daterange" | "defaulters">("summary");

  // Selection configurations
  const [facultyRepSelectedSubId, setFacultyRepSelectedSubId] = useState("");
  const [facultyRepSelectedStId, setFacultyRepSelectedStId] = useState("");
  const [facultyRepStartDate, setFacultyRepStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [facultyRepEndDate, setFacultyRepEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [facultyRepDefaulterThreshold, setFacultyRepDefaulterThreshold] = useState<number>(75);

  // Load faculty reports whenever session changes, or when syncKey/facultySubTab updates
  useEffect(() => {
    if (session && session.role === "faculty" && facultySubTab === "reports") {
      const fetchFacultyReports = async () => {
        setLoadingFacultyReports(true);
        setFacultyReportsError("");
        try {
          const res = await fetch(`/api/faculty/${session.id}/reports`);
          if (!res.ok) {
            throw new Error("Could not retrieve your custom reports data.");
          }
          const data = await res.json();
          setFacultyReportData(data);
          
          // Prefill default dropdown selections
          if (data.subjectWiseStats && data.subjectWiseStats.length > 0) {
            const first = data.subjectWiseStats[0];
            setFacultyRepSelectedSubId(first.subjectId);
            if (first.studentsList && first.studentsList.length > 0) {
              setFacultyRepSelectedStId(first.studentsList[0].id);
            }
          }
        } catch (err: any) {
          console.error(err);
          setFacultyReportsError(err.message || "Network error loading reports.");
        } finally {
          setLoadingFacultyReports(false);
        }
      };

      fetchFacultyReports();
    }
  }, [session, facultySubTab, syncKey]);

  // Apply Theme
  useEffect(() => {
    localStorage.setItem("theme", theme);
    const root = window.document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

  // Load backend data if logged in
  useEffect(() => {
    if (session) {
      fetchCoreData();
    }
  }, [session, syncKey]);

  const fetchCoreData = async () => {
    setLoading(true);
    try {
      const dpR = await fetch("/api/departments");
      const dps = await dpR.json();
      setDepartments(dps);

      const subR = await fetch("/api/subjects");
      const subs = await subR.json();
      setSubjects(subs);

      const stR = await fetch("/api/students");
      const sts = await stR.json();
      setStudents(sts);

      const fR = await fetch("/api/faculty");
      const facs = await fR.json();
      setFaculty(facs);

      const aR = await fetch("/api/assignments");
      const assigns = await aR.json();
      setAssignments(assigns);

      // Default values for dropdowns on assignment form
      if (facs.length > 0 && !assignFacultyId) setAssignFacultyId(facs[0].id);
      if (subs.length > 0 && !assignSubjectId) setAssignSubjectId(subs[0].id);
      if (dps.length > 0 && !assignDept) setAssignDept(dps[0].department_name);

      const statsR = await fetch("/api/dashboard/stats");
      const stats = await statsR.json();
      setDashboardStats(stats);
    } catch (e) {
      console.error("Failed to sync app data", e);
      setErrorMessage("Could not connect to the campus server.");
    } finally {
      setLoading(false);
    }
  };

  // Login handler
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          password: passwordInput,
          role: roleInput
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }
      localStorage.setItem("session", JSON.stringify(data.user));
      setSession(data.user);
      setAuthSuccess("Successfully logged in!");
      setEmailInput("");
      setPasswordInput("");
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  // Faculty Register handler
  const handleFacultyRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccess("");
    if (!regName || !regEmail || !regPassword || !regDept) {
      setAuthError("All profile fields are required.");
      return;
    }
    try {
      const res = await fetch("/api/auth/register-faculty", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName,
          email: regEmail,
          password: regPassword,
          department: regDept
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration error occurred.");
      }
      setAuthSuccess(data.message || "Registration successful! Wait for admin approval.");
      setRegName("");
      setRegEmail("");
      setRegPassword("");
      setRegDept("");
      setIsRegisterMode(false);
    } catch (err: any) {
      setAuthError(err.message);
    }
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("session");
    setSession(null);
    setSelectedAssignment(null);
    setReportData(null);
    setActiveTab("dashboard");
  };

  // --- ADMIN ACTIONS ---
  const handleSaveDept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deptNameInput.trim()) return;
    try {
      const url = editingDept ? `/api/departments/${editingDept.id}` : "/api/departments";
      const method = editingDept ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          department_name: deptNameInput,
          hod: deptHodInput,
          year: deptYearInput
        })
      });
      if (!res.ok) throw new Error((await res.json()).error || "Could not save");
      setDeptNameInput("");
      setDeptHodInput("");
      setDeptYearInput("");
      setEditingDept(null);
      setShowAddDept(false);
      setSyncKey(k => k + 1);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteDept = (id: string) => {
    const dept = departments.find(d => d.id === id);
    const name = dept ? dept.department_name : "";
    setDeleteConfirmTarget({
      id,
      type: "department",
      title: "Delete Department",
      message: `Are you sure you want to delete the department "${name}"? This action cannot be undone and will impact linked courses.`
    });
  };

  const handleSaveSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subCode || !subName || !subDept) return;
    try {
      const url = editingSubj ? `/api/subjects/${editingSubj.id}` : "/api/subjects";
      const method = editingSubj ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject_code: subCode,
          subject_name: subName,
          department: subDept,
          year: subYear,
          semester: subSem
        })
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setSubCode("");
      setSubName("");
      setSubDept("");
      setSubYear(1);
      setSubSem(1);
      setEditingSubj(null);
      setShowAddSubj(false);
      setSyncKey(k => k + 1);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteSubject = (id: string) => {
    const sub = subjects.find(s => s.id === id);
    const name = sub ? `${sub.subject_code} - ${sub.subject_name}` : "";
    setDeleteConfirmTarget({
      id,
      type: "subject",
      title: "Delete Subject",
      message: `Are you sure you want to delete the subject "${name}"? This action cannot be undone.`
    });
  };

  const handleApproveFaculty = async (id: string) => {
    try {
      const res = await fetch(`/api/faculty/${id}/approve`, { method: "POST" });
      if (!res.ok) throw new Error("Could not approve");
      setSyncKey(k => k + 1);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleFacultyActive = async (id: string, currentStatus: boolean) => {
    try {
      const res = await fetch(`/api/faculty/${id}/deactivate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !currentStatus })
      });
      if (!res.ok) throw new Error("Could not modify active status");
      setSyncKey(k => k + 1);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResetFacultyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetFacultyId || !newFacultyPassword.trim()) return;
    try {
      const res = await fetch(`/api/faculty/${resetFacultyId}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newFacultyPassword })
      });
      if (!res.ok) throw new Error("Failed to reset password");
      alert("Faculty password changed successfully.");
      setResetFacultyId(null);
      setNewFacultyPassword("");
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleAddAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignFacultyId || !assignSubjectId || !assignDept || !assignYear || !assignSec) return;
    try {
      const res = await fetch("/api/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          faculty_id: assignFacultyId,
          subject_id: assignSubjectId,
          department: assignDept,
          year: Number(assignYear),
          section: assignSec
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Mapping error");
      setShowAddAssign(false);
      setSyncKey(k => k + 1);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteAssignment = (id: string) => {
    setDeleteConfirmTarget({
      id,
      type: "assignment",
      title: "Remove Assignment",
      message: "Are you sure you want to remove this course and instructor mapping assignment?"
    });
  };

  // Excel / CSV Student Import Parser
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadTemplate = () => {
    try {
      const templateData = [
        ["Roll No", "Student Name", "Department", "Year", "Section"],
        ["22CSE001", "Aarav Sharma", "CSE", 2, "A"],
        ["22ECE054", "Meera Nair", "ECE", 3, "B"],
        ["23EEE012", "John Doe", "EEE", 1, "A"]
      ];

      const ws = XLSX.utils.aoa_to_sheet(templateData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Students Template");
      
      // Auto-fit column widths
      const maxColWidths = [15, 20, 15, 8, 8];
      ws['!cols'] = maxColWidths.map(w => ({ wch: w }));

      XLSX.writeFile(wb, "Student_Roster_Template.xlsx");
    } catch (err: any) {
      alert("Failed to download template: " + err.message);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setSelectedFile(file);
    if (file) {
      setImportStatus(`Selected file: ${file.name}. Ready to import.`);
    }
  };

  const handleImportStudents = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setImportStatus("Please select or drop an Excel/CSV file first.");
      return;
    }
    setImportStatus(`Opening ${selectedFile.name}...`);
    
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = evt.target?.result;
        if (!data) throw new Error("Could not process file content.");

        const workbook = XLSX.read(data, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Parse rows as raw 2D array
        const rows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1 });
        if (rows.length === 0) {
          throw new Error("The selected spreadsheet sheet is empty.");
        }

        // Intelligently scan for header row (allows minor empty padding on top)
        let headerIndex = -1;
        let colRoll = -1, colName = -1, colDept = -1, colYear = -1, colSec = -1;

        for (let i = 0; i < Math.min(10, rows.length); i++) {
          const row = rows[i];
          if (!row) continue;
          const colsStr = row.map(cell => String(cell || "").trim().toLowerCase());
          
          const hasRoll = colsStr.some(h => h.includes("roll") || h.includes("register") || h.includes("id") || h.includes("no"));
          const hasName = colsStr.some(h => h.includes("name") || h.includes("student") || h.includes("full"));
          
          if (hasRoll && hasName) {
            headerIndex = i;
            colRoll = colsStr.findIndex(h => h.includes("roll") || h.includes("register") || h.includes("id") || h.includes("no"));
            colName = colsStr.findIndex(h => h.includes("name") || h.includes("student") || h.includes("full"));
            colDept = colsStr.findIndex(h => h.includes("dept") || h.includes("department") || h.includes("branch"));
            colYear = colsStr.findIndex(h => h.includes("year") || h.includes("yr") || h.includes("sem") || h.includes("class_year"));
            colSec  = colsStr.findIndex(h => h.includes("sec") || h.includes("class") || h.includes("section") || h.includes("group"));
            break;
          }
        }

        // Fallbacks if headers cannot be scanned:
        if (headerIndex === -1) {
          headerIndex = 0;
          colRoll = 0;
          colName = 1;
          colDept = 2;
          colYear = 3;
          colSec = 4;
        }

        const parsedList: any[] = [];
        
        // Read rows starting after the header row index
        for (let i = headerIndex + 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row || row.length === 0) continue;
          
          const rollNo = String(row[colRoll] !== undefined ? row[colRoll] : "").trim().toUpperCase();
          const name = String(row[colName] !== undefined ? row[colName] : "").trim();
          const dept = String(colDept !== -1 && row[colDept] !== undefined ? row[colDept] : "CSE").trim().toUpperCase();
          
          let yearVal = 1;
          if (colYear !== -1 && row[colYear] !== undefined) {
            const rawYr = parseInt(String(row[colYear]).trim(), 10);
            if (!isNaN(rawYr)) {
              yearVal = rawYr;
            }
          }

          const secVal = String(colSec !== -1 && row[colSec] !== undefined ? row[colSec] : "A").trim().toUpperCase();

          if (rollNo && name) {
            parsedList.push({
              roll_no: rollNo,
              student_name: name,
              department: dept || "CSE",
              year: yearVal || 1,
              section: secVal || "A"
            });
          }
        }

        if (parsedList.length === 0) {
          throw new Error("No data row parsed successfully. Match or place columns in order: Roll No | Student Name | Department | Year | Section");
        }

        setImportStatus(`Found ${parsedList.length} student rows. Submitting roster...`);

        const res = await fetch("/api/students/import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ students: parsedList })
        });
        
        const importRes = await res.json();
        if (!res.ok) throw new Error(importRes.error || "Roster upload rejected.");

        setImportStatus(`Success: Imported ${importRes.count || parsedList.length} students successfully!`);
        setSelectedFile(null);
        setSyncKey(k => k + 1);
      } catch (err: any) {
        setImportStatus(`Import Error: ${err.message}`);
      }
    };

    reader.onerror = () => {
      setImportStatus("Error encountered reading selection.");
    };

    reader.readAsBinaryString(selectedFile);
  };

  const handleDeleteStudent = (id: string) => {
    const student = students.find(s => s.id === id);
    const name = student ? `${student.student_name} (${student.roll_no})` : "";
    setDeleteConfirmTarget({
      id,
      type: "student",
      title: "Delete Student Profile",
      message: `Are you sure you want to delete student "${name}" from the records?`
    });
  };

  const handleSaveSingleStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setStudentFormError("");
    setStudentFormSuccess("");

    if (!studentRollInput.trim() || !studentNameInput.trim() || !studentDeptInput.trim() || !studentSecInput.trim()) {
      setStudentFormError("Please fill out all required student details.");
      return;
    }

    const payload = {
      roll_no: studentRollInput.trim().toUpperCase(),
      student_name: studentNameInput.trim(),
      department: studentDeptInput.trim().toUpperCase(),
      year: Number(studentYearInput),
      section: studentSecInput.trim().toUpperCase()
    };

    try {
      const url = editingStudent ? `/api/students/${editingStudent.id}` : "/api/students";
      const method = editingStudent ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save student.");
      }

      setStudentFormSuccess(editingStudent ? "Student record updated successfully!" : "Student registered successfully!");
      setSyncKey(k => k + 1);

      // Keep student details that might be handy for the user when inserting classmate groups!
      // This allows them to register multiple classmates one by one very fast!
      setStudentRollInput("");
      setStudentNameInput("");

      if (editingStudent) {
        setEditingStudent(null);
        setShowAddStudent(false);
      }
    } catch (err: any) {
      setStudentFormError(err.message || "An error occurred.");
    }
  };

  const handleStartEditStudent = (st: Student) => {
    setEditingStudent(st);
    setStudentRollInput(st.roll_no);
    setStudentNameInput(st.student_name);
    setStudentDeptInput(st.department);
    setStudentYearInput(st.year);
    setStudentSecInput(st.section);
    setStudentFormError("");
    setStudentFormSuccess("");
    setShowAddStudent(true);
  };

  const handlePreFillClass = (st: Student) => {
    setEditingStudent(null);
    setStudentRollInput("");
    setStudentNameInput("");
    setStudentDeptInput(st.department);
    setStudentYearInput(st.year);
    setStudentSecInput(st.section);
    setStudentFormError("");
    setStudentFormSuccess("");
    setCopiedDetailsMessage("copied the details");
  };

  const handleDeleteFaculty = (id: string) => {
    const fac = faculty.find(f => f.id === id);
    const name = fac ? fac.name : "";
    setDeleteConfirmTarget({
      id,
      type: "faculty",
      title: "Delete Faculty Profile",
      message: `Are you sure you want to completely delete the faculty profile for "${name}"? This will also revoke all their active subjects and class assignments!`
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteConfirmTarget) return;
    const { id, type } = deleteConfirmTarget;
    try {
      let url = "";
      if (type === "department") url = `/api/departments/${id}`;
      else if (type === "subject") url = `/api/subjects/${id}`;
      else if (type === "assignment") url = `/api/assignments/${id}`;
      else if (type === "student") url = `/api/students/${id}`;
      else if (type === "faculty") url = `/api/faculty/${id}`;

      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Deletion failed");
      }
      setSyncKey(k => k + 1);
    } catch (err: any) {
      alert(err.message || "An error occurred.");
    } finally {
      setDeleteConfirmTarget(null);
    }
  };


  // --- FACULTY WORKFLOWS ---
  // Returns assignments mapped specifically to logged-in Faculty email
  const facultyMyAssignments = useMemo(() => {
    if (!session || session.role !== "faculty") return [];
    const facultyProfile = faculty.find(f => f.email.toLowerCase() === session.email.toLowerCase());
    if (!facultyProfile) return [];
    
    return assignments
      .filter(a => a.faculty_id === facultyProfile.id)
      .map(assign => {
        const sub = subjects.find(s => s.id === assign.subject_id);
        return {
          ...assign,
          facultyName: facultyProfile.name,
          subjectCode: sub?.subject_code,
          subjectName: sub?.subject_name
        } as DetailedAssignment;
      });
  }, [assignments, subjects, faculty, session]);

  // Load and setup attendance register for selected class mapping
  const startAttendanceMarking = async (assign: DetailedAssignment) => {
    setSelectedAssignment(assign);
    setLoadingRegister(true);
    setAttendanceError("");
    setAttendanceSuccess("");
    setAttendanceMarkedToday(false);
    
    try {
      // Find students strictly belonging to this Class mapping (Dept, Year, Sec)
      const matchingStudents = students.filter(
        st => st.department.toUpperCase() === assign.department.toUpperCase() &&
              Number(st.year) === Number(assign.year) &&
              st.section.toUpperCase() === assign.section.toUpperCase()
      );
      setRegisterStudents(matchingStudents);

      // Check if attendance already marked today for this subject & class
      const checkR = await fetch(
        `/api/attendance/check?date=${attendanceDate}&subject_id=${assign.subject_id}&department=${assign.department}&year=${assign.year}&section=${assign.section}`
      );
      const checkData = await checkR.json();
      
      const recordStates: { [studentId: string]: "Present" | "Absent" } = {};
      if (checkData.marked) {
        setAttendanceMarkedToday(true);
        setAttendanceSuccess("Attendance registers already exist for today. You are now in EDIT mode.");
        checkData.records.forEach((rec: any) => {
          recordStates[rec.student_id] = rec.status;
        });
      } else {
        // By default, mark all students as "Present" to facilitate fast marking
        matchingStudents.forEach(s => {
          recordStates[s.id] = "Present";
        });
      }
      setAttendanceRecords(recordStates);
    } catch (err) {
      console.error(err);
      setAttendanceError("Could not verify today's register.");
    } finally {
      setLoadingRegister(false);
    }
  };

  // Quick reload list whenever date changes
  useEffect(() => {
    if (selectedAssignment) {
      startAttendanceMarking(selectedAssignment);
    }
  }, [attendanceDate]);

  const toggleStudentStatus = (studentId: string) => {
    setAttendanceRecords(prev => ({
      ...prev,
      [studentId]: prev[studentId] === "Present" ? "Absent" : "Present"
    }));
  };

  const handleToggleAll = (status: "Present" | "Absent") => {
    const updated = { ...attendanceRecords };
    registerStudents.forEach(s => {
      updated[s.id] = status;
    });
    setAttendanceRecords(updated);
  };

  const handleSubmitAttendance = async () => {
    if (!selectedAssignment) return;
    setAttendanceError("");
    setAttendanceSuccess("");
    
    const recs = Object.keys(attendanceRecords).map(sId => ({
      student_id: sId,
      status: attendanceRecords[sId]
    }));

    if (recs.length === 0) {
      setAttendanceError("No students exist in this register to submit.");
      return;
    }

    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          attendance_date: attendanceDate,
          subject_id: selectedAssignment.subject_id,
          faculty_id: selectedAssignment.faculty_id,
          records: recs,
          isEdit: attendanceMarkedToday // sends if updating
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      setAttendanceSuccess("Attendance submitted and locked successfully!");
      setSyncKey(k => k + 1);
      // Stay on the success view so they see the result clearly
    } catch (err: any) {
      setAttendanceError(err.message);
    }
  };


  // --- DYNAMIC REPORTS VIEWSSPACE ---
  const triggerReportGeneration = async () => {
    setGeneratingReport(true);
    setReportData(null);
    try {
      let query = `type=${reportType}`;
      if (reportType === "department") query += `&department=${reportDept}`;
      if (reportType === "subject") query += `&subjectId=${reportSubId}`;
      if (reportType === "faculty") query += `&facultyId=${reportFacId}`;
      if (reportType === "student") query += `&studentId=${reportStId}`;

      const res = await fetch(`/api/reports/attendance?${query}`);
      const data = await res.json();
      setReportData(data);
    } catch (e) {
      alert("Error building college records report.");
    } finally {
      setGeneratingReport(false);
    }
  };

  // Excel Exporter
  const runExportToExcel = (title: string, breakdownList: any[]) => {
    try {
      const headers = ["Student Name", "Roll Number", "Total Lectures", "Lectures Present", "Lectures Absent", "Attendance %"];
      const rows = breakdownList.map(item => [
        item.name,
        item.rollNo,
        item.totalClasses,
        item.present,
        item.absent,
        `${item.percentage}%`
      ]);
      
      const infoRow0 = [`REPORT: ${title}`];
      const infoRow1 = [`Generated: ${new Date().toLocaleDateString()}`];
      
      const sheetData = [
        infoRow0,
        infoRow1,
        [], // empty spacer row
        headers,
        ...rows
      ];

      const ws = XLSX.utils.aoa_to_sheet(sheetData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance Report");
      
      // Auto-fit column widths
      const maxColWidths = [25, 15, 15, 15, 15, 15];
      ws['!cols'] = maxColWidths.map(w => ({ wch: w }));

      const fileName = `Attendance_Report_${title.replace(/\s+/g, "_")}.xlsx`;
      XLSX.writeFile(wb, fileName);
    } catch (err: any) {
      alert("Failed to export to Excel: " + err.message);
    }
  };

  // PDF Exporter & Printable layout activator
  const triggerPrintPreview = (title: string, breakdownList: any[]) => {
    // 1. Trigger beautiful PDF file download directly
    try {
      const doc = new jsPDF("p", "mm", "a4");
      
      const margin = 14;
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      
      // Set title
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(30, 41, 59); // slate-800
      doc.text("CAMPUS ATTENDANCE GENERAL LEDGER", margin, 20);
      
      // Subtitle
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(71, 85, 105); // slate-600
      doc.text(`Report: ${title}`, margin, 27);
      doc.text(`Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, margin, 33);
      
      // Line separator
      doc.setDrawColor(203, 213, 225); // slate-300
      doc.setLineWidth(0.5);
      doc.line(margin, 38, pageWidth - margin, 38);
      
      // Table headers
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(10);
      doc.setFillColor(241, 245, 249); // slate-100 bg
      doc.rect(margin, 43, pageWidth - (margin * 2), 8, "F");
      
      doc.setTextColor(51, 65, 85); // slate-700 text
      doc.text("#", margin + 2, 48.5);
      doc.text("Student Name", margin + 10, 48.5);
      doc.text("Roll Number", margin + 65, 48.5);
      doc.text("Total", margin + 100, 48.5);
      doc.text("Present", margin + 120, 48.5);
      doc.text("Absent", margin + 140, 48.5);
      doc.text("Avg %", margin + 160, 48.5);
      
      doc.line(margin, 51, pageWidth - margin, 51);
      
      let y = 57;
      doc.setFont("Helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      
      breakdownList.forEach((st, idx) => {
        if (y > pageHeight - 30) {
          doc.addPage();
          
          doc.setFont("Helvetica", "bold");
          doc.setFontSize(10);
          doc.setFillColor(241, 245, 249);
          doc.rect(margin, 15, pageWidth - (margin * 2), 8, "F");
          doc.setTextColor(51, 65, 85);
          doc.text("#", margin + 2, 20.5);
          doc.text("Student Name", margin + 10, 20.5);
          doc.text("Roll Number", margin + 65, 20.5);
          doc.text("Total", margin + 100, 20.5);
          doc.text("Present", margin + 120, 20.5);
          doc.text("Absent", margin + 140, 20.5);
          doc.text("Avg %", margin + 160, 20.5);
          
          doc.line(margin, 23, pageWidth - margin, 23);
          
          y = 29;
          doc.setFont("Helvetica", "normal");
          doc.setFontSize(9);
          doc.setTextColor(30, 41, 59);
        }
        
        if (idx % 2 === 1) {
          doc.setFillColor(248, 250, 252);
          doc.rect(margin, y - 4, pageWidth - (margin * 2), 6, "F");
        }
        
        doc.text(String(idx + 1), margin + 2, y);
        doc.text(st.name || "N/A", margin + 10, y, { maxWidth: 52 });
        doc.text(st.rollNo || "N/A", margin + 65, y);
        doc.text(String(st.totalClasses), margin + 100, y);
        
        doc.setTextColor(16, 185, 129);
        doc.text(String(st.present), margin + 120, y);
        doc.setTextColor(239, 68, 68);
        doc.text(String(st.absent), margin + 140, y);
        
        doc.setTextColor(30, 41, 59);
        doc.setFont("Helvetica", "bold");
        doc.text(`${st.percentage}%`, margin + 160, y);
        doc.setFont("Helvetica", "normal");
        
        doc.setDrawColor(241, 245, 249);
        doc.line(margin, y + 2, pageWidth - margin, y + 2);
        
        y += 7;
      });
      
      if (y > pageHeight - 35) {
        doc.addPage();
        y = 25;
      }
      
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.5);
      doc.line(margin, y + 5, pageWidth - margin, y + 5);
      
      doc.setFont("Helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text("Smart Attendance College Management System v1.0.", margin, y + 10);
      doc.text("Values calculated real-time from active database logs.", margin, y + 14);
      
      doc.setFont("Helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Authorized Stamp / Signatory", pageWidth - margin - 50, y + 10);
      
      const fileName = `Attendance_Report_${title.replace(/\s+/g, "_")}.pdf`;
      doc.save(fileName);
    } catch (err: any) {
      console.error("PDF download fallback failed or blocked", err);
    }

    // 2. Also set state for window print overlay for absolute browser coverage
    setPrintReportMeta({
      title,
      breakdownList,
      date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString()
    });
    setTimeout(() => {
      window.print();
    }, 200);
  };


  // --- RENDER DENSE DATA HELPERS ---
  const enrichedAssignmentsList = useMemo(() => {
    return assignments.map(a => {
      const fac = faculty.find(f => f.id === a.faculty_id);
      const sub = subjects.find(s => s.id === a.subject_id);
      return {
        ...a,
        facultyName: fac ? fac.name : "Unknown Faculty",
        subjectCode: sub ? sub.subject_code : "N/A",
        subjectName: sub ? sub.subject_name : "N/A"
      };
    });
  }, [assignments, faculty, subjects]);

  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchesSearch = s.student_name.toLowerCase().includes(studentSearch.toLowerCase()) || 
                            s.roll_no.toLowerCase().includes(studentSearch.toLowerCase());
      const matchesDept = !studentDeptFilter || s.department.toUpperCase() === studentDeptFilter.toUpperCase();
      const matchesYear = !studentYearFilter || Number(s.year) === Number(studentYearFilter);

      return matchesSearch && matchesDept && matchesYear;
    });
  }, [students, studentSearch, studentDeptFilter, studentYearFilter]);

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage) || 1;
  const paginatedStudents = useMemo(() => {
    const startIndex = (studentPage - 1) * studentsPerPage;
    return filteredStudents.slice(startIndex, startIndex + studentsPerPage);
  }, [filteredStudents, studentPage]);

  // Handle pagination boundary safety
  useEffect(() => {
    if (studentPage > totalPages) {
      setStudentPage(totalPages);
    }
  }, [totalPages, studentPage]);


  // Pie Chart Prepper for Stats
  const chartData = useMemo(() => {
    if (!dashboardStats?.todaySummary) return [];
    return [
      { name: "Present", value: dashboardStats.todaySummary.present, color: "#10b981" },
      { name: "Absent", value: dashboardStats.todaySummary.absent, color: "#ef4444" }
    ];
  }, [dashboardStats]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* NATIVE PRINT PREVIEW OVERLAY (Triggered via class print:block) */}
      {printReportMeta && (
        <div id="print-canvas" className="hidden print:block p-8 bg-white text-black min-h-screen font-sans">
          <div className="text-center border-b-2 border-slate-300 pb-4 mb-6">
            <h1 className="text-3xl font-extrabold tracking-tight text-blue-900 uppercase">Campus Attendance Ledger</h1>
            <h2 className="text-xl font-medium text-slate-700 mt-2">{printReportMeta.title}</h2>
            <p className="text-sm text-slate-500 mt-1">Generated: {printReportMeta.date}</p>
          </div>
          
          {printReportMeta.metadata && (
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6 text-xs font-sans">
              {printReportMeta.metadata.map((m: any, idx: number) => (
                <div key={idx} className="flex justify-between border-b border-dashed border-slate-200 pb-1">
                  <span className="font-semibold text-slate-500">{m.label}:</span>
                  <span className="font-bold text-slate-800">{m.value}</span>
                </div>
              ))}
            </div>
          )}

          <table className="w-full border-collapse border border-slate-300 text-sm">
            <thead>
              <tr className="bg-slate-100">
                {printReportMeta.tableHeaders ? (
                  printReportMeta.tableHeaders.map((h: string, idx: number) => (
                    <th key={idx} className="border border-slate-300 p-2 text-left font-bold text-slate-800">{h}</th>
                  ))
                ) : (
                  <>
                    <th className="border border-slate-300 p-2 text-left font-bold text-slate-800">#</th>
                    <th className="border border-slate-300 p-2 text-left font-bold text-slate-800">Student Name</th>
                    <th className="border border-slate-300 p-2 text-left font-bold text-slate-800">Roll Number</th>
                    <th className="border border-slate-300 p-2 text-center font-bold text-slate-800">Total Classes</th>
                    <th className="border border-slate-300 p-2 text-center font-bold text-slate-800">Present</th>
                    <th className="border border-slate-300 p-2 text-center font-bold text-slate-800">Absent</th>
                    <th className="border border-slate-300 p-2 text-center font-bold text-slate-800">Avg %</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {printReportMeta.tableHeaders && printReportMeta.tableRows ? (
                printReportMeta.tableRows.map((row: string[], idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    {row.map((cell: string, cidx: number) => (
                      <td key={cidx} className="border border-slate-300 p-2 whitespace-nowrap">{cell}</td>
                    ))}
                  </tr>
                ))
              ) : (
                printReportMeta.breakdownList?.map((st: any, idx: number) => (
                  <tr key={st.id} className="hover:bg-slate-50">
                    <td className="border border-slate-300 p-2 text-left">{idx + 1}</td>
                    <td className="border border-slate-300 p-2 font-semibold">{st.name}</td>
                    <td className="border border-slate-300 p-2">{st.rollNo}</td>
                    <td className="border border-slate-300 p-2 text-center font-mono">{st.totalClasses}</td>
                    <td className="border border-slate-300 p-2 text-center font-mono text-emerald-600">{st.present}</td>
                    <td className="border border-slate-300 p-2 text-center font-mono text-rose-600">{st.absent}</td>
                    <td className="border border-slate-300 p-2 text-center font-mono font-bold">{st.percentage}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          <div className="mt-12 flex justify-between text-xs text-slate-500 border-t pt-4">
            <p>{printReportMeta.footerMessage || "Smart Attendance college management tool v1.0. All values are calculated in live database."}</p>
            <p className="font-semibold">authorized signatory stamp / signature</p>
          </div>
        </div>
      )}

      {/* REGULAR APP SCREEN (Hidden during print screen layout) */}
      <div className="print:hidden flex flex-col flex-grow">
        
        {/* HEADER BAR */}
        <header id="header-bar" className="sticky top-0 z-30 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-colors">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-200 dark:shadow-none">
                <GraduationCap className="h-6 w-6" />
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-950 dark:text-white">Smart Attendance</span>
                <span className="hidden sm:inline-block ml-2 px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full">College Center</span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              {/* Theme switch */}
              <button
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                className="p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Toggle Theme"
              >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </button>

              {session && (
                <div className="flex items-center space-x-3 border-l border-slate-200 dark:border-slate-800 pl-3">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-semibold text-slate-900 dark:text-gray-100">{session.name}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 capitalize">{session.role} • {session.department || "Admin Office"}</p>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 dark:hover:bg-rose-900/30 rounded-lg text-sm font-medium transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* MAIN BODY AREA */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full">
          
          {/* 1. NOT AUTHENTICATED: LANDING & LOGIN */}
          {!session ? (
            <div className="max-w-md mx-auto my-6 sm:my-12 bg-white dark:bg-slate-900 p-5 sm:p-8 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-800 transition-all">
              <div className="text-center mb-8">
                <div className="inline-block p-4 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 rounded-2xl mb-4">
                  <GraduationCap className="h-10 w-10 mx-auto" />
                </div>
                <h2 className="text-2xl font-extrabold text-slate-950 dark:text-white">Smart Attendance Portal</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage registration, classes, logs, and daily indices.</p>
              </div>

              {/* Login/Register Toggle Panel */}
              <div className="flex border-b border-slate-200 dark:border-slate-800 mb-6 font-medium">
                <button
                  onClick={() => { setIsRegisterMode(false); setAuthError(""); setAuthSuccess(""); }}
                  className={`flex-1 pb-3 text-center transition-colors border-b-2 ${!isRegisterMode ? "border-blue-600 text-blue-600 dark:text-blue-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                >
                  Account Login
                </button>
                <button
                  onClick={() => { setIsRegisterMode(true); setAuthError(""); setAuthSuccess(""); }}
                  className={`flex-1 pb-3 text-center transition-colors border-b-2 ${isRegisterMode ? "border-blue-600 text-blue-600 dark:text-blue-400 font-bold" : "border-transparent text-slate-400 hover:text-slate-600"}`}
                >
                  Faculty Register
                </button>
              </div>

              {authError && (
                <div className="mb-4 p-3 bg-red-100 border-l-4 border-red-500 text-red-700 dark:bg-red-950/20 dark:text-red-400 text-xs rounded flex items-start space-x-2 animate-pulse">
                  <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{authError}</span>
                </div>
              )}

              {authSuccess && (
                <div className="mb-4 p-3 bg-emerald-100 border-l-4 border-emerald-500 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 text-xs rounded flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{authSuccess}</span>
                </div>
              )}

              {!isRegisterMode ? (
                // LOGIN SCREEN FORM
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5">User Role Scope</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => { setRoleInput("faculty"); setAuthError(""); }}
                        className={`py-2 px-3 text-sm font-medium rounded-lg border text-center transition-all ${roleInput === "faculty" ? "bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500" : "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700"}`}
                      >
                        Faculty Panel
                      </button>
                      <button
                        type="button"
                        onClick={() => { setRoleInput("admin"); setAuthError(""); }}
                        className={`py-2 px-3 text-sm font-medium rounded-lg border text-center transition-all ${roleInput === "admin" ? "bg-blue-50 border-blue-600 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-500" : "bg-white border-slate-200 dark:bg-slate-800 dark:border-slate-700"}`}
                      >
                        Admin Portal
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder={roleInput === "admin" ? "admin@college.com" : "e.g., ravi@college.edu"}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-sm dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label htmlFor="pass" className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Account Password</label>
                    <input
                      id="pass"
                      type="password"
                      required
                      value={passwordInput}
                      onChange={(e) => setPasswordInput(e.target.value)}
                      placeholder="******"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-sm dark:border-slate-700"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors mt-2"
                  >
                    Authenticate Account
                  </button>

                  <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-xs space-y-1 mt-4">
                    <p className="font-semibold text-slate-700 dark:text-slate-300">Default Demo accounts:</p>
                    <p>• Admin: <span className="font-mono bg-white dark:bg-slate-900 px-1 rounded text-red-500">admin@college.com</span> / password <span className="font-mono bg-white dark:bg-slate-900 px-1 rounded">admin123</span></p>
                    <p>• Faculty: <span className="font-mono bg-white dark:bg-slate-900 px-1 rounded text-red-500">ravi@college.edu</span> / password <span className="font-mono bg-white dark:bg-slate-900 px-1 rounded">facultypassword</span></p>
                  </div>
                </form>
              ) : (
                // FACULTY REGISTRATION PANEL
                <form onSubmit={handleFacultyRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      required
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="e.g. Prof. Ravi Kumar"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-sm dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Campus Email</label>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="username@college.edu"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-sm dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Login Password</label>
                    <input
                      type="password"
                      required
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      placeholder="Choose a strong password"
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-transparent text-sm dark:border-slate-700"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">College Department</label>
                    <select
                      value={regDept}
                      onChange={(e) => setRegDept(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-800 text-sm dark:border-slate-700"
                      required
                    >
                      <option value="">-- Choose Dept --</option>
                      <option value="CSE">CSE (Computer Science)</option>
                      <option value="IT">IT (Information Tech)</option>
                      <option value="ECE">ECE (Electronics Eng)</option>
                      <option value="EEE">EEE (Electrical Eng)</option>
                      <option value="Mechanical">Mechanical</option>
                      <option value="Civil">Civil</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm transition-colors mt-2"
                  >
                    Submit Registration Request
                  </button>
                  <p className="text-[11px] text-slate-500 text-center">Note: Faculty accounts must be approved by the Admin in the dashboard before signing in.</p>
                </form>
              )}
            </div>
          ) : (
            // 2. USER IS LOGGED IN
            <div className="space-y-8">
              
              {/* BRANDING HUB BAR FOR ADMINS OR FACULTIES */}
              {session.role === "admin" ? (
                // ==========================================
                // ADMIN INTERFACE LAYOUT
                // ==========================================
                <div className="space-y-8">
                  
                  {/* ADMIN HEADER QUICK-TABS NAVIGATION */}
                  <div className="flex items-center w-full overflow-x-auto pb-2 border-b border-slate-200 dark:border-slate-800 md:flex-wrap gap-1.5 -mx-4 px-4 md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {[
                      { id: "dashboard", label: "Overview Stats", icon: Users },
                      { id: "departments", label: "Departments", icon: Briefcase },
                      { id: "subjects", label: "Subjects", icon: BookOpen },
                      { id: "assignments", label: "Faculty Assignments", icon: UserCheck },
                      { id: "students", label: "Student Register", icon: GraduationCap },
                      { id: "faculty", label: "Approved Faculty", icon: Users },
                      { id: "reports", label: "Dynamic Reports", icon: FileText }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        id={`tab-nav-${tab.id}`}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all flex-shrink-0 ${activeTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-amber-100/10 dark:hover:bg-slate-800"}`}
                      >
                        <tab.icon className="w-4.5 h-4.5" />
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* ACTIVE TAB SECTION - ADMIN */}
                  {activeTab === "dashboard" && (
                    <div className="space-y-8">
                      {/* STATS TILES GRID */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-ellipsis overflow-hidden">Total Active Students</p>
                            <p className="text-3xl font-extrabold tracking-tight mt-1 text-slate-950 dark:text-white">{dashboardStats?.studentsCount || 0}</p>
                          </div>
                          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                            <GraduationCap className="h-6 w-6" />
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Approved Faculty</p>
                            <p className="text-3xl font-extrabold tracking-tight mt-1 text-slate-950 dark:text-white">
                              {faculty.filter(f => f.approved).length} <span className="text-xs text-slate-400 font-normal">/ {faculty.length}</span>
                            </p>
                          </div>
                          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <Users className="h-6 w-6" />
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Academic Subjects</p>
                            <p className="text-3xl font-extrabold tracking-tight mt-1 text-slate-950 dark:text-white">{dashboardStats?.subjectsCount || 0}</p>
                          </div>
                          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                            <BookOpen className="h-6 w-6" />
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Marked Attendance Today</p>
                            <p className="text-3xl font-extrabold tracking-tight mt-1 text-slate-950 dark:text-white">{dashboardStats?.todaySummary?.percentage || 0}%</p>
                          </div>
                          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <CheckCircle className="h-6 w-6" />
                          </div>
                        </div>
                      </div>

                      {/* STATS TILES GRID - SECOND ROW (ADDITIONAL WEEKLY/MONTHLY AND SUBJECT STATS) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Weekly Attendance Avg</p>
                            <p className="text-3xl font-extrabold tracking-tight mt-1 text-slate-950 dark:text-white">{dashboardStats?.weeklyRate || 0}%</p>
                            <p className="text-xs text-slate-400 mt-1">Past 7 calendar days rolling</p>
                          </div>
                          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                            <TrendingUp className="h-6 w-6" />
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Monthly Attendance Avg</p>
                            <p className="text-3xl font-extrabold tracking-tight mt-1 text-slate-950 dark:text-white">{dashboardStats?.monthlyRate || 0}%</p>
                            <p className="text-xs text-slate-400 mt-1 font-normal">Cumulative 30 days rolling</p>
                          </div>
                          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                            <Calendar className="h-6 w-6" />
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 text-ellipsis overflow-hidden">Top Attended Subject</p>
                            <p className="text-lg font-extrabold tracking-tight mt-1 text-slate-950 dark:text-white truncate max-w-[170px]">
                              {(() => {
                                if (!dashboardStats?.subjectAnalysis || dashboardStats.subjectAnalysis.length === 0) return "N/A";
                                const top = dashboardStats.subjectAnalysis.reduce((max: any, item: any) => item.percentage > max.percentage ? item : max, dashboardStats.subjectAnalysis[0]);
                                return `${top.subjectCode} (${top.percentage}%)`;
                              })()}
                            </p>
                            <p className="text-xs text-slate-400 mt-1">Highest attendance average</p>
                          </div>
                          <div className="p-3 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-xl">
                            <Star className="h-6 w-6" />
                          </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Attendance Logs</p>
                            <p className="text-3xl font-extrabold tracking-tight mt-1 text-slate-950 dark:text-white">{dashboardStats?.totalAttendanceCount || 0}</p>
                            <p className="text-xs text-slate-400 mt-1">All-time database registers</p>
                          </div>
                          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                            <Database className="h-6 w-6" />
                          </div>
                        </div>
                      </div>

                      {/* CHARTS CONTAINER - VISUALIZATIONS */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        
                        {/* Daily Attendance Rate (Donut Chart for Today's Department-wise Presence) */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-md flex flex-col justify-between lg:col-span-1">
                          <div>
                            <h3 className="font-bold text-slate-900 dark:text-white text-lg">Today's Presence Audit</h3>
                            <p className="text-xs text-slate-500 mt-1">Donut chart of present students grouped by department active today.</p>
                          </div>
                          
                          <div className="h-48 my-4 flex items-center justify-center">
                            {dashboardStats?.todayDeptAnalysis && dashboardStats.todayDeptAnalysis.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={dashboardStats.todayDeptAnalysis}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={52}
                                    outerRadius={75}
                                    paddingAngle={3}
                                    dataKey="value"
                                  >
                                    {dashboardStats.todayDeptAnalysis.map((entry: any, index: number) => {
                                      const colors = ["#10b981", "#3b82f6", "#6366f1", "#8b5cf6", "#f59e0b"];
                                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                    })}
                                  </Pie>
                                  <Tooltip formatter={(value) => [`${value} Present`]} />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="text-center text-sm text-slate-400 mt-12">
                                <Clock className="w-8 h-8 mx-auto stroke-1" />
                                <p className="mt-2 text-xs">No entries posted today yet.</p>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 text-[10px] border-t pt-4">
                            {dashboardStats?.todayDeptAnalysis?.map((entry: any, index: number) => {
                              const colors = ["bg-emerald-500", "bg-blue-500", "bg-indigo-500", "bg-purple-500", "bg-amber-500"];
                              return (
                                <div key={entry.name} className="flex items-center space-x-1">
                                  <span className={`w-2 h-2 rounded-full ${colors[index % colors.length]}`} />
                                  <span className="font-medium text-slate-600 dark:text-slate-400 truncate max-w-[90px]" title={entry.name}>
                                    {entry.name}: <span className="font-bold text-slate-800 dark:text-slate-200">{entry.value}</span>
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Department Wise average metrics */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-md lg:col-span-2">
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg">Average Attendance by Department</h3>
                          <p className="text-xs text-slate-500 mt-1 mb-4">Historic attendance stats for matching registered students.</p>
                          
                          <div className="h-56">
                            {dashboardStats?.deptAnalysis && dashboardStats?.deptAnalysis.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dashboardStats.deptAnalysis}>
                                  <XAxis dataKey="department" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                  <YAxis unit="%" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                  <Tooltip formatter={(value) => [`${value}% Attendance`]} />
                                  <Bar dataKey="percentage" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={45}>
                                    {dashboardStats.deptAnalysis.map((entry: any, index: number) => {
                                      const colors = ["#2563eb", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899"];
                                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                    })}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            ) : (
                              <p className="text-center text-sm text-slate-400 py-20">Syncing database averages...</p>
                            )}
                          </div>
                        </div>

                      </div>

                      {/* ADDITIONAL CHARTS ROW */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Subject-wise metrics (LineChart instead of BarChart) */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-md">
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg">Subject-wise Average Attendance</h3>
                          <p className="text-xs text-slate-500 mt-1 mb-4">Class-wise historical average attendance curve per subject code.</p>
                          
                          <div className="h-56">
                            {dashboardStats?.subjectAnalysis && dashboardStats?.subjectAnalysis.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={dashboardStats.subjectAnalysis} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                  <XAxis dataKey="subjectCode" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                  <YAxis unit="%" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                  <Tooltip formatter={(value, name, props) => [`${value}% Attendance`, props.payload.subjectName]} />
                                  <Line type="monotone" dataKey="percentage" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                                </LineChart>
                              </ResponsiveContainer>
                            ) : (
                              <p className="text-center text-sm text-slate-400 py-20">Loading subject analytics...</p>
                            )}
                          </div>
                        </div>

                        {/* Weekly Attendance Trend Analysis (Column Chart) */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-md">
                          <h3 className="font-bold text-slate-900 dark:text-white text-lg">Weekly Trend Analysis</h3>
                          <p className="text-xs text-slate-500 mt-1 mb-4">Percentage rating over active attendance register sessions/dates.</p>
                          
                          <div className="h-56">
                            {dashboardStats?.timeAnalysis && dashboardStats?.timeAnalysis.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={dashboardStats.timeAnalysis}>
                                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
                                  <YAxis unit="%" stroke="#94a3b8" fontSize={11} tickLine={false} />
                                  <Tooltip formatter={(value) => [`${value}% Rate`]} />
                                  <Bar dataKey="percentage" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={45}>
                                    {dashboardStats.timeAnalysis.map((entry: any, index: number) => {
                                      const colors = ["#10b981", "#34d399", "#059669", "#6ee7b7"];
                                      return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                                    })}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            ) : (
                              <p className="text-center text-sm text-slate-400 py-20">Loading periodic analytics...</p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* QUICK MANUAL STEPS */}
                      <div className="bg-blue-50/50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 p-5 rounded-2xl flex items-start space-x-3">
                        <AlertTriangle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <h4 className="font-bold text-blue-900 dark:text-blue-300 text-sm">Getting started as an administrator:</h4>
                          <p className="text-xs text-blue-800 dark:text-blue-400 mt-1 leading-relaxed">
                            1. Ensure academic <span className="font-bold">Departments</span> exist (e.g. CSE, IT). <br />
                            2. Use <span className="font-bold">Student Register</span> page to upload lists instantly copy-pasting from Excel. <br />
                            3. Approve pending faculty profiles in <span className="font-bold">Faculty Approval</span> logs.<br />
                            4. Map classes by assigning faculty members matching available <span className="font-bold">Subjects</span>.
                          </p>
                        </div>
                      </div>

                    </div>
                  )}

                  {/* ACTIVE TAB SECTION - DEPARTMENTS */}
                  {activeTab === "departments" && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold">Academic Departments</h3>
                          <p className="text-xs text-slate-500">Core departments mapped in the college ecosystem.</p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingDept(null);
                            setDeptNameInput("");
                            setDeptHodInput("");
                            setDeptYearInput("");
                            setShowAddDept(true);
                          }}
                          className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors w-full sm:w-auto"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Department</span>
                        </button>
                      </div>

                      {showAddDept && (
                        <form onSubmit={handleSaveDept} className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-xl">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{editingDept ? "Edit" : "Create"} Department</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Department Name</label>
                              <input
                                type="text"
                                required
                                value={deptNameInput}
                                onChange={(e) => setDeptNameInput(e.target.value)}
                                placeholder="e.g., CSE"
                                className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent text-sm dark:border-slate-700"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">HOD Name</label>
                              <input
                                type="text"
                                value={deptHodInput}
                                onChange={(e) => setDeptHodInput(e.target.value)}
                                placeholder="e.g., Dr. Amit Verma"
                                className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent text-sm dark:border-slate-700"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Academic Years / Classes</label>
                              <input
                                type="text"
                                value={deptYearInput}
                                onChange={(e) => setDeptYearInput(e.target.value)}
                                placeholder="e.g., 1st, 2nd, 3rd, 4th Year"
                                className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-transparent text-sm dark:border-slate-700"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end space-x-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => { 
                                setShowAddDept(false); 
                                setEditingDept(null); 
                                setDeptNameInput(""); 
                                setDeptHodInput(""); 
                                setDeptYearInput(""); 
                              }}
                              className="px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 rounded-md"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md font-bold"
                            >
                              Save
                            </button>
                          </div>
                        </form>
                      )}

                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto">
                        <table className="min-w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                              <th className="p-4 font-semibold text-slate-700 dark:text-slate-100 uppercase tracking-wider text-xs">#</th>
                              <th className="p-4 font-semibold text-slate-700 dark:text-slate-100 uppercase tracking-wider text-xs">Department Name</th>
                              <th className="p-4 font-semibold text-slate-700 dark:text-slate-100 uppercase tracking-wider text-xs">HOD Name</th>
                              <th className="p-4 font-semibold text-slate-700 dark:text-slate-100 uppercase tracking-wider text-xs">Academic Years</th>
                              <th className="p-4 font-semibold text-slate-700 dark:text-slate-100 uppercase tracking-wider text-xs text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 whitespace-nowrap">
                            {departments.map((dept, index) => (
                              <tr key={dept.id} className="hover:bg-slate-50/50">
                                <td className="p-4 font-semibold">{index + 1}</td>
                                <td className="p-4 font-bold tracking-wide text-blue-600 dark:text-blue-400">{dept.department_name}</td>
                                <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">{dept.hod || "Not Assigned"}</td>
                                <td className="p-4 text-slate-500 text-xs font-mono">{dept.year || "N/A"}</td>
                                <td className="p-4 text-right space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingDept(dept);
                                      setDeptNameInput(dept.department_name);
                                      setDeptHodInput(dept.hod || "");
                                      setDeptYearInput(dept.year || "");
                                      setShowAddDept(true);
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-4.5 h-4.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteDept(dept.id)}
                                    className="p-1.5 text-rose-500 hover:text-rose-700"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4.5 h-4.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {departments.length === 0 && (
                              <tr>
                                <td colSpan={5} className="p-6 text-center text-slate-400">No departments specified yet.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ACTIVE TAB SECTION - SUBJECTS */}
                  {activeTab === "subjects" && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold">Subjects Directory</h3>
                          <p className="text-xs text-slate-500">Academic catalogs matching university terms.</p>
                        </div>
                        <button
                          onClick={() => {
                            setEditingSubj(null);
                            setSubCode("");
                            setSubName("");
                            setSubDept(departments[0]?.department_name || "");
                            setSubYear(1);
                            setSubSem(1);
                            setShowAddSubj(true);
                          }}
                          className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors w-full sm:w-auto"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Add Subject</span>
                        </button>
                      </div>

                      {showAddSubj && (
                        <form onSubmit={handleSaveSubject} className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-lg">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">{editingSubj ? "Edit" : "Create"} Subject</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Subject Code</label>
                              <input
                                type="text"
                                required
                                value={subCode}
                                onChange={(e) => setSubCode(e.target.value)}
                                placeholder="CS401"
                                className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 bg-transparent text-sm dark:border-slate-700"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Subject Name</label>
                              <input
                                type="text"
                                required
                                value={subName}
                                onChange={(e) => setSubName(e.target.value)}
                                placeholder="Database Management"
                                className="w-full px-3 py-1.5 border rounded-lg focus:ring-2 bg-transparent text-sm dark:border-slate-700"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Department</label>
                              <select
                                value={subDept}
                                onChange={(e) => setSubDept(e.target.value)}
                                className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-sm dark:border-slate-700"
                                required
                              >
                                {departments.map(d => (
                                  <option key={d.id} value={d.department_name}>{d.department_name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Academic Year</label>
                              <select
                                value={subYear}
                                onChange={(e) => setSubYear(Number(e.target.value))}
                                className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-sm dark:border-slate-700"
                              >
                                <option value={1}>1st Year</option>
                                <option value={2}>2nd Year</option>
                                <option value={3}>3rd Year</option>
                                <option value={4}>4th Year</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Semester Index</label>
                              <input
                                type="number"
                                required
                                min={1}
                                max={8}
                                value={subSem}
                                onChange={(e) => setSubSem(Number(e.target.value))}
                                className="w-full px-3 py-1.5 border rounded-lg bg-transparent text-sm dark:border-slate-700"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end space-x-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => { setShowAddSubj(false); setEditingSubj(null); }}
                              className="px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md font-bold"
                            >
                              Save Subject
                            </button>
                          </div>
                        </form>
                      )}

                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto">
                        <table className="min-w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                              <th className="p-4 font-semibold text-slate-700 dark:text-slate-100 uppercase tracking-wider text-xs">Code</th>
                              <th className="p-4 font-semibold text-slate-700 dark:text-slate-100 uppercase tracking-wider text-xs">Subject Name</th>
                              <th className="p-4 font-semibold text-slate-700 dark:text-slate-100 uppercase tracking-wider text-xs">Department</th>
                              <th className="p-4 font-semibold text-slate-700 dark:text-slate-100 uppercase tracking-wider text-xs">Year</th>
                              <th className="p-4 font-semibold text-slate-700 dark:text-slate-100 uppercase tracking-wider text-xs">Semester</th>
                              <th className="p-4 font-semibold text-slate-700 dark:text-slate-100 uppercase tracking-wider text-xs text-right">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 whitespace-nowrap">
                            {subjects.map((subj) => (
                              <tr key={subj.id} className="hover:bg-slate-50/50">
                                <td className="p-4 font-mono font-bold text-blue-600 dark:text-blue-400">{subj.subject_code}</td>
                                <td className="p-4 font-semibold text-slate-900 dark:text-white">{subj.subject_name}</td>
                                <td className="p-4">{subj.department}</td>
                                <td className="p-4">Year {subj.year}</td>
                                <td className="p-4">Sem {subj.semester}</td>
                                <td className="p-4 text-right space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingSubj(subj);
                                      setSubCode(subj.subject_code);
                                      setSubName(subj.subject_name);
                                      setSubDept(subj.department);
                                      setSubYear(subj.year);
                                      setSubSem(subj.semester);
                                      setShowAddSubj(true);
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                                    title="Edit"
                                  >
                                    <Edit2 className="w-4.5 h-4.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteSubject(subj.id)}
                                    className="p-1.5 text-rose-500 hover:text-rose-700"
                                    title="Delete"
                                  >
                                    <Trash2 className="w-4.5 h-4.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {subjects.length === 0 && (
                              <tr>
                                <td colSpan={6} className="p-6 text-center text-slate-400">No subjects initialized.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ACTIVE TAB SECTION - FACULTY ASSIGNMENTS */}
                  {activeTab === "assignments" && (
                    <div className="space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold">Faculty Subject Assignments</h3>
                          <p className="text-xs text-slate-500">Authorize active mappings mapping Faculty to Subjects and specific Classes.</p>
                        </div>
                        <button
                          onClick={() => {
                            if (faculty.filter(f => f.approved).length === 0) {
                              alert("Please approve at least one faculty profile first to create mappings!");
                              return;
                            }
                            if (subjects.length === 0) {
                              alert("Please create subjects first before assignment mappings!");
                              return;
                            }
                            setShowAddAssign(true);
                          }}
                          className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors w-full sm:w-auto"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Assign Faculty</span>
                        </button>
                      </div>

                      {showAddAssign && (
                        <form onSubmit={handleAddAssignment} className="p-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4 max-w-lg">
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white">Create Faculty Assignment Mapping</h4>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Approved Faculty</label>
                              <select
                                value={assignFacultyId}
                                onChange={(e) => setAssignFacultyId(e.target.value)}
                                className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-sm dark:border-slate-700"
                                required
                              >
                                {faculty.filter(f => f.approved).map(f => (
                                  <option key={f.id} value={f.id}>{f.name} ({f.department})</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
                              <select
                                value={assignSubjectId}
                                onChange={(e) => setAssignSubjectId(e.target.value)}
                                className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-sm dark:border-slate-700"
                                required
                              >
                                {subjects.map(s => (
                                  <option key={s.id} value={s.id}>{s.subject_code} - {s.subject_name}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Target Department</label>
                              <select
                                value={assignDept}
                                onChange={(e) => setAssignDept(e.target.value)}
                                className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-sm dark:border-slate-700"
                                required
                              >
                                {departments.map(d => (
                                  <option key={d.id} value={d.department_name}>{d.department_name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Academic Year</label>
                              <select
                                value={assignYear}
                                onChange={(e) => setAssignYear(Number(e.target.value))}
                                className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-sm dark:border-slate-700"
                              >
                                <option value={1}>1st Year</option>
                                <option value={2}>2nd Year</option>
                                <option value={3}>3rd Year</option>
                                <option value={4}>4th Year</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Class Section</label>
                              <input
                                type="text"
                                required
                                value={assignSec}
                                onChange={(e) => setAssignSec(e.target.value.toUpperCase())}
                                placeholder="A"
                                className="w-full px-3 py-1.5 border rounded-lg bg-transparent text-sm dark:border-slate-700 focus:outline-none"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end space-x-1.5 pt-1">
                            <button
                              type="button"
                              onClick={() => setShowAddAssign(false)}
                              className="px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              className="px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md font-bold"
                            >
                              Create Mapping
                            </button>
                          </div>
                        </form>
                      )}

                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto">
                        <table className="min-w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 whitespace-nowrap">
                              <th className="p-4 font-semibold text-slate-700 dark:text-slate-100 uppercase tracking-wider text-xs">Faculty</th>
                              <th className="p-4 font-semibold text-slate-700 dark:text-slate-100 uppercase tracking-wider text-xs">Subject</th>
                              <th className="p-4 font-semibold text-slate-700 dark:text-slate-100 uppercase tracking-wider text-xs">Class (Dept / Yr / Sec)</th>
                              <th className="p-4 font-semibold text-slate-700 dark:text-slate-100 uppercase tracking-wider text-xs text-right">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 whitespace-nowrap">
                            {enrichedAssignmentsList.map((mapItem) => (
                              <tr key={mapItem.id} className="hover:bg-slate-50/50">
                                <td className="p-4 font-bold text-slate-900 dark:text-white capitalize">{mapItem.facultyName}</td>
                                <td className="p-4">
                                  <span className="font-mono text-xs px-2 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded font-bold mr-1">{mapItem.subjectCode}</span> 
                                  <span>{mapItem.subjectName}</span>
                                </td>
                                <td className="p-4 font-medium tracking-wide">
                                  {mapItem.department} • Year {mapItem.year} • Sec {mapItem.section}
                                </td>
                                <td className="p-4 text-right">
                                  <button
                                    onClick={() => handleDeleteAssignment(mapItem.id)}
                                    className="p-1.5 text-rose-500 hover:text-rose-700"
                                    title="Revoke Mapping"
                                  >
                                    <Trash2 className="w-4.5 h-4.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                            {enrichedAssignmentsList.length === 0 && (
                              <tr>
                                <td colSpan={4} className="p-6 text-center text-slate-400">No faculty mappings active currently.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ACTIVE TAB SECTION - STUDENTS EXCEL IMPORT */}
                  {activeTab === "students" && (
                    <div className="space-y-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <h3 className="text-lg font-bold">Students Roster & Excel Import</h3>
                          <p className="text-xs text-slate-400">Add individuals or paste structured columns from spreadsheet software natively.</p>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingStudent(null);
                              setStudentRollInput("");
                              setStudentNameInput("");
                              if (departments.length > 0) {
                                setStudentDeptInput(departments[0].department_name);
                              } else {
                                setStudentDeptInput("");
                              }
                              setStudentSecInput("A");
                              setStudentYearInput(1);
                              setStudentFormError("");
                              setStudentFormSuccess("");
                              setShowAddStudent(!showAddStudent);
                            }}
                            className="flex items-center justify-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                            <span>{showAddStudent ? "Close Form" : "Add Student One-by-One"}</span>
                          </button>
                        </div>
                      </div>

                      {/* STRUCTURAL IMPORT SECTION */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        <div className="md:col-span-1 space-y-4">
                          {/* SINGLE STUDENT REGISTRATION OR EDIT FORM */}
                          {showAddStudent && (
                            <form onSubmit={handleSaveSingleStudent} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
                              <div className="flex items-center justify-between border-b pb-2 dark:border-slate-800">
                                <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                                  <UserPlus className="w-5 h-5" />
                                  <h4 className="font-bold text-sm">{editingStudent ? "Edit Student Profile" : "Register Student"}</h4>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setShowAddStudent(false);
                                    setEditingStudent(null);
                                  }}
                                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>

                              {studentFormError && (
                                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400 text-xs rounded-lg font-medium leading-relaxed">
                                  {studentFormError}
                                </div>
                              )}

                              {studentFormSuccess && (
                                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs rounded-lg font-medium leading-relaxed">
                                  {studentFormSuccess}
                                </div>
                              )}

                              <div className="space-y-3">
                                <div>
                                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-1">Roll / Register Number</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. 21X01A0501"
                                    value={studentRollInput}
                                    onChange={(e) => setStudentRollInput(e.target.value)}
                                    className="w-full px-3 py-1.5 border rounded-lg focus:ring-1 focus:ring-blue-500 bg-transparent text-sm dark:border-slate-700"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-1">Student Full Name</label>
                                  <input
                                    type="text"
                                    required
                                    placeholder="e.g. John Doe"
                                    value={studentNameInput}
                                    onChange={(e) => setStudentNameInput(e.target.value)}
                                    className="w-full px-3 py-1.5 border rounded-lg focus:ring-1 focus:ring-blue-500 bg-transparent text-sm dark:border-slate-700 capitalize"
                                  />
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-1">Department</label>
                                    <select
                                      value={studentDeptInput}
                                      onChange={(e) => setStudentDeptInput(e.target.value)}
                                      className="w-full h-[34px] px-2.5 border rounded-lg bg-white dark:bg-slate-800 text-sm dark:border-slate-700"
                                      required
                                    >
                                      <option value="">-- select --</option>
                                      {departments.map(d => (
                                        <option key={d.id} value={d.department_name}>{d.department_name}</option>
                                      ))}
                                    </select>
                                  </div>

                                  <div>
                                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-1">Section</label>
                                    <input
                                      type="text"
                                      required
                                      placeholder="A"
                                      value={studentSecInput}
                                      onChange={(e) => setStudentSecInput(e.target.value.toUpperCase())}
                                      className="w-full px-3 py-1.5 border rounded-lg focus:ring-1 focus:ring-blue-500 bg-transparent text-sm dark:border-slate-700"
                                    />
                                  </div>
                                </div>

                                <div>
                                  <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500 mb-1">Academic Class Year</label>
                                  <select
                                    value={studentYearInput}
                                    onChange={(e) => setStudentYearInput(Number(e.target.value))}
                                    className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-sm dark:border-slate-705"
                                  >
                                    <option value={1}>1st Year</option>
                                    <option value={2}>2nd Year</option>
                                    <option value={3}>3rd Year</option>
                                    <option value={4}>4th Year</option>
                                  </select>
                                </div>
                              </div>

                              <div className="flex justify-end space-x-1.5 border-t pt-3 dark:border-slate-800">
                                {editingStudent && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingStudent(null);
                                      setStudentRollInput("");
                                      setStudentNameInput("");
                                      setStudentFormError("");
                                      setStudentFormSuccess("");
                                      setShowAddStudent(false);
                                    }}
                                    className="px-2.5 py-1.5 text-xs text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                                  >
                                    Cancel
                                  </button>
                                )}
                                <button
                                  type="submit"
                                  className="px-4 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md font-bold transition-all shadow-sm"
                                >
                                  {editingStudent ? "Update Log" : "Confirm Register"}
                                </button>
                              </div>
                            </form>
                          )}

                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                            <div className="flex items-center space-x-2 text-blue-600 dark:text-blue-400">
                              <FileSpreadsheet className="w-5 h-5" />
                              <h4 className="font-bold text-sm">Upload Excel Spreadsheet</h4>
                            </div>
                          
                          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                            Upload or drag an Excel (<code className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1 rounded">.xlsx</code>, <code className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1 rounded">.xls</code>) or <code className="font-mono text-[11px] bg-slate-100 dark:bg-slate-800 px-1 rounded">.csv</code> file to register multiple students simultaneously.
                          </p>

                          <button
                            type="button"
                            onClick={handleDownloadTemplate}
                            className="w-full text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold flex items-center justify-center gap-1.5 bg-blue-50/50 dark:bg-blue-950/20 py-2 rounded-xl border border-blue-100 dark:border-blue-900/30 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Sample Template (.xlsx)</span>
                          </button>

                          {/* DRAG AND DROP ZONE */}
                          <div
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDragging(true);
                            }}
                            onDragLeave={() => {
                              setIsDragging(false);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDragging(false);
                              const file = e.dataTransfer.files?.[0];
                              if (file) {
                                setSelectedFile(file);
                                setImportStatus(`Selected file via drop: ${file.name}. Ready to import.`);
                              }
                            }}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-2 ${
                              isDragging
                                ? "border-blue-500 bg-blue-50/50 dark:bg-blue-950/20"
                                : selectedFile
                                ? "border-emerald-500 bg-emerald-50/10 dark:bg-emerald-950/5"
                                : "border-slate-300 dark:border-slate-700 hover:border-blue-400 dark:hover:border-slate-600 bg-slate-50 dark:bg-slate-850"
                            }`}
                          >
                            <input
                              type="file"
                              ref={fileInputRef}
                              onChange={handleFileChange}
                              accept=".xlsx, .xls, .csv"
                              className="hidden"
                            />
                            
                            {selectedFile ? (
                              <>
                                <CheckCircle className="w-8 h-8 text-emerald-500 animate-pulse" />
                                <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                                  {selectedFile.name}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  {(selectedFile.size / 1024).toFixed(1)} KB — Click to change
                                </span>
                              </>
                            ) : (
                              <>
                                <Upload className="w-8 h-8 text-slate-400 dark:text-slate-500" />
                                <span className="font-medium text-xs text-slate-600 dark:text-slate-300">
                                  {isDragging ? "Drop your sheet here" : "Click or Drag file here"}
                                </span>
                                <span className="text-[10px] text-slate-400">
                                  Supports .xlsx, .xls, .csv
                                </span>
                              </>
                            )}
                          </div>

                          <div className="bg-slate-50 dark:bg-slate-850 border border-slate-105 dark:border-slate-800 p-3 rounded-lg text-[11px] space-y-1 text-slate-500 leading-normal">
                            <span className="font-semibold text-slate-700 dark:text-gray-200 block text-xs">Expected Columns:</span>
                            <div className="flex flex-wrap gap-1 font-mono text-[10px] pt-1">
                              {["Roll No (Required)", "Student Name (Required)", "Department", "Year", "Section"].map((col, idx) => (
                                <span key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                  {col}
                                </span>
                              ))}
                            </div>
                          </div>

                          <form onSubmit={handleImportStudents} className="space-y-3">
                            <div className="flex gap-2">
                              {selectedFile && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedFile(null);
                                    setImportStatus("");
                                  }}
                                  className="px-3 py-2 border border-slate-300 dark:border-slate-700 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                                >
                                  Clear
                                </button>
                              )}
                              <button
                                type="submit"
                                disabled={!selectedFile}
                                className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                                  selectedFile
                                    ? "bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                                }`}
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Process & Link Roster</span>
                              </button>
                            </div>
                          </form>

                          {importStatus && (
                            <div className="p-3 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-400 text-xs rounded border border-blue-100 dark:border-slate-800 break-words leading-relaxed">
                              {importStatus}
                            </div>
                          )}
                        </div>
                      </div>

                        {/* ROSTER VIEWER LIST */}
                        <div className="md:col-span-2 space-y-4">
                          
                          {/* Search / Filter bar */}
                          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-wrap gap-2 items-center">
                            
                            <div className="flex-1 min-w-[150px] relative">
                              <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-slate-400" />
                              <input
                                type="text"
                                placeholder="Search by roll number or name..."
                                value={studentSearch}
                                onChange={(e) => { setStudentSearch(e.target.value); setStudentPage(1); }}
                                className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg py-1.5 pl-8 pr-3 text-xs"
                              />
                            </div>

                            <select
                              value={studentDeptFilter}
                              onChange={(e) => { setStudentDeptFilter(e.target.value); setStudentPage(1); }}
                              className="bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg py-1.5 px-2.5 text-xs text-slate-700 dark:text-slate-300 w-full sm:w-auto"
                            >
                              <option value="">All Departments</option>
                              {departments.map(d => (
                                <option key={d.id} value={d.department_name}>{d.department_name}</option>
                              ))}
                            </select>

                            <select
                              value={studentYearFilter}
                              onChange={(e) => { setStudentYearFilter(e.target.value); setStudentPage(1); }}
                              className="bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-lg py-1.5 px-2.5 text-xs text-slate-700 dark:text-slate-300 w-full sm:w-auto"
                            >
                              <option value="">All Years</option>
                              <option value="1">1st Year</option>
                              <option value="2">2nd Year</option>
                              <option value="3">3rd Year</option>
                              <option value="4">4th Year</option>
                            </select>

                          </div>

                          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto">
                            <table className="min-w-full border-collapse text-left text-sm">
                              <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-100 uppercase font-semibold whitespace-nowrap">
                                  <th className="p-3">Roll Number</th>
                                  <th className="p-3">Name</th>
                                  <th className="p-3">Department</th>
                                  <th className="p-3 text-center">Year / Section</th>
                                  <th className="p-3 text-right">Actions</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 whitespace-nowrap">
                                {paginatedStudents.map((st) => (
                                  <tr key={st.id} className="hover:bg-slate-50/50 text-xs">
                                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-white">{st.roll_no}</td>
                                    <td className="p-3 font-semibold text-blue-600 dark:text-blue-400 capitalize">{st.student_name}</td>
                                    <td className="p-3">{st.department}</td>
                                    <td className="p-3 text-center font-semibold">Yr {st.year} - Sec {st.section}</td>
                                    <td className="p-3 text-right">
                                      <div className="flex items-center justify-end space-x-2">
                                        <button
                                          onClick={() => handleStartEditStudent(st)}
                                          className="p-1.5 text-blue-550 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/25 dark:text-blue-400 rounded-md transition-colors"
                                          title="Edit Student Info"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handlePreFillClass(st)}
                                          className="p-1.5 text-amber-600 hover:text-amber-800 bg-amber-50 dark:bg-amber-900/25 dark:text-amber-400 rounded-md transition-colors"
                                          title="Clone Class Details (Fast Entry)"
                                        >
                                          <Copy className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteStudent(st.id)}
                                          className="p-1.5 text-rose-500 hover:text-rose-700 bg-rose-50 dark:bg-rose-900/25 dark:text-rose-450 rounded-md transition-colors"
                                          title="Delete Student"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                                {paginatedStudents.length === 0 && (
                                  <tr>
                                    <td colSpan={5} className="p-6 text-center text-slate-400">No matching student records found.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800 border-t border-slate-100 dark:border-slate-800 text-xs">
                                <span className="text-slate-500">
                                  Showing page <span className="font-semibold text-slate-700 dark:text-gray-200">{studentPage}</span> of {totalPages} ({filteredStudents.length} rows total)
                                </span>
                                <div className="flex space-x-1">
                                  <button
                                    onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                                    disabled={studentPage === 1}
                                    className="p-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => setStudentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={studentPage === totalPages}
                                    className="p-1 border border-slate-200 dark:border-slate-700 rounded hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>
                            )}

                          </div>

                        </div>

                      </div>

                    </div>
                  )}

                  {/* ACTIVE TAB SECTION - FACULTY MANAGE approvals */}
                  {activeTab === "faculty" && (
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold">Faculty Status logs</h3>
                        <p className="text-xs text-slate-400">Approve pending credentials, block/deactivate profiles, or configure temporary credentials.</p>
                      </div>

                      {/* RESET PASSWORD POPUP */}
                      {resetFacultyId && (
                        <form onSubmit={handleResetFacultyPassword} className="p-4 bg-amber-50 dark:bg-slate-900 border border-amber-200 dark:border-slate-800 rounded-xl max-w-sm space-y-3">
                          <h4 className="font-bold text-xs text-amber-800 dark:text-amber-400 uppercase tracking-widest flex items-center space-x-1">
                            <AlertTriangle className="w-4 h-4" />
                            <span>Reset Credentials</span>
                          </h4>
                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1">New Plaintext Password</label>
                            <input
                              type="text"
                              required
                              value={newFacultyPassword}
                              onChange={(e) => setNewFacultyPassword(e.target.value)}
                              placeholder="Type password..."
                              className="w-full px-2 py-1.5 border rounded bg-white text-xs text-black"
                            />
                          </div>
                          <div className="flex space-x-1.5 justify-end">
                            <button
                              type="button"
                              onClick={() => { setResetFacultyId(null); setNewFacultyPassword(""); }}
                              className="px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs"
                            >
                              Abort
                            </button>
                            <button
                              type="submit"
                              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-bold"
                            >
                              Update Password
                            </button>
                          </div>
                        </form>
                      )}

                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-x-auto">
                        <table className="min-w-full border-collapse text-left text-sm">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-100 uppercase font-semibold whitespace-nowrap">
                              <th className="p-4">Name</th>
                              <th className="p-4">Email</th>
                              <th className="p-4">Department</th>
                              <th className="p-4 text-center">Verified Approval</th>
                              <th className="p-4 text-center">Service Active</th>
                              <th className="p-4 text-right block/hidden sm:table-cell">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 whitespace-nowrap">
                            {faculty.map((facItem) => (
                              <tr key={facItem.id} className="hover:bg-slate-50/50">
                                <td className="p-4 font-bold text-slate-900 dark:text-white capitalize">{facItem.name}</td>
                                <td className="p-4 text-xs font-mono">{facItem.email}</td>
                                <td className="p-4 font-semibold text-slate-500">{facItem.department}</td>
                                <td className="p-4 text-center">
                                  {!facItem.approved ? (
                                    <button
                                      onClick={() => handleApproveFaculty(facItem.id)}
                                      className="px-2.5 py-1 text-[11px] bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-full shadow-sm transition-colors"
                                    >
                                      Approve Account
                                    </button>
                                  ) : (
                                    <span className="inline-flex items-center space-x-1 text-emerald-600 font-bold text-xs bg-emerald-50 dark:bg-emerald-950/20 px-2 py-0.5 rounded-full">
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Approved</span>
                                    </span>
                                  )}
                                </td>
                                <td className="p-4 text-center">
                                  <button
                                    onClick={() => handleToggleFacultyActive(facItem.id, facItem.active)}
                                    className={`px-3 py-1 rounded text-xs font-semibold ${facItem.active ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"}`}
                                  >
                                    {facItem.active ? "Active" : "Deactivated"}
                                  </button>
                                </td>
                                <td className="p-4 text-right">
                                  <div className="flex items-center justify-end space-x-2">
                                    <button
                                      onClick={() => {
                                        setResetFacultyId(facItem.id);
                                        setNewFacultyPassword("");
                                      }}
                                      className="px-2.5 py-1 border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs rounded transition-colors"
                                    >
                                      Reset Pass
                                    </button>
                                    <button
                                      onClick={() => handleDeleteFaculty(facItem.id)}
                                      className="p-1.5 text-rose-550 hover:text-rose-700 bg-rose-50 dark:bg-rose-900/25 dark:text-rose-400 rounded-md transition-colors"
                                      title="Delete Faculty Profile"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* ACTIVE TAB SECTION - COLLEGE ATTENDANCE DYNAMIC REPORTS */}
                  {activeTab === "reports" && (
                    <div className="space-y-6">
                      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
                        <div className="flex items-center space-x-2 text-blue-600">
                          <SlidersHorizontal className="w-5 h-5" />
                          <h4 className="font-bold text-sm text-slate-800 dark:text-gray-100">Configure General Ledger Query</h4>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-xs font-semibold text-slate-500 mb-1">Filter Report Type</label>
                            <select
                              value={reportType}
                              onChange={(e) => setReportType(e.target.value as any)}
                              className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-sm dark:border-slate-700 font-semibold text-slate-800 dark:text-white"
                            >
                              <option value="department">By College Department</option>
                              <option value="subject">By Course Subject</option>
                              <option value="faculty">By Assigned Faculty</option>
                              <option value="student">By Particular Student</option>
                            </select>
                          </div>

                          {/* DYNAMIC SECOND PARAMETER DROPDOWN */}
                          {reportType === "department" && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Target Department</label>
                              <select
                                value={reportDept}
                                onChange={(e) => setReportDept(e.target.value)}
                                className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-sm dark:border-slate-700"
                                required
                              >
                                <option value="">-- Choose Dept --</option>
                                {departments.map(d => (
                                  <option key={d.id} value={d.department_name}>{d.department_name}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {reportType === "subject" && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Subject</label>
                              <select
                                value={reportSubId}
                                onChange={(e) => setReportSubId(e.target.value)}
                                className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-sm dark:border-slate-700"
                                required
                              >
                                <option value="">-- Choose Course --</option>
                                {subjects.map(s => (
                                  <option key={s.id} value={s.id}>{s.subject_code} - {s.subject_name}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {reportType === "faculty" && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Faculty</label>
                              <select
                                value={reportFacId}
                                onChange={(e) => setReportFacId(e.target.value)}
                                className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-sm dark:border-slate-700"
                                required
                              >
                                <option value="">-- Choose Faculty --</option>
                                {faculty.map(f => (
                                  <option key={f.id} value={f.id}>{f.name} ({f.department})</option>
                                ))}
                              </select>
                            </div>
                          )}

                          {reportType === "student" && (
                            <div>
                              <label className="block text-xs font-semibold text-slate-500 mb-1">Specific Student</label>
                              <select
                                value={reportStId}
                                onChange={(e) => setReportStId(e.target.value)}
                                className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 text-sm dark:border-slate-700"
                                required
                              >
                                <option value="">-- Choose Student --</option>
                                {students.map(st => (
                                  <option key={st.id} value={st.id}>{st.roll_no} - {st.student_name}</option>
                                ))}
                              </select>
                            </div>
                          )}

                          <div className="flex items-end">
                            <button
                              onClick={triggerReportGeneration}
                              disabled={generatingReport}
                              className="w-full py-1.5.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-sm transition-colors py-2"
                            >
                              {generatingReport ? "Running Query..." : "Compile Ledger report"}
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* COMPILED REPORT VIEW TARGET */}
                      {reportData ? (
                        <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 space-y-6 shadow-md">
                          
                          {/* SUMMARY LEDGER INFORMATION */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b dark:border-slate-800 pb-4 gap-3">
                            <div>
                              <h4 className="font-extrabold text-xl text-blue-900 dark:text-blue-400 capitalize">{reportData.title}</h4>
                              <p className="text-xs text-slate-500 mt-1">
                                Compiled {reportData.totalClasses || 0} unique calendar lecture registers with average rate of <span className="font-bold text-slate-800 dark:text-gray-100">{reportData.percentage || 0}%</span>.
                              </p>
                            </div>

                            <div className="flex items-center space-x-2">
                              {reportData.studentBreakdown && (
                                <>
                                  <button
                                    onClick={() => runExportToExcel(reportData.title, reportData.studentBreakdown)}
                                    className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-semibold transition-colors"
                                  >
                                    <Download className="w-4 h-4" />
                                    <span>Download Excel</span>
                                  </button>
                                  <button
                                    onClick={() => triggerPrintPreview(reportData.title, reportData.studentBreakdown)}
                                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-semibold transition-colors"
                                  >
                                    <FileText className="w-4 h-4" />
                                    <span>Export Printable PDF</span>
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* METRICS ROW */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center">
                              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Total Classes</p>
                              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{reportData.totalClasses || 0}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center">
                              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Average rate</p>
                              <p className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">{reportData.percentage || 0}%</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center">
                              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Absentees</p>
                              <p className="text-2xl font-black text-rose-500 mt-1">{reportData.absentCount || 0}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl text-center">
                              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest border-red bg-opacity-10">Registered Roster size</p>
                              <p className="text-2xl font-black text-emerald-500 mt-1">{reportData.studentBreakdown?.length || 0}</p>
                            </div>
                          </div>

                          {/* CHRONICLES breakdown list of student logs */}
                          {reportData.studentBreakdown && reportData.studentBreakdown.length > 0 ? (
                            <div className="space-y-3">
                              <h5 className="font-bold text-sm uppercase text-slate-400 tracking-wider">Individuals Breakdown list</h5>
                              
                              <div className="overflow-x-auto border border-slate-100 dark:border-slate-800 rounded-xl">
                                <table className="min-w-full text-left text-sm">
                                  <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-100 font-semibold uppercase whitespace-nowrap">
                                      <th className="p-3">Student Name</th>
                                      <th className="p-3">Roll Number</th>
                                      <th className="p-3 text-center">Lectures Present / Total</th>
                                      <th className="p-3 text-center">Absent Count</th>
                                      <th className="p-3 text-right">Attendance Avg %</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 whitespace-nowrap">
                                    {reportData.studentBreakdown.map((item: any) => (
                                      <tr key={item.id} className="hover:bg-slate-50/50">
                                        <td className="p-3 font-semibold capitalize text-slate-900 dark:text-white">{item.name}</td>
                                        <td className="p-3 font-mono text-xs">{item.rollNo}</td>
                                        <td className="p-3 text-center font-semibold text-emerald-600 bg-emerald-50 bg-opacity-5">{item.present} / {item.totalClasses}</td>
                                        <td className="p-3 text-center font-semibold text-rose-600">{item.absent}</td>
                                        <td className="p-3 text-right font-bold text-blue-600">
                                          <span className={`px-2 py-0.5 rounded ${item.percentage < 75 ? "bg-red-100 text-red-700 dark:bg-red-950/20 dark:text-red-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300"}`}>
                                            {item.percentage}%
                                          </span>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ) : (
                            <div className="p-8 text-center text-slate-450 text-sm">No lecture registers matching query rules currently compiled.</div>
                          )}

                        </div>
                      ) : (
                        <div className="bg-white dark:bg-slate-900 p-8 text-center text-slate-400 border border-dashed rounded-2xl">
                          <FileText className="w-8 h-8 mx-auto stroke-1" />
                          <p className="mt-2 text-xs">Run a query criteria above to compile dynamic averages.</p>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              ) : (
                // ==========================================
                // FACULTY INTERFACE LAYOUT
                // ==========================================
                <div className="space-y-8">
                  
                  {/* WELCOME BLOCK */}
                  <div className="bg-gradient-to-r from-blue-700 to-indigo-800 dark:from-slate-900 dark:to-slate-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <span className="text-xs font-bold uppercase tracking-wider bg-white/20 text-white px-2.5 py-1 rounded-full">FACULTY WORKSPACE</span>
                      <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-3">Welcome, {session.name}</h2>
                      <p className="text-blue-100 dark:text-slate-400 text-sm mt-1">Instructor • Dept: {session.department || "No Department Linked"}</p>
                    </div>

                    <div className="flex space-x-2 flex-wrap gap-2">
                      <button
                        onClick={() => {
                          setFacultySubTab("register");
                          setSelectedAssignment(null);
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${facultySubTab === "register" ? "bg-white text-blue-900 font-bold shadow-md" : "bg-white/10 text-white hover:bg-white/20"}`}
                      >
                        Assigned Register
                      </button>
                      <button
                        onClick={() => {
                          setFacultySubTab("reports");
                          setSelectedAssignment(null);
                        }}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${facultySubTab === "reports" ? "bg-white text-blue-900 font-bold shadow-md" : "bg-white/10 text-white hover:bg-white/20"}`}
                      >
                        Attendance Reports
                      </button>
                    </div>
                  </div>

                  {/* ACTIVE SCREEN RENDERER FOR FACULTY CHECK */}
                  {facultySubTab === "reports" ? (
                    <FacultyAttendanceReports session={session} syncKey={syncKey} onTriggerPrint={setPrintReportMeta} />
                  ) : !selectedAssignment ? (
                    // GRID OF REGISTER CLASS CARDS
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-bold">Your Designated Classes register list</h3>
                        <p className="text-xs text-slate-500">Pick a course module from mapping catalog to open attendance books.</p>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {facultyMyAssignments.map((assign) => (
                          <div
                            key={assign.id}
                            className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all flex flex-col justify-between"
                          >
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="font-mono text-xs font-black tracking-wider px-2 py-0.5 bg-blue-50 dark:bg-slate-800 text-blue-700 dark:text-blue-300 rounded">
                                  {assign.subjectCode}
                                </span>
                                <span className="text-xs text-slate-400 font-medium">Mapped Class</span>
                              </div>

                              <div>
                                <h4 className="font-bold text-slate-950 dark:text-white line-clamp-1">{assign.subjectName}</h4>
                                <div className="text-xs text-slate-500 capitalize mt-1">
                                  Dept: <span className="font-bold text-slate-700 dark:text-slate-300">{assign.department}</span> • Year {assign.year}
                                </div>
                              </div>

                              <div className="flex items-center space-x-1 bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-lg text-xs leading-none">
                                <Users className="w-3.5 h-3.5 text-slate-400" />
                                <span className="font-bold text-slate-700 dark:text-slate-200">Section {assign.section}</span>
                              </div>
                            </div>

                            <button
                              onClick={() => startAttendanceMarking(assign)}
                              className="w-full mt-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-lg tracking-wider uppercase transition-colors"
                            >
                              Check & Mark Attendance
                            </button>
                          </div>
                        ))}

                        {facultyMyAssignments.length === 0 && (
                          <div className="bg-white dark:bg-slate-900 border border-dashed rounded-2xl p-8 text-center col-span-full">
                            <Clock className="w-8 h-8 text-slate-400 mx-auto stroke-1" />
                            <p className="text-xs text-slate-500 mt-2">You don't have active course mappings authorized yet.</p>
                            <p className="text-[11px] text-slate-400 mt-1">Please request University Admin office to assign subjects matching Section.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    // ACTIVE REGISTER ATTENDANCE SCREEN
                    <div className="space-y-6">
                      
                      {/* SUB BAR LOGS FOR ACTION */}
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
                        
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => setSelectedAssignment(null)}
                            className="p-2 border dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
                            title="Back to Grid"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <div>
                            <p className="text-xs font-mono font-black text-blue-600 dark:text-blue-400 uppercase">{selectedAssignment.subjectCode}</p>
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white tracking-wide">{selectedAssignment.subjectName}</h3>
                            <p className="text-xs text-slate-400">Class: {selectedAssignment.department} Yr {selectedAssignment.year} - Sec {selectedAssignment.section}</p>
                          </div>
                        </div>

                        {/* SELECT CALENDAR REGISTER DATE */}
                        <div className="flex items-center justify-between sm:justify-start space-x-2 w-full sm:w-auto">
                          <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Marking Date:</span>
                          <input
                            type="date"
                            className="bg-slate-50 border dark:border-slate-700 dark:bg-slate-800 rounded py-1 px-2.5 text-xs font-bold focus:outline-none"
                            value={attendanceDate}
                            onChange={(e) => setAttendanceDate(e.target.value)}
                          />
                        </div>

                      </div>

                      {attendanceError && (
                        <div className="p-3 bg-red-100 border-l-4 border-red-500 text-red-700 text-xs rounded">
                          {attendanceError}
                        </div>
                      )}

                      {attendanceSuccess && (
                        <div className="p-3 bg-emerald-100 border-l-4 border-emerald-500 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400 text-xs rounded">
                          {attendanceSuccess}
                        </div>
                      )}

                      {/* ACTIVE REGISTER LIST */}
                      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 p-6 space-y-4 shadow-md">
                        
                        <div className="flex items-center justify-between pb-3 border-b dark:border-slate-800">
                          <div>
                            <span className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Attendance Register</span>
                            <span className="ml-2 py-0.5 px-2 text-xs bg-slate-100 dark:bg-slate-800 font-semibold rounded text-slate-500">{registerStudents.length} Students listed</span>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleToggleAll("Present")}
                              className="px-2 py-1 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300 text-[11px] font-semibold rounded hover:bg-emerald-100"
                            >
                              Present All
                            </button>
                            <button
                              onClick={() => handleToggleAll("Absent")}
                              className="px-2 py-1 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-300 text-[11px] font-semibold rounded hover:bg-rose-100"
                            >
                              Absent All
                            </button>
                          </div>
                        </div>

                        {loadingRegister ? (
                          <div className="p-12 text-center text-slate-400 text-xs">Loading Class Roster...</div>
                        ) : (
                          <div className="space-y-2">
                            {registerStudents.map((st, idx) => {
                              const isPresent = attendanceRecords[st.id] === "Present";
                              return (
                                <div
                                  key={st.id}
                                  onClick={() => toggleStudentStatus(st.id)}
                                  className={`flex items-center justify-between p-3 border rounded-xl hover:bg-slate-50/50 cursor-pointer select-none transition-all ${isPresent ? "border-emerald-100 bg-emerald-50/10 dark:border-emerald-950/20" : "border-rose-100 bg-rose-50/10 dark:border-rose-950/20"}`}
                                >
                                  <div className="flex items-center space-x-3.5">
                                    <span className="text-xs text-slate-400 font-bold">{idx + 1}</span>
                                    <div>
                                      <p className="font-bold text-slate-900 dark:text-white capitalize">{st.student_name}</p>
                                      <p className="text-xs font-mono text-slate-500 mt-0.5">Roll No • {st.roll_no}</p>
                                    </div>
                                  </div>

                                  <div className="flex items-center">
                                    {isPresent ? (
                                      <span className="flex items-center space-x-1 font-black text-xs uppercase bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 py-1.5 px-3 rounded-full">
                                        <Check className="w-4 h-4 text-emerald-600" />
                                        <span>Present</span>
                                      </span>
                                    ) : (
                                      <span className="flex items-center space-x-1 font-black text-xs uppercase bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400 py-1.5 px-3 rounded-full">
                                        <X className="w-4 h-4 text-rose-600" />
                                        <span>Absent</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {registerStudents.length === 0 && (
                              <div className="p-8 text-center text-slate-400">
                                <AlertTriangle className="w-6 h-6 mx-auto stroke-1" />
                                <p className="text-xs mt-2">No students match this Class department / year / section.</p>
                                <p className="text-[11px] text-slate-400 mt-1">Upload students spreadsheet to {selectedAssignment.department} Year {selectedAssignment.year} Sec {selectedAssignment.section}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {registerStudents.length > 0 && (
                          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between border-t dark:border-slate-800 gap-4">
                            <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold space-x-4">
                              <span>PRESENTS: <span className="text-emerald-600 font-extrabold">{Object.values(attendanceRecords).filter(v => v === "Present").length}</span></span>
                              <span>ABSENTS: <span className="text-rose-600 font-extrabold">{Object.values(attendanceRecords).filter(v => v === "Absent").length}</span></span>
                            </div>

                            <button
                              onClick={handleSubmitAttendance}
                              className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs uppercase tracking-widest shadow-md transition-colors"
                            >
                              LOCK & SAVE REGISTER
                            </button>
                          </div>
                        )}

                      </div>

                    </div>
                  )}

                </div>
              )}

            </div>
          )}

        </main>

        {/* BOTTOM FOOLPROOF FOOTER */}
        <footer className="bg-white border-t border-slate-200 dark:bg-slate-900 dark:border-slate-800 transition-colors py-6 mt-12">
          <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400 space-y-2">
            <p className="font-bold">SMART ATTENDANCE PORTAL • COLLEGE SYSTEM MANAGER</p>
            <p>Runs offline-first simulation caches matching live Express endpoints securely. Built with React + TypeScript.</p>
          </div>
        </footer>

        {/* Toast notification for copied details */}
        {copiedDetailsMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white dark:bg-white dark:text-slate-900 dark:border-slate-200 px-4 py-3 rounded-xl shadow-2xl flex items-center space-x-2.5 text-xs font-bold animate-bounce md:mr-4">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{copiedDetailsMessage}</span>
          </div>
        )}

        {/* Custom Styled Delete Confirmation Modal */}
        {deleteConfirmTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 max-w-sm w-full shadow-2xl transform scale-100 transition-all">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 rounded-xl">
                  <AlertTriangle className="w-5 h-5 animate-pulse" />
                </div>
                <div className="space-y-1 flex-1">
                  <h4 className="text-sm font-bold text-slate-950 dark:text-white">
                    {deleteConfirmTarget.title}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {deleteConfirmTarget.message}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 mt-6 border-t pt-4 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmTarget(null)}
                  className="px-3 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-250 dark:border-slate-700 rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 hover:scale-[1.02] active:scale-[0.98] rounded-xl shadow-md transition-all cursor-pointer"
                >
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
