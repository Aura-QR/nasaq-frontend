import { TextField, InputAdornment, MenuItem } from "@mui/material";

const SelectFilter = ({ 
  value, 
  onChange, 
  label, 
  options = [], 
  icon: Icon,
  allLabel = "الكل",
  disabled = false,
}) => {
  return (
    <TextField 
      select 
      sx={{ 
        borderRadius: "8px !important",
        border: "1px solid",
        borderColor: "primary.border",
        bgcolor: "#eceff9",
        width: "100%" ,
      }} 
      label={label}
      disabled={disabled}
      InputProps={{ 
        startAdornment: Icon && (
          <InputAdornment position="start">
            <Icon color={value && "primary"} />
          </InputAdornment>
        ) 
      }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {allLabel && <MenuItem value="">{allLabel}</MenuItem>}
      {options.map((item, i) => (
        <MenuItem key={i} value={item.value}>
          {item.label}
        </MenuItem>
      ))}
    </TextField>
  );
};

export default SelectFilter;