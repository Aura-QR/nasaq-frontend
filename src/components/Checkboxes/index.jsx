import { Checkbox, FormControlLabel, Grid } from "@mui/material";

// Checkboxes Component
// This component renders a list of checkboxes based on the provided items and manages the selected state.
// Items => Array of objects with 'id' and 'name' properties.
// selectedData => Array of selected item ids.
// setSelectedData => Function to update the selected items.

const Checkboxes = ({ items, selectedData, setSelectedData }) => {

    // Handle Change
    const handleChange = (event) => {
        const { target: { value } } = event;
        if (selectedData.includes(value)) {
            setSelectedData(selectedData.filter(item => item !== value));
        } else {
            setSelectedData([...selectedData, value]);
        }
    }
    
    return (
        <Grid container spacing={2} mt={2}>
            {items.map((item, index) => (
                <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                    <FormControlLabel 
                        control={<Checkbox />}
                        label={item.name}
                        checked={selectedData.includes(item.id)}
                        onChange={handleChange}
                        value={item.id}
                        sx={{color : "text.secondary"}}
                    />
                </Grid>
            ))}
        </Grid>
    )
}

export default Checkboxes