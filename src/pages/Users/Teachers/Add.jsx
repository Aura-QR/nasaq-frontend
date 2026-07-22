import {
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  ArrowForwardIosRounded,
  PersonAddAlt1Rounded,
} from "@mui/icons-material";

import { useForm } from "react-hook-form";
import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import TeacherForm from "@/components/Teachers/TeacherForm";
import TeacherFormActions from "@/components/Teachers/TeacherFormActions";

import { addTeacher } from "@/APIs/users/teachers";

const Add = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      hireDate: new Date()
        .toISOString()
        .split("T")[0],
      isActive: 1,
    },
  });

  const [selectedSubjects, setSelectedSubjects] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const navigate = useNavigate();

  const onSubmit = async (formData) => {
    if (selectedSubjects.length === 0) {
      toast.error(
        "يرجى اختيار مادة دراسية واحدة على الأقل"
      );
      return;
    }

    try {
      setLoading(true);

      const payload = {
        ...formData,
        isActive: formData.isActive == 1,
        subjectIds: selectedSubjects,
      };

      const response =
        await addTeacher(payload);

      if (!response?.status) {
        toast.error(
          response?.message ||
            response ||
            "حدث خطأ أثناء إضافة المعلم"
        );
        return;
      }

      toast.success(
        "تمت إضافة المعلم بنجاح"
      );

      const teacherId =
        response?.data?.teacher?._id ||
        response?.data?._id;

      navigate(
        `/users/teachers/${teacherId}`,
        {
          replace: true,
        }
      );
    } catch (error) {
      toast.error(
        error?.response?.data?.message ||
          "حدث خطأ أثناء إضافة المعلم"
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
        autoComplete="off"
        onSubmit={handleSubmit(onSubmit)}
      >
        <Box
          aria-hidden="true"
          sx={{
            position: "fixed",
            top: -10000,
            left: -10000,
            width: 1,
            height: 1,
            overflow: "hidden",
            opacity: 0,
            pointerEvents: "none",
          }}
        >
          <input
            type="text"
            name="nasaq-hidden-teacher-username"
            autoComplete="username"
            tabIndex={-1}
          />

          <input
            type="password"
            name="nasaq-hidden-teacher-password"
            autoComplete="new-password"
            tabIndex={-1}
          />
        </Box>

        <Stack spacing={1}>
          <Button
            component={Link}
            to="/users/teachers"
            startIcon={
              <ArrowForwardIosRounded />
            }
            sx={{
              width: "fit-content",
              minHeight: 34,
              px: 1.1,

              color: "var(--color-navy)",
              backgroundColor:
                "rgba(36, 74, 112, 0.045)",
              borderRadius: "10px",

              fontSize: "10.5px",
              fontWeight: 800,
              textTransform: "none",

              "& .MuiButton-startIcon": {
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
            العودة إلى المعلمين
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
              <PersonAddAlt1Rounded />
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
                إضافة معلم جديد
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
                أدخل بيانات المعلم المهنية
                واختر المواد الدراسية.
              </Typography>
            </Box>
          </Paper>

          <TeacherForm
            mode="add"
            register={register}
            errors={errors}
            selectedSubjects={
              selectedSubjects
            }
            setSelectedSubjects={
              setSelectedSubjects
            }
            showSubjects
          />

          <TeacherFormActions
            loading={loading}
            submitLabel="حفظ المعلم"
          />
        </Stack>
      </Box>
    </Container>
  );
};

export default Add;
