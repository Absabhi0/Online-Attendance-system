import axios from "axios";

const api = axios.create({
  baseURL: "https://absabhi0-attendance-backend.hf.space",
});

/**
 * Register a new student with name, roll number, and one photo.
 * Sends multipart/form-data to POST /students/register
 *
 * @param {string} name
 * @param {string} rollNumber
 * @param {File[]} photos  - array of 3–5 File objects
 */
export const registerStudent = (name, rollNumber, photos) => {
  const formData = new FormData();
  formData.append("name", name);
  formData.append("roll_number", rollNumber);
  photos.forEach((photo) => formData.append("photos", photo));

  return api.post("/students/register", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * Send a webcam frame to POST /attendance/scan
 * Frame is a base64 data URL — we convert it to a Blob before sending.
 *
 * @param {string} courseId   - UUID of the selected course
 * @param {string} frameDataUrl - base64 data URL from react-webcam getScreenshot()
 */
export const scanFace = async (courseId, frameDataUrl) => {
  // Convert base64 data URL → Blob → File
  const res = await fetch(frameDataUrl);
  const blob = await res.blob();
  const file = new File([blob], "frame.jpg", { type: "image/jpeg" });

  const formData = new FormData();
  formData.append("course_id", courseId);
  formData.append("frame", file);

  return api.post("/attendance/scan", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

/**
 * Fetch all registered students (id, name, roll_number, created_at)
 */
export const fetchStudents = () => api.get("/students/");

/**
 * Fetch today's attendance report, optionally filtered by course
 * @param {string} [courseId]
 */
export const fetchAttendanceReport = (courseId = null) => {
  const params = courseId ? { course_id: courseId } : {};
  return api.get("/attendance/report", { params });
};

/**
 * Verify student credentials against the database
 * @param {string} rollNumber
 * @param {string} passcode
 */
export const loginStudentProfile = (rollNumber, passcode) => {
  return api.post("/students/login", {
    roll_number: rollNumber,
    passcode: passcode,
  });
};

export default api;