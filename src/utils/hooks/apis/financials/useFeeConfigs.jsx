import { fetchFeeConfigs } from "@/APIs/financials/feeConfigs";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useFeeConfigs = () => {
	const [feeConfigs, setFeeConfigs] = useState([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			const res = await fetchFeeConfigs();
			if (res.status) {
				setFeeConfigs(res.data || []);
			} else {
				toast.error(res || "حدث خطأ ما أثناء جلب إعدادات الرسوم");
				setFeeConfigs([]);
			}
			setLoading(false);
		};

		fetchData();
	}, []);

	return { feeConfigs, loading, setFeeConfigs };
};
