import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchAuthSession } from "aws-amplify/auth";
import { fetchUserAttributes } from "aws-amplify/auth";
import DeleteIcon from '@mui/icons-material/Delete';
import PhotoCamera from '@mui/icons-material/PhotoCamera'; // Icon for profile picture upload

import Cropper from 'react-easy-crop';
import Dialog from '@mui/material/Dialog';
import Slider from '@mui/material/Slider';
import { getCroppedImg } from '../../functions/cropImage.js';



import {
  TextField,
  Button,
  Paper,
  Typography,
  Grid,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Avatar, // pfp
} from "@mui/material";
import PageContainer from "../Container";
import FileManagement from "../../components/FileManagement";

function titleCase(str) {
  if (typeof str !== "string") return str;
  return str
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export const InstructorNewPatient = ({ data, simulation_group_id, onClose }) => {
  const [files, setFiles] = useState([]); // For LLM Upload
  const [newFiles, setNewFiles] = useState([]); // For LLM Upload
  const [savedFiles, setSavedFiles] = useState([]); // For LLM Upload
  const [deletedFiles, setDeletedFiles] = useState([]); // For LLM Upload
  const [metadata, setMetadata] = useState({}); // For LLM Upload

  const [patientFiles, setPatientFiles] = useState([]); // For Patient Info Upload
  const [newPatientFiles, setNewPatientFiles] = useState([]); // For Patient Info Upload
  const [savedPatientFiles, setSavedPatientFiles] = useState([]); // For Patient Info Upload
  const [deletedPatientFiles, setDeletedPatientFiles] = useState([]); // For Patient Info Upload
  const [patientMetadata, setPatientMetadata] = useState({}); // For Patient Info Upload

  const [profilePicture, setProfilePicture] = useState(null); // For profile picture upload
  const [profilePicturePreview, setProfilePicturePreview] = useState(null); // For profile picture preview
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [patientPrompt, setPatientPrompt] = useState("");
  const [nextPatientNumber, setNextPatientNumber] = useState(data.length + 1);

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);


  const cleanFileName = (fileName) => {
    return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  };
  const handleBackClick = () => {
    window.history.back();
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        setProfilePicture(URL.createObjectURL(file));
        setIsCropDialogOpen(true); // Open cropping dialog
    }
  };

  const onCropComplete = (_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropImage = async () => {
      try {
          const croppedImage = await getCroppedImg(profilePicture, croppedAreaPixels);
          setProfilePicturePreview(croppedImage);
          setIsCropDialogOpen(false); // Close cropping dialog
      } catch (error) {
          console.error("Crop failed:", error);
      }
  };


  const uploadProfilePicture = async (profilePicture, token, patientId) => {
    if (!profilePicture) return;
    const fileType = profilePicture.name.split('.').pop();
    const fileName = cleanFileName(profilePicture.name);

    const response = await fetch(
      `${
        import.meta.env.VITE_API_ENDPOINT
      }instructor/generate_presigned_url?simulation_group_id=${encodeURIComponent(
        simulation_group_id
      )}&patient_id=${encodeURIComponent(
        patientId
      )}&file_type=${encodeURIComponent(
        fileType
      )}&file_name=${encodeURIComponent(fileName)}&is_document=${false}`,
      {
        method: "GET",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      }
    );

    const presignedUrl = await response.json();
    await fetch(presignedUrl.presignedurl, {
      method: "PUT",
      headers: {
        "Content-Type": profilePicture.type,
      },
      body: profilePicture,
    });
  };

  const uploadFiles = async (newFiles, token, patientId) => {
    const newFilePromises = newFiles.map((file) => {
      const fileType = file.name.split('.').pop();
      const fileName = cleanFileName(file.name.replace(/\.[^/.]+$/, ""));
      return fetch(
        `${
          import.meta.env.VITE_API_ENDPOINT
        }instructor/generate_presigned_url?simulation_group_id=${encodeURIComponent(
          simulation_group_id
        )}&patient_id=${encodeURIComponent(
          patientId
        )}&patient_name=${encodeURIComponent(
          patientName
        )}&file_type=${encodeURIComponent(fileType)}&file_name=${encodeURIComponent(
          fileName
        )}&is_document=${true}`,
        {
          method: "GET",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      )
        .then((response) => response.json())
        .then((presignedUrl) => {
          return fetch(presignedUrl.presignedurl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type,
            },
            body: file,
          });
        });
    });

    return await Promise.all(newFilePromises);
  };

  const uploadPatientFiles = async (newFiles, token, patientId) => {
    const newFilePromises = newFiles.map((file) => {
      const fileType = file.name.split('.').pop();
      const fileName = cleanFileName(file.name.replace(/\.[^/.]+$/, ""));

      return fetch(
        `${
          import.meta.env.VITE_API_ENDPOINT
        }instructor/generate_presigned_url?simulation_group_id=${encodeURIComponent(
          simulation_group_id
        )}&patient_id=${encodeURIComponent(
          patientId
        )}&patient_name=${encodeURIComponent(
          patientName
        )}&file_type=${encodeURIComponent(
          fileType
        )}&file_name=${encodeURIComponent(fileName)}&is_document=${false}`,
        {
          method: "GET",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      )
        .then((response) => response.json())
        .then((presignedUrl) => {
          return fetch(presignedUrl.presignedurl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type,
            },
            body: file,
          });
        });
    });

    return await Promise.all(newFilePromises);
  };

  const handleSave = async () => {
    if (isSaving) return;

    if (!patientName) {
      toast.error("Patient Name is required.", {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      return;
    }

    if (!patientAge) {
      toast.error("Patient Age is required.", {
        position: "top-center",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      return;
    }

    if (!patientGender) {
      
      toast.error("Patient Gender is required.", {
        position: "top-center",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      return;
    }

    if (!patientPrompt) {
      toast.error("Patient Prompt is required.", {
        position: "top-center",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
      return;
    }

    setIsSaving(true);

    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken;
      const { email } = await fetchUserAttributes();

      const response = await fetch(
        `${
          import.meta.env.VITE_API_ENDPOINT
        }instructor/create_patient?simulation_group_id=${encodeURIComponent(
          simulation_group_id
        )}&patient_name=${encodeURIComponent(
          patientName
        )}&patient_number=${encodeURIComponent(
          nextPatientNumber
        )}&patient_age=${encodeURIComponent(
          patientAge
        )}&patient_gender=${encodeURIComponent(
          patientGender
        )}&instructor_email=${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patient_prompt: patientPrompt,
          }),
        }
      );

      if (!response.ok) {
        console.error(`Failed to create patient`, response.statusText);
        toast.error("Patient Creation Failed", {
          position: "top-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      } else {
        const updatedPatient = await response.json();
        await uploadProfilePicture(profilePicture, token, updatedPatient.patient_id); // Upload profile picture
        await uploadFiles(newFiles, token, updatedPatient.patient_id); // LLM Upload
        await uploadPatientFiles(newPatientFiles, token, updatedPatient.patient_id); // Patient Info Upload

        setFiles((prevFiles) =>
          prevFiles.filter((file) => !deletedFiles.includes(file.fileName))
        );
        setSavedFiles((prevFiles) => [...prevFiles, ...newFiles]);

        setPatientFiles((prevFiles) =>
          prevFiles.filter((file) => !deletedPatientFiles.includes(file.fileName))
        );
        setSavedPatientFiles((prevFiles) => [...prevFiles, ...newPatientFiles]);

        setDeletedFiles([]);
        setNewFiles([]);
        setDeletedPatientFiles([]);
        setNewPatientFiles([]);
        toast.success("Patient Created Successfully", {
          position: "top-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
        onClose();
      }
    } catch (error) {
      console.error("Error saving changes:", error);
    } finally {
      setIsSaving(false);
      setNextPatientNumber(nextPatientNumber + 1);
      setTimeout(() => {
        handleBackClick();
      }, 1000);
    }
  };

  return (
    <PageContainer>
      <Paper style={{ padding: 25, width: "100%", overflow: "auto" }}>
        <Typography variant="h6">New Patient</Typography>

        {/* Profile Picture Upload Section */}
        <Box display="flex" alignItems="center" justifyContent="center" marginBottom={2}>
          <Avatar
            src={profilePicturePreview}
            alt="Profile Picture"
            sx={{ width: 100, height: 100 }}
          />
          <input
            accept="image/*"
            id="profile-picture-upload"
            type="file"
            style={{ display: "none" }}
            onChange={handleProfilePictureChange}
          />
          <label htmlFor="profile-picture-upload">
            <IconButton component="span" color="primary" aria-label="upload profile picture">
              <PhotoCamera />
            </IconButton>
          </label>
        </Box>


        {/* Cropper Dialog */}
        <Dialog open={isCropDialogOpen} onClose={() => setIsCropDialogOpen(false)}>
          <Box p={3} width="100%">
            <Typography variant="h6">Crop Profile Picture</Typography>
            <Box position="relative" width="100%" height={300} mt={2}>
              <Cropper
                image={profilePicture}
                crop={crop}
                zoom={zoom}
                aspect={1}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </Box>
            <Box mt={2}>
              <Typography gutterBottom>Zoom</Typography>
              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e, zoom) => setZoom(zoom)}
              />
            </Box>
            <Box mt={2} display="flex" justifyContent="flex-end">
              <Button onClick={() => setIsCropDialogOpen(false)} color="secondary" sx={{ mr: 2 }}>
                Cancel
              </Button>
              <Button onClick={handleCropImage} variant="contained" color="primary">
                Crop Image
              </Button>
            </Box>
          </Box>
        </Dialog>

        {/* Patient Information Fields */}
        <TextField
          label="Patient Name"
          name="name"
          value={patientName}
          onChange={e => setPatientName(e.target.value)}
          fullWidth
          margin="normal"
          inputProps={{ maxLength: 50 }}
        />

        <TextField
          label="Patient Age"
          value={patientAge}
          onChange={e => setPatientAge(e.target.value)}
          fullWidth
          margin="normal"
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Gender</InputLabel>
          <Select
            value={patientGender}
            onChange={e => setPatientGender(e.target.value)}
          >
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Patient Prompt"
          value={patientPrompt}
          onChange={e => setPatientPrompt(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          rows={4}
        />

        {/* LLM Upload Section */}
        <Typography variant="h6" style={{ marginTop: 20 }}>
          LLM Upload
        </Typography>
        <FileManagement
          newFiles={newFiles}
          setNewFiles={setNewFiles}
          files={files}
          setFiles={setFiles}
          setDeletedFiles={setDeletedFiles}
          savedFiles={savedFiles}
          setSavedFiles={setSavedFiles}
          loading={loading}
          metadata={metadata}
          setMetadata={setMetadata}
          isDocument={true}
        />

        {/* Patient Info Upload Section */}
        <Typography variant="h6" style={{ marginTop: 20 }}>
          Patient Information Upload
        </Typography>
        <FileManagement
          newFiles={newPatientFiles}
          setNewFiles={setNewPatientFiles}
          files={patientFiles}
          setFiles={setPatientFiles}
          setDeletedFiles={setDeletedPatientFiles}
          savedFiles={savedPatientFiles}
          setSavedFiles={setSavedPatientFiles}
          loading={loading}
          metadata={patientMetadata}
          setMetadata={setPatientMetadata}
          isDocument={false}
        />

        <Grid container spacing={2} style={{ marginTop: 16 }}>
          <Grid item xs={4}>
            <Box display="flex" gap={6}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleBackClick}
                sx={{ width: "30%" }}
              >
                Cancel
              </Button>
            </Box>
          </Grid>
          <Grid item xs={4}></Grid>
          <Grid item xs={4} style={{ textAlign: "right" }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              style={{ width: "30%" }}
            >
              Save Patient
            </Button>
          </Grid>
        </Grid>
      </Paper>
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </PageContainer>
  );
};

export default InstructorNewPatient;