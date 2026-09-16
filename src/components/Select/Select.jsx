import { MenuItem, Stack, TextField, Typography } from "@mui/material";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useEffect, useState } from "react";
// Register is the imported register from useForm
// Error : error={errors?.city?.message || (error?.city && error?.city[0])} |||| Errors => from useForm , Error => respond
// data : is data need to be listed
// registerName : Name Of Register
// Label : Is The Input Label
// Required Is True or False
// Name : is the name of the value in the object
//onChange: to handle the dynamic select
//disabled: lock the select until certain action
const Select = ({
  register,
  error,
  data,
  registerName,
  label,
  required,
  name,
  defaultValue,
  onChange,
  disabled, // Added disabled prop
  defaultSelect="لا يوجد",
}) => {
  const [changed, setChanged] = useState(false);

  /*
   * The value follows `defaultValue` for the life of the field, not only on
   * the first render.
   *
   * It used to be an uncontrolled select: a value arriving later — the active
   * academic year once the list loads, or a class cleared because the year
   * changed — never reached the screen. The student edit form showed a class
   * the form no longer held, so saving sent nothing and still reported
   * success, and the class stayed as it was.
   */
  const [value, setValue] = useState(defaultValue ?? "");

  useEffect(() => {
    setValue(defaultValue ?? "");
  }, [defaultValue]);

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
        disabled={disabled} // Added disabled prop
        error={error && !changed ? true : false}
        color="primary"
        sx={{
          borderRadius: "8px !important",
          border: "1px solid",
          borderColor: "primary.border",
          bgcolor: "#eceff9",
        }}
        value={value}
        onChange={(e) => {
          setValue(e.target.value ?? "");
          setChanged(true);
          if (onChange) {
            onChange(e.target.value);
          }
        }}
      >
        {!required && <MenuItem key={0} value="">{defaultSelect}</MenuItem>}
        {data &&
          data.map((item) => {
            return (
              <MenuItem
                value={name ? item._id || item.id : item}
                key={name ? item._id || item.id : item}
              >
                {name ? item[name] : item}
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

export default Select;
