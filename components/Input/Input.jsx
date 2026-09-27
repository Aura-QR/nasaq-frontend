import {
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

import { useRef, useState } from "react";

const HiddenEyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      fill="currentColor"
      d="M9.47 15.28c-.19 0-.38-.07-.53-.22A4.305 4.305 0 017.67 12c0-2.39 1.94-4.33 4.33-4.33 1.15 0 2.24.45 3.06 1.27a.75.75 0 010 1.06L10 15.06c-.15.15-.34.22-.53.22zM12 9.17a2.834 2.834 0 00-2.46 4.23l3.86-3.86c-.42-.24-.9-.37-1.4-.37z"
    />
    <path
      fill="currentColor"
      d="M5.6 18.51c-.17 0-.35-.06-.49-.18-1.07-.91-2.03-2.03-2.85-3.33-1.06-1.65-1.06-4.34 0-6C4.7 5.18 8.25 2.98 12 2.98c2.2 0 4.37.76 6.27 2.19a.75.75 0 01-.9 1.2c-1.64-1.24-3.5-1.89-5.37-1.89-3.23 0-6.32 1.94-8.48 5.33-.75 1.17-.75 3.21 0 4.38s1.61 2.18 2.56 3c.31.27.35.74.08 1.06-.14.17-.35.26-.56.26zM12 21.02c-1.33 0-2.63-.27-3.88-.8a.75.75 0 01-.4-.98c.16-.38.6-.56.98-.4 1.06.45 2.17.68 3.29.68 3.23 0 6.32-1.94 8.48-5.33.75-1.17.75-3.21 0-4.38-.31-.49-.65-.96-1.01-1.4a.76.76 0 01.11-1.06.75.75 0 011.06.11c.39.48.77 1 1.11 1.54 1.06 1.65 1.06 4.34 0 6-2.44 3.82-5.99 6.02-9.74 6.02z"
    />
    <path
      fill="currentColor"
      d="M12.69 16.27c-.35 0-.67-.25-.74-.61-.08-.41.19-.8.6-.87 1.1-.2 2.02-1.12 2.22-2.22.08-.41.47-.67.88-.6.41.08.68.47.6.88-.32 1.73-1.7 3.1-3.42 3.42-.05-.01-.09 0-.14 0zM2 22.75c-.19 0-.38-.07-.53-.22a.754.754 0 010-1.06L8.94 14c.29-.29.77-.29 1.06 0 .29.29.29.77 0 1.06l-7.47 7.47c-.15.15-.34.22-.53.22zM14.53 10.22c-.19 0-.38-.07-.53-.22a.754.754 0 010-1.06l7.47-7.47c.29-.29.77-.29 1.06 0 .29.29.29.77 0 1.06L15.06 10c-.15.15-.34.22-.53.22z"
    />
  </svg>
);

const VisibleEyeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="22"
    height="22"
    fill="none"
    viewBox="0 0 24 24"
  >
    <path
      fill="currentColor"
      d="M12 16.33c-2.39 0-4.33-1.94-4.33-4.33S9.61 7.67 12 7.67s4.33 1.94 4.33 4.33-1.94 4.33-4.33 4.33zm0-7.16c-1.56 0-2.83 1.27-2.83 2.83s1.27 2.83 2.83 2.83 2.83-1.27 2.83-2.83S13.56 9.17 12 9.17z"
    />
    <path
      fill="currentColor"
      d="M12 21.02c-3.76 0-7.31-2.2-9.75-6.02-1.06-1.65-1.06-4.34 0-6 2.45-3.82 6-6.02 9.75-6.02s7.3 2.2 9.74 6.02c1.06 1.65 1.06 4.34 0 6-2.44 3.82-5.99 6.02-9.74 6.02zm0-16.54c-3.23 0-6.32 1.94-8.48 5.33-.75 1.17-.75 3.21 0 4.38 2.16 3.39 5.25 5.33 8.48 5.33 3.23 0 6.32-1.94 8.48-5.33.75-1.17.75-3.21 0-4.38-2.16-3.39-5.25-5.33-8.48-5.33z"
    />
  </svg>
);

const Input = ({
  label,
  required,
  error,
  registerName,
  register,
  type = "text",
  defaultValue,
  multiline = false,
  valueAsNumber = false,
  autoComplete,
  placeholder,
  rows = 4,
  minRows,
  maxRows,
  sx,
  inputProps,
}) => {
  const [visible, setVisible] = useState(false);
  const inputRef = useRef(null);

  const isPassword = type === "password";
  const isDate = type === "date";

  const openPicker = () => {
    if (inputRef.current?.showPicker && isDate) {
      inputRef.current.showPicker();
    }
  };

  const validationRules = {
    required: required ? "This Field Is Required" : false,
    valueAsNumber,
  };

  if (type === "email") {
    validationRules.pattern = {
      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
      message: "Please enter a valid email",
    };
  }

  if (isPassword) {
    validationRules.pattern = {
      value: /^(?=.*[a-z])(?=.*\d).{8,}$/,
      message:
        "Password must contain at least one lowercase letter and one number",
    };

    validationRules.minLength = {
      value: 8,
      message: "Password must contain at least 8 characters",
    };

    validationRules.maxLength = {
      value: 16,
      message: "Password must contain max 16 characters",
    };
  }

  return (
    <Stack
      alignItems="stretch"
      spacing={1}
      width="100%"
    >
      <Typography
        variant="subtitle"
        color="text.secondary"
        fontWeight={500}
      >
        {label}
        {required && (
          <span style={{ color: "red" }}> *</span>
        )}
      </Typography>

      <Stack
        width="100%"
        position="relative"
      >
        <TextField
          inputRef={inputRef}
          onClick={openPicker}
          defaultValue={defaultValue || ""}
          type={isPassword && visible ? "text" : type}
          {...register(registerName, validationRules)}
          fullWidth
          error={Boolean(error)}
          color="primary"
          multiline={multiline}
          rows={multiline && !minRows ? rows : undefined}
          minRows={multiline ? minRows : undefined}
          maxRows={multiline ? maxRows : undefined}
          autoComplete={
            autoComplete ||
            (isPassword ? "new-password" : undefined)
          }
          placeholder={placeholder}
          inputProps={{
            ...(isDate && {
              dir: "ltr",
              style: {
                textAlign: "right",
              },
            }),
            ...inputProps,
          }}
          sx={[
            {
              borderRadius: "8px !important",
              border: "1px solid",
              borderColor: "primary.border",
              bgcolor: "#eceff9",

              /*
               * نحجز مساحة ثابتة لأيقونة إظهار كلمة المرور
               * حتى لا تختفي النقط تحت الأيقونة.
               */
              ...(isPassword && {
                "& .MuiInputBase-input": {
                  paddingRight: "54px !important",
                  paddingLeft: "14px !important",
                },

                "& input[type='password']::-ms-reveal, & input[type='password']::-ms-clear":
                  {
                    display: "none",
                  },

                "& input[type='password']::-webkit-credentials-auto-fill-button, & input[type='password']::-webkit-contacts-auto-fill-button":
                  {
                    visibility: "hidden",
                    display: "none !important",
                    pointerEvents: "none",
                  },
              }),
            },
            sx,
          ]}
        />

        {isPassword && (
          <IconButton
            type="button"
            aria-label={
              visible
                ? "إخفاء كلمة المرور"
                : "إظهار كلمة المرور"
            }
            onClick={() =>
              setVisible((previous) => !previous)
            }
            onMouseDown={(event) =>
              event.preventDefault()
            }
            sx={{
              position: "absolute",
              right: 9,
              top: "50%",
              zIndex: 2,

              width: 34,
              height: 34,

              color: "#7F7C87",
              borderRadius: "9px",

              transform: "translateY(-50%)",

              "&:hover": {
                color: "var(--color-navy, #244a70)",
                backgroundColor: "rgba(36, 74, 112, 0.07)",
              },
            }}
          >
            {visible ? (
              <VisibleEyeIcon />
            ) : (
              <HiddenEyeIcon />
            )}
          </IconButton>
        )}
      </Stack>

      {error && (
        <Stack
          direction="row"
          alignItems="center"
          spacing={0.7}
        >
          <ErrorOutlineIcon
            sx={{
              color: "red",
              fontSize: 18,
            }}
          />

          <Typography
            color="red"
            fontSize="12px"
            fontWeight={500}
          >
            {error}
          </Typography>
        </Stack>
      )}
    </Stack>
  );
};

export default Input;
