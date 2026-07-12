import { api } from "../Axios";

export const fetchStudentClass = async () => {
  try {
    const response = await api.get("/classes/student/me");
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const fetchStudentLectures = async () => {
  try {
    const response = await api.get("/lectures/student/me");
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const fetchStudentAttendance = async () => {
  try {
    const response = await api.get("/attendance/student/me");
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const fetchStudentSubjects = async () => {
  try {
    const response = await api.get("/subjects/student/me");
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const fetchStudentExams = async (filters) => {
  try {
    const response = await api.get("/exams/student/me", { params: filters });
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const fetchStudentProjects = async (filters) => {
  try {
    const response = await api.get("/projects/student/me", { params: filters });
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const fetchStudentGrades = async (filters) => {
  try {
    const response = await api.get("/gradesCriteria/student/me/grades", { params: filters });
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const fetchStudentMates = async () => {
  try {
    const response = await api.get("/classes/student/me/mates");
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const startStudentExam = async (examId) => {
  try {
    const response = await api.post(`/exams/${examId}/start`);
    return response.data;
  } catch (err) {
    return err.response?.data?.message || "حدث خطأ ما";
  }
};

export const gradeStudentExam = async (examId, data) => {
  try {
    const response = await api.post(`/exams/${examId}/grade`, data);
    return response.data;
  } catch (err) {
    return err.response?.data?.message || "حدث خطأ ما";
  }
};

export const fetchProjectSubmission = async (projectId) => {
  try {
    const response = await api.get(`/projects/${projectId}/my-submission`);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const submitProject = async (projectId, files) => {
  try {
    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    const response = await api.post(`/projects/${projectId}/submit`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};