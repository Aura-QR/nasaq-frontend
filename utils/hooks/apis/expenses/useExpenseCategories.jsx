import { fetchExpenseCategories } from "@/APIs/expenses";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useExpenseCategories = () => {
	const [categories, setCategories] = useState([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			const res = await fetchExpenseCategories();
			if (res.status) {
				setCategories(res.data || []);
			} else {
				toast.error(res || "حدث خطأ ما أثناء جلب تصنيفات المصروفات");
				setCategories([]);
			}
			setLoading(false);
		};

		fetchData();
	}, []);

	return { categories, loading, setCategories };
};
