import { fetchSingleFeeConfig } from "@/APIs/financials/feeConfigs";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useFeeConfig = (feeConfigId) => {
	const [feeConfig, setFeeConfig] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!feeConfigId) {
			setFeeConfig(null);
			return;
		}

		const fetchData = async () => {
			setLoading(true);
			const res = await fetchSingleFeeConfig(feeConfigId);
			if (res.status) {
				setFeeConfig(res.data);
			} else {
				toast.error(res || "حدث خطأ ما أثناء جلب إعداد الرسوم");
				setFeeConfig(null);
			}
			setLoading(false);
		};

		fetchData();
	}, [feeConfigId]);

	return { feeConfig, loading };
};
