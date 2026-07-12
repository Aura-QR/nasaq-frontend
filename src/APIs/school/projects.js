import { api } from "../Axios";

const ENDPOINT = "/projects";

export const fetchProjects = async (filters) => {
  try {
    const response = await api.get(ENDPOINT, { params: filters });
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const fetchSingleProject = async (id) => {
  try {
    const response = await api.get(ENDPOINT + "/" + id);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const addProject = async (data) => {
  try {
    const response = await api.post(ENDPOINT, data);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const editProject = async (data, id) => {
  try {
    const response = await api.patch(ENDPOINT + "/" + id, data);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

export const deleteProject = async (id) => {
  try {
    const response = await api.delete(ENDPOINT + "/" + id);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

// Add files to a project
export const addFilesToProject = async (projectId, files) => {
  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    
    const response = await api.post(`/projects/${projectId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

// Remove a file from a project
export const removeFileFromProject = async (projectId, filename) => {
  try {
    const response = await api.delete(`/projects/${projectId}/files/${filename}`);
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

// Fetch all student submissions for a project
export const fetchProjectSubmissions = async (projectId, filters) => {
  try {
    const response = await api.get(`/projects/${projectId}/submissions`, { params: filters });
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};

// Grade a student submission
export const gradeSubmission = async (projectId, studentId, achievedGrade) => {
  try {
    const response = await api.patch(`/projects/${projectId}/submissions/${studentId}/grade`, { achievedGrade });
    return response.data;
  } catch (err) {
    return err?.response?.data?.message || "حدث خطأ ما";
  }
};