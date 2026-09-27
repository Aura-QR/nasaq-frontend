import { TextField, InputAdornment } from "@mui/material";
import ContentPasteSearchIcon from '@mui/icons-material/ContentPasteSearch';

const SearchFilter = ({ value, onChange, placeholder = "بحث..." }) => {
  return (
    <TextField 
      type="search" 
      sx={{ 
        borderRadius: "8px !important",
        border: "1px solid",
        borderColor: "primary.border",
        bgcolor: "#eceff9",
        width: "100%"
      }} 
      placeholder={placeholder}
      InputProps={{ 
        startAdornment: (
          <InputAdornment position="start">
            <ContentPasteSearchIcon color={value && "primary"} />
          </InputAdornment>
        ) 
      }}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default SearchFilter;