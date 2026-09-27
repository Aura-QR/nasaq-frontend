import { AddRounded, ArrowBackRounded } from "@mui/icons-material";
import { Box, Button, Chip, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import ClassForm from "@/components/SchoolClasses/ClassForm";
import { createSchoolClass } from "@/APIs/school/classes";
import { getEntityId, unwrapApiData } from "@/utils/school/classData";

const Add = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

 const onSubmit = async (payload) => {
  setLoading(true);

  try {
    const safePayload = {
      ...payload,
    };

    const teacherValue =
      payload?.teacherInChargeId;

    const teacherInChargeId =
      teacherValue &&
      typeof teacherValue === "object"
        ? teacherValue?._id ||
          teacherValue?.id ||
          ""
        : String(
            teacherValue || ""
          ).trim();

    // الحقل اختياري:
    // لو مفيش معلم مسؤول، ما نبعتش الحقل أصلًا.
    if (!teacherInChargeId) {
      delete safePayload.teacherInChargeId;
    } else {
      safePayload.teacherInChargeId =
        teacherInChargeId;
    }

    const response =
      await createSchoolClass(
        safePayload
      );

    if (response?.status === false) {
      toast.error(
        response?.message ||
          "تعذر إضافة الفصل"
      );
      return;
    }

    toast.success(
      "تمت إضافة الفصل بنجاح"
    );

    const created =
      unwrapApiData(response);

    const id = getEntityId(
      created?.class || created
    );

    navigate(
      id
        ? `/school/classes/${id}`
        : "/school/classes"
    );
  } finally {
    setLoading(false);
  }
};

  return (
    <Container>
      <Box dir="rtl" sx={{ pb: 4 }}>
        <Paper elevation={0} sx={{ p: { xs: 1.6, md: 1.9 }, border: "1px solid rgba(36,74,112,.08)", borderRadius: "18px", background: "linear-gradient(135deg,rgba(255,252,247,.98),rgba(251,240,216,.44))", boxShadow: "0 10px 24px rgba(18,47,77,.06)" }}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" gap={1}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={.7}>
                <Typography component="h1" sx={{ color: "#122f4d", fontSize: { xs: "21px", md: "25px" }, fontWeight: 800 }}>إضافة فصل جديد</Typography>
                <Chip size="small" icon={<AddRounded />} label="جديد" sx={{ color: "#b78430", backgroundColor: "#fbf0d8", fontWeight: 800 }} />
              </Stack>
              <Typography sx={{ mt: .35, color: "#7e8791", fontSize: "10px" }}>أنشئ الفصل داخل سنة وصف دراسي محددين.</Typography>
            </Box>
            <Button variant="outlined" startIcon={<ArrowBackRounded />} onClick={() => navigate("/school/classes")} sx={{ minHeight: 42, borderRadius: "12px", color: "#244a70", borderColor: "rgba(36,74,112,.18)", fontWeight: 800 }}>الرجوع للفصول</Button>
          </Stack>
        </Paper>

        <ClassForm mode="add" loading={loading} onSubmit={onSubmit} onCancel={() => navigate("/school/classes")} />
      </Box>
    </Container>
  );
};

export default Add;
