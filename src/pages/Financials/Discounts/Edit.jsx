import { Box, Checkbox, FormControlLabel, Paper, Stack, Typography } from "@mui/material";
import { DiscountRounded } from "@mui/icons-material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { editDiscount } from "@/APIs/financials/discounts";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Loading from "@/components/Loading";
import { FormActions, formFieldsSx, pageCardSx } from "@/components/financial/FinancialShell";
import { useDiscount } from "@/utils/hooks/apis/financials/useDiscount";
import DiscountFields, { discountPayload } from "./DiscountFields";

const DiscountsEditPage = () => {
  const { register, handleSubmit, watch, setValue, reset, formState: { errors, isDirty } } = useForm();
  const [saving, setSaving] = useState(false);
  const [ready, setReady] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const { discount, loading } = useDiscount(id);
  useEffect(() => {
    if (!discount) return;
    reset({
      name: discount.name || "",
      description: discount.description || "",
      type: discount.type === "fixed" ? "fixed" : "percentage",
      percentage: Number(discount.percentage || 0),
      amount: Number(discount.amount || 0),
      isActive: !!discount.isActive,
    });
    setReady(true);
  }, [discount, reset]);
  const submit = async (d) => {
    if (!isDirty) return toast.info("لم تحدث أي بيانات للتعديل");
    setSaving(true);
    const r = await editDiscount({ name: d.name, description: d.description || "", isActive: !!d.isActive, ...discountPayload(d) }, id);
    if (r?.status) {
      toast.success("تم تعديل الخصم بنجاح");
      navigate("/financial/discounts");
    } else toast.error(r?.message || r || "حدث خطأ أثناء تعديل الخصم");
    setSaving(false);
  };
  if (loading) return <Loading />;
  return (
    <Container>
      <Box component="form" onSubmit={handleSubmit(submit)} dir="rtl" sx={{ pb: 3 }}>
        <Paper elevation={0} sx={{ ...pageCardSx, p: 1.4 }}><Back title="تعديل الخصم" /></Paper>
        <Paper elevation={0} sx={{ ...pageCardSx, ...formFieldsSx, mt: 1.25, p: 2 }}>
          <Stack direction="row" spacing={1} sx={{ mb: 1.5, pb: 1.25, borderBottom: "1px solid rgba(36,74,112,.07)" }}>
            <Box sx={{ width: 40, height: 40, display: "grid", placeItems: "center", bgcolor: "var(--color-gold-soft)", color: "var(--color-gold-dark)", borderRadius: "12px" }}><DiscountRounded /></Box>
            <Box>
              <Typography sx={{ fontSize: 16, fontWeight: 800, color: "var(--color-navy-deep)" }}>تفاصيل الخصم</Typography>
              <Typography sx={{ fontSize: 10, color: "var(--color-muted)" }}>التعديل يسري على التطبيقات الجديدة؛ الخصومات المطبقة على الطلاب تبقى كما هي.</Typography>
            </Box>
          </Stack>
          {ready && (
            <>
              <DiscountFields register={register} errors={errors} watch={watch} setValue={setValue} />
              <FormControlLabel
                control={<Checkbox checked={!!watch("isActive")} onChange={(e) => setValue("isActive", e.target.checked, { shouldDirty: true })} />}
                label="الخصم نشط"
                sx={{ mt: 1.5, mx: 0, p: 1, border: "1px solid rgba(36,74,112,.08)", borderRadius: "12px", bgcolor: "white" }}
              />
            </>
          )}
        </Paper>
        <Paper elevation={0} sx={{ ...pageCardSx, mt: 1.25, p: 1.4 }}><FormActions loading={saving} onCancel={() => navigate(-1)} label="حفظ التغييرات" /></Paper>
      </Box>
    </Container>
  );
};
export default DiscountsEditPage;
