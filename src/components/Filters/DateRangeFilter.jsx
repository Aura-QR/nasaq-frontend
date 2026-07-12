import { TextField, Box } from "@mui/material";
import { useRef, useEffect } from "react";
import flatpickr from "flatpickr";
import { Arabic } from "flatpickr/dist/l10n/ar.js";
import "flatpickr/dist/flatpickr.min.css";

const DateRangeFilter = ({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange,
  startLabel = "من تاريخ...",
  endLabel = "إلى تاريخ..."
}) => {
  const startInputRef = useRef(null);
  const endInputRef = useRef(null);
  const startPickerRef = useRef(null);
  const endPickerRef = useRef(null);

  useEffect(() => {
    if (startInputRef.current) {
      startPickerRef.current = flatpickr(startInputRef.current, {
        locale: Arabic,
        dateFormat: "Y-m-d",
        defaultDate: startDate || null,
        maxDate: endDate || null,
        onChange: (selectedDates, dateStr) => {
          onStartDateChange(dateStr);
        },
      });
    }

    if (endInputRef.current) {
      endPickerRef.current = flatpickr(endInputRef.current, {
        locale: Arabic,
        dateFormat: "Y-m-d",
        defaultDate: endDate || null,
        minDate: startDate || null,
        onChange: (selectedDates, dateStr) => {
          onEndDateChange(dateStr);
        },
      });
    }

    return () => {
      if (startPickerRef.current) startPickerRef.current.destroy();
      if (endPickerRef.current) endPickerRef.current.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (startPickerRef.current) {
      startPickerRef.current.set("maxDate", endDate || null);
    }
  }, [endDate]);

  useEffect(() => {
    if (endPickerRef.current) {
      endPickerRef.current.set("minDate", startDate || null);
    }
  }, [startDate]);

  return (
    <Box sx={{ display: "flex", gap: 6, width: "100%" }}>
      <TextField
        inputRef={startInputRef}
        InputLabelProps={{ shrink: true }}
        sx={{
          borderRadius: "8px !important",
          border: "1px solid",
          borderColor: "primary.border",
          bgcolor: "#eceff9",
          width: "100%",
        }}
        placeholder={startLabel}
      />

      <TextField
        inputRef={endInputRef}
        InputLabelProps={{ shrink: true }}
        sx={{
          borderRadius: "8px !important",
          border: "1px solid",
          borderColor: "primary.border",
          bgcolor: "#eceff9",
          width: "100%",
        }}
        placeholder={endLabel}
      />
    </Box>
  );
};

export default DateRangeFilter;
