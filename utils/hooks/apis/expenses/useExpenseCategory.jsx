import { fetchExpenseCategory } from "@/APIs/expenses";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useExpenseCategory = (id) => {
	const [category, setCategory] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!id) return;
		const fetchData = async () => {
			setLoading(true);
			const res = await fetchExpenseCategory(id);
			if (res.status) {
				setCategory(res.data);
			} else {
				toast.error(res || "حدث خطأ ما أثناء جلب التصنيف");
			}
			setLoading(false);
		};

		fetchData();
	}, [id]);

	return { category, loading };
};
