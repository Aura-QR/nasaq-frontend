import { fetchSingleInstallmentPlan } from "@/APIs/financials/installmentPlans";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useInstallmentPlan = (installmentPlanId) => {
	const [installmentPlan, setInstallmentPlan] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!installmentPlanId) {
			setInstallmentPlan(null);
			return;
		}

		const fetchData = async () => {
			setLoading(true);
			const res = await fetchSingleInstallmentPlan(installmentPlanId);
			if (res.status) {
				setInstallmentPlan(res.data);
			} else {
				toast.error(res || "حدث خطأ ما أثناء جلب خطة التقسيط");
				setInstallmentPlan(null);
			}
			setLoading(false);
		};

		fetchData();
	}, [installmentPlanId]);

	return { installmentPlan, loading };
};
