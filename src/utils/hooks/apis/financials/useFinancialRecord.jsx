import { fetchSingleFinancialRecord } from "@/APIs/financials/financialRecords";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useFinancialRecord = (studentId) => {
	const [financialRecord, setFinancialRecord] = useState(null);
	const [loading, setLoading] = useState(true);

	const fetchData = async () => {
		if (!studentId) {
			setFinancialRecord(null);
			setLoading(false);
			return;
		}

		setLoading(true);
		const res = await fetchSingleFinancialRecord(studentId);
		if (res.status) {
			setFinancialRecord(res.data || null);
		} else {
			toast.error(res || "حدث خطأ ما أثناء جلب مصاريف الطالب");
			setFinancialRecord(null);
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [studentId]);

	return { financialRecord, loading, setFinancialRecord, refetch: fetchData };
};
