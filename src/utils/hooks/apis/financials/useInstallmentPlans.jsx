import { fetchInstallmentPlans } from "@/APIs/financials/installmentPlans";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useInstallmentPlans = () => {
	const [installmentPlans, setInstallmentPlans] = useState([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			const res = await fetchInstallmentPlans();
			if (res.status) {
				setInstallmentPlans(res.data || []);
			} else {
				toast.error(res || "حدث خطأ ما أثناء جلب خطط التقسيط");
				setInstallmentPlans([]);
			}
			setLoading(false);
		};

		fetchData();
	}, []);

	return { installmentPlans, loading, setInstallmentPlans };
};
