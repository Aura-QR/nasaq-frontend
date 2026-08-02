import {
  createSchoolTeacher,
  deleteSchoolTeacher,
  getCurrentTeacher,
  getSchoolTeacherById,
  getSchoolTeachers,
  getSchoolTeachersList,
  getTeachersBySubject,
  toggleSchoolTeacherActive,
  updateSchoolTeacher,
} from "../school/teachers";

const wrapTeacherResult = (
  result
) => {
  if (
    result?.status ===
      false
  ) {
    return result;
  }

  const teacher =
    result?.data?.teacher ||
    result?.data;

  return {
    ...result,
    data: {
      teacher,
    },
  };
};

export const fetchTeachers =
  getSchoolTeachers;

export const fetchTeachersList =
  getSchoolTeachersList;

export const fetchTeacher =
  getSchoolTeacherById;

/*
 * Legacy name used by lecture, teacher profile,
 * add and edit pages.
 */
export const fetchSingleTeacher =
  getSchoolTeacherById;

export const fetchCurrentTeacher =
  getCurrentTeacher;

/*
 * Legacy profile export.
 */
export const fetchMyTeacherProfile =
  getCurrentTeacher;

export const fetchTeachersBySubject =
  getTeachersBySubject;

/*
 * Legacy subject-filter export.
 */
export const fetchTeachersBySubjectId =
  getTeachersBySubject;

export const addTeacher =
  async (payload) =>
    wrapTeacherResult(
      await createSchoolTeacher(
        payload
      )
    );

export const editTeacher =
  async (
    payload,
    teacherId
  ) =>
    wrapTeacherResult(
      await updateSchoolTeacher(
        teacherId,
        payload
      )
    );

export const toggleActiveTeacher =
  toggleSchoolTeacherActive;

/*
 * Additional compatibility aliases used by
 * older teacher screens.
 */
export const toggleTeacherActive =
  toggleSchoolTeacherActive;

export const deleteTeacher =
  deleteSchoolTeacher;

export {
  createSchoolTeacher,
  deleteSchoolTeacher,
  getCurrentTeacher,
  getSchoolTeacherById,
  getSchoolTeachers,
  getSchoolTeachersList,
  getTeachersBySubject,
  toggleSchoolTeacherActive,
  updateSchoolTeacher,
};

export default {
  fetchTeachers,
  fetchTeachersList,
  fetchTeacher,
  fetchSingleTeacher,
  fetchCurrentTeacher,
  fetchMyTeacherProfile,
  fetchTeachersBySubject,
  fetchTeachersBySubjectId,
  addTeacher,
  editTeacher,
  toggleActiveTeacher,
  toggleTeacherActive,
  deleteTeacher,
};
