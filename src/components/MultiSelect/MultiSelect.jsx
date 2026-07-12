import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useState } from "react";

// Register is the imported register from useForm (using Controller for multi-select)
// Error : error={errors?.categories?.message || (error?.categories && error?.categories[0])}
// data : is data need to be listed
// registerName : Name Of Register
// Label : Is The Input Label
// Required Is True or False
// Name : is the name of the value in the object
// onChange: to handle the dynamic select
// disabled: lock the select until certain action
// defaultValue: array of selected values

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
      width: 250,
    },
  },
};

function getStyles(value, selectedValues, theme) {
  return {
    fontWeight: selectedValues.includes(value)
      ? theme.typography.fontWeightMedium
      : theme.typography.fontWeightRegular,
  };
}

const MultiSelect = ({
  register,
  error,
  data,
  registerName,
  label,
  required,
  name,
  onChange,
  disabled,
  placeholder = "اختر الفصول",
  selectedValues,
  setSelectedValues
}) => {
  const theme = useTheme();
  const [changed, setChanged] = useState(false);
  
  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    const newValue = typeof value === "string" ? value.split(",") : value;
    
    setSelectedValues(newValue);
    setChanged(true);
    
    if (onChange) {
      onChange(newValue);
    }
  };

  return (
    <Stack alignItems={"start"} spacing={4}>
      <Typography variant="subtitle" color={"text.secondary"} fontWeight={500}>
        {label} {required && <span style={{ color: "red" }}>*</span>}
      </Typography>

      <TextField
        {...register(registerName, {
          required: required && "This Field Is Required",
        })}
        fullWidth
        select
        SelectProps={{
          multiple: true,
          displayEmpty: true,
          value: selectedValues,
          onChange: handleChange,
          renderValue: (selected) => {
            if (selected.length === 0) {
              return (
                <Typography color="text.secondary" sx={{ opacity: 0.6 }}>
                  {placeholder}
                </Typography>
              );
            }
            
            // Join selected items with comma
            const displayItems = selected.map((value) => {
              const item = data?.find((d) => 
                name ? (d._id || d.id) === value : d === value
              );
              return name && item ? item[name] : value;
            });
            
            return displayItems.join(", ");
          },
          MenuProps: MenuProps,
        }}
        disabled={disabled}
        error={error && !changed ? true : false}
        color="primary"
        sx={{
          borderRadius: "8px !important",
          border: "1px solid",
          borderColor: "primary.border",
          bgcolor: "#eceff9",
        }}
      >
        {data &&
          data.map((item) => {
            const value = name ? item._id || item.id : item;
            const displayText = name ? item[name] : item;
            
            return (
              <MenuItem
                key={value}
                value={value}
                style={getStyles(value, selectedValues, theme)}
              >
                {displayText}
              </MenuItem>
            );
          })}
      </TextField>

      {error && (
        <Stack direction={"row"} alignItems={"center"} spacing={4}>
          <ErrorOutlineIcon sx={{ color: "red" }} />
          <Typography color={"red"} fontSize={"14px"} fontWeight={"500"}>
            {error}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
};

export default MultiSelect;