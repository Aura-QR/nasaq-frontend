import {
  IconButton,
} from "@mui/material";

import {
  DeleteOutlineRounded,
} from "@mui/icons-material";

import { useState } from "react";
import { toast } from "react-toastify";

import Popup from "@/components/Popup/Popup";

import { deleteLibrary } from "@/APIs/school/library";

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
      setLoading(true);

      try {
        const response =
          await deleteLibrary(
            id
          );

        if (!response?.status) {
          toast.error(
            response?.message ||
              response ||
              "حدث خطأ أثناء حذف عنصر المكتبة"
          );
          return;
        }

        toast.success(
          "تم حذف العنصر بنجاح"
        );

        setItems(
          (previousItems) =>
            previousItems.filter(
              (item) =>
                (
                  item?._id ||
                  item?.id
                ) !== id
            )
        );

        setLocalPagination?.(
          (previous) => {
            if (!previous) {
              return previous;
            }

            return {
              ...previous,
              totalDocs:
                Math.max(
                  0,
                  Number(
                    previous.totalDocs ||
                      1
                  ) - 1
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
