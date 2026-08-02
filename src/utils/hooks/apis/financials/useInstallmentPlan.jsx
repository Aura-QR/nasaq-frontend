import {
  useEffect,
  useState,
} from "react";
import { toast } from "react-toastify";

import { fetchSingleInstallmentPlan } from "@/APIs/financials/installmentPlans";

const planCache = new Map();
const pendingRequests = new Map();

const normalizeId = (
  value
) => {
  if (!value) return "";

  if (
    typeof value === "object"
  ) {
    return (
      value._id ||
      value.id ||
      ""
    );
  }

  const id =
    String(value).trim();

  return id === "null"
    ? ""
    : id;
};

const extractPlan = (
  response
) => {
  if (
    !response ||
    response?.status === false
  ) {
    return {
      status: false,
      message:
        response?.message ||
        "تعذر تحميل خطة التقسيط",
      plan: null,
    };
  }

  const plan =
    response?.data?.data ??
    response?.data ??
    response;

  return {
    status: Boolean(
      plan &&
        typeof plan ===
          "object"
    ),
    plan:
      plan &&
      typeof plan ===
        "object"
        ? plan
        : null,
    message:
      "خطة التقسيط غير موجودة",
  };
};

const loadPlan = (
  planId
) => {
  if (
    planCache.has(planId)
  ) {
    return Promise.resolve(
      planCache.get(planId)
    );
  }

  if (
    pendingRequests.has(planId)
  ) {
    return pendingRequests.get(
      planId
    );
  }

  const request =
    fetchSingleInstallmentPlan(
      planId
    )
      .then(extractPlan)
      .then((result) => {
        if (result.status) {
          planCache.set(
            planId,
            result
          );
        }

        return result;
      })
      .finally(() => {
        pendingRequests.delete(
          planId
        );
      });

  pendingRequests.set(
    planId,
    request
  );

  return request;
};

export const useInstallmentPlan = (
  installmentPlanId
) => {
  const planId =
    normalizeId(
      installmentPlanId
    );

  const [
    installmentPlan,
    setInstallmentPlan,
  ] = useState(null);

  const [loading, setLoading] =
    useState(Boolean(planId));

  useEffect(() => {
    let active = true;

    if (!planId) {
      setInstallmentPlan(null);
      setLoading(false);

      return () => {
        active = false;
      };
    }

    const fetchData =
      async () => {
        setLoading(true);

        const result =
          await loadPlan(planId);

        if (!active) return;

        if (!result.status) {
          toast.error(
            result.message,
            {
              toastId:
                `installment-plan-${planId}`,
            }
          );

          setInstallmentPlan(
            null
          );

          setLoading(false);
          return;
        }

        setInstallmentPlan(
          result.plan
        );

        setLoading(false);
      };

    fetchData();

    return () => {
      active = false;
    };
  }, [planId]);

  return {
    installmentPlan,
    loading,
  };
};
