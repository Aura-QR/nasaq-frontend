import {
  ArrowBackRounded,
  EmailOutlined,
  LockOutlined,
  VisibilityOffOutlined,
  VisibilityOutlined,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useAuthUser,
  useIsAuthenticated,
  useSignIn,
} from "react-auth-kit";

import {
  useNavigate,
} from "react-router-dom";

import {
  useForm,
} from "react-hook-form";

import {
  toast,
} from "react-toastify";

import {
  loginRequest,
} from "@/APIs/auth/login";

import AuthLayout, {
  AuthField,
  authColors,
} from "../Auth/AuthLayout";

const ROLE_HOME_PATHS = {
  SUPER_ADMIN:
    "/platform/dashboard",

  OWNER:
    "/users/students",

  SUPERVISOR:
    "/users/students",

  MANAGER:
    "/users/students",

  TEACHER:
    "/teacher/dashboard",

  STUDENT:
    "/student-dashboard",
};

const FULL_ACCESS_ROLES = [
  "OWNER",
  "SUPERVISOR",
];

const normalizeRole = (role) =>
  String(role || "")
    .trim()
    .toUpperCase();

const PERMISSION_OPERATION_MAP = {
  read: "read",
  view: "read",
  add: "create",
  create: "create",
  edit: "update",
  update: "update",
  delete: "delete",
  remove: "delete",
  manage: "manage",
};

const PERMISSION_WRAPPER_KEYS = new Set([
  "data",
  "result",
  "payload",
  "response",
  "permissions",
  "permission",
  "items",
  "docs",
  "records",
  "defaults",
  "roles",
  "modules",
  "allowedpermissions",
  "managerpermissions",
]);

const addPermissionString = (
  value,
  output
) => {
  const permission =
    String(value || "").trim();

  if (!permission) {
    return;
  }

  // Full access / already-normalized permission.
  if (
    permission === "*" ||
    permission.startsWith(
      "school."
    )
  ) {
    output.add(permission);
    return;
  }

  /*
   * Backward-compatible flat permission format returned by /admin/login:
   *
   * students.read
   * students.add
   * students.edit
   *
   * Normalize it to the current frontend/backend catalog:
   *
   * school.students.read
   * school.students.create
   * school.students.update
   */
  const parts =
    permission.split(".");

  if (parts.length === 2) {
    const [
      moduleName,
      rawOperation,
    ] = parts;

    const operation =
      PERMISSION_OPERATION_MAP[
        String(
          rawOperation || ""
        ).toLowerCase()
      ] || rawOperation;

    if (
      moduleName &&
      operation
    ) {
      output.add(
        `school.${moduleName}.${operation}`
      );
    }
  }
};

const collectPermissionStrings = (
  value,
  output = new Set(),
  currentModule = ""
) => {
  if (typeof value === "string") {
    addPermissionString(
      value,
      output
    );

    return output;
  }

  if (Array.isArray(value)) {
    value.forEach((item) => {
      collectPermissionStrings(
        item,
        output,
        currentModule
      );
    });

    return output;
  }

  if (
    !value ||
    typeof value !== "object"
  ) {
    return output;
  }

  Object.entries(value).forEach(
    ([rawKey, item]) => {
      const key =
        String(rawKey || "").trim();

      const lowerKey =
        key.toLowerCase();

      /*
       * Example:
       * {
       *   "school.students.read": true
       * }
       */
      if (
        (
          key === "*" ||
          key.startsWith(
            "school."
          )
        ) &&
        item === true
      ) {
        addPermissionString(
          key,
          output
        );
      }

      /*
       * Example:
       * {
       *   permission: "school.students.read"
       * }
       *
       * Also supports:
       * {
       *   key: "school.students.read"
       * }
       */
      if (typeof item === "string") {
        addPermissionString(
          item,
          output
        );
      }

      /*
       * Backward-compatible nested format:
       * {
       *   students: {
       *     read: true,
       *     add: true
       *   }
       * }
       */
      const normalizedOperation =
        PERMISSION_OPERATION_MAP[
          lowerKey
        ];

      if (
        normalizedOperation &&
        item === true &&
        currentModule
      ) {
        output.add(
          `school.${currentModule}.${normalizedOperation}`
        );
      }

      if (
        item &&
        typeof item === "object"
      ) {
        const isWrapper =
          PERMISSION_WRAPPER_KEYS.has(
            lowerKey
          ) ||
          [
            "role",
            "rolename",
            "rolecode",
            "name",
            "key",
            "_id",
            "id",
          ].includes(lowerKey);

        let nextModule =
          currentModule;

        if (
          !isWrapper &&
          !normalizedOperation &&
          !key.startsWith(
            "school."
          )
        ) {
          nextModule =
            lowerKey;
        }

        if (
          key.startsWith(
            "school."
          )
        ) {
          const parts =
            key.split(".");

          nextModule =
            parts[1] ||
            currentModule;
        }

        collectPermissionStrings(
          item,
          output,
          nextModule
        );
      }
    }
  );

  return output;
};

const normalizePermissions = (
  permissions,
  role
) => {
  const normalized =
    Array.from(
      collectPermissionStrings(
        permissions
      )
    );

  if (
    normalized.length > 0
  ) {
    return normalized;
  }

  if (
    FULL_ACCESS_ROLES.includes(
      role
    )
  ) {
    return ["*"];
  }

  return [];
};


const LOGIN_CONTAINER_KEYS = [
  "data",
  "result",
  "payload",
  "response",
];

const LOGIN_USER_KEYS = [
  "user",
  "profile",
  "account",
  "admin",
  "platformAdmin",
  "teacher",
  "student",
];

const getLoginObjects = (source) => {
  const objects = [];
  const queue = [source];
  const visited = new Set();

  while (queue.length && objects.length < 16) {
    const current = queue.shift();

    if (
      !current ||
      typeof current !== "object" ||
      Array.isArray(current) ||
      visited.has(current)
    ) {
      continue;
    }

    visited.add(current);
    objects.push(current);

    LOGIN_CONTAINER_KEYS.forEach((key) => {
      const child = current?.[key];

      if (
        child &&
        typeof child === "object" &&
        !Array.isArray(child)
      ) {
        queue.push(child);
      }
    });
  }

  return objects;
};

const getFirstLoginValue = (
  objects,
  keys
) => {
  for (const object of objects) {
    for (const key of keys) {
      const value = object?.[key];

      if (
        value !== undefined &&
        value !== null &&
        value !== ""
      ) {
        return value;
      }
    }
  }

  return null;
};


const getFirstNonEmptyPermissions = (
  ...candidates
) => {
  for (const candidate of candidates) {
    if (
      Array.isArray(candidate) &&
      candidate.length > 0
    ) {
      return candidate;
    }

    if (
      typeof candidate === "string" &&
      candidate.trim()
    ) {
      return candidate;
    }

    if (
      candidate &&
      typeof candidate === "object" &&
      !Array.isArray(candidate) &&
      Object.keys(candidate).length > 0
    ) {
      return candidate;
    }
  }

  return null;
};

const decodeJwtPayload = (token) => {
  try {
    const payloadPart = String(token || "").split(".")[1];

    if (!payloadPart) {
      return null;
    }

    const normalized = payloadPart
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(
        Math.ceil(payloadPart.length / 4) * 4,
        "="
      );

    const decoded = decodeURIComponent(
      window
        .atob(normalized)
        .split("")
        .map(
          (character) =>
            `%${character
              .charCodeAt(0)
              .toString(16)
              .padStart(2, "0")}`
        )
        .join("")
    );

    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const extractLoginSession = (response) => {
  const objects = getLoginObjects(response);

  const token = getFirstLoginValue(objects, [
    "accessToken",
    "access_token",
    "token",
    "jwt",
    "jwtToken",
  ]);

  const tokenPayload = decodeJwtPayload(token);

  let rawUser = null;

  for (const object of objects) {
    for (const key of LOGIN_USER_KEYS) {
      const possibleUser = object?.[key];

      if (
        possibleUser &&
        typeof possibleUser === "object" &&
        !Array.isArray(possibleUser)
      ) {
        rawUser = possibleUser;
        break;
      }
    }

    if (rawUser) {
      break;
    }
  }

  const role = normalizeRole(
    rawUser?.role ||
      getFirstLoginValue(objects, ["role"]) ||
      tokenPayload?.role
  );

  const schoolId =
    rawUser?.schoolId ||
    getFirstLoginValue(objects, ["schoolId"]) ||
    tokenPayload?.schoolId ||
    null;

  const rawPermissions =
    getFirstNonEmptyPermissions(
      // MANAGER permissions are commonly returned under managerPermissions.
      // Prefer them so an empty `permissions: []` does not hide the real grants.
      rawUser?.managerPermissions,
      rawUser?.permissions,
      getFirstLoginValue(
        objects,
        ["managerPermissions"]
      ),
      getFirstLoginValue(
        objects,
        ["permissions"]
      ),
      tokenPayload?.managerPermissions,
      tokenPayload?.permissions
    );

  const permissions = normalizePermissions(
    rawPermissions,
    role
  );

  const fallbackUser =
    tokenPayload && typeof tokenPayload === "object"
      ? tokenPayload
      : null;

  const user =
    rawUser || fallbackUser
      ? {
          ...(fallbackUser || {}),
          ...(rawUser || {}),
          role,
          schoolId,
          permissions,
        }
      : null;

  return {
    token,
    user,
    role,
    schoolId,
    permissions,
  };
};

const Login = () => {
  const navigate =
    useNavigate();

  const signIn =
    useSignIn();

  const isAuthenticated =
    useIsAuthenticated();

  const getAuthUser =
    useAuthUser();

  const [loading, setLoading] =
    useState(false);

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    rememberMe,
    setRememberMe,
  ] = useState(true);

  const {
    register,
    handleSubmit,

    formState: {
      errors,
    },
  } = useForm({
    defaultValues: {
      identifier: "",
      password: "",
    },
  });

  const navigateByRole =
    useCallback(
      (rawRole) => {
        const role =
          normalizeRole(rawRole);

        const destination =
          ROLE_HOME_PATHS[role];

        if (!destination) {
          toast.error(
            "نوع الحساب غير مدعوم في لوحة الدخول الحالية"
          );

          return;
        }

        navigate(destination, {
          replace: true,
        });
      },

      [navigate]
    );

  useEffect(() => {
    const authError =
      sessionStorage.getItem(
        "authError"
      );

    if (authError) {
      toast.info(authError);

      sessionStorage.removeItem(
        "authError"
      );
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      return;
    }

    const authState =
      getAuthUser();

    const currentUser =
      authState?.user ||
      authState;

    const role =
      currentUser?.role ||
      authState?.role ||
      localStorage.getItem(
        "role"
      );

    if (!role) {
      return;
    }

    navigateByRole(role);
  }, [
    getAuthUser,
    isAuthenticated,
    navigateByRole,
  ]);

  const onSubmit = async (
    data
  ) => {
    try {
      setLoading(true);

      const response =
        await loginRequest(
          data.identifier,
          data.password
        );

      if (
        response?.status ===
        false
      ) {
        toast.error(
          response?.message ||
            "البيانات غير صحيحة، يرجى المحاولة مرة أخرى"
        );

        return;
      }

      const {
        token,
        user,
        role,
        schoolId,
        permissions,
      } = extractLoginSession(
        response
      );

      if (
        !token ||
        !user ||
        !role
      ) {
        console.error(
          "Incomplete login response:",
          response
        );

        toast.error(
          "استجابة تسجيل الدخول من الخادم غير مكتملة"
        );

        return;
      }

      const signedIn =
        signIn({
          token,

          /*
           * react-auth-kit يستخدم
           * expiresIn بالدقائق.
           */
          expiresIn: rememberMe
            ? 60 * 24 * 30
            : 600,

          tokenType:
            "Bearer",

          authState: {
            user,
            role,
            schoolId,
            permissions,
          },
        });

      if (!signedIn) {
        toast.error(
          "تعذر حفظ جلسة تسجيل الدخول"
        );

        return;
      }

      localStorage.setItem(
        "user",
        JSON.stringify(user)
      );

      localStorage.setItem(
        "role",
        role
      );

      localStorage.setItem(
        "permissions",
        JSON.stringify(
          permissions
        )
      );

      if (schoolId) {
        localStorage.setItem(
          "schoolId",
          schoolId
        );
      } else {
        localStorage.removeItem(
          "schoolId"
        );
      }

      toast.success(
        "تم تسجيل الدخول بنجاح"
      );

      navigateByRole(role);
    } catch (error) {
      console.error(
        "Login error:",
        error
      );

      toast.error(
        error?.response?.data
          ?.message ||
          error?.message ||
          "حدث خطأ أثناء تسجيل الدخول، حاول مرة أخرى"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      activeMode="login"
      title="مرحبًا بك في نَسّق"
      description="سجّل الدخول وابدأ تنظيم يومك الدراسي والوصول إلى حصصك وخططك."
    >
      <Box
        component="form"
        noValidate
        onSubmit={handleSubmit(
          onSubmit
        )}
      >
        <Stack spacing={2.2}>
          <AuthField
            label="البريد الإلكتروني أو اسم المستخدم"
            type="text"
            placeholder="name@example.com أو username"
            autoComplete="username"
            icon={
              <EmailOutlined />
            }
            error={
              errors.identifier
                ?.message
            }
            registration={register(
              "identifier",
              {
                required:
                  "البريد الإلكتروني أو اسم المستخدم مطلوب",

                minLength: {
                  value: 3,

                  message:
                    "أدخل 3 أحرف على الأقل",
                },
              }
            )}
          />

          <AuthField
            label="كلمة المرور"
            type={
              showPassword
                ? "text"
                : "password"
            }
            placeholder="أدخل كلمة المرور"
            autoComplete="current-password"
            icon={
              <LockOutlined />
            }
            error={
              errors.password
                ?.message
            }
            registration={register(
              "password",
              {
                required:
                  "كلمة المرور مطلوبة",

                minLength: {
                  value: 6,

                  message:
                    "كلمة المرور يجب ألا تقل عن 6 أحرف",
                },
              }
            )}
            endAdornment={
              <IconButton
                type="button"
                size="small"
                onClick={() =>
                  setShowPassword(
                    (previous) =>
                      !previous
                  )
                }
                aria-label="إظهار أو إخفاء كلمة المرور"
                sx={{
                  color:
                    authColors.navyLight,
                }}
              >
                {showPassword ? (
                  <VisibilityOffOutlined fontSize="small" />
                ) : (
                  <VisibilityOutlined fontSize="small" />
                )}
              </IconButton>
            }
          />
        </Stack>

        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{
            mt: 1.5,
          }}
        >
          <Stack
            direction="row"
            spacing={0.5}
            alignItems="center"
          >
            <Checkbox
              size="small"
              checked={rememberMe}
              onChange={(event) =>
                setRememberMe(
                  event.target.checked
                )
              }
              inputProps={{
                "aria-label":
                  "تذكر تسجيل الدخول",
              }}
              sx={{
                p: 0.4,

                color:
                  authColors.gold,

                "&.Mui-checked": {
                  color:
                    authColors.goldDark,
                },
              }}
            />

            <Typography
              sx={{
                color:
                  authColors.muted,

                fontSize:
                  "11px",
              }}
            >
              تذكرني
            </Typography>
          </Stack>

          <Button
            type="button"
            sx={{
              p: 0,
              minWidth: 0,

              color:
                authColors.navy,

              fontSize:
                "11px",

              fontWeight: 700,

              textTransform:
                "none",

              "&:hover": {
                color:
                  authColors.goldDark,

                backgroundColor:
                  "transparent",
              },
            }}
          >
            نسيت كلمة المرور؟
          </Button>
        </Stack>

        <Button
          fullWidth
          type="submit"
          disabled={loading}
          sx={{
            minHeight: 58,
            mt: 3,
            px: 2,

            borderRadius:
              "15px",

            color:
              authColors.goldSoft,

            background: `linear-gradient(
              135deg,
              ${authColors.navyLight} 0%,
              ${authColors.navyDark} 100%
            )`,

            boxShadow:
              "0 15px 32px rgba(7,22,41,0.24)",

            textTransform:
              "none",

            transition:
              "transform 0.2s ease, box-shadow 0.2s ease",

            "&:hover": {
              transform:
                "translateY(-2px)",

              boxShadow:
                "0 19px 38px rgba(7,22,41,0.30)",

              background: `linear-gradient(
                135deg,
                ${authColors.navy} 0%,
                ${authColors.navyDark} 100%
              )`,
            },

            "&:disabled": {
              color:
                "rgba(255,255,255,0.8)",

              background:
                "#8893A1",
            },
          }}
        >
          {loading ? (
            <CircularProgress
              size={23}
              sx={{
                color:
                  authColors.goldSoft,
              }}
            />
          ) : (
            <Box
              sx={{
                width: "100%",

                display:
                  "flex",

                alignItems:
                  "center",

                justifyContent:
                  "space-between",
              }}
            >
              <Typography
                sx={{
                  flex: 1,

                  fontSize:
                    "15px",

                  fontWeight:
                    800,
                }}
              >
                تسجيل الدخول
              </Typography>

              <Box
                sx={{
                  width: 38,
                  height: 38,

                  display:
                    "grid",

                  placeItems:
                    "center",

                  borderRadius:
                    "50%",

                  border: `1px solid ${authColors.gold}`,

                  color:
                    authColors.gold,

                  "& svg": {
                    fontSize:
                      20,
                  },
                }}
              >
                <ArrowBackRounded />
              </Box>
            </Box>
          )}
        </Button>
      </Box>
    </AuthLayout>
  );
};

export default Login;
