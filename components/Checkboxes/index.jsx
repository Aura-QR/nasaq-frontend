import {
  Checkbox,
  FormControlLabel,
  Grid,
} from "@mui/material";

const Checkboxes = ({
  items = [],
  selectedData = [],
  setSelectedData,
}) => {
  const getItemId = (item) =>
    String(
      item?.id ||
        item?._id ||
        item?.value ||
        ""
    );

  const getItemLabel = (item) =>
    item?.name ||
    item?.subjectName ||
    item?.label ||
    item?.title ||
    "بدون اسم";

  const normalizedSelected = selectedData.map(
    (id) => String(id)
  );

  const handleChange = (itemId) => {
    if (!itemId) return;

    setSelectedData((previous = []) => {
      const normalizedPrevious = previous.map(
        (id) => String(id)
      );

      if (
        normalizedPrevious.includes(itemId)
      ) {
        return normalizedPrevious.filter(
          (id) => id !== itemId
        );
      }

      return [
        ...normalizedPrevious,
        itemId,
      ];
    });
  };

  return (
    <Grid container spacing={2} mt={2}>
      {items.map((item) => {
        const itemId = getItemId(item);
        const label = getItemLabel(item);
        const isChecked = normalizedSelected.includes(
          itemId
        );

        return (
          <Grid
            item
            xs={12}
            sm={6}
            md={4}
            lg={2.4}
            key={itemId}
          >
            <FormControlLabel
              label={label}
              control={
                <Checkbox
                  checked={isChecked}
                  onChange={() =>
                    handleChange(itemId)
                  }
                  value={itemId}
                />
              }
              sx={{
                color: "text.secondary",
              }}
            />
          </Grid>
        );
      })}
    </Grid>
  );
};

export default Checkboxes;
