import { fetchBusCandidates, fetchBusList, fetchBusRecord, fetchMyBusRecord } from "@/APIs/financials/bus";
import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";

export const useBus = (studentId) => {
	const [busRecord, setBusRecord] = useState(null);
	const [loading, setLoading] = useState(true);

	const fetchData = async () => {
		if (!studentId) {
			setBusRecord(null);
			setLoading(false);
			return;
		}

		setLoading(true);
		const res = await fetchBusRecord(studentId);
		if (res.status) {
			setBusRecord(res.data || null);
		} else {
			toast.error(res || "حدث خطأ ما أثناء جلب بيانات الباص");
			setBusRecord(null);
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [studentId]);

	return { busRecord, loading, setBusRecord, refetch: fetchData };
};

export const useMyBus = () => {
	const [busRecord, setBusRecord] = useState(null);
	const [loading, setLoading] = useState(true);

	const fetchData = async () => {
		setLoading(true);
		const res = await fetchMyBusRecord();
		if (res.status) {
			setBusRecord(res.data || null);
		} else {
			toast.error(res || "حدث خطأ ما أثناء جلب بيانات الباص");
			setBusRecord(null);
		}
		setLoading(false);
	};

	useEffect(() => {
		fetchData();
	}, []);

	return { busRecord, loading, setBusRecord, refetch: fetchData };
};

export const useBusList = (filters = {}) => {
	const [busRecords, setBusRecords] = useState([]);
	const [loading, setLoading] = useState(false);
	const [pagination, setPagination] = useState(null);
	const [reloadKey, setReloadKey] = useState(0);

	const filterString = useMemo(() => JSON.stringify(filters), [filters]);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			const res = await fetchBusList(filters);
			if (res.status) {
				setBusRecords(res.data || []);
				setPagination(
					res.totalDocs !== undefined && res.totalPages !== undefined
						? { totalDocs: res.totalDocs, totalPages: res.totalPages }
						: null,
				);
			} else {
				toast.error(res || "حدث خطأ ما أثناء جلب قائمة الباص");
				setBusRecords([]);
				setPagination(null);
			}
			setLoading(false);
		};

		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filterString, reloadKey]);

	const refetch = () => setReloadKey((prev) => prev + 1);

	return { busRecords, loading, pagination, setPagination, refetch };
};

export const useBusCandidates = (filters = {}) => {
	const [candidates, setCandidates] = useState([]);
	const [loading, setLoading] = useState(false);
	const [reloadKey, setReloadKey] = useState(0);

	const filterString = useMemo(() => JSON.stringify(filters), [filters]);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);
			const res = await fetchBusCandidates(filters);
			if (res.status) {
				setCandidates(res.data || []);
			} else {
				toast.error(res || "حدث خطأ ما أثناء جلب الطلاب المتاحين للباص");
				setCandidates([]);
			}
			setLoading(false);
		};

		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [filterString, reloadKey]);

	const refetch = () => setReloadKey((prev) => prev + 1);

	return { candidates, loading, refetch };
};
