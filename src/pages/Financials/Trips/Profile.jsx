import {
  DeleteOutlineRounded,
  LuggageRounded,
  PaymentsRounded,
  ReceiptLongRounded,
  UndoRounded,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useForm } from "react-hook-form";
import {
  useNavigate,
  useParams,
} from "react-router-dom";
import { toast } from "react-toastify";

import {
  deleteTrip,
  payTripInstallment,
  refundTripInstallment,
} from "@/APIs/financials/trips";

import Back from "@/components/Back/Back";
import Container from "@/components/Container/Container";
import Input from "@/components/Input/Input";
import Loading from "@/components/Loading";

import { useTrip } from "@/utils/hooks/apis/financials/useTrip";
import usePermissions from "@/utils/hooks/usePermissions";

const statusMap = {
  paid: "مدفوعة",
  partial: "جزئية",
  unpaid: "غير مدفوعة",
};

const installmentStatusMap = {
  paid: "مدفوع",
  overdue: "متأخر",
  pending: "قيد الانتظار",
};

const cardSx = {
  border: "1px solid rgba(36,74,112,.08)",
  borderRadius: "18px",
  bgcolor: "rgba(255,255,255,.96)",
  boxShadow: "0 8px 22px rgba(18,47,77,.05)",
};

const formatMoney = (value) =>
  `${Number(value || 0)} ريال`;

const formatDate = (value) => {
  if (!value) return "—";

  return new Date(
    value
  ).toLocaleDateString("en-GB");
};

const SummaryCard = ({
  label,
  value,
  icon,
}) => (
  <Paper
    elevation={0}
    sx={{
      ...cardSx,
      p: 1.35,
      minHeight: 82,
      display: "flex",
      alignItems: "center",
      gap: 1,
    }}
  >
    <Box
      sx={{
        width: 42,
        height: 42,
        flexShrink: 0,
        display: "grid",
        placeItems: "center",
        color:
          "var(--color-gold-dark)",
        bgcolor:
          "var(--color-gold-soft)",
        border:
          "1px solid rgba(211,164,79,.20)",
        borderRadius: "13px",
        "& svg": {
          fontSize: 21,
        },
      }}
    >
      {icon}
    </Box>

    <Box>
      <Typography
        sx={{
          color:
            "var(--color-muted)",
          fontSize: 9.5,
          fontWeight: 700,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          mt: 0.15,
          color:
            "var(--color-navy-deep)",
          fontSize: 17,
          fontWeight: 900,
        }}
      >
        {value}
      </Typography>
    </Box>
  </Paper>
);

const TripProfilePage = () => {
  const { studentId, tripId } =
    useParams();

  const navigate = useNavigate();

  const permissions =
    usePermissions("financial");

  const {
    trip,
    loading,
    refetch,
  } = useTrip(
    studentId,
    tripId
  );

  const [payOpen, setPayOpen] =
    useState(false);

  const [
    refundOpen,
    setRefundOpen,
  ] = useState(false);

  const [
    deleteOpen,
    setDeleteOpen,
  ] = useState(false);

  const [
    selectedInstallment,
    setSelectedInstallment,
  ] = useState(null);

  const [
    actionLoading,
    setActionLoading,
  ] = useState(false);

  const installments =
    useMemo(() => {
      return (
        trip?.installments || []
      ).map((item) => ({
        id:
          item?._id ||
          item?.installmentNumber,

        installmentNumber:
          item?.installmentNumber,

        amountRaw: Number(
          item?.amount || 0
        ),

        paidAmountRaw: Number(
          item?.paidAmount || 0
        ),

        remainingRaw:
          Math.max(
            Number(
              item?.amount || 0
            ) -
              Number(
                item?.paidAmount ||
                  0
              ),
            0
          ),

        amount: formatMoney(
          item?.amount
        ),

        paidAmount:
          formatMoney(
            item?.paidAmount
          ),

        dueDate: formatDate(
          item?.dueDate
        ),

        paymentDate:
          item?.payments?.length >
          0
            ? formatDate(
                item?.payments[
                  item.payments
                    .length - 1
                ]?.paidAt
              )
            : "—",

        statusRaw:
          item?.status,

        status:
          installmentStatusMap[
            item?.status
          ] ||
          "قيد الانتظار",
      }));
    }, [trip?.installments]);

  const handleOpenPay = (
    installment
  ) => {
    setSelectedInstallment(
      installment
    );
    setPayOpen(true);
  };

  const handleClosePay =
    () => {
      setPayOpen(false);
      setSelectedInstallment(
        null
      );
    };

  const handleOpenRefund = (
    installment
  ) => {
    setSelectedInstallment(
      installment
    );
    setRefundOpen(true);
  };

  const handleCloseRefund =
    () => {
      setRefundOpen(false);
      setSelectedInstallment(
        null
      );
    };

  const handlePay = async (
    data
  ) => {
    if (!studentId || !tripId) {
      return;
    }

    setActionLoading(true);

    const payload = {
      installmentNumber:
        Number(
          data.installmentNumber
        ),
      amount: Number(
        data.amount
      ),
      paidAt: data.paidAt,
      notes:
        data.notes ||
        undefined,
    };

    const response =
      await payTripInstallment(
        studentId,
        tripId,
        payload
      );

    if (response.status) {
      toast.success(
        response.message ||
          "تم تسجيل دفعة الرحلة بنجاح"
      );

      handleClosePay();
      await refetch();
    } else {
      toast.error(
        response?.message ||
          response ||
          "حدث خطأ ما أثناء تسجيل دفعة الرحلة"
      );
    }

    setActionLoading(false);
  };

  const handleRefund =
    async (data) => {
      if (
        !studentId ||
        !tripId ||
        !selectedInstallment
      ) {
        return;
      }

      const amount =
        Number(data.amount);

      const reason =
        String(
          data.reason || ""
        ).trim();

      if (
        !Number.isFinite(
          amount
        ) ||
        amount <= 0
      ) {
        toast.error(
          "أدخل مبلغ استرداد صحيح"
        );
        return;
      }

      if (
        amount >
        selectedInstallment
          .paidAmountRaw
      ) {
        toast.error(
          `قيمة الاسترداد لا يمكن أن تتجاوز المدفوع ${formatMoney(
            selectedInstallment
              .paidAmountRaw
          )}`
        );
        return;
      }

      if (!reason) {
        toast.error(
          "سبب التصحيح مطلوب"
        );
        return;
      }

      setActionLoading(true);

      const response =
        await refundTripInstallment(
          studentId,
          tripId,
          selectedInstallment
            .installmentNumber,
          {
            installmentNumber:
              Number(
                selectedInstallment
                  .installmentNumber
              ),
            amount,
            reason,
          }
        );

      if (response?.status) {
        toast.success(
          response.message ||
            "تم تسجيل استرداد دفعة الرحلة بنجاح"
        );

        handleCloseRefund();
        await refetch();
      } else {
        toast.error(
          response?.message ||
            response ||
            "تعذر تسجيل استرداد دفعة الرحلة"
        );
      }

      setActionLoading(false);
    };

  const handleDelete =
    async () => {
      if (
        !studentId ||
        !tripId
      ) {
        return;
      }

      setActionLoading(true);

      const response =
        await deleteTrip(
          studentId,
          tripId
        );

      if (response.status) {
        toast.success(
          response.message ||
            "تم حذف الرحلة بنجاح"
        );

        navigate(
          `/financial/records/${studentId}/trips`
        );
      } else {
        toast.error(
          response ||
            "حدث خطأ ما أثناء حذف الرحلة"
        );
      }

      setActionLoading(false);
    };

  if (loading) {
    return (
      <Container>
        <Loading />
      </Container>
    );
  }

  if (!trip) {
    return (
      <Container>
        <Back title="تفاصيل الرحلة" />

        <Paper
          elevation={0}
          sx={{
            ...cardSx,
            mt: 1.25,
            p: 2,
          }}
        >
          <Typography
            sx={{
              color:
                "var(--color-muted)",
              fontWeight: 700,
            }}
          >
            لا توجد بيانات لهذه الرحلة
          </Typography>
        </Paper>
      </Container>
    );
  }

  const effectiveFee =
    Number(
      trip?.discount
        ? trip?.netFee
        : trip?.fee || 0
    );

  const totalPaid =
    Number(
      trip?.totalPaid || 0
    );

  const remaining =
    Math.max(
      effectiveFee -
        totalPaid,
      0
    );

  const status =
    statusMap[
      trip?.status
    ] || "غير مدفوعة";

  return (
    <Container>
      <Box
        dir="rtl"
        sx={{ pb: 4 }}
      >
        <Back title="تفاصيل الرحلة" />

        <Paper
          elevation={0}
          sx={{
            ...cardSx,
            mt: 1.1,
            mb: 1.15,
            p: {
              xs: 1.5,
              md: 1.8,
            },
            background:
              "linear-gradient(135deg,rgba(255,252,247,.98),rgba(251,240,216,.44))",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            justifyContent="space-between"
            alignItems={{
              xs: "stretch",
              sm: "center",
            }}
            gap={1}
          >
            <Stack
              direction="row"
              alignItems="center"
              gap={1}
            >
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  flexShrink: 0,
                  display: "grid",
                  placeItems: "center",
                  color:
                    "var(--color-gold-dark)",
                  bgcolor:
                    "var(--color-gold-soft)",
                  border:
                    "1px solid rgba(211,164,79,.22)",
                  borderRadius:
                    "14px",
                }}
              >
                <LuggageRounded />
              </Box>

              <Box minWidth={0}>
                <Stack
                  direction="row"
                  alignItems="center"
                  gap={0.7}
                  flexWrap="wrap"
                >
                  <Typography
                    component="h1"
                    sx={{
                      color:
                        "var(--color-navy-deep)",
                      fontSize: {
                        xs: 20,
                        md: 24,
                      },
                      fontWeight: 900,
                    }}
                  >
                    {trip?.name ||
                      "—"}
                  </Typography>

                  <Chip
                    size="small"
                    label={status}
                    sx={{
                      height: 24,
                      fontSize: 9,
                      fontWeight: 900,
                      bgcolor:
                        trip?.status ===
                        "paid"
                          ? "#E7F8F1"
                          : trip?.status ===
                              "partial"
                            ? "#EEF5FF"
                            : "#FDECEC",
                      color:
                        trip?.status ===
                        "paid"
                          ? "#0E9F6E"
                          : trip?.status ===
                              "partial"
                            ? "#1D4ED8"
                            : "#D14343",
                    }}
                  />
                </Stack>

                <Typography
                  sx={{
                    mt: 0.2,
                    color:
                      "var(--color-muted)",
                    fontSize: 10,
                  }}
                >
                  {trip?.description ||
                    "—"}
                </Typography>
              </Box>
            </Stack>

            {permissions?.delete && (
              <Button
                variant="outlined"
                color="error"
                startIcon={
                  <DeleteOutlineRounded />
                }
                onClick={() =>
                  setDeleteOpen(true)
                }
                sx={{
                  minHeight: 40,
                  borderRadius:
                    "11px",
                  fontSize: 10,
                  fontWeight: 900,
                }}
              >
                حذف الرحلة
              </Button>
            )}
          </Stack>
        </Paper>

        <Box
          sx={{
            mb: 1.15,
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3,minmax(0,1fr))",
            },
            gap: 1,
          }}
        >
          <SummaryCard
            label="إجمالي الرسوم"
            value={formatMoney(
              effectiveFee
            )}
            icon={<PaymentsRounded />}
          />

          <SummaryCard
            label="إجمالي المدفوع"
            value={formatMoney(
              totalPaid
            )}
            icon={<ReceiptLongRounded />}
          />

          <SummaryCard
            label="المتبقي"
            value={formatMoney(
              remaining
            )}
            icon={<ReceiptLongRounded />}
          />
        </Box>

        <Paper
          elevation={0}
          sx={{
            ...cardSx,
            p: {
              xs: 1.15,
              md: 1.4,
            },
          }}
        >
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            gap={1}
            sx={{ mb: 1 }}
          >
            <Box>
              <Typography
                sx={{
                  color:
                    "var(--color-navy-deep)",
                  fontSize: 16,
                  fontWeight: 900,
                }}
              >
                أقساط الرحلة
              </Typography>

              <Typography
                sx={{
                  mt: 0.1,
                  color:
                    "var(--color-muted)",
                  fontSize: 9.5,
                }}
              >
                راجع الاستحقاق وسجّل
                الدفعات أو التصحيحات.
              </Typography>
            </Box>

            <Chip
              size="small"
              label={`${installments.length} قسط`}
              sx={{
                bgcolor:
                  "var(--color-gold-soft)",
                color:
                  "var(--color-gold-dark)",
                fontWeight: 900,
                fontSize: 9,
              }}
            />
          </Stack>

          {installments.length ===
          0 ? (
            <Box
              sx={{
                py: 5,
                textAlign: "center",
                border:
                  "1px dashed rgba(36,74,112,.14)",
                borderRadius:
                  "14px",
              }}
            >
              <Typography
                sx={{
                  color:
                    "var(--color-muted)",
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                لا توجد أقساط لعرضها
              </Typography>
            </Box>
          ) : (
            <Box
              sx={{
                overflowX: "auto",
              }}
            >
              <Box
                component="table"
                sx={{
                  width: "100%",
                  minWidth: 820,
                  borderCollapse:
                    "separate",
                  borderSpacing:
                    "0 7px",

                  "& th": {
                    px: 1.2,
                    py: 1.1,
                    bgcolor:
                      "rgba(36,74,112,.045)",
                    color:
                      "var(--color-navy)",
                    fontSize: 9.5,
                    fontWeight: 900,
                    textAlign:
                      "right",
                  },

                  "& td": {
                    px: 1.2,
                    py: 1.05,
                    bgcolor:
                      "rgba(255,255,255,.98)",
                    borderTop:
                      "1px solid rgba(36,74,112,.08)",
                    borderBottom:
                      "1px solid rgba(36,74,112,.08)",
                    color:
                      "var(--color-navy-deep)",
                    fontSize: 10.5,
                  },
                }}
              >
                <thead>
                  <tr>
                    <th>القسط</th>
                    <th>المبلغ</th>
                    <th>المدفوع</th>
                    <th>الاستحقاق</th>
                    <th>تاريخ الدفع</th>
                    <th>الحالة</th>
                    <th>الإجراء</th>
                  </tr>
                </thead>

                <tbody>
                  {installments.map(
                    (item) => (
                      <tr
                        key={item.id}
                      >
                        <td
                          style={{
                            fontWeight:
                              900,
                          }}
                        >
                          #
                          {
                            item.installmentNumber
                          }
                        </td>

                        <td>
                          {item.amount}
                        </td>

                        <td>
                          {
                            item.paidAmount
                          }
                        </td>

                        <td>
                          {
                            item.dueDate
                          }
                        </td>

                        <td>
                          {
                            item.paymentDate
                          }
                        </td>

                        <td>
                          <Chip
                            size="small"
                            label={
                              item.status
                            }
                            sx={{
                              height: 24,
                              fontSize: 9,
                              fontWeight:
                                900,
                              bgcolor:
                                item.statusRaw ===
                                "paid"
                                  ? "#E7F8F1"
                                  : item.statusRaw ===
                                      "overdue"
                                    ? "#FDECEC"
                                    : "#EEF5FF",
                              color:
                                item.statusRaw ===
                                "paid"
                                  ? "#0E9F6E"
                                  : item.statusRaw ===
                                      "overdue"
                                    ? "#D14343"
                                    : "#1D4ED8",
                            }}
                          />
                        </td>

                        <td>
                          {permissions?.edit ? (
                            <Stack
                              direction="row"
                              spacing={0.7}
                              flexWrap="wrap"
                            >
                              {item.statusRaw !==
                                "paid" &&
                                item.remainingRaw >
                                  0 && (
                                  <Button
                                    variant="contained"
                                    onClick={() =>
                                      handleOpenPay(
                                        item
                                      )
                                    }
                                    sx={{
                                      minHeight: 34,
                                      px: 1.5,
                                      borderRadius:
                                        "9px",
                                      fontSize:
                                        9.5,
                                      fontWeight:
                                        900,
                                    }}
                                  >
                                    تسجيل دفعة
                                  </Button>
                                )}

                              {item.paidAmountRaw >
                                0 && (
                                <Button
                                  variant="outlined"
                                  color="error"
                                  startIcon={
                                    <UndoRounded />
                                  }
                                  onClick={() =>
                                    handleOpenRefund(
                                      item
                                    )
                                  }
                                  sx={{
                                    minHeight: 34,
                                    px: 1.5,
                                    borderRadius:
                                      "9px",
                                    fontSize:
                                      9.5,
                                    fontWeight:
                                      900,
                                  }}
                                >
                                  تصحيح دفعة
                                </Button>
                              )}

                              {item.statusRaw ===
                                "paid" &&
                                item.paidAmountRaw <=
                                  0 &&
                                "—"}
                            </Stack>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </Box>
            </Box>
          )}
        </Paper>

        <PayTripDialog
          open={payOpen}
          onClose={handleClosePay}
          installment={
            selectedInstallment
          }
          onSubmit={handlePay}
          loading={actionLoading}
        />

        <RefundTripDialog
          open={refundOpen}
          onClose={
            handleCloseRefund
          }
          installment={
            selectedInstallment
          }
          onSubmit={handleRefund}
          loading={actionLoading}
        />

        <ConfirmDeleteDialog
          open={deleteOpen}
          onClose={() =>
            setDeleteOpen(false)
          }
          onConfirm={
            handleDelete
          }
          loading={actionLoading}
        />
      </Box>
    </Container>
  );
};

const PayTripDialog = ({
  open,
  onClose,
  installment,
  onSubmit,
  loading,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (installment) {
      reset({
        installmentNumber:
          installment.installmentNumber,
        amount:
          installment.remainingRaw,
        paidAt:
          new Date()
            .toISOString()
            .slice(0, 10),
        notes: "",
      });
    }
  }, [installment, reset]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          overflow: "hidden",
          borderRadius: "20px",
          bgcolor:
            "var(--color-cream)",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2.2,
          pt: 2,
          pb: 1,
          color:
            "var(--color-navy-deep)",
          fontSize: 17,
          fontWeight: 900,
        }}
      >
        تسجيل دفعة الرحلة
      </DialogTitle>

      <DialogContent
        sx={{
          px: 2.2,
          pt: "8px !important",
          pb: 1.5,
        }}
      >
        <input
          type="hidden"
          {...register(
            "installmentNumber",
            {
              required: true,
              valueAsNumber:
                true,
            }
          )}
        />

        <Stack spacing={1.25}>
          <TextField
            fullWidth
            type="number"
            label="المبلغ المدفوع"
            error={Boolean(
              errors.amount
            )}
            helperText={
              errors.amount
                ?.message ||
              `المتبقي على القسط: ${
                installment?.remainingRaw ||
                0
              } ريال`
            }
            inputProps={{
              min: 1,
              max:
                installment?.remainingRaw ||
                undefined,
              step: "any",
            }}
            {...register(
              "amount",
              {
                required:
                  "أدخل مبلغ الدفعة",
                valueAsNumber:
                  true,
                min: {
                  value: 1,
                  message:
                    "المبلغ يجب أن يكون أكبر من صفر",
                },
                max: {
                  value:
                    installment?.remainingRaw ||
                    Number.MAX_SAFE_INTEGER,
                  message: `أقصى مبلغ متاح هو ${
                    installment?.remainingRaw ||
                    0
                  } ريال`,
                },
              }
            )}
          />

          <Input
            register={register}
            registerName="paidAt"
            error={
              errors.paidAt
                ?.message
            }
            label="تاريخ الدفع"
            required
            type="date"
          />
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.2,
          pb: 2,
          pt: 1,
          gap: 1,
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          sx={{
            minHeight: 38,
            borderRadius: "10px",
            fontWeight: 800,
          }}
        >
          إلغاء
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit(
            onSubmit
          )}
          disabled={
            loading ||
            !installment?.remainingRaw
          }
          sx={{
            minHeight: 38,
            px: 2.5,
            borderRadius: "10px",
            fontWeight: 900,
          }}
        >
          تسجيل الدفع
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const RefundTripDialog = ({
  open,
  onClose,
  installment,
  onSubmit,
  loading,
}) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (installment) {
      reset({
        amount:
          installment.paidAmountRaw,
        reason: "",
      });
    }
  }, [installment, reset]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          overflow: "hidden",
          borderRadius: "20px",
          bgcolor:
            "var(--color-cream)",
        },
      }}
    >
      <DialogTitle
        sx={{
          px: 2.2,
          pt: 2,
          pb: 1,
          color:
            "var(--color-navy-deep)",
          fontSize: 17,
          fontWeight: 900,
        }}
      >
        تصحيح / استرداد دفعة الرحلة
      </DialogTitle>

      <DialogContent
        sx={{
          px: 2.2,
          pt: "8px !important",
          pb: 1.5,
        }}
      >
        <Stack spacing={1.25}>
          <TextField
            fullWidth
            type="number"
            label="مبلغ الاسترداد"
            error={Boolean(
              errors.amount
            )}
            helperText={
              errors.amount
                ?.message ||
              `أقصى مبلغ متاح: ${
                installment?.paidAmountRaw ||
                0
              } ريال`
            }
            inputProps={{
              min: 1,
              max:
                installment?.paidAmountRaw ||
                undefined,
              step: "any",
            }}
            {...register(
              "amount",
              {
                required:
                  "أدخل مبلغ الاسترداد",
                valueAsNumber:
                  true,
                min: {
                  value: 1,
                  message:
                    "المبلغ يجب أن يكون أكبر من صفر",
                },
                max: {
                  value:
                    installment?.paidAmountRaw ||
                    Number.MAX_SAFE_INTEGER,
                  message: `أقصى مبلغ متاح هو ${
                    installment?.paidAmountRaw ||
                    0
                  } ريال`,
                },
              }
            )}
          />

          <Input
            register={register}
            registerName="reason"
            error={
              errors.reason
                ?.message
            }
            label="سبب التصحيح"
            required
            multiline
            rows={3}
          />
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          px: 2.2,
          pb: 2,
          pt: 1,
          gap: 1,
        }}
      >
        <Button
          variant="outlined"
          onClick={onClose}
          disabled={loading}
          sx={{
            minHeight: 38,
            borderRadius: "10px",
            fontWeight: 800,
          }}
        >
          إلغاء
        </Button>

        <Button
          variant="contained"
          color="error"
          onClick={handleSubmit(
            onSubmit
          )}
          disabled={
            loading ||
            !installment?.paidAmountRaw
          }
          sx={{
            minHeight: 38,
            px: 2.5,
            borderRadius: "10px",
            fontWeight: 900,
          }}
        >
          تسجيل الاسترداد
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const ConfirmDeleteDialog = ({
  open,
  onClose,
  onConfirm,
  loading,
}) => (
  <Dialog
    open={open}
    onClose={onClose}
    fullWidth
    maxWidth="xs"
    PaperProps={{
      sx: {
        overflow: "hidden",
        borderRadius: "20px",
        bgcolor:
          "var(--color-cream)",
      },
    }}
  >
    <DialogTitle
      sx={{
        px: 2.2,
        pt: 2,
        pb: 1,
        color:
          "var(--color-navy-deep)",
        fontSize: 17,
        fontWeight: 900,
      }}
    >
      حذف الرحلة
    </DialogTitle>

    <DialogContent
      sx={{
        px: 2.2,
        pt: "8px !important",
      }}
    >
      <Typography
        sx={{
          color:
            "var(--color-navy)",
          fontSize: 11,
        }}
      >
        هل أنت متأكد من حذف هذه
        الرحلة؟
      </Typography>
    </DialogContent>

    <DialogActions
      sx={{
        px: 2.2,
        pb: 2,
        gap: 1,
      }}
    >
      <Button
        variant="outlined"
        onClick={onClose}
        disabled={loading}
        sx={{
          borderRadius: "10px",
          fontWeight: 800,
        }}
      >
        إلغاء
      </Button>

      <Button
        variant="contained"
        color="error"
        onClick={onConfirm}
        disabled={loading}
        sx={{
          borderRadius: "10px",
          fontWeight: 900,
        }}
      >
        تأكيد
      </Button>
    </DialogActions>
  </Dialog>
);

export default TripProfilePage;
