import { fetchDiscounts } from "@/APIs/financials/discounts";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useDiscounts = () => {
	const [discounts, setDiscounts] = useState([]);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			const res = await fetchDiscounts();
			if (res.status) {
				setDiscounts(res.data || []);
			} else {
				toast.error(res || "حدث خطأ ما أثناء جلب الخصومات");
				setDiscounts([]);
			}
			setLoading(false);
		};

		fetchData();
	}, []);

	return { discounts, loading, setDiscounts };
};
