import { useMemo } from "react";
import { toast } from "react-toastify";
import Select from "../Select/Select";
import { useInstallmentPlans } from "@/utils/hooks/apis/financials/useInstallmentPlans";

const InstallmentPlanSelector = ({
  register,
  errors,
  defaultInstallmentPlanId = "",
  label = "خطة التقسيط",
  required = false,
}) => {
  const { installmentPlans, loading } = useInstallmentPlans();

  const plansData = useMemo(() => {
    return (installmentPlans || []).map((plan) => ({
      ...plan,
      displayName: `${plan.name} (${plan.numberOfInstallments} قسط)`,
    }));
  }, [installmentPlans]);

  const handlePlanClick = () => {
    if (plansData.length === 0) {
      toast.info("لا توجد خطط تقسيط متاحة حالياً");
    }
  };

  return (
    <div onClick={handlePlanClick}>
      <Select
        register={register}
        registerName={"installmentPlanId"}
        error={errors?.installmentPlanId?.message}
        data={plansData}
        name="displayName"
        disabled={loading || plansData.length === 0}
        defaultValue={defaultInstallmentPlanId}
        label={label}
        required={required}
        defaultSelect="كاش بدون تقسيط"
      />
    </div>
  );
};

export default InstallmentPlanSelector;
