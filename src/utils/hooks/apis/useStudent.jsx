import {
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";

import { fetchSingleStudent } from "@/APIs/users/students";

const pendingRequests = new Map();

const extractStudentResponse = (
  response
) => {
  if (
    !response ||
    response?.status === false
  ) {
    return {
      status: false,
      message:
        response?.message ||
        "حدث خطأ أثناء جلب بيانات الطالب",
      student: null,
    };
  }

  const student =
    response?.data?.student ??
    response?.data?.data?.student ??
    response?.data?.data ??
    response?.data ??
    response;

  return {
    status: Boolean(
      student &&
        typeof student ===
          "object"
    ),
    student:
      student &&
      typeof student ===
        "object"
        ? student
        : null,
    message:
      "لم يتم العثور على بيانات الطالب",
  };
};

const loadStudent = (
  studentId
) => {
  if (
    pendingRequests.has(
      studentId
    )
  ) {
    return pendingRequests.get(
      studentId
    );
  }

  const request =
    fetchSingleStudent(
      studentId
    )
      .then(
        extractStudentResponse
      )
      .finally(() => {
        pendingRequests.delete(
          studentId
        );
      });

  pendingRequests.set(
    studentId,
    request
  );

  return request;
};

export const useStudent = (
  studentId
) => {
  const [student, setStudent] =
    useState(null);

  const [loading, setLoading] =
    useState(Boolean(studentId));

  useEffect(() => {
    let active = true;

    if (!studentId) {
      setStudent(null);
      setLoading(false);

      toast.error(
        "معرّف الطالب غير موجود",
        {
          toastId:
            "missing-student-id",
        }
      );

      return () => {
        active = false;
      };
    }

    const fetchData =
      async () => {
        setLoading(true);

        const result =
          await loadStudent(
            studentId
          );

        if (!active) return;

        if (!result.status) {
          toast.error(
            result.message,
            {
              toastId:
                `student-${studentId}`,
            }
          );

          setStudent(null);
          setLoading(false);
          return;
        }

        setStudent(
          result.student
        );

        setLoading(false);
      };

    fetchData();

    return () => {
      active = false;
    };
  }, [studentId]);

  return {
    student,
    loading,
    setStudent,
  };
};
