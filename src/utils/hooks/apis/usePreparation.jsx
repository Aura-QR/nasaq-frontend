import { fetchSinglePreparation } from "@/APIs/school/preparation";
import {
  useState,
  useEffect,
} from "react";
import { toast } from "react-toastify";

export const usePreparation = (
  preparationId
) => {
  const [
    preparation,
    setPreparation,
  ] = useState(null);

  const [loading, setLoading] =
    useState(false);

  useEffect(() => {
    let active = true;

    if (!preparationId) {
      setPreparation(null);
      setLoading(false);

      return () => {
        active = false;
      };
    }

    const fetchData = async () => {
      setLoading(true);

      try {
        const res =
          await fetchSinglePreparation(
            preparationId
          );

        if (!active) {
          return;
        }

        if (res?.status) {
          setPreparation(
            res?.data || null
          );

          return;
        }

        toast.error(
          res?.message ||
            "حدث خطأ ما أثناء جلب التحضير"
        );

        setPreparation(null);
      } catch (error) {
        if (!active) {
          return;
        }

        toast.error(
          error?.response?.data
            ?.message ||
            error?.message ||
            "حدث خطأ ما أثناء جلب التحضير"
        );

        setPreparation(null);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      active = false;
    };
  }, [preparationId]);

  return {
    preparation,
    loading,
  };
};