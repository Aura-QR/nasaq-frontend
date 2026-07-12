import { Box, Grid, Typography } from "@mui/material";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { editFeeConfig } from "@/APIs/financials/feeConfigs";
import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";
import SubmitSection from "@/components/SubmitSection";
import { getChangedValues } from "@/utils/helpers/getChangedValues";
import { useFeeConfig } from "@/utils/hooks/apis/financials/useFeeConfig";
import Years from "@/utils/constants/Years";

const FeeConfigsEditPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [defaultValues, setDefaultValues] = useState(null);
  const navigate = useNavigate();
  const { id } = useParams();

  const { feeConfig, loading: feeConfigLoading } = useFeeConfig(id);

  useEffect(() => {
    if (feeConfig) {
      const normalized = {
        academicYear: feeConfig.academicYear,
        tuitionFee: feeConfig.tuitionFee,
      };
      reset(normalized);
      setDefaultValues(normalized);
    }
  }, [feeConfig, reset]);

  const onSubmit = async (data) => {
    setLoading(true);

    const changedData = getChangedValues(data, defaultValues || {});
    if (Object.keys(changedData).length === 0) {
      toast.info("لم تحدث أي بيانات للتعديل");
      setLoading(false);
      return;
    }

    const response = await editFeeConfig(changedData, id);
    if (response.status) {
      toast.success("تم تعديل إعداد الرسوم بنجاح");
      navigate("/financial/fee-configs");
    } else {
      toast.error(response || "حدث خطأ ما أثناء تعديل إعداد الرسوم");
    }
    setLoading(false);
  };

  return (
    <Container>
      <Back title={"تعديل إعداد الرسوم"} />

      <Box bgcolor={"primary.white"} p={"32px 16px"} borderRadius={"12px"} my={8}>
        <Typography variant="title" fontWeight={"500"}>
          تفاصيل إعداد الرسوم
        </Typography>

        {defaultValues && (
          <Grid container mt={8} spacing={8}>
            <Grid item xs={12} sm={6}>
              <Select
                register={register}
                registerName={"academicYear"}
                data={Years}
                error={errors.academicYear?.message}
                label={"السنة الدراسية"}
                required={true}
                defaultValue={defaultValues.academicYear}
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
                defaultValue={defaultValues.tuitionFee}
                valueAsNumber={true}
              />
            </Grid>
          </Grid>
        )}
      </Box>

      <SubmitSection
        onSubmit={onSubmit}
        handleSubmit={handleSubmit}
        loading={loading || feeConfigLoading}
      />
    </Container>
  );
};

export default FeeConfigsEditPage;
