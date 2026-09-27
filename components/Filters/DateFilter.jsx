import { TextField, InputAdornment } from "@mui/material";
import { DateRange } from "@mui/icons-material";
import { useRef } from "react";

const DateFilter = ({ value, onChange, label = "التاريخ..." }) => {
  const inputRef = useRef(null);

  const openPicker = () => {
    if (inputRef.current?.showPicker) {
      inputRef.current.showPicker(); // Open the native date picker
    }
  };

  return (
    <TextField
      type="date"
      inputRef={inputRef}
      onClick={openPicker}      // open when clicking field
      InputLabelProps={{ shrink: true }} // keep label visible
      sx={{
        borderRadius: "8px !important",
        border: "1px solid",
        borderColor: "primary.border",
        bgcolor: "#eceff9",
        width: "100%",
      }}
      label={label}
      InputProps={{
        startAdornment: (
          <InputAdornment position="start" onClick={openPicker} style={{ cursor: "pointer" }}>
            <DateRange color={value ? "primary" : "inherit"} />
          </InputAdornment>
        ),
      }}
      inputProps={{
        dir: "rtl",
        lang: "ar-SA", // Arabic locale
      }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default DateFilter;
