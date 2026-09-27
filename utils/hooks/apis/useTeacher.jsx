import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  getSchoolTeacherById,
} from "@/APIs/school/teachers";

const extractTeacher = (
  value
) =>
  value?.teacher ||
  value?.item ||
  value?.record ||
  value ||
  null;

const useTeacher = (
  teacherId
) => {
  const [
    teacher,
    setTeacher,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(
    Boolean(teacherId)
  );

  const [
    error,
    setError,
  ] = useState("");

  const refetch =
    useCallback(
      async ({
        force = true,
        silent = false,
      } = {}) => {
        if (!teacherId) {
          setTeacher(null);
          setLoading(false);
          return null;
        }

        if (!silent) {
          setLoading(true);
        }

        setError("");

        const response =
          await getSchoolTeacherById(
            teacherId,
            {
              force,
            }
          );

        if (
          response?.status ===
            false
        ) {
          setTeacher(null);
          setError(
            response?.message ||
            "تعذر تحميل بيانات المعلم"
          );
          setLoading(false);

          return null;
        }

        const nextTeacher =
          extractTeacher(
            response?.data
          );

        setTeacher(
          nextTeacher
        );

        setLoading(false);

        return nextTeacher;
      },
      [teacherId]
    );

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!teacherId) {
        setTeacher(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      const response =
        await getSchoolTeacherById(
          teacherId
        );

      if (!active) {
        return;
      }

      if (
        response?.status ===
          false
      ) {
        setTeacher(null);
        setError(
          response?.message ||
          "تعذر تحميل بيانات المعلم"
        );
        setLoading(false);
        return;
      }

      setTeacher(
        extractTeacher(
          response?.data
        )
      );

      setLoading(false);
    };

    run();

    return () => {
      active = false;
    };
  }, [teacherId]);

  return {
    teacher,
    loading,
    error,
    refetch,
  };
};

export {
  extractTeacher,
  useTeacher,
};

export default useTeacher;
