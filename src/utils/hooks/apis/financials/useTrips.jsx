import { fetchTrips } from "@/APIs/financials/trips";
import { fetchMyTripsOverview } from "@/APIs/financials/financialRecords";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

export const useTrips = (studentId) => {
	const [trips, setTrips] = useState([]);
	const [loading, setLoading] = useState(true);

	const fetchData = async () => {
		if (!studentId) {
			setTrips([]);
			setLoading(false);
			return;
		}

		setLoading(true);
		const res = await fetchTrips(studentId);
		if (res.status) {
			setTrips(res.data || []);
		} else {
			toast.error(res || "حدث خطأ ما أثناء جلب الرحلات");
			setTrips([]);
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [studentId]);

	return { trips, loading, setTrips, refetch: fetchData };
};

export const useMyTripsOverview = () => {
	const [allTrips, setAllTrips] = useState([]);
	const [enrolledTrips, setEnrolledTrips] = useState([]);
	const [loading, setLoading] = useState(true);

	const fetchData = async () => {
		setLoading(true);
		const res = await fetchMyTripsOverview();
		if (res.status) {
			setAllTrips(res.data?.allTrips || []);
			setEnrolledTrips(res.data?.enrolledTrips || []);
		} else {
			toast.error(res || "حدث خطأ ما أثناء جلب بيانات الرحلات");
			setAllTrips([]);
			setEnrolledTrips([]);
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchData();
	}, []);

	return {
		allTrips,
		enrolledTrips,
		loading,
		setAllTrips,
		setEnrolledTrips,
		refetch: fetchData,
	};
};
