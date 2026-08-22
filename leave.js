/* ==========================================================================
   LEAVE.JS
   Vanilla JS controller for the Leave Management page.

   This connects to the EXISTING Express backend at:
     POST http://localhost:5000/api/leave/apply

   No fake data and no fake API responses are used here -- every leave
   request shown to the user comes from the real server response.
   ========================================================================== */

/* ==========================================================================
   1. CONFIG
   ========================================================================== */

const LEAVE_API_URL = "http://localhost:5000/api/leave/apply";

/* ==========================================================================
   2. DOM REFERENCES
   ========================================================================== */

const dom = {
  todayDate: document.getElementById("todayDate"),

  form: document.getElementById("leaveForm"),

  employeeId: document.getElementById("employeeId"),
  leaveType: document.getElementById("leaveType"),
  startDate: document.getElementById("startDate"),
  endDate: document.getElementById("endDate"),
  remarks: document.getElementById("remarks"),

  fieldError: document.getElementById("fieldError"),
  formMessage: document.getElementById("formMessage"),

  applyBtn: document.getElementById("applyBtn"),
  applyBtnText: document.getElementById("applyBtnText"),
};

/* ==========================================================================
   3. HELPERS
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

function renderHeaderDate() {
  dom.todayDate.textContent = getFormattedToday();
}

// Shows/clears the small red text under the form (field-level validation).
function setFieldError(message) {
  dom.fieldError.textContent = message || "";
}

// Shows a success or error banner above the form.
function showFormMessage(type, message) {
  dom.formMessage.textContent = message;
  dom.formMessage.className = `form-message ${type}`; // "success" or "error"
  dom.formMessage.hidden = false;
}

function hideFormMessage() {
  dom.formMessage.hidden = true;
  dom.formMessage.textContent = "";
  dom.formMessage.className = "form-message";
}

// Toggles the button's loading state and prevents double submissions.
function setSubmitting(isSubmitting) {
  dom.applyBtn.disabled = isSubmitting;
  dom.applyBtnText.textContent = isSubmitting ? "Submitting..." : "Apply Leave";
}

/* ==========================================================================
   4. VALIDATION
   Returns an error message string if something is invalid, or an empty
   string if the form is valid.
   ========================================================================== */

function validateForm(data) {
  if (!data.employeeId.trim()) {
    return "Employee ID is required.";
  }

  if (!data.leaveType) {
    return "Please select a leave type.";
  }

  if (!data.startDate) {
    return "Please select a start date.";
  }

  if (!data.endDate) {
    return "Please select an end date.";
  }

  if (!data.remarks.trim()) {
    return "Please add a short remark for your leave request.";
  }

  // End date must not be before start date.
  if (new Date(data.endDate) < new Date(data.startDate)) {
    return "End Date cannot be before Start Date.";
  }

  return "";
}

/* ==========================================================================
   5. READ FORM DATA
   ========================================================================== */

function getFormData() {
  return {
    employeeId: dom.employeeId.value,
    leaveType: dom.leaveType.value,
    startDate: dom.startDate.value,
    endDate: dom.endDate.value,
    remarks: dom.remarks.value,
  };
}

// Resets the leave-specific fields after a successful submission.
// Employee ID is left as-is since the same employee may apply again.
function resetLeaveFields() {
  dom.leaveType.value = "";
  dom.startDate.value = "";
  dom.endDate.value = "";
  dom.remarks.value = "";
}

/* ==========================================================================
   6. API CALL
   Sends the leave request to the real Express backend and returns the
   parsed JSON response. Throws an error if the request fails so the
   caller can show an error message.
   ========================================================================== */

async function submitLeaveRequest(leaveData) {
  const response = await fetch(LEAVE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(leaveData),
  });

  // The server may return a non-2xx status with a JSON error body.
  // Try to parse it either way so we can show a meaningful message.
  let responseBody;
  try {
    responseBody = await response.json();
  } catch (parseError) {
    throw new Error("The server returned an unexpected response. Please try again.");
  }

  if (!response.ok || !responseBody.success) {
    const serverMessage = responseBody && responseBody.message;
    throw new Error(serverMessage || "Failed to submit leave request. Please try again.");
  }

  return responseBody;
}

/* ==========================================================================
   7. FORM SUBMIT HANDLER
   ========================================================================== */

async function handleFormSubmit(event) {
  event.preventDefault();

  hideFormMessage();
  setFieldError("");

  const formData = getFormData();
  const validationError = validateForm(formData);

  if (validationError) {
    setFieldError(validationError);
    return;
  }

  setSubmitting(true);

  try {
    const result = await submitLeaveRequest(formData);

    // Use the server's own message and returned leave request details.
    const leaveRequest = result.leaveRequest;
    const successMessage = leaveRequest
      ? `${result.message} (Request ID: ${leaveRequest.id}, Status: ${leaveRequest.status})`
      : result.message;

    showFormMessage("success", successMessage);
    resetLeaveFields();
  } catch (error) {
    showFormMessage("error", error.message);
  } finally {
    setSubmitting(false);
  }
}

/* ==========================================================================
   8. EVENT LISTENERS
   ========================================================================== */

dom.form.addEventListener("submit", handleFormSubmit);

// Clear the field error as soon as the user starts fixing the form.
[dom.employeeId, dom.leaveType, dom.startDate, dom.endDate, dom.remarks].forEach((field) => {
  field.addEventListener("input", () => setFieldError(""));
});

/* ==========================================================================
   9. INIT
   ========================================================================== */

document.addEventListener("DOMContentLoaded", renderHeaderDate);