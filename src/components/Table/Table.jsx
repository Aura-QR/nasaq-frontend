import {
  Box,
  IconButton,
  Menu,
  MenuItem,
  Skeleton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import Person4Icon from "@mui/icons-material/Person4";
import {
  DeleteOutline,
  Edit,
  EventAvailable,
  LockResetRounded,
  MoreHorizRounded,
} from "@mui/icons-material";

import { Link } from "react-router-dom";
import { useState } from "react";

import Popup from "../Popup/Popup";

const ACTION_BUTTON_SIZE = 34;

const actionButtonSx = {
  width: ACTION_BUTTON_SIZE,
  height: ACTION_BUTTON_SIZE,
  padding: 0,

  borderRadius: "10px",
  border: "1px solid rgba(36, 74, 112, 0.09)",

  transition:
    "transform 0.18s ease, background-color 0.18s ease, border-color 0.18s ease",

  "&:hover": {
    transform: "translateY(-1px)",
  },

  "& svg": {
    fontSize: 19,
  },
};

const cellTextSx = {
  minWidth: 0,
  overflow: "hidden",
  color: "var(--color-muted)",
  fontSize: "12px",
  fontWeight: 600,
  lineHeight: 1.5,
  textOverflow: "ellipsis",
  whiteSpace: "nowrap",
};

const Table = ({
  headers,
  data,
  body,
  edit,
  profile,
  loading,
  deleteFn,
  schedule,
  addFn,
  editBtn,
  setPasswordFn,
  renderCell,
}) => {
  const [activeDelete, setActiveDelete] =
    useState(false);

  const [deleteId, setDeleteId] =
    useState(null);

  const hasActions = Boolean(
    edit ||
      profile ||
      deleteFn ||
      schedule ||
      addFn ||
      editBtn ||
      setPasswordFn
  );

  if (loading) {
    return (
      <Stack
        spacing={1}
        width="100%"
        py={1}
      >
        {[...Array(5)].map((_, index) => (
          <Skeleton
            key={index}
            variant="rounded"
            height={54}
            animation="wave"
            sx={{
              borderRadius: "12px",
              backgroundColor:
                "rgba(36, 74, 112, 0.07)",
            }}
          />
        ))}
      </Stack>
    );
  }

  if (!data?.length) {
    return (
      <Box
        sx={{
          minHeight: 180,
          display: "grid",
          placeItems: "center",
          px: 2,
          py: 4,
        }}
      >
        <Stack
          alignItems="center"
          spacing={0.7}
        >
          <Typography
            sx={{
              color:
                "var(--color-navy-deep)",
              fontSize: "15px",
              fontWeight: 800,
            }}
          >
            لا توجد بيانات لعرضها
          </Typography>

          <Typography
            sx={{
              color: "var(--color-muted)",
              fontSize: "11px",
            }}
          >
            غيّر الفلاتر أو أضف بيانات جديدة.
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <>
      <Box
        className="Table"
        sx={{
          width: "100%",
          maxHeight: 390,
          overflow: "auto",
          pr: 0.5,
          pb: 0.5,

          scrollbarWidth: "thin",
          scrollbarColor:
            "rgba(36, 74, 112, 0.22) transparent",

          "&::-webkit-scrollbar": {
            width: 6,
            height: 7,
          },

          "&::-webkit-scrollbar-track": {
            background: "transparent",
          },

          "&::-webkit-scrollbar-thumb": {
            borderRadius: 999,
            backgroundColor:
              "rgba(36, 74, 112, 0.20)",
          },
        }}
      >
        <Stack
          spacing={1}
          sx={{
            minWidth: {
              xs: Math.max(920, (headers?.length || 0) * 128 + (hasActions ? 190 : 90)),
              md: Math.max(840, (headers?.length || 0) * 118 + (hasActions ? 170 : 80)),
            },
            width: "100%",
          }}
        >
          <TableHeader
            headers={headers}
            hasActions={hasActions}
          />

          {data.map((item, index) => (
            <TableItem
              key={item.id ?? index}
              item={item}
              index={index}
              body={body}
              edit={edit}
              profile={profile}
              setActiveDelete={
                setActiveDelete
              }
              hasDelete={Boolean(deleteFn)}
              setDeleteId={setDeleteId}
              schedule={schedule}
              addFn={addFn}
              editBtn={editBtn}
              setPasswordFn={setPasswordFn}
              renderCell={renderCell}
              hasActions={hasActions}
            />
          ))}
        </Stack>
      </Box>

      {deleteFn && (
        <Popup
          open={activeDelete}
          setOpen={setActiveDelete}
          message="هل أنت متأكد أنك تريد حذف هذا العنصر؟"
          type="delete"
          fn={() =>
            deleteFn(
              deleteId,
              setActiveDelete
            )
          }
        />
      )}
    </>
  );
};

const TableHeader = ({
  headers,
  hasActions,
}) => {
  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1}
      px={1.5}
      py={1.25}
      position="sticky"
      top={0}
      zIndex={3}
      sx={{
        minHeight: 50,

        color: "var(--color-navy-deep)",
        background:
          "linear-gradient(135deg, #f5f7fb 0%, #e9eef5 100%)",

        border:
          "1px solid rgba(36, 74, 112, 0.08)",
        borderRadius: "12px",

        boxShadow:
          "0 5px 14px rgba(18, 47, 77, 0.07)",

        backdropFilter: "blur(12px)",
        WebkitBackdropFilter:
          "blur(12px)",
      }}
    >
      <HeaderCell
        flex={0.65}
        text="الترتيب"
      />

      {headers?.map((header) => (
        <HeaderCell
          key={header}
          flex={2}
          text={header}
        />
      ))}

      {hasActions && (
        <HeaderCell
          flex={1.45}
          text="الإجراءات"
        />
      )}
    </Stack>
  );
};

const HeaderCell = ({ text, flex }) => (
  <Typography
    sx={{
      flex,
      minWidth: 0,

      color: "var(--color-navy-deep)",
      fontSize: "11.5px",
      fontWeight: 800,
      lineHeight: 1.4,

      textAlign: "center",
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </Typography>
);

const TableItem = ({
  item,
  index,
  body,
  edit,
  profile,
  setActiveDelete,
  hasDelete,
  setDeleteId,
  schedule,
  addFn,
  editBtn,
  setPasswordFn,
  renderCell,
  hasActions,
}) => {
  const [actionsAnchor, setActionsAnchor] = useState(null);

  const openMoreActions = (event) => {
    setActionsAnchor(event.currentTarget);
  };

  const closeMoreActions = () => {
    setActionsAnchor(null);
  };

  const handleSetPassword = () => {
    closeMoreActions();
    setPasswordFn?.(item);
  };

  const openDeletePopup = () => {
    setDeleteId(item.id);
    setActiveDelete(true);
  };

  return (
    <Stack
      direction="row"
      alignItems="center"
      gap={1}
      px={1.5}
      py={1}
      minHeight={54}
      position="relative"
      overflow="hidden"
      className="tableItem"
      sx={{
        backgroundColor:
          index % 2 === 0
            ? "rgba(36, 74, 112, 0.045)"
            : "rgba(255, 252, 247, 0.92)",

        border:
          "1px solid rgba(36, 74, 112, 0.065)",
        borderRadius: "12px",

        transition:
          "transform 0.18s ease, background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",

        "&:hover": {
          backgroundColor:
            "rgba(251, 240, 216, 0.48)",
          borderColor:
            "rgba(211, 164, 79, 0.22)",
          boxShadow:
            "0 7px 18px rgba(18, 47, 77, 0.06)",
          transform: "translateY(-1px)",
        },
      }}
    >
      <Typography
        sx={{
          ...cellTextSx,
          flex: 0.65,
          textAlign: "center",
          color:
            "var(--color-navy-deep)",
          fontWeight: 800,
        }}
      >
        {index + 1}
      </Typography>

      {body?.map((key) => {
        const rawValue = item?.[key];
        const value =
          rawValue === null ||
          rawValue === undefined ||
          rawValue === ""
            ? "—"
            : String(rawValue);
        const customCell = renderCell?.({
          item,
          keyName: key,
          value: rawValue,
          displayValue: value,
          index,
        });

        if (customCell !== undefined && customCell !== null) {
          return (
            <Box
              key={key}
              sx={{
                flex: 2,
                minWidth: 0,
                px: 0.4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {customCell}
            </Box>
          );
        }

        return (
          <Tooltip
            key={key}
            title={value}
            arrow
          >
            <Typography
              sx={{
                ...cellTextSx,
                flex: 2,
                px: 0.4,
                textAlign: "center",
              }}
            >
              {value.length > 20
                ? `${value.slice(0, 20)}…`
                : value}
            </Typography>
          </Tooltip>
        );
      })}

      {hasActions && (
        <Box
          sx={{
            flex: 1.45,
            minWidth: setPasswordFn ? 190 : 148,

            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 0.9,
          }}
        >
          {schedule && (
            <Tooltip
              title="الجدول الدراسي"
              arrow
            >
              <IconButton
                component={Link}
                to={`${item?.id}/schedule`}
                aria-label="الجدول الدراسي"
                sx={{
                  ...actionButtonSx,
                  color: "#a96d0b",
                  backgroundColor:
                    "rgba(211, 164, 79, 0.12)",

                  "&:hover": {
                    ...actionButtonSx[
                      "&:hover"
                    ],
                    backgroundColor:
                      "rgba(211, 164, 79, 0.22)",
                    borderColor:
                      "rgba(211, 164, 79, 0.32)",
                  },
                }}
              >
                <EventAvailable />
              </IconButton>
            </Tooltip>
          )}

          {addFn &&
            typeof addFn === "function" && (
              <Tooltip
                title="إضافة"
                arrow
              >
                <IconButton
                  onClick={() =>
                    addFn(item)
                  }
                  aria-label="إضافة"
                  sx={{
                    ...actionButtonSx,
                    color:
                      "var(--color-navy)",
                    backgroundColor:
                      "rgba(36, 74, 112, 0.07)",
                  }}
                >
                  <Person4Icon />
                </IconButton>
              </Tooltip>
            )}

          {edit &&
            (editBtn ? (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                }}
              >
                {editBtn}
              </Box>
            ) : (
              <Tooltip
                title="تعديل"
                arrow
              >
                <IconButton
                  component={Link}
                  to={`edit/${item?.id}`}
                  aria-label="تعديل"
                  sx={{
                    ...actionButtonSx,
                    color: "#238f55",
                    backgroundColor:
                      "rgba(35, 143, 85, 0.09)",

                    "&:hover": {
                      ...actionButtonSx[
                        "&:hover"
                      ],
                      backgroundColor:
                        "rgba(35, 143, 85, 0.17)",
                      borderColor:
                        "rgba(35, 143, 85, 0.23)",
                    },
                  }}
                >
                  <Edit />
                </IconButton>
              </Tooltip>
            ))}

          {profile && (
            <Tooltip
              title="عرض التفاصيل"
              arrow
            >
              <IconButton
                component={Link}
                to={String(item?.id)}
                aria-label="عرض التفاصيل"
                sx={{
                  ...actionButtonSx,
                  color:
                    "var(--color-navy)",
                  backgroundColor:
                    "rgba(36, 74, 112, 0.07)",

                  "&:hover": {
                    ...actionButtonSx[
                      "&:hover"
                    ],
                    backgroundColor:
                      "rgba(36, 74, 112, 0.14)",
                    borderColor:
                      "rgba(36, 74, 112, 0.20)",
                  },
                }}
              >
                <Person4Icon />
              </IconButton>
            </Tooltip>
          )}

          {setPasswordFn && (
            <>
              <Tooltip
                title="إجراءات أخرى"
                arrow
              >
                <IconButton
                  type="button"
                  onClick={openMoreActions}
                  aria-label="إجراءات أخرى"
                  aria-haspopup="menu"
                  aria-expanded={
                    Boolean(actionsAnchor)
                      ? "true"
                      : undefined
                  }
                  sx={{
                    ...actionButtonSx,
                    color: "var(--color-gold-dark)",
                    backgroundColor:
                      "rgba(211, 164, 79, 0.10)",

                    "&:hover": {
                      ...actionButtonSx[
                        "&:hover"
                      ],
                      backgroundColor:
                        "rgba(211, 164, 79, 0.20)",
                      borderColor:
                        "rgba(211, 164, 79, 0.30)",
                    },
                  }}
                >
                  <MoreHorizRounded />
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={actionsAnchor}
                open={Boolean(actionsAnchor)}
                onClose={closeMoreActions}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "right",
                }}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "right",
                }}
                slotProps={{
                  paper: {
                    sx: {
                      mt: 0.6,
                      minWidth: 190,
                      borderRadius: "12px",
                      border:
                        "1px solid rgba(36,74,112,0.10)",
                      boxShadow:
                        "0 12px 30px rgba(18,47,77,0.14)",
                    },
                  },
                }}
              >
                <MenuItem
                  onClick={handleSetPassword}
                  sx={{
                    gap: 1,
                    minHeight: 42,
                    color:
                      "var(--color-navy-deep)",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  <LockResetRounded
                    sx={{
                      color:
                        "var(--color-gold-dark)",
                      fontSize: 20,
                    }}
                  />
                  تعيين كلمة المرور
                </MenuItem>
              </Menu>
            </>
          )}

          {hasDelete && (
            <Tooltip
              title="حذف"
              arrow
            >
              <IconButton
                type="button"
                onClick={openDeletePopup}
                aria-label="حذف"
                sx={{
                  ...actionButtonSx,
                  color:
                    "var(--color-danger)",
                  backgroundColor:
                    "rgba(201, 79, 79, 0.07)",

                  "&:hover": {
                    ...actionButtonSx[
                      "&:hover"
                    ],
                    color: "#ffffff",
                    backgroundColor:
                      "var(--color-danger)",
                    borderColor:
                      "var(--color-danger)",
                  },
                }}
              >
                <DeleteOutline />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      )}
    </Stack>
  );
};

export default Table;
