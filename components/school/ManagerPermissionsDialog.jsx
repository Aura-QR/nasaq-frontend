import {
  CloseRounded,
  SaveRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

const getPermissionLabel = (
  permission
) => {
  const labels = {
    students: "الطلاب",
    teachers: "المعلمون",
    classes: "الفصول",
    subjects: "المواد",
    attendance: "الحضور",
    lectures: "الحصص",
    exams: "الاختبارات",
    gradesCriteria:
      "معايير الدرجات",
    projects: "المشاريع",
    preparation: "التحضير",
    library: "المكتبة",
    financial: "المالية",
    expenses: "المصروفات",
    managers: "المديرون",
    analytics: "التقارير",
    settings: "الإعدادات",
  };

  const actions = {
    read: "عرض",
    create: "إضافة",
    add: "إضافة",
    update: "تعديل",
    edit: "تعديل",
    delete: "حذف",
    manage: "إدارة",
  };

  const parts =
    String(
      permission || ""
    ).split(".");

  return `${
    labels[parts[1]] ||
    parts[1] ||
    permission
  }${
    parts[2]
      ? ` — ${
          actions[
            parts[2]
          ] || parts[2]
        }`
      : ""
  }`;
};

const ManagerPermissionsDialog =
  ({
    open,
    manager,
    permissions = [],
    loading = false,
    onClose,
    onSave,
  }) => {
    const [
      selected,
      setSelected,
    ] = useState([]);

    useEffect(() => {
      if (!open) {
        return;
      }

      const currentPermissions =
        Array.isArray(
          manager?.permissions
        )
          ? manager.permissions
          : Array.isArray(
              manager?.managerPermissions
            )
          ? manager.managerPermissions
          : [];

      setSelected(
        currentPermissions
      );
    }, [
      open,
      manager,
    ]);

    const availablePermissions =
      useMemo(
        () =>
          Array.from(
            new Set([
              ...permissions,
              ...selected,
            ])
          ).sort(),
        [
          permissions,
          selected,
        ]
      );

    const togglePermission =
      (permission) => {
        setSelected(
          (previous) =>
            previous.includes(
              permission
            )
              ? previous.filter(
                  (item) =>
                    item !==
                    permission
                )
              : [
                  ...previous,
                  permission,
                ]
        );
      };

    return (
      <Dialog
        open={open}
        onClose={
          loading
            ? undefined
            : onClose
        }
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius:
              "20px",

            fontFamily:
              "Tajawal, Arial, sans-serif",
          },
        }}
      >
        <DialogTitle
          sx={{
            px: 2.5,
            py: 1.7,

            display:
              "flex",

            alignItems:
              "center",

            justifyContent:
              "space-between",

            color:
              "#122f4d",

            borderBottom:
              "1px solid #ded8cd",

            fontSize:
              "16px",

            fontWeight:
              800,
          }}
        >
          تعديل صلاحيات المدير

          <IconButton
            onClick={onClose}
            disabled={loading}
          >
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent
          sx={{
            px: 2.5,
            py:
              "22px !important",
          }}
        >
          <Typography
            sx={{
              color:
                "#122f4d",

              fontSize:
                "12px",

              fontWeight:
                800,
            }}
          >
            {manager?.username ||
              manager?.name ||
              manager?.email ||
              "المدير"}
          </Typography>

          <Typography
            sx={{
              mt: 0.35,

              color:
                "#7e8791",

              fontSize:
                "8.5px",
            }}
          >
            حدد العمليات التي يمكن لهذا المدير تنفيذها.
          </Typography>

          <Box
            sx={{
              mt: 1.5,

              display:
                "grid",

              gridTemplateColumns:
                {
                  xs: "1fr",
                  sm:
                    "repeat(2,minmax(0,1fr))",
                  md:
                    "repeat(3,minmax(0,1fr))",
                },

              gap: 0.75,
            }}
          >
            {availablePermissions.map(
              (
                permission
              ) => (
                <FormControlLabel
                  key={
                    permission
                  }
                  control={
                    <Checkbox
                      checked={selected.includes(
                        permission
                      )}
                      onChange={() =>
                        togglePermission(
                          permission
                        )
                      }
                      size="small"
                    />
                  }
                  label={getPermissionLabel(
                    permission
                  )}
                  sx={{
                    m: 0,
                    p: 0.8,

                    borderRadius:
                      "11px",

                    backgroundColor:
                      "#fffcf7",

                    border:
                      "1px solid #ded8cd",

                    "& .MuiFormControlLabel-label":
                      {
                        color:
                          "#193754",

                        fontSize:
                          "8.5px",

                        fontWeight:
                          700,
                      },
                  }}
                />
              )
            )}
          </Box>

          {!availablePermissions.length && (
            <Typography
              sx={{
                mt: 2,

                color:
                  "#7e8791",

                fontSize:
                  "9px",
              }}
            >
              لا توجد صلاحيات متاحة حاليًا.
            </Typography>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            px: 2.5,
            py: 1.5,

            gap: 0.8,

            borderTop:
              "1px solid #ded8cd",
          }}
        >
          <Button
            onClick={onClose}
            disabled={loading}
          >
            إلغاء
          </Button>

          <Button
            onClick={() =>
              onSave?.(
                selected
              )
            }
            disabled={loading}
            startIcon={
              loading ? (
                <CircularProgress
                  size={16}
                  sx={{
                    color:
                      "inherit",
                  }}
                />
              ) : (
                <SaveRounded />
              )
            }
            sx={{
              color:
                "#ffffff",

              backgroundColor:
                "#244a70",

              "&:hover": {
                backgroundColor:
                  "#1b3d61",
              },
            }}
          >
            حفظ الصلاحيات
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

export default ManagerPermissionsDialog;
