import {
  Box,
  Button,
  Paper,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import {
  ArrowForwardIosRounded,
  EditNoteRounded,
} from "@mui/icons-material";

import { useForm } from "react-hook-form";
import {
  useEffect,
  useState,
} from "react";
import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import SubjectForm from "@/components/Subjects/SubjectForm";
import SubjectFormActions from "@/components/Subjects/SubjectFormActions";

import { editSubject } from "@/APIs/school/subjects";
import { getChangedValues } from "@/utils/helpers/getChangedValues";
import { useSubject } from "@/utils/hooks/apis/useSubject";

const Edit = () => {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      subjectName: "",
      subjectCode: "",
      isRequiredForPromotion: true,
    },
  });

  const [loading, setLoading] =
    useState(false);

  const [
    defaultValues,
    setDefaultValues,
  ] = useState(null);

  const navigate = useNavigate();
  const { id } = useParams();

  const {
    subject,
    loading: subjectLoading,
  } = useSubject(id);

  useEffect(() => {
    if (!subject) return;

    const normalizedSubject = {
      ...subject,
      subjectName:
        subject.subjectName?.trim() ||
        "",
      subjectCode:
        subject.subjectCode?.trim() ||
        "",
      isRequiredForPromotion:
        subject.isRequiredForPromotion !== false,
    };

    reset(normalizedSubject);
    setDefaultValues(
      normalizedSubject
    );
  }, [subject, reset]);

  const onSubmit = async (
    formData
  ) => {
    if (!defaultValues) return;

    try {
      setLoading(true);

      const normalizedData = {
        ...formData,
        subjectName:
          formData.subjectName?.trim(),
        subjectCode:
          formData.subjectCode?.trim() ||
          "",
        isRequiredForPromotion:
          formData.isRequiredForPromotion !== false,
      };

      const changedData =
        getChangedValues(
          normalizedData,
          defaultValues,
          ["classIds"]
        );

      if (
        Object.keys(changedData)
          .length === 0
      ) {
        toast.info(
          "لم يتم إجراء أي تغييرات على البيانات"
        );
        return;
      }

      if (
        "subjectCode" in
          changedData &&
        !changedData.subjectCode
      ) {
        changedData.subjectCode =
          undefined;
      }

      const response =
        await editSubject(
          changedData,
          id
        );

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "حدث خطأ أثناء تعديل بيانات المادة"
        );
        return;
      }

      toast.success(
        "تم تعديل بيانات المادة بنجاح"
      );

      navigate("/school/subjects", {
        replace: true,
      });
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء تعديل بيانات المادة"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(
          onSubmit
        )}
      >
        <Stack spacing={1}>
          <Button
            component={Link}
            to="/school/subjects"
            startIcon={
              <ArrowForwardIosRounded />
            }
            sx={{
              width: "fit-content",
              minHeight: 34,
              px: 1.1,

              color:
                "var(--color-navy)",
              backgroundColor:
                "rgba(36, 74, 112, 0.045)",
              borderRadius: "10px",

              fontSize: "10.5px",
              fontWeight: 800,
              textTransform: "none",

              "& .MuiButton-startIcon":
                {
                  marginLeft: "5px",
                  marginRight: 0,
                },

              "& svg": {
                fontSize: "15px",
              },

              "&:hover": {
                color:
                  "var(--color-gold-dark)",
                backgroundColor:
                  "var(--color-gold-soft)",
              },
            }}
          >
            العودة إلى المواد
          </Button>

          <Paper
            elevation={0}
            sx={{
              p: {
                xs: 1.25,
                md: 1.5,
              },

              display: "flex",
              alignItems: "center",
              gap: 1,

              border:
                "1px solid rgba(36, 74, 112, 0.08)",
              borderRadius: "16px",

              background:
                "linear-gradient(135deg, rgba(255,252,247,0.98), rgba(251,240,216,0.38))",

              boxShadow:
                "0 8px 20px rgba(18,47,77,0.05)",
            }}
          >
            <Box
              sx={{
                width: 40,
                height: 40,

                display: "grid",
                placeItems: "center",
                flexShrink: 0,

                color:
                  "var(--color-gold-dark)",
                backgroundColor:
                  "var(--color-gold-soft)",

                border:
                  "1px solid rgba(211,164,79,0.21)",
                borderRadius: "12px",

                "& svg": {
                  fontSize: 21,
                },
              }}
            >
              <EditNoteRounded />
            </Box>

            <Box>
              <Typography
                component="h1"
                sx={{
                  color:
                    "var(--color-navy-deep)",
                  fontSize: {
                    xs: "19px",
                    md: "22px",
                  },
                  fontWeight: 800,
                  lineHeight: 1.25,
                }}
              >
                تعديل المادة الدراسية
              </Typography>

              <Typography
                sx={{
                  mt: 0.15,
                  color:
                    "var(--color-muted)",
                  fontSize: "9.5px",
                  lineHeight: 1.5,
                }}
              >
                عدّل اسم المادة أو الكود
                ثم احفظ التغييرات.
              </Typography>
            </Box>
          </Paper>

          {subjectLoading ||
          !defaultValues ? (
            <Skeleton
              variant="rounded"
              height={132}
              sx={{
                borderRadius: "16px",
              }}
            />
          ) : (
            <>
              <SubjectForm
                register={register}
                control={control}
                errors={errors}
              />

              <SubjectFormActions
                loading={loading}
                submitLabel="حفظ التعديلات"
              />
            </>
          )}
        </Stack>
      </Box>
    </Container>
  );
};

export default Edit;
