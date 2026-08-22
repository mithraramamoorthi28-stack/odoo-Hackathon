/* ==========================================================================
   ATTENDANCE.JS
   Vanilla JS controller for the Attendance Management page.

   This file is organized into clearly separated sections so it can be
   swapped from "dummy data" to a real Node.js + Express + MySQL backend
   later without restructuring the page:

     1. DUMMY DATA        -> replace with data fetched from the API
     2. DOM REFERENCES     -> unchanged
     3. RENDER FUNCTIONS   -> unchanged (they just read from `state`)
     4. STATE / LOGIC       -> replace local logic with API calls
     5. EVENT LISTENERS    -> unchanged
     6. INIT                -> unchanged
   ========================================================================== */

/* ==========================================================================
   1. DUMMY DATA
   In production this comes from endpoints such as:
     GET /api/employees/:id
     GET /api/attendance/today?employeeId=...
     GET /api/attendance/history?employeeId=...&limit=10
     GET /api/attendance/summary?employeeId=...&month=...
   ========================================================================== */

const employee = {
  id: "101",
  name: "Priya Sharma",
};
// Dummy attendance history (most recent last is fine, we render as-is).
const attendanceHistory = [
  { date: "2026-08-11", checkIn: "09:02 AM", checkOut: "06:05 PM", hours: "9.0", status: "present" },
  { date: "2026-08-12", checkIn: "09:15 AM", checkOut: "06:00 PM", hours: "8.7", status: "present" },
  { date: "2026-08-13", checkIn: "--",       checkOut: "--",       hours: "0",   status: "absent" },
  { date: "2026-08-14", checkIn: "09:05 AM", checkOut: "01:10 PM", hours: "4.1", status: "half" },
  { date: "2026-08-17", checkIn: "08:58 AM", checkOut: "06:12 PM", hours: "9.2", status: "present" },
  { date: "2026-08-18", checkIn: "09:20 AM", checkOut: "06:02 PM", hours: "8.7", status: "present" },
  { date: "2026-08-19", checkIn: "09:01 AM", checkOut: "06:00 PM", hours: "9.0", status: "present" },
  { date: "2026-08-20", checkIn: "--",       checkOut: "--",       hours: "0",   status: "absent" },
  { date: "2026-08-21", checkIn: "09:07 AM", checkOut: "06:10 PM", hours: "9.1", status: "present" },
];

// Dummy monthly summary totals.
const monthlySummary = {
  monthLabel: "August 2026",
  totalWorkingDays: 22,
  presentDays: 17,
  absentDays: 3,
  leaveDays: 2,
};

/* ==========================================================================
   2. DOM REFERENCES
   ========================================================================== */

const dom = {
  todayDate: document.getElementById("todayDate"),

  employeeAvatar: document.getElementById("employeeAvatar"),
  employeeName: document.getElementById("employeeName"),
  employeeId: document.getElementById("employeeId"),

  statusPill: document.getElementById("statusPill"),
  statusLabel: document.getElementById("statusLabel"),

  checkInTime: document.getElementById("checkInTime"),
  checkOutTime: document.getElementById("checkOutTime"),
  todayStatusValue: document.getElementById("todayStatusValue"),

  checkInBtn: document.getElementById("checkInBtn"),
  checkOutBtn: document.getElementById("checkOutBtn"),
  actionHint: document.getElementById("actionHint"),

  historyTableBody: document.getElementById("historyTableBody"),

  summaryMonthLabel: document.getElementById("summaryMonthLabel"),
  totalDays: document.getElementById("totalDays"),
  presentDays: document.getElementById("presentDays"),
  absentDays: document.getElementById("absentDays"),
  leaveDays: document.getElementById("leaveDays"),

  ringProgress: document.getElementById("ringProgress"),
  ringPercent: document.getElementById("ringPercent"),
};

/* ==========================================================================
   3. LOCAL STATE
   Tracks today's in-progress attendance. In the backend-connected version,
   this object would be populated from GET /api/attendance/today and updated
   via POST /api/attendance/check-in and POST /api/attendance/check-out.
   ========================================================================== */

const todayState = {
  checkInTime: null,   // e.g. "09:05 AM"
  checkOutTime: null,  // e.g. "06:00 PM"
  status: "pending",   // "pending" | "present" | "half" | "absent"
};

/* ==========================================================================
   4. HELPER / FORMAT FUNCTIONS
   ========================================================================== */

function getFormattedToday() {
  const now = new Date();
  return now.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function getCurrentTimeLabel() {
  const now = new Date();
  return now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function getInitials(fullName) {
  return fullName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function formatDateForTable(isoDate) {
  const dateObj = new Date(isoDate + "T00:00:00");
  return dateObj.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function statusText(statusKey) {
  const map = {
    present: "Present",
    absent: "Absent",
    half: "Half Day",
    pending: "Not Checked In",
  };
  return map[statusKey] || "--";
}

/* ==========================================================================
   5. RENDER FUNCTIONS
   Each function is responsible for one piece of the UI and reads only
   from `state` variables above -- no DOM logic is duplicated elsewhere.
   ========================================================================== */

function renderHeaderDate() {
  dom.todayDate.textContent = getFormattedToday();
}

function renderEmployeeInfo() {
  dom.employeeAvatar.textContent = getInitials(employee.name);
  dom.employeeName.textContent = employee.name;
  dom.employeeId.textContent = `Employee ID: ${employee.id}`;
}

function renderStatusPill() {
  dom.statusPill.setAttribute("data-status", todayState.status);
  dom.statusLabel.textContent = statusText(todayState.status);
}

function renderTodayPanel() {
  dom.checkInTime.textContent = todayState.checkInTime || "--:--";
  dom.checkOutTime.textContent = todayState.checkOutTime || "--:--";
  dom.todayStatusValue.textContent = statusText(todayState.status);
}

function renderActionButtons() {
  const hasCheckedIn = Boolean(todayState.checkInTime);
  const hasCheckedOut = Boolean(todayState.checkOutTime);

  dom.checkInBtn.disabled = hasCheckedIn;
  dom.checkOutBtn.disabled = !hasCheckedIn || hasCheckedOut;

  if (!hasCheckedIn) {
    dom.actionHint.textContent = "Tap \"Check In\" to begin your work day.";
  } else if (hasCheckedIn && !hasCheckedOut) {
    dom.actionHint.textContent = "You're checked in. Don't forget to check out at the end of the day.";
  } else {
    dom.actionHint.textContent = "You've completed today's attendance. See you tomorrow!";
  }
}

function renderHistoryTable() {
  dom.historyTableBody.innerHTML = "";

  attendanceHistory.forEach((record) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${formatDateForTable(record.date)}</td>
      <td>${record.checkIn}</td>
      <td>${record.checkOut}</td>
      <td>${record.hours}</td>
      <td><span class="badge badge-${record.status}">${statusText(record.status)}</span></td>
    `;

    dom.historyTableBody.appendChild(row);
  });
}

function renderMonthlySummary() {
  dom.summaryMonthLabel.textContent = monthlySummary.monthLabel;
  dom.totalDays.textContent = monthlySummary.totalWorkingDays;
  dom.presentDays.textContent = monthlySummary.presentDays;
  dom.absentDays.textContent = monthlySummary.absentDays;
  dom.leaveDays.textContent = monthlySummary.leaveDays;

  const attendancePercent = Math.round(
    (monthlySummary.presentDays / monthlySummary.totalWorkingDays) * 100
  );

  dom.ringPercent.textContent = `${attendancePercent}%`;

  // Progress ring math: circumference = 2 * PI * r (r = 62, see attendance.css)
  const circumference = 2 * Math.PI * 62;
  const offset = circumference - (attendancePercent / 100) * circumference;

  // Small delay so the CSS transition is visible on first paint.
  requestAnimationFrame(() => {
    dom.ringProgress.style.strokeDashoffset = offset;
  });
}

function renderAll() {
  renderHeaderDate();
  renderEmployeeInfo();
  renderStatusPill();
  renderTodayPanel();
  renderActionButtons();
  renderHistoryTable();
  renderMonthlySummary();
}

/* ==========================================================================
   6. ACTIONS (Check In / Check Out)
   In the backend-connected version, these become async functions that
   call the API and then re-render using the server's response, e.g.:

     async function handleCheckIn() {
       const response = await fetch("/api/attendance/check-in", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({ employeeId: employee.id }),
       });
       const data = await response.json();
       todayState.checkInTime = data.checkInTime;
       todayState.status = data.status;
       renderStatusPill();
       renderTodayPanel();
       renderActionButtons();
     }
   ========================================================================== */

async function handleCheckIn() {
  try {
    const response = await fetch("http://localhost:5000/api/attendance/check-in", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        employeeId: employee.id
      })
    });

    const data = await response.json();

    if (!data.success) {
      alert(data.message || "Check-in failed");
      return;
    }

    todayState.checkInTime = data.checkInTime;
    todayState.status = data.status;

    renderStatusPill();
    renderTodayPanel();
    renderActionButtons();

  } catch (error) {
    console.error(error);
    alert("Backend server is not connected.");
  }
}


async function handleCheckOut() {
  try {
    const response = await fetch("http://localhost:5000/api/attendance/check-out", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        employeeId: employee.id
      })
    });

    const data = await response.json();

    if (!data.success) {
      alert(data.message || "Check-out failed");
      return;
    }

    todayState.checkOutTime = data.checkOutTime;
    todayState.status = data.status === "completed"
      ? "present"
      : data.status;

    renderStatusPill();
    renderTodayPanel();
    renderActionButtons();

  } catch (error) {
    console.error(error);
    alert("Backend server is not connected.");
  }
}
/* ==========================================================================
   7. EVENT LISTENERS
   ========================================================================== */

dom.checkInBtn.addEventListener("click", handleCheckIn);
dom.checkOutBtn.addEventListener("click", handleCheckOut);

/* ==========================================================================
   8. INIT
   ========================================================================== */

document.addEventListener("DOMContentLoaded", renderAll);