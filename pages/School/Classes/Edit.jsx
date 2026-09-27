import { ArrowBackRounded, EditRounded } from "@mui/icons-material";
import { Alert, Box, Button, Chip, Paper, Skeleton, Stack, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";

import Container from "@/components/Container/Container";
import ClassForm from "@/components/SchoolClasses/ClassForm";
import { getSchoolClassById, updateSchoolClass } from "@/APIs/school/classes";
import { extractClass } from "@/utils/school/classData";

const Edit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [classItem, setClassItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const response = await getSchoolClassById(id);
      if (!active) return;
      if (response?.status === false) {
        setError(response?.message || "تعذر تحميل الفصل");
      } else {
        setClassItem(extractClass(response));
      }
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [id]);

  const onSubmit = async (payload) => {
    setSaving(true);
    const response = await updateSchoolClass(id, payload);
    if (response?.status === false) {
      toast.error(response?.message || "تعذر تعديل الفصل");
      setSaving(false);
      return;
    }
    toast.success("تم تعديل بيانات الفصل بنجاح");
    navigate(`/school/classes/${id}`);
  };

  if (loading) {
    return <Container><Stack spacing={1}><Skeleton variant="rounded" height={110} /><Skeleton variant="rounded" height={430} /></Stack></Container>;
  }

  return (
    <Container>
      <Box dir="rtl" sx={{ pb: 4 }}>
        <Paper elevation={0} sx={{ p: { xs: 1.6, md: 1.9 }, border: "1px solid rgba(36,74,112,.08)", borderRadius: "18px", background: "linear-gradient(135deg,rgba(255,252,247,.98),rgba(251,240,216,.44))", boxShadow: "0 10px 24px rgba(18,47,77,.06)" }}>
          <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between" gap={1}>
            <Box>
              <Stack direction="row" alignItems="center" spacing={.7}>
                <Typography component="h1" sx={{ color: "#122f4d", fontSize: { xs: "21px", md: "25px" }, fontWeight: 800 }}>تعديل الفصل</Typography>
                <Chip size="small" icon={<EditRounded />} label="تعديل" sx={{ color: "#b78430", backgroundColor: "#fbf0d8", fontWeight: 800 }} />
              </Stack>
              <Typography sx={{ mt: .35, color: "#7e8791", fontSize: "10px" }}>عدّل الهيكل الأكاديمي أو البيانات الأساسية للفصل.</Typography>
            </Box>
            <Button variant="outlined" startIcon={<ArrowBackRounded />} onClick={() => navigate(`/school/classes/${id}`)} sx={{ minHeight: 42, borderRadius: "12px", color: "#244a70", borderColor: "rgba(36,74,112,.18)", fontWeight: 800 }}>الرجوع للتفاصيل</Button>
          </Stack>
        </Paper>

        {error ? <Alert severity="error" sx={{ mt: 1.1, borderRadius: "14px" }}>{error}</Alert> : (
          <ClassForm mode="edit" initialData={classItem} loading={saving} onSubmit={onSubmit} onCancel={() => navigate(`/school/classes/${id}`)} />
        )}
      </Box>
    </Container>
  );
};

export default Edit;
