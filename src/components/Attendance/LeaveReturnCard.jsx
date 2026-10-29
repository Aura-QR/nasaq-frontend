import { Alert, Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { KeyboardReturnRounded } from "@mui/icons-material";
import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";

import { requestBrowserLocation } from "@/utils/geolocation";

const clock = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("ar-SA-u-ca-gregory", { hour: "2-digit", minute: "2-digit" });
};

const listOf = (response) => {
  const data = response?.data ?? response;
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

/**
 * Today's approved استئذان, and the button to record coming back.
 *
 * loadLeaves() returns the person's approved leave requests for today;
 * submitReturn(location) records the return. Shown only when there is one.
 */
const LeaveReturnCard = ({ loadLeaves, submitReturn, onReturned, refreshKey }) => {
  const [leave, setLeave] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const response = await loadLeaves();
    if (response?.status === false) return;
    const approved = listOf(response).find((item) => item?.status === "approved");
    setLeave(approved || null);
  }, [loadLeaves]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  if (!leave) return null;

  const record = async () => {
    setBusy(true);
    try {
      const location = await requestBrowserLocation();
      const response = await submitReturn(location);
      if (response?.status === false) {
        toast.error(response?.message || "تعذر تسجيل العودة من الاستئذان");
        return;
      }
      toast.success("تم تسجيل عودتك من الاستئذان، وأُبلغت الإدارة");
      await load();
      onReturned?.();
    } catch (error) {
      toast.error(error?.message || "تعذر تحديد موقعك");
    } finally {
      setBusy(false);
    }
  };

  if (leave.returnedAt) {
    return (
      <Alert severity="success" sx={{ mt: 1.5, borderRadius: "13px", fontWeight: 700 }}>
        سُجّلت عودتك من الاستئذان الساعة {clock(leave.returnedAt)}
        {leave.departedAt ? ` (خرجت الساعة ${clock(leave.departedAt)})` : ""}.
      </Alert>
    );
  }

  return (
    <Box sx={{ mt: 1.5, p: 1.5, borderRadius: "13px", border: "1px solid #E8C96F", backgroundColor: "#FFF9E8" }}>
      <Typography sx={{ fontWeight: 900, fontSize: 14 }}>لديك استئذان معتمد اليوم</Typography>
      <Typography sx={{ fontSize: 13, color: "#5b6670", mt: 0.3, mb: 1.2 }}>
        الانصراف الساعة {leave.leaveAt}
        {leave.reason ? ` — ${leave.reason}` : ""}. إذا عدت إلى المدرسة فسجّل عودتك من موقع المدرسة لتُبلَّغ الإدارة.
      </Typography>
      <Stack direction="row">
        <Button
          variant="contained"
          onClick={record}
          disabled={busy}
          startIcon={busy ? <CircularProgress size={16} color="inherit" /> : <KeyboardReturnRounded />}
          sx={{ borderRadius: "11px", fontWeight: 900, backgroundColor: "#244A70", boxShadow: "none" }}
        >
          {busy ? "جارٍ تسجيل العودة" : "تسجيل العودة من الاستئذان"}
        </Button>
      </Stack>
    </Box>
  );
};

export default LeaveReturnCard;
