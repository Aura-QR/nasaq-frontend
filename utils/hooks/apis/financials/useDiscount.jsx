import { fetchSingleDiscount } from "@/APIs/financials/discounts";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useDiscount = (discountId) => {
	const [discount, setDiscount] = useState(null);
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (!discountId) {
			setDiscount(null);
			return;
		}

		const fetchData = async () => {
			setLoading(true);
			const res = await fetchSingleDiscount(discountId);
			if (res.status) {
				setDiscount(res.data);
			} else {
				toast.error(res || "حدث خطأ ما أثناء جلب الخصم");
				setDiscount(null);
			}
			setLoading(false);
		};

		fetchData();
	}, [discountId]);

	return { discount, loading };
};
