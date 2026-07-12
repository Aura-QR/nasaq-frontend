import {
  IconButton,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import Person4Icon from "@mui/icons-material/Person4";
import { Link } from "react-router-dom";
import { DeleteOutline, Edit, EventAvailable } from "@mui/icons-material";
import { useState } from "react";
import Popup from "../Popup/Popup";

const Table = ({ headers, data, body, edit, profile, loading, deleteFn , schedule , addFn , editBtn }) => {
  const [activeDelete, setActiveDelete] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  if (loading) {
    return (
      <Stack spacing={2} width="100%" py={4}>
        {/* Skeleton Rows */}
        {[...Array(5)].map((_, i) => (
          <Skeleton
            key={i}
            variant="rectangular"
            height={56}
            animation="wave"
            sx={{
              background: "linear-gradient(135deg, rgba(49,141,206,0.15), rgba(50,52,73,0.1))",
              boxShadow: "0 2px 8px rgba(49,141,206,0.1)",
              borderRadius: "12px",
              backdropFilter: "blur(8px)",
            }}
          />
        ))}
      </Stack>
    );
  } else {
    return data?.length > 0 ? (
      <>
        <Stack
          width={"100%"}
          borderRadius={"16px"}
          pb={8}
          pr={2}
          className="Table"
          sx={{ overflow: "scroll" }}
          maxHeight={"450px"}
        >
          <Stack
            minWidth={{ xs: "900px", md: "400px" }}
            position={"relative"}
            maxWidth={"100%"}
          >
            {/* Head */}
            <TableHeader
              headers={headers}
              edit={edit}
              profile={profile}
              isDelete={deleteFn ? true : false}
              schedule={schedule}
            />
            {/* Body */}
            <Stack spacing={4}>
              {data?.length > 0 &&
                data?.map((item, i) => {
                  return (
                    <TableItem
                      key={item.id}
                      item={item}
                      i={i}
                      body={body}
                      edit={edit}
                      profile={profile}
                      setActiveDelete={setActiveDelete}
                      isDelete={deleteFn ? true : false}
                      setDeleteId={setDeleteId}
                      schedule={schedule}
                      addFn={addFn}
                      editBtn={editBtn}
                    />
                  );
                })}
            </Stack>
          </Stack>
        </Stack>
        {/* Delete Popup */}
        <Popup
          open={activeDelete}
          setOpen={setActiveDelete}
          message={"هل أنت متأكد أنك تريد حذف هذا؟"}
          type="delete"
          fn={() => deleteFn(deleteId , setActiveDelete)}
        />
      </>
    ) : (
      <Typography textAlign={"center"} pt={40} fontWeight={500}>
        لا توجد بيانات لعرضها
      </Typography>
    );
  }
};

const TableHeader = ({ headers, edit, profile, isDelete , schedule }) => {
  return (
    <Stack
      direction={"row"}
      py={8}
      px={8}
      spacing={4}
      position={"sticky"}
      top={0}
      sx={{
        background: "linear-gradient(135deg, #f9fafc 0%, #e9eef5 100%)",
        boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
        border: "1px solid rgba(255, 255, 255, 0.4)",
        backdropFilter: "saturate(180%)",
        transition: "all 0.3s ease",
        position: "sticky",
        top: 0,
        zIndex: 3,
      }}
      zIndex={3}
      borderRadius={"12px"}
      mb={8}
    >
      <Typography variant="breadcrumbs" flex={1}>
        الترتيب
      </Typography>
      {headers?.length > 0 &&
        headers.map((header, i) => {
          return (
            <Typography variant="breadcrumbs" flex={2} key={i}>
              {header}
            </Typography>
          );
        })}
      {(edit || profile || isDelete || schedule) && (
        <Typography variant="breadcrumbs" flex={2}>
          الإجراءات
        </Typography>
      )}
    </Stack>
  );
};

const TableItem = ({
  item,
  i,
  body,
  edit,
  profile,
  setActiveDelete,
  isDelete,
  setDeleteId,
  schedule,
  editBtn
}) => {
  return (
    <Stack
      py={4}
      direction={"row"}
      px={8}
      spacing={4}
      whiteSpace={"nowrap"}
      bgcolor={
        i % 2 === 0
          ? "rgba(49, 141, 206, 0.08)" // soft blue tint
          : "rgba(50, 52, 73, 0.04)"   // soft gray tint
      }
      alignItems={"center"}
      maxWidth={"100%"}
      minHeight={"56px"}
      borderRadius={"12px"}
      position={"relative"}
      overflow={"hidden"}
      className="tableItem"
    >
      {/* Hover Effect */}
      <div className="tableHover"></div>

      <Typography variant="breadcrumbs" zIndex={2} color={"text.secondary"} flex={1}>
        {i + 1}
      </Typography>

      {body?.map((key, i) => {
        return (
          <Typography
            zIndex={2}
            key={i}
            variant="breadcrumbs"
            fontWeight={"500"}
            color={"text.secondary"}
            flex={2}
            pr={4}
            noWrap
          >
            <Tooltip title={item[key] && item[key]}>
              {item[key] && item[key]?.toString().slice(0, 20)}{" "}
            </Tooltip>
          </Typography>
        );
      })}

      {(edit || profile || isDelete || schedule) && (
        <Typography zIndex={2} variant="breadcrumbs" color={"text.secondary"} flex={2}>
          <Stack direction={"row"} spacing={1} alignItems={"center"}>
            {schedule && (
              <Link to={`${item?.id?.toString()}/schedule`}>
                <Tooltip title="الجدول الدراسي">
                  <IconButton color="warning">
                    <EventAvailable fontSize="medium" />
                  </IconButton>
                </Tooltip>
              </Link>
            )}
            {edit && (
              editBtn ? (
                editBtn
              ) : (
                <Link to={"edit/" + item?.id}>
                  <Tooltip title="تعديل">
                    <IconButton sx={{ color: "#32C652" }}>
                      <Edit />
                    </IconButton>
                  </Tooltip>
                </Link>
              )
            )}
            {profile && (
              <Link to={item?.id?.toString()}>
                <Tooltip title="تفاصيل اكثر">
                  <IconButton color="primary">
                    <Person4Icon />
                  </IconButton>
                </Tooltip>
              </Link>
            )}
            {isDelete && (
              <div
                onClick={() => {
                  setActiveDelete(true);
                  setDeleteId(item.id);
                }}
              >
                <Tooltip title="حذف">
                  <IconButton>
                    <DeleteOutline color="error" />
                  </IconButton>
                </Tooltip>
              </div>
            )}
          </Stack>
        </Typography>
      )}
    </Stack>
  );
};

export default Table;
