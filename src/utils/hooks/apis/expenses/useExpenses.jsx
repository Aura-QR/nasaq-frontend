import { fetchExpenses } from "@/APIs/expenses";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

export const useExpenses = (filters = {}) => {
	const [expenses, setExpenses] = useState([]);
	const [loading, setLoading] = useState(false);
	const [pagination, setPagination] = useState(null);
	const [reloadKey, setReloadKey] = useState(0);

	const filterString = useMemo(() => JSON.stringify(filters), [filters]);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			const res = await fetchExpenses(filters);
			if (res.status) {
				setExpenses(res.data || []);
				setPagination(res.pagination);
			} else {
				toast.error(res || "حدث خطأ ما أثناء جلب المصروفات");
				setExpenses([]);
				setPagination(null);
			}
			setLoading(false);
		};

		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filterString, reloadKey]);

	const refetch = () => setReloadKey((prev) => prev + 1);

	return { expenses, loading, pagination, setExpenses, refetch };
};
