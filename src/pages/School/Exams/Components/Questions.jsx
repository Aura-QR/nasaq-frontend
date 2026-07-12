import { Box, Grid, Typography, IconButton, Divider, Button } from "@mui/material";
import Input from "@/components/Input/Input";
import Select from "@/components/Select/Select";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";

const Questions = ({ fields, register, errors, watch, remove, addQuestion }) => {
  return (
    <Box my={8}>
      <div style={{ padding: "16px" }}>
        <Typography variant="title" fontWeight={"500"} fontSize={20}>
          الأسئلة
        </Typography>
      </div>
      
      <Box bgcolor={"primary.white"} p={"32px 16px"} borderRadius={"12px"} my={8}>
        {fields.map((field, qIndex) => (
          <Box key={field.id} mb={6}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={8}>
              <Typography variant="title" fontWeight={"500"}>
                السؤال {qIndex + 1}
              </Typography>
              {fields.length > 1 && (
                <IconButton onClick={() => remove(qIndex)} sx={{ color: "error.main" }} size="small">
                  <DeleteOutlineIcon size={18} />
                </IconButton>
              )}
            </Box>

            <Grid container spacing={8}>
              <Grid item xs={12}>
                <Input
                  register={register}
                  registerName={`questions.${qIndex}.question`}
                  error={errors.questions?.[qIndex]?.question?.message}
                  label="نص السؤال"
                  required={true}
                  multiline={true}
                />
              </Grid>

              {[0, 1, 2, 3].map((optIndex) => (
                <Grid item xs={12} sm={6} key={optIndex} my={2}>
                  <Input
                    register={register}
                    registerName={`questions.${qIndex}.options.${optIndex}`}
                    error={errors.questions?.[qIndex]?.options?.[optIndex]?.message}
                    label={`الخيار ${optIndex + 1}`}
                    required={ optIndex === 1 || optIndex === 0 ? true : false}
                  />
                </Grid>
              ))}

              {(() => {
                const options = watch(`questions.${qIndex}.options`) || [ "", "", "", ""];
                // disable if the first two options are not filled
                const isDisabled = !options[0] || !options[1];
                return (
                  <Grid item xs={12} my={2}>
                    <Select
                      register={register}
                      registerName={`questions.${qIndex}.correctAnswer`}
                      data={options.filter(option => option ? option : null)}
                      error={errors.questions?.[qIndex]?.correctAnswer?.message}
                      label={"اختر الإجابة الصحيحة"}
                      required={true}
                      defaultSelect="اختر الإجابة الصحيحة"
                      disabled={isDisabled}
                    />
                  </Grid>
                );
              })()}

            </Grid>

            {qIndex < fields.length - 1 && (
              <Divider sx={{ mb: 16, mt: 24 }} />
            )}
          </Box>
        ))}
      </Box>
      
      <Box display={"flex"} spacing={3} flexDirection={"row"} alignItems={"center"}>
        <Button
          onClick={addQuestion}
          startIcon={
            <AddIcon
              sx={{ 
                backgroundColor: "primary.main", 
                borderRadius: "50%", 
                scale: "1.4", 
                padding: "2px", 
                marginRight: "4px", 
                color: "white"
              }}
            />
          }
          variant="none"
          sx={{ p: "18px 18px", borderRadius: "8px", color: "primary.main" }}
        >
          اضافة سؤال جديد
        </Button>
      </Box>
    </Box>
  );
};

export default Questions;