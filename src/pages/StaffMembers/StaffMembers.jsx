import { useCallback, useEffect, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions,
  DialogContent, DialogTitle, IconButton, InputAdornment, Paper, Stack,
  TextField, Tooltip, Typography,
} from "@mui/material";
import {
  AddRounded, BadgeRounded, ContentCopyRounded, DeleteOutlineRounded,
  EditRounded, KeyRounded, RefreshRounded, ShuffleRounded,
} from "@mui/icons-material";
import { toast } from "react-toastify";
import Container from "@/components/Container/Container";
import {
  createStaffMember, deleteStaffMember, fetchStaffMembers, updateStaffMember,
} from "@/APIs/school/staffMembers";

/*
 * موظفو الخدمات — a guard, a cleaner, a driver.
 *
 * They keep the school's hours and sign in only to record their own
 * attendance. The owner adds them here and hands over a username and
 * password; most have no email, so "forgot password" cannot reach them and
 * a new password is set from this screen instead.
 */

const JOB_SUGGESTIONS = ["حارس", "بوّاب", "عامل نظافة", "سائق", "مراسل"];
const USERNAME = /^[A-Za-z0-9._-]{4,20}$/;

/** Eight characters a guard can read out loud without confusing 0 and O. */
const generatePassword = () => {
  const letters = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const pick = (set) => {
    const buf = new Uint32Array(1);
    window.crypto.getRandomValues(buf);
    return set[buf[0] % set.length];
  };
  const body = Array.from({ length: 6 }, () => pick(letters)).join("");
  return `${body}${pick(digits)}${pick(digits)}`;
};

const copy = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("تم النسخ");
  } catch {
    toast.info("انسخ البيانات يدويًا");
  }
};

const EMPTY = { fullName: "", jobLabel: "", phoneNumber: "", username: "", password: "", email: "" };
const PHONE = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]*$/;

const StaffMembers = () => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [form, setForm] = useState(null); // { mode: 'create'|'edit', id?, values }
  const [formError, setFormError] = useState("");
  const [passwordFor, setPasswordFor] = useState(null); // row
  const [newPassword, setNewPassword] = useState("");
  const [removing, setRemoving] = useState(null); // row
  const [credentials, setCredentials] = useState(null); // { fullName, username, password }
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    const result = await fetchStaffMembers();
    if (result?.status === false) {
      setRows([]); setError(result?.message || "تعذر تحميل موظفي الخدمات");
    } else {
      const data = result?.data ?? result;
      setRows(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const set = (key) => (event) =>
    setForm((current) => ({ ...current, values: { ...current.values, [key]: event.target.value } }));

  const openCreate = () => {
    setFormError("");
    setForm({ mode: "create", values: { ...EMPTY, password: generatePassword() } });
  };

  const openEdit = (row) => {
    setFormError("");
    setForm({
      mode: "edit",
      id: row.id,
      values: {
        fullName: row.fullName || "",
        jobLabel: row.jobLabel || "",
        phoneNumber: row.phoneNumber || "",
        username: row.username || "",
        email: row.hasEmail ? row.email : "",
        password: "",
      },
    });
  };

  const validate = (values, mode) => {
    if (!values.fullName.trim()) return "اكتب اسم الموظف";
    if (mode === "create") {
      if (!USERNAME.test(values.username.trim()))
        return "اسم المستخدم من 4 إلى 20 حرفًا: حروف إنجليزية وأرقام فقط";
      if (values.password.trim().length < 6) return "كلمة المرور 6 أحرف على الأقل";
    }
    if (values.phoneNumber.trim() && (!PHONE.test(values.phoneNumber.trim()) || values.phoneNumber.trim().length > 20))
      return "رقم الجوال غير صحيح";
    if (values.email.trim() && !/^\S+@\S+\.\S+$/.test(values.email.trim()))
      return "البريد الإلكتروني غير صحيح";
    return "";
  };

  const submitForm = async () => {
    const problem = validate(form.values, form.mode);
    if (problem) { setFormError(problem); return; }

    setSaving(true);
    const result = form.mode === "create"
      ? await createStaffMember(form.values)
      : await updateStaffMember(form.id, {
          fullName: form.values.fullName,
          jobLabel: form.values.jobLabel,
          phoneNumber: form.values.phoneNumber,
          ...(form.values.email.trim() ? { email: form.values.email } : {}),
        });
    setSaving(false);

    if (result?.status === false) { setFormError(result?.message || "تعذر الحفظ"); return; }

    toast.success(result?.message || "تم الحفظ");
    if (form.mode === "create") {
      setCredentials({
        fullName: form.values.fullName.trim(),
        username: form.values.username.trim(),
        password: form.values.password.trim(),
      });
    }
    setForm(null);
    load();
  };

  const submitPassword = async () => {
    if (newPassword.trim().length < 6) { toast.error("كلمة المرور 6 أحرف على الأقل"); return; }
    setSaving(true);
    const result = await updateStaffMember(passwordFor.id, { password: newPassword });
    setSaving(false);
    if (result?.status === false) { toast.error(result?.message || "تعذر تعيين كلمة المرور"); return; }
    toast.success("تم تعيين كلمة المرور");
    setCredentials({ fullName: passwordFor.fullName, username: passwordFor.username, password: newPassword.trim() });
    setPasswordFor(null); setNewPassword("");
  };

  const confirmRemove = async () => {
    setSaving(true);
    const result = await deleteStaffMember(removing.id);
    setSaving(false);
    if (result?.status === false) { toast.error(result?.message || "تعذر حذف الموظف"); return; }
    toast.success(result?.message || "تم حذف الموظف");
    setRemoving(null); load();
  };

  return (
    <Container>
      <Stack spacing={2} sx={{ py: 2 }} dir="rtl">
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1}>
          <Stack direction="row" spacing={1} alignItems="center">
            <BadgeRounded sx={{ color: "#244A70" }} />
            <Box>
              <Typography sx={{ fontWeight: 900, fontSize: 18 }}>موظفو الخدمات</Typography>
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                الحراس والعمال والسائقون — يدخلون لتسجيل حضورهم فقط
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button size="small" startIcon={<RefreshRounded />} onClick={load}>تحديث</Button>
            <Button size="small" variant="contained" startIcon={<AddRounded />} onClick={openCreate}>إضافة موظف</Button>
          </Stack>
        </Stack>

        <Alert severity="info" sx={{ borderRadius: "12px" }}>
          يلتزم موظفو الخدمات بدوام المدرسة وأيامها، ويظهر حضورهم في تقرير حضور الإداريين.
          ولا يطّلعون على أي بيانات للطلاب أو المعلمين.
        </Alert>

        {error ? <Alert severity="error">{error}</Alert> : null}

        {loading ? (
          <Stack alignItems="center" sx={{ py: 6 }}><CircularProgress size={28} /></Stack>
        ) : !rows.length ? (
          <Paper variant="outlined" sx={{ p: 5, textAlign: "center", borderRadius: "14px" }}>
            <Typography color="text.secondary" sx={{ mb: 1.5 }}>لا يوجد موظفو خدمات بعد.</Typography>
            <Button variant="outlined" startIcon={<AddRounded />} onClick={openCreate}>إضافة أول موظف</Button>
          </Paper>
        ) : (
          <Stack spacing={1.2}>
            {rows.map((row) => (
              <Paper key={row.id} variant="outlined" sx={{ p: 1.6, borderRadius: "14px" }}>
                <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1}>
                  <Stack spacing={0.6}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                      <Typography sx={{ fontWeight: 900, fontSize: 15 }}>{row.fullName || row.username}</Typography>
                      {row.jobLabel ? <Chip size="small" label={row.jobLabel} sx={{ fontWeight: 800 }} /> : null}
                    </Stack>
                    <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
                      اسم المستخدم: <Box component="span" dir="ltr" sx={{ fontFamily: "monospace", fontWeight: 700 }}>{row.username}</Box>
                      {" · "}
                      {row.hasEmail ? <Box component="span" dir="ltr">{row.email}</Box> : "لا يوجد بريد إلكتروني"}
                      {" · "}
                      {row.phoneNumber
                        ? <Box component="a" href={`tel:${row.phoneNumber}`} dir="ltr" sx={{ color: "inherit", fontWeight: 700 }}>{row.phoneNumber}</Box>
                        : "لا يوجد رقم جوال"}
                    </Typography>
                  </Stack>
                  <Stack direction="row" spacing={0.5}>
                    <Tooltip title="تعديل"><IconButton onClick={() => openEdit(row)}><EditRounded /></IconButton></Tooltip>
                    <Tooltip title="كلمة مرور جديدة">
                      <IconButton onClick={() => { setPasswordFor(row); setNewPassword(generatePassword()); }}><KeyRounded /></IconButton>
                    </Tooltip>
                    <Tooltip title="حذف"><IconButton color="error" onClick={() => setRemoving(row)}><DeleteOutlineRounded /></IconButton></Tooltip>
                  </Stack>
                </Stack>
              </Paper>
            ))}
          </Stack>
        )}
      </Stack>

      {/* إضافة / تعديل */}
      <Dialog open={Boolean(form)} onClose={() => !saving && setForm(null)} dir="rtl" fullWidth maxWidth="xs">
        <DialogTitle>{form?.mode === "edit" ? "تعديل بيانات الموظف" : "إضافة موظف خدمات"}</DialogTitle>
        <DialogContent>
          {form ? (
            <Stack spacing={1.6} sx={{ mt: 1 }}>
              {formError ? <Alert severity="error">{formError}</Alert> : null}
              <TextField id="staff-fullName" label="الاسم الكامل" required value={form.values.fullName} onChange={set("fullName")} inputProps={{ maxLength: 100 }} />
              <Box>
                <TextField id="staff-jobLabel" fullWidth label="المسمى" placeholder="حارس" value={form.values.jobLabel} onChange={set("jobLabel")} inputProps={{ maxLength: 60 }} />
                <Stack direction="row" gap={0.6} flexWrap="wrap" sx={{ mt: 0.8 }}>
                  {JOB_SUGGESTIONS.map((label) => (
                    <Chip key={label} size="small" label={label} variant={form.values.jobLabel === label ? "filled" : "outlined"}
                      onClick={() => setForm((current) => ({ ...current, values: { ...current.values, jobLabel: label } }))} />
                  ))}
                </Stack>
              </Box>
              <TextField id="staff-phone" label="رقم الجوال (اختياري)" value={form.values.phoneNumber} onChange={set("phoneNumber")}
                placeholder="05xxxxxxxx" inputProps={{ dir: "ltr", maxLength: 20, inputMode: "tel" }} />
              <TextField id="staff-username" label="اسم المستخدم" required={form.mode === "create"} disabled={form.mode === "edit"}
                value={form.values.username} onChange={set("username")}
                helperText={form.mode === "create" ? "يدخل به الموظف — حروف إنجليزية وأرقام، من 4 إلى 20" : "لا يمكن تغيير اسم المستخدم"}
                inputProps={{ dir: "ltr", maxLength: 20, autoComplete: "off" }} />
              {form.mode === "create" ? (
                <TextField id="staff-password" label="كلمة المرور" required value={form.values.password} onChange={set("password")}
                  inputProps={{ dir: "ltr", autoComplete: "new-password" }}
                  InputProps={{ endAdornment: (
                    <InputAdornment position="end">
                      <Tooltip title="توليد كلمة مرور">
                        <IconButton edge="end" onClick={() => setForm((current) => ({ ...current, values: { ...current.values, password: generatePassword() } }))}>
                          <ShuffleRounded />
                        </IconButton>
                      </Tooltip>
                    </InputAdornment>
                  ) }} />
              ) : null}
              <TextField id="staff-email" label="البريد الإلكتروني (اختياري)" value={form.values.email} onChange={set("email")}
                helperText="بدونه لا تصل الموظفَ رسالة استعادة كلمة المرور، وتُعيَّن له كلمة جديدة من هنا"
                inputProps={{ dir: "ltr" }} />
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForm(null)} disabled={saving}>إلغاء</Button>
          <Button variant="contained" onClick={submitForm} disabled={saving}>{saving ? "جارٍ الحفظ..." : "حفظ"}</Button>
        </DialogActions>
      </Dialog>

      {/* كلمة مرور جديدة */}
      <Dialog open={Boolean(passwordFor)} onClose={() => !saving && setPasswordFor(null)} dir="rtl" fullWidth maxWidth="xs">
        <DialogTitle>كلمة مرور جديدة</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 1 }}>
            <Typography sx={{ fontSize: 14 }}>
              تُستبدل كلمة مرور {passwordFor?.fullName || passwordFor?.username}، ولا تعمل القديمة بعد ذلك.
            </Typography>
            <TextField id="staff-new-password" label="كلمة المرور الجديدة" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
              inputProps={{ dir: "ltr", autoComplete: "new-password" }}
              InputProps={{ endAdornment: (
                <InputAdornment position="end">
                  <IconButton edge="end" onClick={() => setNewPassword(generatePassword())}><ShuffleRounded /></IconButton>
                </InputAdornment>
              ) }} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordFor(null)} disabled={saving}>إلغاء</Button>
          <Button variant="contained" onClick={submitPassword} disabled={saving}>{saving ? "جارٍ الحفظ..." : "تعيين"}</Button>
        </DialogActions>
      </Dialog>

      {/* حذف */}
      <Dialog open={Boolean(removing)} onClose={() => !saving && setRemoving(null)} dir="rtl" fullWidth maxWidth="xs">
        <DialogTitle>حذف الموظف</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 14 }}>
            يُحذف حساب {removing?.fullName || removing?.username} ولا يستطيع الدخول بعد ذلك.
            وتبقى سجلات حضوره السابقة في التقارير.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRemoving(null)} disabled={saving}>إلغاء</Button>
          <Button variant="contained" color="error" onClick={confirmRemove} disabled={saving}>{saving ? "جارٍ الحذف..." : "حذف"}</Button>
        </DialogActions>
      </Dialog>

      {/* بيانات الدخول — تظهر مرة واحدة */}
      <Dialog open={Boolean(credentials)} onClose={() => setCredentials(null)} dir="rtl" fullWidth maxWidth="xs">
        <DialogTitle>بيانات دخول الموظف</DialogTitle>
        <DialogContent>
          <Stack spacing={1.5} sx={{ mt: 0.5 }}>
            <Alert severity="warning" sx={{ borderRadius: "10px" }}>
              سلّم هذه البيانات إلى {credentials?.fullName}. لا تظهر كلمة المرور مرة أخرى.
            </Alert>
            {[["اسم المستخدم", credentials?.username], ["كلمة المرور", credentials?.password]].map(([label, value]) => (
              <Stack key={label} direction="row" alignItems="center" justifyContent="space-between"
                sx={{ p: 1.2, border: "1px solid rgba(36,74,112,.15)", borderRadius: "10px" }}>
                <Box>
                  <Typography sx={{ fontSize: 12, color: "text.secondary" }}>{label}</Typography>
                  <Typography dir="ltr" sx={{ fontFamily: "monospace", fontWeight: 800, fontSize: 16 }}>{value}</Typography>
                </Box>
                <IconButton onClick={() => copy(value)}><ContentCopyRounded /></IconButton>
              </Stack>
            ))}
            <Typography sx={{ fontSize: 12.5, color: "text.secondary" }}>
              يدخل الموظف من صفحة تسجيل الدخول المعتادة باسم المستخدم وكلمة المرور.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setCredentials(null)}>تم</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StaffMembers;
