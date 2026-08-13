import {
  IconButton,
} from "@mui/material";

import {
  DeleteOutlineRounded,
} from "@mui/icons-material";

import { useState } from "react";

import { toast } from "react-toastify";

import Popup from "@/components/Popup/Popup";

import {
  deleteLibrary,
} from "@/APIs/school/library";

const normalizeId = (value) => {
  if (
    value &&
    typeof value === "object"
  ) {
    return String(
      value._id ||
        value.id ||
        ""
    ).trim();
  }

  return String(value || "").trim();
};

const Delete = ({
  setItems,
  id,
  setLocalPagination,
}) => {
  const [open, setOpen] =
    useState(false);

  const [loading, setLoading] =
    useState(false);

  const handleDelete =
    async () => {
      const itemId =
        normalizeId(id);

      if (!itemId) {
        toast.error(
          "معرّف عنصر المكتبة غير موجود"
        );

        return;
      }

      setLoading(true);

      try {
        const response =
          await deleteLibrary(
            itemId
          );

        if (!response?.status) {
          toast.error(
            response?.message ||
              "حدث خطأ أثناء حذف عنصر المكتبة"
          );

          return;
        }

        toast.success(
          "تم حذف العنصر بنجاح"
        );

        setItems?.(
          (previous = []) =>
            previous.filter(
              (item) =>
                normalizeId(
                  item
                ) !== itemId
            )
        );

        setLocalPagination?.(
          (previous) => {
            if (!previous) {
              return previous;
            }

            const totalDocs =
              Math.max(
                0,
                Number(
                  previous.totalDocs ||
                    0
                ) - 1
              );

            const limit =
              Math.max(
                1,
                Number(
                  previous.limit ||
                    10
                )
              );

            return {
              ...previous,
              totalDocs,

              totalPages:
                Math.max(
                  1,
                  Math.ceil(
                    totalDocs /
                      limit
                  )
                ),
            };
          }
        );

        setOpen(false);
      } catch (error) {
        toast.error(
          error?.response?.data
            ?.message ||
            "حدث خطأ أثناء حذف عنصر المكتبة"
        );
      } finally {
        setLoading(false);
      }
    };

  return (
    <>
      <IconButton
        type="button"
        aria-label="حذف عنصر المكتبة"
        onClick={() =>
          setOpen(true)
        }
        sx={{
          width: 36,
          height: 36,

          color:
            "var(--color-danger)",

          backgroundColor:
            "rgba(201,79,79,0.07)",

          border:
            "1px solid rgba(201,79,79,0.12)",

          borderRadius: "10px",

          "&:hover": {
            backgroundColor:
              "rgba(201,79,79,0.13)",
          },
        }}
      >
        <DeleteOutlineRounded fontSize="small" />
      </IconButton>

      <Popup
        open={open}
        setOpen={setOpen}
        message="هل أنت متأكد من حذف هذا العنصر؟"
        type="delete"
        fn={handleDelete}
        loading={loading}
      />
    </>
  );
};

export default Delete;