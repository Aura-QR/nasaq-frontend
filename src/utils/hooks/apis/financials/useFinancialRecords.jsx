import { fetchFinancialRecords } from "@/APIs/financials/financialRecords";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

export const useFinancialRecords = (filters = {}) => {
	const [financialRecords, setFinancialRecords] = useState([]);
	const [loading, setLoading] = useState(false);
	const [pagination, setPagination] = useState(null);
	const [reloadKey, setReloadKey] = useState(0);

	const filterString = useMemo(() => JSON.stringify(filters), [filters]);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			const res = await fetchFinancialRecords(filters);
			if (res.status) {
				setFinancialRecords(res.data || []);
				setPagination(res.pagination);
			} else {
				toast.error(res || "حدث خطأ ما أثناء جلب مصاريف الطلاب");
				setFinancialRecords([]);
				setPagination(null);
			}
			setLoading(false);
		};

		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filterString, reloadKey]);

	const refetch = () => setReloadKey((prev) => prev + 1);

	return { financialRecords, loading, pagination, setPagination, refetch };
};
