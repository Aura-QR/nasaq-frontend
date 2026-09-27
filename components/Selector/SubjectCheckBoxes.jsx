import {
  Button,
  Stack,
  Typography,
} from "@mui/material";

import {
  RefreshRounded,
} from "@mui/icons-material";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  fetchSubjectOfferings,
} from "@/APIs/school/subjectOfferings";

import Checkboxes from "../Checkboxes";

const cleanId = (value) =>
  String(
    value?._id ||
      value?.id ||
      value ||
      ""
  ).trim();

const getEntityName = (
  value,
  fallback = ""
) => {
  if (!value) return fallback;

  if (typeof value === "string") {
    return fallback;
  }

  return (
    value?.name ||
    value?.title ||
    value?.subjectName ||
    value?.label ||
    fallback
  );
};

const extractOfferings = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) {
    return data;
  }

  if (
    Array.isArray(
      data?.subjectOfferings
    )
  ) {
    return data.subjectOfferings;
  }

  if (
    Array.isArray(
      data?.offerings
    )
  ) {
    return data.offerings;
  }

  if (Array.isArray(data?.docs)) {
    return data.docs;
  }

  if (Array.isArray(data?.items)) {
    return data.items;
  }

  return [];
};

const SubjectCheckBoxes = ({
  selectedSubjects = [],
  setSelectedSubjects,
}) => {
  const [offerings, setOfferings] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const loadOfferings =
    useCallback(async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetchSubjectOfferings(
            {},
            {
              forceListEndpoint:
                true,
            }
          );

        if (
          response?.status ===
          false
        ) {
          setError(
            response?.message ||
              "تعذر تحميل عروض المواد"
          );
          setOfferings([]);
          return;
        }

        setOfferings(
          extractOfferings(
            response
          )
        );
      } catch (err) {
        setError(
          err?.response?.data
            ?.message ||
            "تعذر تحميل عروض المواد"
        );

        setOfferings([]);
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    loadOfferings();
  }, [loadOfferings]);

  const items = useMemo(
    () =>
      offerings
        .map((offering) => {
          const offeringId =
            cleanId(offering);

          const subject =
            offering?.subjectId ||
            offering?.subject;

          const grade =
            offering?.gradeLevelId ||
            offering?.gradeLevel;

          const term =
            offering?.termId ||
            offering?.term;

          const subjectName =
            getEntityName(
              subject,
              offering?.subjectName ||
                "مادة دراسية"
            );

          const gradeName =
            getEntityName(grade);

          const termName =
            getEntityName(term);

          const details = [
            subjectName,
            gradeName,
            termName,
          ].filter(Boolean);

          const label =
            details.join(" - ");

          return {
            ...offering,

            // Checkboxes must store SubjectOffering IDs.
            _id: offeringId,
            id: offeringId,
            name: label,
            label,
          };
        })
        .filter(
          (item) => item._id
        ),
    [offerings]
  );

  if (loading) {
    return (
      <Typography
        color="text.secondary"
        sx={{
          py: 1,
          fontSize: "11px",
        }}
      >
        جاري تحميل عروض المواد...
      </Typography>
    );
  }

  if (error) {
    return (
      <Stack
        alignItems="flex-start"
        spacing={0.8}
        sx={{
          py: 0.5,
        }}
      >
        <Typography
          color="error.main"
          sx={{
            fontSize: "10px",
            fontWeight: 700,
          }}
        >
          {error}
        </Typography>

        <Button
          type="button"
          size="small"
          onClick={loadOfferings}
          startIcon={
            <RefreshRounded />
          }
          sx={{
            minHeight: 32,
            fontSize: "9px",
            fontWeight: 800,
          }}
        >
          إعادة المحاولة
        </Button>
      </Stack>
    );
  }

  if (items.length === 0) {
    return (
      <Typography
        color="text.secondary"
        sx={{
          py: 1,
          fontSize: "10px",
        }}
      >
        لا توجد عروض مواد متاحة للاختيار.
        تأكد من إضافة المادة للصف والترم أولًا.
      </Typography>
    );
  }

  return (
    <Checkboxes
      items={items}
      selectedData={selectedSubjects}
      setSelectedData={setSelectedSubjects}
    />
  );
};

export default SubjectCheckBoxes;
