import { fetchExpense } from "@/APIs/expenses";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useExpense = (id) => {
	const [expense, setExpense] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!id) return;
		const fetchData = async () => {
			setLoading(true);
			const res = await fetchExpense(id);
			if (res.status) {
				setExpense(res.data);
			} else {
				toast.error(res || "حدث خطأ ما أثناء جلب المصروف");
			}
			setLoading(false);
		};

		fetchData();
	}, [id]);

	return { expense, loading };
};
