import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  fetchSubjectsList,
} from "@/APIs/school/subjects";

const extractSubjects = (
  response
) => {
  const candidates = [
    response,
    response?.data,
    response?.data?.data,
  ];

  for (
    const candidate of candidates
  ) {
    if (
      Array.isArray(candidate)
    ) {
      return candidate;
    }

    if (
      candidate &&
      typeof candidate ===
        "object"
    ) {
      const list =
        [
          candidate.items,
          candidate.subjects,
          candidate.results,
          candidate.docs,
          candidate.data,
        ].find(
          Array.isArray
        );

      if (list) {
        return list;
      }
    }
  }

  return [];
};

const useSubjectsList = () => {
  const [
    subjects,
    setSubjects,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const load =
    useCallback(
      async ({
        force = false,
        silent = false,
      } = {}) => {
        if (!silent) {
          setLoading(true);
        }

        setError("");

        const response =
          await fetchSubjectsList({
            force,
          });

        if (
          response?.status ===
            false
        ) {
          setSubjects([]);
          setError(
            response?.message ||
            "تعذر تحميل قائمة المواد"
          );
          setLoading(false);

          return [];
        }

        const nextSubjects =
          extractSubjects(
            response
          );

        setSubjects(
          nextSubjects
        );

        setLoading(false);

        return nextSubjects;
      },
      []
    );

  useEffect(() => {
    let active = true;

    const run = async () => {
      const response =
        await fetchSubjectsList();

      if (!active) {
        return;
      }

      if (
        response?.status ===
          false
      ) {
        setSubjects([]);
        setError(
          response?.message ||
          "تعذر تحميل قائمة المواد"
        );
        setLoading(false);
        return;
      }

      setSubjects(
        extractSubjects(
          response
        )
      );

      setError("");
      setLoading(false);
    };

    setLoading(true);
    run();

    return () => {
      active = false;
    };
  }, []);

  return {
    subjects,
    loading,
    error,
    refetch: load,
  };
};

export {
  extractSubjects,
  useSubjectsList,
};

export default useSubjectsList;
