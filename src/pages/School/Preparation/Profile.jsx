import {
  Box,
  Divider,
  Grid,
  IconButton,
  Paper,
  Stack,
  Tooltip,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
} from "@mui/material";
import Container from "@/components/Container/Container";
import Back from "@/components/Back/Back";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import Popup from "@/components/Popup/Popup";
import { Delete, Edit, Download, PictureAsPdf } from "@mui/icons-material";
import { toast } from "react-toastify";
import { translateGender } from "@/utils/helpers/translateGender";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Loading from "@/components/Loading";
import usePermissions from "@/utils/hooks/usePermissions";
import { usePreparation } from "@/utils/hooks/apis/usePreparation";
import { deletePreparation } from "@/APIs/school/preparation";
import Slots from "@/utils/constants/Slots";
import Days from "@/utils/constants/Days";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const Profile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { preparation, loading: preparationLoading } = usePreparation(id);

  const [open, setOpen] = useState(false);
  const handleDelete = async () => {
    const res = await deletePreparation(id);
    if (res.status) {
      toast.success("تم حذف التحضير بنجاح");
      navigate("/school/preparation");
    } else {
      toast.error(res || "حدث خطأ ما أثناء حذف التحضير");
    }
  };

  //permissions
  const permissions = usePermissions("preparation");

  if (preparationLoading) {
    return <Loading />;
  }

  return (
    <Container>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={{ xs: 4, sm: 0 }}
        justifyContent={"space-between"}
        alignItems={"center"}
      >
        <Back title={"تفاصيل التحضير"} />
      </Stack>
      {preparation && (
        <Details
          item={preparation}
          setOpen={setOpen}
          permissions={permissions}
        />
      )}
      <Popup
        open={open}
        setOpen={setOpen}
        message={"هل انت متأكد من انك تريد حذف هذا التحضير"}
        type={"delete"}
        fn={handleDelete}
      />
    </Container>
  );
};

const Details = ({ item, setOpen, permissions }) => {
  const slot = Slots.find((slot) => item.lecture.slot === slot.id)?.name;
  const day = Days.find((day) => item.lecture.dayOfWeek === day.id)?.day;
  const cls = `${item?.academicYear}-${item?.roomNumber}-${translateGender(item?.gender, "class")}`;
  const subject = `${item.subject?.subjectName}-${item.subject?.subjectCode}`;
  const data = [
    { key: "الفصل", value: cls },
    { key: "المعلم", value: item.name },
    { key: "المادة", value: subject },
    { key: "اليوم", value: day },
    { key: "الحصة", value: slot },
    { key: "تاريخ الإنشاء", value: format(new Date(item.createdAt), "dd MMM, yyyy" , {locale: ar}) },
  ];

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          bgcolor: "#FFFFFF",
          border: "1px solid #E5E7EB",
          boxShadow: "0px 1px 2px 0px #0000000D",
          p: 12,
          borderRadius: "16px",
          mt: 10,
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          width={"100%"}
        >
          <Stack spacing={1}>
            <Typography variant="h5" fontWeight="bold">
              {`${item.subject?.subjectName} - ${day} - ${slot}`}
            </Typography>
          </Stack>

          <Stack direction="row" spacing={2}>
            {permissions.edit && (
              <Tooltip title={"تعديل التحضير"}>
                <Link to={`/school/preparation/edit/${item._id}`}>
                  <IconButton color="success" size="large">
                    <Edit />
                  </IconButton>
                </Link>
              </Tooltip>
            )}
            {permissions.delete && (
              <Tooltip title={"حذف التحضير"}>
                <IconButton
                  color="error"
                  size="large"
                  onClick={() => setOpen(true)}
                >
                  <Delete />
                </IconButton>
              </Tooltip>
            )}
          </Stack>
        </Stack>
        <Divider sx={{ my: 10 }} />

        <Grid container spacing={4}>
          {data.map((field, i) => {
            return (
              <Grid item xs={12} md={6} lg={4} key={i}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "10px",
                    bgcolor: i % 2 === 0 ? "primary.white" : "white",
                    transition: ".5s",
                    "&:hover": { bgcolor: "grey.100" },
                  }}
                >
                  <Typography
                    variant="label"
                    color="text.secondary"
                    sx={{ mb: 0.5, fontWeight: 500, fontSize: "12px" }}
                  >
                    {field.key}
                  </Typography>
                  <Typography
                    variant="subtitle"
                    sx={{
                      display: "block",
                      fontWeight: 500,
                      color: "text.primary",
                    }}
                  >
                    {field.value}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Files Section */}
      {item?.files && item.files.length > 0 && <Files item={item} />}
    </>
  );
};

const Files = ({ item }) => {
  return (
    <Paper
      elevation={0}
      sx={{
        bgcolor: "#FFFFFF",
        border: "1px solid #E5E7EB",
        boxShadow: "0px 1px 2px 0px #0000000D",
        p: 12,
        borderRadius: "16px",
        mt: 10,
      }}
    >
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5" fontWeight="bold">
            ملف التحضير
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Divider sx={{ my: 10 }} />
          <Grid container spacing={4}>
            {item.files.map((file, index) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={index}>
                <Card key={index} item={file} index={index} />
              </Grid>
            ))}
          </Grid>
        </AccordionDetails>
      </Accordion>
    </Paper>
  );
};

const Card = ({ item, index }) => {
  return (
    <Stack
      borderRadius={"20px"}
      border={"1px solid"}
      pt={24}
      p={12}
      width={"100%"}
      overflow={"hidden"}
      borderColor={"primary.border"}
      alignItems={"center"}
      position={"relative"}
    >
      {/* Icon */}
      <Stack
        width={64}
        height={64}
        borderRadius={"50%"}
        bgcolor={"#3B82F626"}
        alignItems={"center"}
        justifyContent={"center"}
      >
        <PictureAsPdf sx={{ fontSize: 30, color: "primary.main" }} />
      </Stack>

      {/* Title */}
      <Typography
        fontWeight={600}
        fontSize={16}
        mt={4}
        textAlign={"center"}
        color={"secondary"}
      >
        {item.filename || `ملف ${index + 1}`}
      </Typography>

      {/* Open Button */}
      <Button
        variant="outlined"
        size="small"
        startIcon={<Download />}
        href={item.url}
        target="_blank"
        download
        fullWidth
        sx={{ py: 6, mt: 4, borderRadius: "12px" }}
      >
        تحميل الملف
      </Button>
    </Stack>
  );
};

export default Profile;
