import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  Stack,
  Typography,
} from "@mui/material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

const ENTITY_LABELS = {
  students: "الطلاب",
  teachers: "المعلمون",
  classes: "الفصول",
  subjects: "المواد",
  lectures: "الحصص",
  library: "المكتبة",
  attendance: "الحضور",
  gradesCriteria: "معايير الدرجات",
  exams: "الاختبارات",
  projects: "المشاريع",
  grades: "الدرجات",
  preparation: "التحضير",
  financial: "المالية",
  financialSettings: "إعدادات المالية",
  expenses: "المصروفات",
  managers: "المديرون",
  analytics: "التقارير",
  settings: "الإعدادات",
};

const ACTION_LABELS = {
  read: "عرض",
  add: "إضافة",
  edit: "تعديل",
  delete: "حذف",
};

const clonePermissions = (
  value
) => {
  if (
    !value ||
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).map(
      ([entity, actions]) => [
        entity,
        {
          ...(actions &&
          typeof actions ===
            "object" &&
          !Array.isArray(actions)
            ? actions
            : {}),
        },
      ]
    )
  );
};

const SchoolRolePermissionsDialog = ({
  open,
  title = "صلاحيات المساعدين الإداريين",
  permissions = {},
  loading = false,
  saving = false,
  onClose,
  onSave,
}) => {
  const [draft, setDraft] =
    useState({});

  useEffect(() => {
    if (!open) return;

    setDraft(
      clonePermissions(
        permissions
      )
    );
  }, [open, permissions]);

  const entities = useMemo(
    () =>
      Object.entries(draft),
    [draft]
  );

  const toggle = (
    entity,
    action
  ) => {
    setDraft((current) => ({
      ...current,
      [entity]: {
        ...(current[entity] || {}),
        [action]: !Boolean(
          current?.[entity]?.[
            action
          ]
        ),
      },
    }));
  };

  return (
    <Dialog
      open={open}
      onClose={
        saving ? undefined : onClose
      }
      fullWidth
      maxWidth="md"
      dir="rtl"
      PaperProps={{
        sx: {
          borderRadius: "18px",
          border:
            "1px solid #DED8CD",
        },
      }}
    >
      <DialogTitle
        sx={{
          color: "#122F4D",
          fontWeight: 900,
        }}
      >
        {title}
      </DialogTitle>

      <DialogContent dividers>
        <Alert
          severity="info"
          sx={{
            mb: 1.5,
            borderRadius: "12px",
            fontSize: "12px",
          }}
        >
          هذه الصلاحيات موحّدة لكل حسابات المساعد الإداري في المدرسة. أي تعديل هنا يطبّق على الجميع بعد تسجيل الدخول من جديد.
        </Alert>

        {loading ? (
          <Box
            sx={{
              minHeight: 220,
              display: "grid",
              placeItems: "center",
            }}
          >
            <CircularProgress />
          </Box>
        ) : !entities.length ? (
          <Alert
            severity="warning"
            sx={{
              borderRadius: "12px",
            }}
          >
            لم يرجع الخادم إعدادات صلاحيات MANAGER بعد.
          </Alert>
        ) : (
          <Stack spacing={1}>
            {entities.map(
              ([entity, actions]) => (
                <Box
                  key={entity}
                  sx={{
                    p: 1.3,
                    borderRadius:
                      "13px",
                    border:
                      "1px solid #E5E0D7",
                    bgcolor: "#FFFCF7",
                  }}
                >
                  <Typography
                    sx={{
                      mb: 0.8,
                      color: "#193754",
                      fontSize: "12px",
                      fontWeight: 900,
                    }}
                  >
                    {ENTITY_LABELS[
                      entity
                    ] || entity}
                  </Typography>

                  <Stack
                    direction="row"
                    gap={0.6}
                    flexWrap="wrap"
                  >
                    {Object.keys(
                      actions || {}
                    ).map((action) => (
                      <FormControlLabel
                        key={`${entity}-${action}`}
                        control={
                          <Checkbox
                            size="small"
                            checked={Boolean(
                              actions?.[
                                action
                              ]
                            )}
                            onChange={() =>
                              toggle(
                                entity,
                                action
                              )
                            }
                          />
                        }
                        label={
                          ACTION_LABELS[
                            action
                          ] || action
                        }
                        sx={{
                          m: 0,
                          px: 0.7,
                          py: 0.15,
                          borderRadius:
                            "9px",
                          bgcolor: "#FFFFFF",
                          border:
                            "1px solid #E2E7EB",
                          "& .MuiFormControlLabel-label": {
                            color:
                              "#315E88",
                            fontSize:
                              "10px",
                            fontWeight: 800,
                          },
                        }}
                      />
                    ))}
                  </Stack>
                </Box>
              )
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{ p: 2, gap: 0.8 }}
      >
        <Button
          onClick={onClose}
          disabled={saving}
          sx={{
            color: "#315E88",
            fontWeight: 800,
          }}
        >
          إلغاء
        </Button>

        <Button
          variant="contained"
          onClick={() =>
            onSave?.(
              clonePermissions(
                draft
              )
            )
          }
          disabled={
            loading ||
            saving ||
            !entities.length
          }
          sx={{
            minWidth: 140,
            borderRadius: "10px",
            bgcolor: "#244A70",
            boxShadow: "none",
            fontWeight: 900,
            "&:hover": {
              bgcolor: "#122F4D",
              boxShadow: "none",
            },
          }}
        >
          {saving
            ? "جاري الحفظ..."
            : "حفظ الصلاحيات"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SchoolRolePermissionsDialog;
