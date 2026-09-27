import { Box, Stack, Typography, IconButton } from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState, useRef } from "react";
import { toast } from "react-toastify";

const ImageUploader = ({ label, required, onImageChange, defaultImage, maxSize = 5 }) => {
  const [preview, setPreview] = useState(defaultImage || null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = (file) => {
    if (file && file.type.startsWith('image/')) {
      // Check file size (in MB)
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`File size should be less than ${maxSize}MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
        if (onImageChange) {
          onImageChange(file, e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const file = e.target.files[0];
    handleFileSelect(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  };

  const handleRemoveImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageChange) {
      onImageChange(null, null);
    }
  };

  const handleBoxClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <Stack alignItems={"start"} height={"100%"} spacing={4} width={"100%"}>
      <Typography variant="subtitle" color={"text.secondary"} fontWeight={500}>
        {label} {required && <span style={{color: "red"}}>*</span>}
      </Typography>
      
      <Box
        sx={{
          width: "100%",
          flexGrow: 1,
          minHeight: preview ? "auto" : "200px",
          border: "2px dashed",
          borderColor: dragOver ? "primary.main" : "primary.border",
          borderRadius: "8px",
          bgcolor: dragOver ? "rgba(25, 118, 210, 0.04)" : "#eceff9",
          cursor: "pointer",
          transition: "all 0.3s ease",
          overflow: "hidden",
          "&:hover": {
            borderColor: "primary.main",
            bgcolor: "rgba(25, 118, 210, 0.04)"
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={!preview ? handleBoxClick : undefined}
      >
        {preview ? (
          <Box sx={{ position: "relative", width: "100%" }}>
            <Box
              component="img"
              src={preview}
              alt="Preview"
              sx={{
                width: "100%",
                maxHeight: "300px",
                objectFit: "contain",
                display: "block"
              }}
            />
            <Box
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                display: "flex",
                gap: 1
              }}
            >
              <IconButton
                size="small"
                onClick={handleRemoveImage}
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.9)",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 1)"
                  }
                }}
              >
                <DeleteIcon sx={{ color: "red", fontSize: 20 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={handleBoxClick}
                sx={{
                  bgcolor: "rgba(255, 255, 255, 0.9)",
                  "&:hover": {
                    bgcolor: "rgba(255, 255, 255, 1)"
                  }
                }}
              >
                <CloudUploadIcon sx={{ color: "primary.main", fontSize: 20 }} />
              </IconButton>
            </Box>
          </Box>
        ) : (
          <Stack
            alignItems="center"
            justifyContent="center"
            spacing={2}
            sx={{ height: "100%", p: 3 }}
          >
            <CloudUploadIcon 
              sx={{ 
                fontSize: 48, 
                color: dragOver ? "primary.main" : "text.secondary",
                transition: "color 0.3s ease"
              }} 
            />
            <Typography 
              variant="body1" 
              color={dragOver ? "primary.main" : "text.secondary"}
              fontWeight={500}
              textAlign="center"
            >
              {dragOver ? "Drop your image here" : "Click to upload or drag and drop"}
            </Typography>
            <Typography 
              variant="body2" 
              color="text.disabled"
              textAlign="center"
            >
              PNG, JPG, GIF up to {maxSize}MB
            </Typography>
          </Stack>
        )}
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleInputChange}
        style={{ display: "none" }}
      />
    </Stack>
  );
};

export default ImageUploader;