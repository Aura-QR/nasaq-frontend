import { fetchMyFinancialRecord } from "@/APIs/financials/financialRecords";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useMyFinancialRecord = () => {
	const [financialRecord, setFinancialRecord] = useState(null);
	const [loading, setLoading] = useState(true);

	const fetchData = async () => {
		setLoading(true);
		const res = await fetchMyFinancialRecord();
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
	}, []);

	return { financialRecord, loading, setFinancialRecord, refetch: fetchData };
};
