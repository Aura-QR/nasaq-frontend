import { fetchFinancialSummary } from "@/APIs/financials/financialRecords";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useFinancialSummary = (studentId) => {
	const [financialSummary, setFinancialSummary] = useState(null);
	const [loading, setLoading] = useState(true);

	const fetchData = async () => {
		setLoading(true);
		const res = await fetchFinancialSummary(studentId);
		if (res.status) {
			setFinancialSummary(res.data || null);
		} else {
			toast.error(res || "حدث خطأ ما أثناء جلب الملخص المالي");
			setFinancialSummary(null);
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [studentId]);

	return { financialSummary, loading, setFinancialSummary, refetch: fetchData };
};
