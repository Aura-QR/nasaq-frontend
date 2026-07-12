import { Box, Grid, Typography } from "@mui/material";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { addFeeConfig } from "@/APIs/financials/feeConfigs";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";
import SubmitSection from "@/components/SubmitSection";
import Years from "@/utils/constants/Years";

const FeeConfigsAddPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmit = async (data) => {
    setLoading(true);
    const response = await addFeeConfig(data);
    if (response.status) {
      toast.success("تم إضافة إعداد الرسوم بنجاح");
      navigate("/financial/fee-configs");
    } else {
      toast.error(response || "حدث خطأ ما أثناء إضافة إعداد الرسوم");
    }
    setLoading(false);
  };

  return (
    <Container>
      <Back title={"إضافة إعداد رسوم"} />

      <Box bgcolor={"primary.white"} p={"32px 16px"} borderRadius={"12px"} my={8}>
        <Typography variant="title" fontWeight={"500"}>
          تفاصيل إعداد الرسوم
        </Typography>

        <Grid container mt={8} spacing={8}>
          <Grid item xs={12} sm={6}>
            <Select
              register={register}
              registerName={"academicYear"}
              data={Years}
              error={errors.academicYear?.message}
              label={"السنة الدراسية"}
              required={true}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <Input
              register={register}
              registerName={"tuitionFee"}
              error={errors.tuitionFee?.message}
              label={"الرسوم السنوية"}
              required={true}
              type={"number"}
              valueAsNumber={true}
            />
          </Grid>
        </Grid>
      </Box>

      <SubmitSection onSubmit={onSubmit} handleSubmit={handleSubmit} loading={loading} />
    </Container>
  );
};

export default FeeConfigsAddPage;
