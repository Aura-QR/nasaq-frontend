import { Box, Grid, ToggleButton, ToggleButtonGroup, Typography } from "@mui/material";
import Input from "@/components/Input/Input";

/*
 * حقول الخصم: نسبة من الرسوم أو مبلغ ثابت بالريال.
 *
 * المبلغ الثابت يبقى كما هو في كل الصفوف (500 ريال خصم الطلاب السابقين)، أما
 * النسبة فتتغير قيمتها بتغير رسوم الصف؛ لذلك نعرض للمستخدم أثر الخصم على
 * رسوم الصفوف الشائعة قبل الحفظ.
 */
const SAMPLE_FEES = [9000, 11000, 13000];

export const discountLabel = (d) =>
  d?.type === "fixed"
    ? `${Number(d?.amount || 0).toLocaleString("ar-SA")} ريال`
    : `${Number(d?.percentage || 0)}%`;

export const discountPayload = (d) =>
  d.type === "fixed"
    ? { type: "fixed", amount: Number(d.amount) }
    : { type: "percentage", percentage: Number(d.percentage) };

export default function DiscountFields({ register, errors, watch, setValue }) {
  const type = watch("type") || "percentage";
  const value = Number(type === "fixed" ? watch("amount") : watch("percentage")) || 0;

  return (
    <Grid container spacing={1.5}>
      <Grid item xs={12}>
        <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 0.75, color: "var(--color-navy-deep)" }}>نوع الخصم</Typography>
        <ToggleButtonGroup
          exclusive
          value={type}
          onChange={(_, v) => v && setValue("type", v, { shouldDirty: true })}
          size="small"
          sx={{ "& .MuiToggleButton-root": { px: 2, fontWeight: 800, borderRadius: "10px" } }}
        >
          <ToggleButton value="percentage">نسبة من الرسوم</ToggleButton>
          <ToggleButton value="fixed">مبلغ ثابت بالريال</ToggleButton>
        </ToggleButtonGroup>
      </Grid>
      <Grid item xs={12} sm={6}>
        <Input register={register} registerName="name" error={errors.name?.message} label="اسم الخصم" required />
      </Grid>
      <Grid item xs={12} sm={6}>
        {type === "fixed" ? (
          <Input register={register} registerName="amount" error={errors.amount?.message} label="مبلغ الخصم (ريال)" required type="number" valueAsNumber />
        ) : (
          <Input register={register} registerName="percentage" error={errors.percentage?.message} label="نسبة الخصم (%)" required type="number" valueAsNumber />
        )}
      </Grid>
      {value > 0 && (
        <Grid item xs={12}>
          <Box sx={{ p: 1.25, borderRadius: "12px", bgcolor: "var(--color-gold-soft)", fontSize: 12 }}>
            <Typography sx={{ fontSize: 12, fontWeight: 800, mb: 0.5 }}>أثر الخصم على الرسوم</Typography>
            {SAMPLE_FEES.map((fee) => {
              const off = type === "fixed" ? Math.min(value, fee) : Math.round((fee * Math.min(value, 100)) / 100);
              const pct = ((off / fee) * 100).toFixed(2).replace(/\.00$/, "");
              return (
                <Typography key={fee} sx={{ fontSize: 12 }}>
                  رسوم {fee.toLocaleString("ar-SA")} ريال ← خصم {off.toLocaleString("ar-SA")} ريال ({pct}%) ← المطلوب {(fee - off).toLocaleString("ar-SA")} ريال
                </Typography>
              );
            })}
          </Box>
        </Grid>
      )}
      <Grid item xs={12}>
        <Input register={register} registerName="description" error={errors.description?.message} label="الوصف" multiline rows={3} />
      </Grid>
    </Grid>
  );
}
