/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  BarChart,
  Bar,
  CartesianGrid
} from "recharts";
import {
  Users,
  BookOpen,
  Calendar,
  GraduationCap,
  CheckCircle,
  XCircle,
  Download,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  SlidersHorizontal,
  Clock,
  Briefcase
} from "lucide-react";
import { UserSession } from "../types";

interface FacultyAttendanceReportsProps {
  session: UserSession;
  syncKey: number;
  onTriggerPrint?: (meta: any) => void;
}

export default function FacultyAttendanceReports({ session, syncKey, onTriggerPrint }: FacultyAttendanceReportsProps) {
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [localSync, setLocalSync] = useState(0);

  // Sub-tabs under Reports:
  // - "summary": Core dashboard cards + charts
  // - "subject": Subject-wise breakdown + student roster
  // - "student": Individual student search & detailed drill down
  // - "daterange": Query attendance records across start-end dates
  // - "defaulters": Highlight low-attendance records below threshold
  const [activeSection, setActiveSection] = useState<"summary" | "subject" | "student" | "daterange" | "defaulters">("summary");

  // Interactive selectors
  const [selectedAssignmentId, setSelectedAssignmentId] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [threshold, setThreshold] = useState<number>(75);
  const [studentSearchQuery, setStudentSearchQuery] = useState("");

  // Print Mode Modal Preview State
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [printContent, setPrintContent] = useState<any>(null);

  // Load detailed reports matching this verified faculty ID
  useEffect(() => {
    const fetchReports = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch(`/api/faculty/${session.id}/reports`);
        if (!res.ok) {
          throw new Error("Unable to retrieve attendance logs assigned to your profile.");
        }
        const data = await res.json();
        setReportData(data);

        // Auto-select first elements of assignments/subjects lists to prevent blank views
        if (data.subjectWiseStats && data.subjectWiseStats.length > 0) {
          const firstSub = data.subjectWiseStats[0];
          setSelectedAssignmentId(firstSub.assignmentId);
          if (firstSub.studentsList && firstSub.studentsList.length > 0) {
            setSelectedStudentId(firstSub.studentsList[0].id);
          }
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed loading analytics database.");
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [session.id, syncKey, localSync]);

  // Subject statistics helper for currently selected subject register
  const currentSubjectStats = useMemo(() => {
    if (!reportData || !reportData.subjectWiseStats) return null;
    return reportData.subjectWiseStats.find((s: any) => s.assignmentId === selectedAssignmentId) || null;
  }, [reportData, selectedAssignmentId]);

  // Student list under current selection
  useEffect(() => {
    if (currentSubjectStats && currentSubjectStats.studentsList?.length > 0) {
      // If previous student selection does not belong to new subject list, reset it
      const exists = currentSubjectStats.studentsList.some((s: any) => s.id === selectedStudentId);
      if (!exists) {
        setSelectedStudentId(currentSubjectStats.studentsList[0].id);
      }
    }
  }, [selectedAssignmentId, currentSubjectStats]);

  // Computed data for specific selected student overall records
  const targetStudentDetails = useMemo(() => {
    if (!reportData || !reportData.subjectWiseStats || !selectedStudentId || !selectedAssignmentId) return null;
    
    // Find matching assignment
    const subjObj = reportData.subjectWiseStats.find((s: any) => s.assignmentId === selectedAssignmentId);
    if (!subjObj) return null;

    // Find student in that class roster
    const studentObj = subjObj.studentsList.find((s: any) => s.id === selectedStudentId);
    if (!studentObj) return null;

    return {
      student: studentObj,
      subject: subjObj
    };
  }, [reportData, selectedAssignmentId, selectedStudentId]);

  // Date range calculation
  const dateRangeFilteredRecords = useMemo(() => {
    if (!reportData || !reportData.allAttendanceLogs || !selectedAssignmentId) return [];
    
    // Get assignment info to restrict subject scope
    const subjObj = reportData.subjectWiseStats?.find((s: any) => s.assignmentId === selectedAssignmentId);
    if (!subjObj) return [];

    return reportData.allAttendanceLogs.filter((log: any) => {
      const isCorrectSubject = log.subject_id === subjObj.subjectId;
      const isCorrectClass = log.studentDept === subjObj.department &&
                             Number(log.studentYear) === Number(subjObj.year) &&
                             log.studentSection === subjObj.section;
      const withinDates = log.attendance_date >= startDate && log.attendance_date <= endDate;
      return isCorrectSubject && isCorrectClass && withinDates;
    });
  }, [reportData, selectedAssignmentId, startDate, endDate]);

  // Date range user aggregates
  const dateRangeRosterStats = useMemo(() => {
    if (!currentSubjectStats) return [];
    const logs = dateRangeFilteredRecords;
    
    return currentSubjectStats.studentsList.map((stud: any) => {
      const studLogs = logs.filter((l: any) => l.student_id === stud.id);
      const present = studLogs.filter((l: any) => l.status === "Present").length;
      const absent = studLogs.filter((l: any) => l.status === "Absent").length;
      const total = studLogs.length;

      return {
        id: stud.id,
        name: stud.name,
        rollNo: stud.rollNo,
        conducted: total,
        present,
        absent,
        percentage: total > 0 ? Math.round((present / total) * 100) : 0
      };
    });
  }, [currentSubjectStats, dateRangeFilteredRecords]);

  // Defaulters list filtered globally or per subject
  const defaultersList = useMemo(() => {
    if (!currentSubjectStats) return [];
    return currentSubjectStats.studentsList.filter((s: any) => s.classesConducted > 0 && s.attendancePercentage < threshold);
  }, [currentSubjectStats, threshold]);

  // --- EXPORT DRIVERS ---
  
  // Custom CSV & Excel-compatible String exporter
  const triggerDownload = (headerLines: string[][], tableHeaders: string[], dataRows: string[][], filename: string) => {
    const csvContent = [
      ...headerLines.map(line => line.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
      "",
      tableHeaders.map(h => `"${h.replace(/"/g, '""')}"`).join(","),
      ...dataRows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    // Prepend UTF-8 BOM so MS Excel opens regional characters perfectly
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportSubjectCSV = (isExcelFormat = false) => {
    if (!currentSubjectStats) return;
    
    const timestamp = new Date().toISOString().split("T")[0];
    const headerLines = [
      ["SMART CAMPUS PORTAL - SUBJECT-WISE ATTENDANCE REGISTER"],
      ["Faculty In-Charge", session.name],
      ["Subject Name", `${currentSubjectStats.subjectCode} - ${currentSubjectStats.subjectName}`],
      ["Assigned Class", `${currentSubjectStats.department} • Year ${currentSubjectStats.year} - Sec ${currentSubjectStats.section}`],
      ["Total Students", String(currentSubjectStats.totalStudentsCount)],
      ["Classes Conducted", String(currentSubjectStats.classesConductedCount)],
      ["Overall Class Attendance", `${currentSubjectStats.attendancePercentage}%`],
      ["Generated Timestamp", new Date().toLocaleString()]
    ];

    const tableHeaders = ["Roll Number", "Student Name", "Classes Scheduled", "Lectures Present", "Lectures Absent", "Attendance AVG %"];
    const dataRows = currentSubjectStats.studentsList.map((st: any) => [
      st.rollNo,
      st.name,
      String(st.classesConducted),
      String(st.attendedCount),
      String(st.absentCount),
      `${st.attendancePercentage}%`
    ]);

    const ext = isExcelFormat ? "csv" : "csv";
    const prefix = isExcelFormat ? "Excel_Report_" : "CSV_Report_";
    triggerDownload(headerLines, tableHeaders, dataRows, `${prefix}${currentSubjectStats.subjectCode}_Attendance_${timestamp}.${ext}`);
  };

  const handleExportStudentCSV = () => {
    if (!targetStudentDetails) return;
    const { student, subject } = targetStudentDetails;
    const timestamp = new Date().toISOString().split("T")[0];

    const headerLines = [
      ["SMART CAMPUS PORTAL - INDIVIDUAL PERFORMANCE STATEMENT"],
      ["Student Name", student.name],
      ["Roll Number", student.rollNo],
      ["Course Subject", `${subject.subjectCode} - ${subject.subjectName}`],
      ["Section Mapping", `${subject.department} Yr ${subject.year} - Sec ${subject.section}`],
      ["Faculty Advisor", session.name],
      ["Conducted Sessions", String(student.classesConducted)],
      ["Attended Sessions", String(student.attendedCount)],
      ["Absent Sessions", String(student.absentCount)],
      ["Performance Attendance Avg", `${student.attendancePercentage}%`],
      ["Generated Timestamp", new Date().toLocaleString()]
    ];

    // Find student specific logs to list as rows
    const studentLogs = reportData.allAttendanceLogs.filter((l: any) => 
      l.student_id === student.id && l.subject_id === subject.subjectId
    ).sort((a: any, b: any) => b.attendance_date.localeCompare(a.attendance_date));

    const tableHeaders = ["Index", "Attendance Calendar Date", "Subject Code", "Session Advisor", "Lobby Status"];
    const dataRows = studentLogs.map((log: any, idx: number) => [
      String(idx + 1),
      log.attendance_date,
      log.subjectCode,
      log.facultyName || session.name,
      log.status
    ]);

    triggerDownload(headerLines, tableHeaders, dataRows, `Student_${student.rollNo}_${subject.subjectCode}_Ledger_${timestamp}.csv`);
  };

  const handleExportDateRangeCSV = () => {
    if (!currentSubjectStats || dateRangeRosterStats.length === 0) return;
    const timestamp = new Date().toISOString().split("T")[0];

    const headerLines = [
      ["SMART CAMPUS PORTAL - DATE WINDOW REPORT"],
      ["Faculty In-Charge", session.name],
      ["Subject Code", `${currentSubjectStats.subjectCode} - ${currentSubjectStats.subjectName}`],
      ["Filter Date Range", `${startDate} to ${endDate}`],
      ["Class Layout", `${currentSubjectStats.department} Yr ${currentSubjectStats.year} - Sec ${currentSubjectStats.section}`],
      ["Unique Registers Processed", String(new Set(dateRangeFilteredRecords.map((r: any) => r.attendance_date)).size)],
      ["Generated Timestamp", new Date().toLocaleString()]
    ];

    const tableHeaders = ["Roll Number", "Student Name", "Sessions Within Window", "Present Count", "Absent Count", "Window Attendance %"];
    const dataRows = dateRangeRosterStats.map((st: any) => [
      st.rollNo,
      st.name,
      String(st.conducted),
      String(st.present),
      String(st.absent),
      `${st.percentage}%`
    ]);

    triggerDownload(headerLines, tableHeaders, dataRows, `DateRange_${currentSubjectStats.subjectCode}_${startDate}_to_${endDate}.csv`);
  };

  const handleExportDefaultersCSV = () => {
    if (!currentSubjectStats || defaultersList.length === 0) return;
    const timestamp = new Date().toISOString().split("T")[0];

    const headerLines = [
      ["SMART CAMPUS PORTAL - COMPLIANCE WARNING REPORT (DEFAULTERS)"],
      ["Faculty In-Charge", session.name],
      ["Subject Code", `${currentSubjectStats.subjectCode} - ${currentSubjectStats.subjectName}`],
      ["Maximum Threshold Specified", `${threshold}%`],
      ["Class Mapping", `${currentSubjectStats.department} Yr ${currentSubjectStats.year} - Sec ${currentSubjectStats.section}`],
      ["Defaulters Found Count", String(defaultersList.length)],
      ["Generated Timestamp", new Date().toLocaleString()]
    ];

    const tableHeaders = ["Roll Number", "Student Name", "Conducted Classes", "Classes Attended", "Absented classes", "Attendance %"];
    const dataRows = defaultersList.map((st: any) => [
      st.rollNo,
      st.name,
      String(st.classesConducted),
      String(st.attendedCount),
      String(st.absentCount),
      `${st.attendancePercentage}%`
    ]);

    triggerDownload(headerLines, tableHeaders, dataRows, `Defaulters_${currentSubjectStats.subjectCode}_Under_${threshold}pct.csv`);
  };

  // --- PRINT PREVIEW DRAWER (FOR EXCELLENT PDF GENERATION) ---
  const handleOpenPrintPreview = (type: "subject" | "student" | "daterange" | "defaulter") => {
    const generatedDate = new Date().toLocaleString();
    let title = "";
    let metadata: { label: string; value: string }[] = [];
    let tableHeaders: string[] = [];
    let tableRows: any[] = [];
    let footerMessage = "Generated safely by College Smart Attendance Engine.";

    if (type === "subject" && currentSubjectStats) {
      title = "Subject-wise Attendance General Ledger";
      metadata = [
        { label: "Faculty Name", value: session.name },
        { label: "Subject", value: `${currentSubjectStats.subjectCode} - ${currentSubjectStats.subjectName}` },
        { label: "Department", value: currentSubjectStats.department },
        { label: "Class Layout", value: `Year ${currentSubjectStats.year} - Section ${currentSubjectStats.section}` },
        { label: "Total Registered Students", value: String(currentSubjectStats.totalStudentsCount) },
        { label: "Classes Conducted", value: String(currentSubjectStats.classesConductedCount) },
        { label: "Overall Class Average", value: `${currentSubjectStats.attendancePercentage}%` },
        { label: "Date Generated", value: generatedDate }
      ];
      tableHeaders = ["Roll Number", "Student Name", "Total Lessons", "Attended", "Absent", "Attendance Avg"];
      tableRows = currentSubjectStats.studentsList.map((st: any) => [
        st.rollNo,
        st.name,
        String(st.classesConducted),
        String(st.attendedCount),
        String(st.absentCount),
        `${st.attendancePercentage}%`
      ]);
    } else if (type === "student" && targetStudentDetails) {
      const { student, subject } = targetStudentDetails;
      title = "Individual Trainee Attendance Ledger";
      metadata = [
        { label: "Student Name", value: student.name },
        { label: "Roll Number", value: student.rollNo },
        { label: "Mapped Department", value: subject.department },
        { label: "Class Year / Sec", value: `Year ${subject.year} - Section ${subject.section}` },
        { label: "Course Subject", value: `${subject.subjectCode} - ${subject.subjectName}` },
        { label: "Assigned Faculty", value: session.name },
        { label: "Total Sessions", value: String(student.classesConducted) },
        { label: "Presents Ratio", value: `${student.attendedCount} Attendance (${student.attendancePercentage}%)` },
        { label: "Absents", value: String(student.absentCount) },
        { label: "Date Generated", value: generatedDate }
      ];
      
      const studentLogs = reportData.allAttendanceLogs.filter((l: any) => 
        l.student_id === student.id && l.subject_id === subject.subjectId
      ).sort((a: any, b: any) => b.attendance_date.localeCompare(a.attendance_date));

      tableHeaders = ["# Index", "Calendar Date", "Course Code", "Instructor", "Active Status"];
      tableRows = studentLogs.map((log: any, idx: number) => [
        String(idx + 1),
        log.attendance_date,
        log.subjectCode,
        log.facultyName || session.name,
        log.status
      ]);
    } else if (type === "daterange" && currentSubjectStats) {
      title = `Lesson Registry Ledger (${startDate} to ${endDate})`;
      metadata = [
        { label: "Faculty Name", value: session.name },
        { label: "Subject", value: `${currentSubjectStats.subjectCode} - ${currentSubjectStats.subjectName}` },
        { label: "Department", value: currentSubjectStats.department },
         { label: "Class Section", value: `Year ${currentSubjectStats.year} - Section ${currentSubjectStats.section}` },
        { label: "Query Period", value: `${startDate} to ${endDate}` },
        { label: "Date Generated", value: generatedDate }
      ];
      tableHeaders = ["Roll Number", "Student Name", "Scheduled Lessons", "Attended Within Window", "Absent", "Attendance Avg"];
      tableRows = dateRangeRosterStats.map((st: any) => [
        st.rollNo,
        st.name,
        String(st.conducted),
        String(st.present),
        String(st.absent),
        `${st.percentage}%`
      ]);
    } else if (type === "defaulter" && currentSubjectStats) {
      title = `Attendance Defaulters List - Threshold Target: <${threshold}%`;
      metadata = [
        { label: "Faculty Name", value: session.name },
        { label: "Subject", value: `${currentSubjectStats.subjectCode} - ${currentSubjectStats.subjectName}` },
        { label: "Department", value: currentSubjectStats.department },
        { label: "Class Layout", value: `Year ${currentSubjectStats.year} - Section ${currentSubjectStats.section}` },
        { label: "Threshold Warning Ceiling", value: `Under ${threshold}%` },
        { label: "Defaulters Tracked Count", value: String(defaultersList.length) },
        { label: "Date Generated", value: generatedDate }
      ];
      tableHeaders = ["Roll Number", "Student Name", "conducted Lessons", "present", "absent", "Avg Ratio"];
      tableRows = defaultersList.map((st: any) => [
        st.rollNo,
        st.name,
        String(st.classesConducted),
        String(st.attendedCount),
        String(st.absentCount),
        `${st.attendancePercentage}%`
      ]);
    }

    setPrintContent({
      title,
      metadata,
      tableHeaders,
      tableRows,
      footerMessage
    });
    setIsPrintPreviewOpen(true);
  };

  const executePrintJob = () => {
    if (onTriggerPrint && printContent) {
      onTriggerPrint({
        title: printContent.title,
        metadata: printContent.metadata,
        tableHeaders: printContent.tableHeaders,
        tableRows: printContent.tableRows,
        footerMessage: printContent.footerMessage,
        date: new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString()
      });
      setTimeout(() => {
        window.print();
      }, 250);
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      // In frame-sandboxed view without popup access, invoke local system print directly
      window.print();
      return;
    }

    const styleMarkup = `
      <style>
        body { font-family: 'Inter', sans-serif; padding: 40px; color: #1e293b; background: white; font-size: 13px; line-height: 1.5; }
        .invoice-box { max-width: 800px; margin: auto; }
        .header { border-bottom: 2px solid #ef4444; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: flex-end; }
        .org-title { font-size: 22px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #1e3a8a; }
        .report-subtitle { font-size: 11px; text-transform: uppercase; font-weight: bold; color: #64748b; margin-top: 5px; }
        .meta-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 30px; border: 1px solid #e2e8f0; }
        .meta-item { display: flex; justify-content: space-between; border-bottom: 1px dashed #e2e8f0; padding-bottom: 4px; }
        .meta-label { font-weight: 600; color: #64748b; }
        .meta-val { font-weight: bold; color: #0f172a; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 30px; text-align: left; }
        thead { background: #1e3a8a; color: white; text-transform: uppercase; font-size: 10px; font-weight: bold; }
        th, td { padding: 10px 12px; border-bottom: 1px solid #cbd5e1; }
        tr:nth-child(even) { background-color: #f8fafc; }
        .footer { text-align: center; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 11px; color: #94a3b8; font-weight: 500; margin-top: 40px; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    `;

    const htmlLayout = `
      <html>
        <head>
          <title>${printContent.title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
          ${styleMarkup}
        </head>
        <body>
          <div class="invoice-box">
            <div class="header">
              <div>
                <div class="org-title">College Smart Attendance System</div>
                <div class="report-subtitle">${printContent.title}</div>
              </div>
              <div style="text-align: right">
                <button onclick="window.print()" class="no-print" style="background:#1e3a8a; border:0; color:white; font-size:12px; font-weight:bold; padding:8px 16px; border-radius:6px; cursor:pointer;">
                  SEND TO PDF / PRINTER
                </button>
              </div>
            </div>

            <div class="meta-grid">
              ${printContent.metadata.map((m: any) => `
                <div class="meta-item">
                  <span class="meta-label">${m.label}:</span>
                  <span class="meta-val">${m.value}</span>
                </div>
              `).join("")}
            </div>

            <table>
              <thead>
                <tr>
                  ${printContent.tableHeaders.map((h: any) => `<th>${h}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                ${printContent.tableRows.map((row: any) => `
                  <tr>
                    ${row.map((cell: any) => `<td>${cell}</td>`).join("")}
                  </tr>
                `).join("")}
              </tbody>
            </table>

            <div class="footer">
              <p>${printContent.footerMessage}</p>
              <p style="margin-top:5px; font-size:10px">Document security verified securely. Generated officially on ${new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlLayout);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-12 text-center shadow-sm">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mx-auto stroke-1" />
        <h4 className="font-bold text-slate-800 dark:text-slate-100 mt-4">Generating Faculty Report Ledger</h4>
        <p className="text-xs text-slate-500 mt-1">Sieving through database matrices & aggregations, please wait...</p>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-6 text-center space-y-3">
        <AlertTriangle className="w-8 h-8 text-rose-500 mx-auto" />
        <h4 className="font-bold text-rose-800 dark:text-rose-400">Error loading reports engine</h4>
        <p className="text-xs text-rose-600 dark:text-rose-500">{error || "No report data returned. Try checking assignment mapping."}</p>
        <button
          onClick={() => setLocalSync(k => k + 1)}
          className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-colors uppercase"
        >
          Retry
        </button>
      </div>
    );
  }

  const { summary, subjectWiseStats, charts } = reportData;

  return (
    <div className="space-y-6">

      {/* HORIZONTAL REPORTS MENU TAB-VIEW */}
      <div className="flex overflow-x-auto md:overflow-x-visible items-center whitespace-nowrap flex-nowrap md:flex-wrap border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 rounded-2xl gap-1.5 no-scrollbar scroll-smooth select-none">
        {[
          { id: "summary", label: "Dashboard", icon: TrendingUp },
          { id: "subject", label: "Subject-wise", icon: BookOpen },
          { id: "student", label: "Student-wise", icon: GraduationCap },
          { id: "daterange", label: "Date Range", icon: Calendar },
          { id: "defaulters", label: "Defaulter list", icon: AlertTriangle }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-shrink-0 ${activeSection === tab.id ? "bg-indigo-600 text-white shadow-md" : "text-slate-600 hover:text-slate-900 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-amber-100/10"}`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ========================================================
          1. SUMMARY DASHBOARD SECTION
          ======================================================== */}
      {activeSection === "summary" && (
        <div className="space-y-6">
          {/* STATS OVERVIEW CARDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Assigned Subjects</span>
              <p className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">{summary.totalAssignedSubjects}</p>
              <p className="text-[10px] text-slate-500 font-medium">Mapped teaching rosters</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Active Students</span>
              <p className="text-3xl font-extrabold text-emerald-500">{summary.totalStudentsCount}</p>
              <p className="text-[10px] text-slate-500 font-medium">Under your assigned classes</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Total Lessons Logged</span>
              <p className="text-3xl font-extrabold text-indigo-500">{summary.totalClassesConducted}</p>
              <p className="text-[10px] text-slate-500 font-medium">Historical register counts</p>
            </div>

            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Average Attendance %</span>
              <p className="text-3xl font-extrabold text-purple-500">{summary.averageAttendancePercentage}%</p>
              <p className="text-[10px] text-slate-500 font-medium">Combined roster performance</p>
            </div>
          </div>

          {/* DYNAMIC CHARTS PORTLET */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Subjectwise breakdown chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm lg:col-span-8 space-y-3">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-gray-100 text-sm">Subjectwise Attendance AVG</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Average attendance rating grouped per course mapped to your assignments</p>
              </div>
              <div className="h-56">
                {charts.subjectWiseChartData && charts.subjectWiseChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={charts.subjectWiseChartData} margin={{ left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="subjectCode" stroke="#94a3b8" fontSize={10} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} unit="%" />
                      <Tooltip formatter={(v: any) => [`${v}% Average`]} />
                      <Bar dataKey="percentage" fill="#4f46e5" radius={[4, 4, 0, 0]} maxBarSize={45}>
                        {(() => {
                          const cls = ["#4f46e5", "#3b82f6", "#10b981", "#8b5cf6", "#f59e0b"];
                          return charts.subjectWiseChartData.map((e: any, idx: number) => (
                            <Cell key={`cell-${idx}`} fill={cls[idx % cls.length]} />
                          ));
                        })()}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="py-20 text-center text-slate-400 text-xs font-semibold">No subject ratings available yet. Mark some attendance today.</div>
                )}
              </div>
            </div>

            {/* Overall Attendance state (Right side column) - Pie Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm lg:col-span-4 flex flex-col justify-between space-y-4">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-gray-100 text-sm">Cumulative Presence Audit</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Split of all cumulative student rolls processed through database.</p>
              </div>

              <div className="h-44 flex items-center justify-center">
                {summary.totalPresentRecordsCount === 0 && summary.totalAbsentRecordsCount === 0 ? (
                  <div className="text-center text-xs text-slate-400">Loading metrics...</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={charts.overallRatios}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {charts.overallRatios.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="flex justify-around text-xs border-t border-slate-100 dark:border-slate-800 pt-3">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Presents ({charts.overallRatios[0]?.value || 0})</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span className="font-semibold text-slate-600 dark:text-slate-400">Absents ({charts.overallRatios[1]?.value || 0})</span>
                </div>
              </div>
            </div>

            {/* Monthly Trend Chart */}
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm lg:col-span-12 space-y-3">
              <div>
                <h4 className="font-bold text-slate-800 dark:text-gray-100 text-sm">Monthly Attendance Trend Curve</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Chronological aggregate tracking curves over past instruction months.</p>
              </div>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={charts.monthlyTrend} margin={{ left: -20, bottom: 0, right: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} unit="%" />
                    <Tooltip formatter={(v: any) => [`${v}% Attendance`, "Monthly Rate"]} />
                    <Line type="monotone" dataKey="percentage" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        </div>
      )}


      {/* ========================================================
          2. SUBJECT-WISE ATTENDANCE REPORT
          ======================================================== */}
      {activeSection === "subject" && (
        <div className="space-y-6">
          
          {/* SELECT THE SUBJECT ASSIGNMENT CONTROLS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-indigo-600 font-bold text-sm">
                  <SlidersHorizontal className="w-4 h-4" />
                  <span>Configure Target Register</span>
                </div>
                <p className="text-xs text-slate-500">Pick an active assigned register below to retrieve stats.</p>
              </div>

              <div>
                <select
                  value={selectedAssignmentId}
                  onChange={(e) => setSelectedAssignmentId(e.target.value)}
                  className="px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-bold text-xs shadow-sm"
                >
                  {subjectWiseStats?.map((sub: any) => (
                    <option key={sub.assignmentId} value={sub.assignmentId}>
                      {sub.subjectCode} - {sub.subjectName} ({sub.department} {sub.year}-{sub.section})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {currentSubjectStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-50 dark:border-slate-800">
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl">
                  <p className="text-[9px] uppercase font-extrabold text-slate-400">Total Students</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{currentSubjectStats.totalStudentsCount}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl">
                  <p className="text-[9px] uppercase font-extrabold text-slate-400">Classes Held</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white mt-1">{currentSubjectStats.classesConductedCount}</p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl">
                  <p className="text-[9px] uppercase font-extrabold text-slate-400">Present Today</p>
                  <p className={`text-lg font-black mt-1 ${currentSubjectStats.todaySummary.hasAttendance ? "text-emerald-500" : "text-slate-400"}`}>
                    {currentSubjectStats.todaySummary.hasAttendance ? currentSubjectStats.todaySummary.present : "N/A"}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-850 rounded-xl">
                  <p className="text-[9px] uppercase font-extrabold text-slate-400">Roster AVG %</p>
                  <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 mt-1">{currentSubjectStats.attendancePercentage}%</p>
                </div>
              </div>
            )}
          </div>

          {/* STUDENT DETAILS DATATABLE AND EXPORT BUTTONS */}
          {currentSubjectStats ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-50 dark:border-slate-800">
                <div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white">Individual Student Roster</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">Roll indexes and average percentages in database.</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleExportSubjectCSV(false)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300 rounded-xl text-xs font-bold"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={() => handleExportSubjectCSV(true)}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300 rounded-xl text-xs font-bold"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel</span>
                  </button>
                  <button
                    onClick={() => handleOpenPrintPreview("subject")}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-300 rounded-xl text-xs font-bold"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Print/PDF</span>
                  </button>
                </div>
              </div>

              {/* CHRONICLE DATA TABLE */}
              <div className="overflow-x-auto border border-slate-50 dark:border-slate-850 rounded-xl">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-100 font-bold uppercase whitespace-nowrap">
                    <tr>
                      <th className="p-3">Roll No</th>
                      <th className="p-3">Student Name</th>
                      <th className="p-3 text-center">Conducted</th>
                      <th className="p-3 text-center">Attended</th>
                      <th className="p-3 text-center">Absent</th>
                      <th className="p-3 text-right">Avg Percentage</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 whitespace-nowrap">
                    {currentSubjectStats.studentsList.map((st: any) => {
                      const isDanger = st.classesConducted > 0 && st.attendancePercentage < 75;
                      return (
                        <tr key={st.id} className="hover:bg-slate-50/50">
                          <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{st.rollNo}</td>
                          <td className="p-3 font-bold text-slate-900 dark:text-white capitalize">{st.name}</td>
                          <td className="p-3 text-center">{st.classesConducted}</td>
                          <td className="p-3 text-center text-emerald-600 font-semibold">{st.attendedCount}</td>
                          <td className="p-3 text-center text-rose-600 font-semibold">{st.absentCount}</td>
                          <td className="p-3 text-right">
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${isDanger ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40"}`}>
                              {st.attendancePercentage}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-8 text-center text-xs text-slate-400">
              No assigned subject mappings available.
            </div>
          )}

        </div>
      )}


      {/* ========================================================
          3. STUDENT-WISE REPORT DRILLED DOWN
          ======================================================== */}
      {activeSection === "student" && (
        <div className="space-y-6">
          {/* INTERACTIVE dropdowns */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-800 dark:text-gray-100">Select Subject and Student mapping</h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Subject Course</label>
                <select
                  value={selectedAssignmentId}
                  onChange={(e) => setSelectedAssignmentId(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-semibold text-xs shadow-sm"
                >
                  {subjectWiseStats?.map((sub: any) => (
                    <option key={sub.assignmentId} value={sub.assignmentId}>
                      {sub.subjectCode} - {sub.subjectName} ({sub.department} {sub.year}-{sub.section})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Student Candidate</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-semibold text-xs shadow-sm text-ellipsis overflow-hidden"
                >
                  {currentSubjectStats?.studentsList.map((st: any) => (
                    <option key={st.id} value={st.id}>
                      {st.rollNo} - {st.name} ({st.attendancePercentage}%)
                    </option>
                  ))}
                  {currentSubjectStats?.studentsList.length === 0 && (
                    <option value="">No Students assigned to this class register.</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          {/* DRILL DOWN REPORT CARD */}
          {targetStudentDetails ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              
              {/* TOP HEADER */}
              <div className="flex justify-between items-start flex-wrap gap-4 pb-4 border-b border-slate-50 dark:border-slate-800">
                <div className="space-y-1">
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 dark:bg-blue-950/20 dark:text-blue-300 font-mono text-[9px] font-black uppercase tracking-wider rounded">
                    Performance Card
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white capitalize">{targetStudentDetails.student.name}</h3>
                  <p className="text-xs text-slate-500 font-semibold font-mono">Roll: {targetStudentDetails.student.rollNo} • Section {targetStudentDetails.subject.section}</p>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleExportStudentCSV}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300 text-xs font-bold rounded-lg"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV</span>
                  </button>
                  <button
                    onClick={() => handleOpenPrintPreview("student")}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-300 text-xs font-bold rounded-lg"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>PDF/Print</span>
                  </button>
                </div>
              </div>

              {/* STATISTICS BLOCKS MATRIX AND PROGRESS METERS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                
                <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl text-center space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Lessons Scheduled</span>
                  <p className="text-2xl font-black text-slate-900 dark:text-white">{targetStudentDetails.student.classesConducted}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl text-center space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Sessions Attended</span>
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{targetStudentDetails.student.attendedCount}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl text-center space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Absented Register</span>
                  <p className="text-2xl font-black text-rose-600 dark:text-rose-400">{targetStudentDetails.student.absentCount}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl text-center space-y-1">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Attendance Rate</span>
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{targetStudentDetails.student.attendancePercentage}%</p>
                </div>

              </div>

              {/* EXQUISITE VISUAL ATTENDANCE PROGRESS GRAPH METER */}
              <div className="bg-slate-50 dark:bg-slate-850 p-5 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-bold text-slate-600 dark:text-slate-400">Attendance Rating Speedometer</span>
                  <span className="font-extrabold text-blue-600 dark:text-blue-400">{targetStudentDetails.student.attendancePercentage}% Progress</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${targetStudentDetails.student.attendancePercentage < 75 ? "bg-rose-500" : "bg-emerald-500"}`}
                    style={{ width: `${targetStudentDetails.student.attendancePercentage}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  {targetStudentDetails.student.attendancePercentage < 75 ? (
                    <span className="text-rose-500 font-bold">⚠️ Warning: Attendance falls short by the required 75% benchmark threshold.</span>
                  ) : (
                    <span className="text-emerald-600 font-bold">✔️ Perfect. Attendance is in safe margins according to academic laws.</span>
                  )}
                </p>
              </div>

            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900 border rounded-xl p-8 text-center text-slate-400 text-xs">
              No matching student performance matrix found. Assign registry students in student database view.
            </div>
          )}
        </div>
      )}


      {/* ========================================================
          4. DATE RANGE QUERY WINDOW
          ======================================================== */}
      {activeSection === "daterange" && (
        <div className="space-y-6">
          {/* CONTROLS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-800 dark:text-gray-100">Configure Date Range Calendar Map</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Target Subject</label>
                <select
                  value={selectedAssignmentId}
                  onChange={(e) => setSelectedAssignmentId(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-semibold text-xs shadow-sm"
                >
                  {subjectWiseStats?.map((sub: any) => (
                    <option key={sub.assignmentId} value={sub.assignmentId}>
                      {sub.subjectCode} - {sub.subjectName} ({sub.department} {sub.year}-{sub.section})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Start Calendar Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-semibold text-xs shadow-sm cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">End Calendar Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-semibold text-xs shadow-sm cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* GENERATED WINDOW LEDGER LIST */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-50 dark:border-slate-800">
              <div>
                <h4 className="font-bold text-sm text-slate-800 dark:text-white">Active Logs during queried calendar timeframe</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Found {dateRangeFilteredRecords.length} session indexes during this period.</p>
              </div>

              {dateRangeFilteredRecords.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleExportDateRangeCSV}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300 text-xs font-bold rounded-lg"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV Ledger</span>
                  </button>
                  <button
                    onClick={() => handleOpenPrintPreview("daterange")}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-300 text-xs font-bold rounded-lg"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Print PDF</span>
                  </button>
                </div>
              )}
            </div>

            {dateRangeFilteredRecords.length > 0 ? (
              <div className="overflow-x-auto border border-slate-50 dark:border-slate-850 rounded-xl">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-100 font-bold uppercase whitespace-nowrap">
                    <tr>
                      <th className="p-3">Roll Index</th>
                      <th className="p-3">Trainee Candidate</th>
                      <th className="p-3 text-center">Lessons</th>
                      <th className="p-3 text-center">Present</th>
                      <th className="p-3 text-center">Absent</th>
                      <th className="p-3 text-right">Window Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 whitespace-nowrap">
                    {dateRangeRosterStats.map((st: any) => (
                      <tr key={st.id} className="hover:bg-slate-50/50">
                        <td className="p-3 font-mono text-slate-600 dark:text-slate-300 font-semibold">{st.rollNo}</td>
                        <td className="p-3 font-bold text-slate-900 dark:text-white capitalize">{st.name}</td>
                        <td className="p-3 text-center">{st.conducted}</td>
                        <td className="p-3 text-center text-emerald-600 font-bold">{st.present}</td>
                        <td className="p-3 text-center text-rose-600 font-bold">{st.absent}</td>
                        <td className="p-3 text-right font-bold text-indigo-600 dark:text-indigo-400">{st.percentage}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">No instruction registers found between {startDate} and {endDate} for selected subject.</div>
            )}
          </div>
        </div>
      )}


      {/* ========================================================
          5. DEFAULTER COMPLIANCE CHECKS
          ======================================================== */}
      {activeSection === "defaulters" && (
        <div className="space-y-6">
          
          {/* SELECT THE THRESHOLD WARNING CONTROLS */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <h4 className="font-bold text-sm text-slate-800 dark:text-gray-100">Set Threshold Warn benchmarks</h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Filter Subject</label>
                <select
                  value={selectedAssignmentId}
                  onChange={(e) => setSelectedAssignmentId(e.target.value)}
                  className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-800 font-semibold text-xs shadow-sm"
                >
                  {subjectWiseStats?.map((sub: any) => (
                    <option key={sub.assignmentId} value={sub.assignmentId}>
                      {sub.subjectCode} - {sub.subjectName} ({sub.department} {sub.year}-{sub.section})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">Ceiling Percentage ({threshold}%)</label>
                <div className="flex items-center space-x-3">
                  <input
                    type="range"
                    min="50"
                    max="95"
                    step="5"
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                  />
                  <select
                    value={threshold}
                    onChange={(e) => setThreshold(Number(e.target.value))}
                    className="px-2 py-1 border rounded bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    <option value={75}>75% (Std)</option>
                    <option value={80}>80%</option>
                    <option value={85}>85%</option>
                    <option value={90}>90% (High)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* DEFAULTERS WARNINGS LIST */}
          <div className="bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-50 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-rose-500 font-extrabold text-sm">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Trainees flagged lower than {threshold}% attendance target</span>
                </div>
                <p className="text-[10px] text-slate-500">Tracked {defaultersList.length} compliance warnings inside this register scope.</p>
              </div>

              {defaultersList.length > 0 && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleExportDefaultersCSV}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-300 text-xs font-bold rounded-lg"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV Warning list</span>
                  </button>
                  <button
                    onClick={() => handleOpenPrintPreview("defaulter")}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/20 dark:text-indigo-300 text-xs font-bold rounded-lg"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Print PDF List</span>
                  </button>
                </div>
              )}
            </div>

            {defaultersList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {defaultersList.map((st: any) => (
                  <div
                    key={st.id}
                    className="p-4 border border-rose-100 dark:border-rose-950/30 bg-rose-50/10 dark:bg-rose-950/5 rounded-2xl flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-1">
                      <p className="text-[10px] font-mono text-rose-600 font-extrabold uppercase tracking-widest bg-rose-100/40 dark:bg-rose-950/40 px-2 py-0.5 rounded w-max">
                        Warn level critical
                      </p>
                      <h5 className="font-bold text-slate-900 dark:text-gray-100 capitalize">{st.name}</h5>
                      <p className="text-xs text-slate-500 font-mono font-semibold">Roll Index • {st.rollNo}</p>
                    </div>

                    <div className="flex items-center justify-between text-xs border-t border-dashed dark:border-rose-950/30 pt-2 bg-transparent">
                      <span className="text-slate-500">Scheduled/Attended:</span>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{st.classesConducted} sessions / {st.attendedCount} present</span>
                    </div>

                    <div className="flex items-center justify-between text-xs bg-slate-50 dark:bg-slate-850 p-2 rounded-xl">
                      <span className="font-semibold text-slate-600 dark:text-slate-350">Avg Attendance Rate:</span>
                      <span className="font-black text-rose-600 dark:text-rose-400">{st.attendancePercentage}%</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">✔️ Zero warnings mapped! All roster pupils are performing higher than {threshold}% target benchmark.</div>
            )}
          </div>
        </div>
      )}


      {/* ========================================================
          6. DETAILED PRINT PREVIEW MODAL
          ======================================================== */}
      {isPrintPreviewOpen && printContent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 max-w-2xl w-full border dark:border-slate-800 space-y-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            
            <div className="flex justify-between items-start pb-4 border-b dark:border-slate-800">
              <div>
                <h4 className="font-mono text-xs text-blue-600 dark:text-blue-400 font-black tracking-widest uppercase">Printers proof preview</h4>
                <h3 className="font-bold text-lg text-slate-900 dark:text-white mt-1">Institutional PDF Layout Preview</h3>
              </div>
              <button
                onClick={() => setIsPrintPreviewOpen(false)}
                className="p-1 px-2 border dark:border-slate-750 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-805"
              >
                Close
              </button>
            </div>

            {/* PREVIEW CONTAINER */}
            <div className="border rounded-2xl p-5 bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 text-xs space-y-4 max-h-96 overflow-y-auto">
              <div className="text-center font-bold text-sm uppercase text-slate-800 dark:text-slate-100 tracking-wide">
                {printContent.title}
              </div>

              <div className="grid grid-cols-2 gap-2 text-[11px] border-y py-3 border-dashed">
                {printContent.metadata.map((m: any, idx: number) => (
                  <div key={idx} className="flex justify-between">
                    <span className="font-semibold text-slate-400">{m.label}:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100">{m.value}</span>
                  </div>
                ))}
              </div>

              <table className="w-full text-left font-mono text-[10px]">
                <thead>
                  <tr className="border-b font-black text-slate-500 uppercase">
                    {printContent.tableHeaders.map((h: any, idx: number) => (
                      <th key={idx} className="pb-1">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {printContent.tableRows.slice(0, 8).map((row: any, idx: number) => (
                    <tr key={idx} className="border-b border-slate-100 dark:border-slate-800">
                      {row.map((cell: any, cidx: number) => (
                        <td key={cidx} className="py-1">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {printContent.tableRows.length > 8 && (
                <p className="text-[10px] text-zinc-400 italic text-center">... And {printContent.tableRows.length - 8} additional records will be included in the official printable document layout page ...</p>
              )}
            </div>

            {/* ACTIONS FOOTER */}
            <div className="flex justify-end space-x-2 pt-4 border-t dark:border-slate-800">
              <button
                onClick={() => setIsPrintPreviewOpen(false)}
                className="px-4 py-2 border rounded-xl text-xs font-bold"
              >
                Cancel Proof
              </button>
              <button
                onClick={() => {
                  setIsPrintPreviewOpen(false);
                  executePrintJob();
                }}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow"
              >
                Launch Printer / Save to PDF
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
