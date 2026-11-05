import { Box, Paper, Stack, Typography } from "@mui/material";
import { DiscountRounded } from "@mui/icons-material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { addDiscount } from "@/APIs/financials/discounts";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import { FormActions, formFieldsSx, pageCardSx } from "@/components/financial/FinancialShell";
import DiscountFields, { discountPayload } from "./DiscountFields";

const DiscountsAddPage = () => {
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({ defaultValues: { type: "percentage" } });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const submit = async (d) => {
    setLoading(true);
    const r = await addDiscount({ name: d.name, description: d.description || undefined, ...discountPayload(d) });
    if (r?.status) {
      toast.success("تم إضافة الخصم بنجاح");
      navigate("/financial/discounts");
    } else toast.error(r?.message || r || "حدث خطأ أثناء إضافة الخصم");
    setLoading(false);
  };
  return (
    <Container>
      <Box component="form" onSubmit={handleSubmit(submit)} dir="rtl" sx={{ pb: 3 }}>
        <Paper elevation={0} sx={{ ...pageCardSx, p: 1.4 }}><Back title="إضافة خصم" /></Paper>
        <Paper elevation={0} sx={{ ...pageCardSx, ...formFieldsSx, mt: 1.25, p: 2 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5, pb: 1.25, borderBottom: "1px solid rgba(36,74,112,.07)" }}>
            <Box sx={{ width: 40, height: 40, display: "grid", placeItems: "center", bgcolor: "var(--color-gold-soft)", color: "var(--color-gold-dark)", borderRadius: "12px" }}><DiscountRounded /></Box>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 800, color: "var(--color-navy-deep)" }}>تفاصيل الخصم</Typography>
              <Typography sx={{ fontSize: 10, color: "var(--color-muted)" }}>نسبة من الرسوم، أو مبلغ ثابت يبقى كما هو في كل الصفوف.</Typography>
            </Box>
          </Stack>
          <DiscountFields register={register} errors={errors} watch={watch} setValue={setValue} />
        </Paper>
        <Paper elevation={0} sx={{ ...pageCardSx, mt: 1.25, p: 1.4 }}><FormActions loading={loading} onCancel={() => navigate(-1)} label="حفظ الخصم" /></Paper>
      </Box>
    </Container>
  );
};
export default DiscountsAddPage;
