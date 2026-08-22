const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Test route
app.get("/", (req, res) => {
  res.json({
    message: "HRMS Attendance Backend is running!"
  });
});

// Employee details
app.get("/api/employees/:id", (req, res) => {
  const employee = {
    id: req.params.id,
    name: "Priya Sharma"
  };

  res.json(employee);
});

// Check-in
app.post("/api/attendance/check-in", (req, res) => {
  const { employeeId } = req.body;

  const checkInTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  res.json({
    success: true,
    employeeId: employeeId,
    checkInTime: checkInTime,
    status: "present"
  });
});
// Check-out
app.post("/api/attendance/check-out", (req, res) => {
  const { employeeId } = req.body;

  const checkOutTime = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });

  res.json({
    success: true,
    employeeId: employeeId,
    checkOutTime: checkOutTime,
    status: "completed"
  });
});
// Leave Management
app.post("/api/leave/apply", (req, res) => {
  const { employeeId, leaveType, startDate, endDate, remarks } = req.body;

  if (!employeeId || !leaveType || !startDate || !endDate || !remarks) {
    return res.status(400).json({
      success: false,
      message: "All leave details are required"
    });
  }

  const leaveRequest = {
    id: Date.now(),
    employeeId,
    leaveType,
    startDate,
    endDate,
    remarks,
    status: "Pending"
  };

  res.json({
    success: true,
    message: "Leave request submitted successfully",
    leaveRequest
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});