import { fetchTrip } from "@/APIs/financials/trips";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useTrip = (studentId, tripId) => {
	const [trip, setTrip] = useState(null);
	const [loading, setLoading] = useState(true);

	const fetchData = async () => {
		if (!studentId || !tripId) {
			setTrip(null);
			setLoading(false);
			return;
		}

		setLoading(true);
		const res = await fetchTrip(studentId, tripId);
		if (res.status) {
			setTrip(res.data || null);
		} else {
			toast.error(res || "حدث خطأ ما أثناء جلب بيانات الرحلة");
			setTrip(null);
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [studentId, tripId]);

	return { trip, loading, setTrip, refetch: fetchData };
};
