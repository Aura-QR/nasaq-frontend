import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  ArrowForwardIosRounded,
  LibraryAddRounded,
} from "@mui/icons-material";

import { useForm } from "react-hook-form";
import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import SubjectForm from "@/components/Subjects/SubjectForm";
import SubjectFormActions from "@/components/Subjects/SubjectFormActions";

import { addSubject } from "@/APIs/school/subjects";

const Add = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] =
    useState(false);

  const navigate = useNavigate();

  const onSubmit = async (
    formData
  ) => {
    try {
      setLoading(true);

      const payload = {
        ...formData,
        subjectName:
          formData.subjectName?.trim(),
        subjectCode:
          formData.subjectCode?.trim() ||
          undefined,
      };

      const response =
        await addSubject(payload);

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "حدث خطأ أثناء إضافة المادة"
        );
        return;
      }

      toast.success(
        "تمت إضافة المادة بنجاح"
      );

      navigate("/school/subjects", {
        replace: true,
      });
    } catch (error) {
      toast.error(
        error?.response?.data
          ?.message ||
          "حدث خطأ أثناء إضافة المادة"
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
              <LibraryAddRounded />
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
                إضافة مادة دراسية
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
                أدخل اسم المادة ويمكنك
                إضافة كود تعريفي لها.
              </Typography>
            </Box>
          </Paper>

          <SubjectForm
            register={register}
            errors={errors}
          />

          <SubjectFormActions
            loading={loading}
            submitLabel="حفظ المادة"
          />
        </Stack>
      </Box>
    </Container>
  );
};

export default Add;
