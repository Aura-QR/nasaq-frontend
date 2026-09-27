import { Box } from '@mui/material'
import SelectFilter from './SelectFilter'

const LimitFilter = ({ limit, setLimit }) => {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
        <Box
        sx={{
            "& .MuiOutlinedInput-root": {
            padding: "0 !important",
            },
            "& .MuiSelect-select": {
            padding: "8px 30px 8px 15px !important",
            },
        }}
        >
        <SelectFilter
            value={limit}
            onChange={setLimit}
            label=""
            allLabel=""
            options={[
            { value: 5, label: "5" },
            { value: 10, label: "10" },
            { value: 20, label: "20" },
            { value: 50, label: "50" },
            ]}
        />
        </Box>
    </Box>
  )
}

export default LimitFilter