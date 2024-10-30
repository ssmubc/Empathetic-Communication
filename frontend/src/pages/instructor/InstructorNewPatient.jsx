import { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";
import PhotoCamera from "@mui/icons-material/PhotoCamera";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "../../functions/cropImage.js";
import {
  TextField,
  Button,
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Slider,
} from "@mui/material";
import FileManagement from "../../components/FileManagement";

export const InstructorNewPatient = ({ open, onClose, simulationGroupId, onSave }) => {
  const [files, setFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [savedFiles, setSavedFiles] = useState([]);
  const [deletedFiles, setDeletedFiles] = useState([]);
  const [metadata, setMetadata] = useState({});

  const [patientFiles, setPatientFiles] = useState([]);
  const [newPatientFiles, setNewPatientFiles] = useState([]);
  const [savedPatientFiles, setSavedPatientFiles] = useState([]);
  const [deletedPatientFiles, setDeletedPatientFiles] = useState([]);
  const [patientMetadata, setPatientMetadata] = useState({});

  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [patientPrompt, setPatientPrompt] = useState("");
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);

  const cleanFileName = (fileName) => fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfilePicture(URL.createObjectURL(file));
      setIsCropDialogOpen(true);
    }
  };

  const onCropComplete = (_, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropImage = async () => {
    try {
      const croppedImage = await getCroppedImg(profilePicture, croppedAreaPixels);
      setProfilePicturePreview(croppedImage);
      setIsCropDialogOpen(false);
    } catch (error) {
      console.error("Crop failed:", error);
    }
  };

  const uploadProfilePicture = async (profilePicture, token, patientId) => {
    if (!profilePicture) return;
    const fileType = profilePicture.name.split(".").pop();
    const fileName = cleanFileName(profilePicture.name);

    const response = await fetch(
      `${import.meta.env.VITE_API_ENDPOINT}instructor/generate_presigned_url?simulation_group_id=${encodeURIComponent(
        simulationGroupId
      )}&patient_id=${encodeURIComponent(
        patientId
      )}&file_type=${encodeURIComponent(
        fileType
      )}&file_name=${encodeURIComponent(fileName)}&is_document=false`,
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

  const handleSave = async () => {
    if (isSaving) return;
    if (!patientName || !patientAge || !patientGender || !patientPrompt) {
      toast.error("All fields are required");
      return;
    }
    setIsSaving(true);
    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken;
      const { email } = await fetchUserAttributes();

      const response = await fetch(
        `${import.meta.env.VITE_API_ENDPOINT}instructor/create_patient?simulation_group_id=${encodeURIComponent(
          simulationGroupId
        )}&patient_name=${encodeURIComponent(
          patientName
        )}&patient_number=1&patient_age=${encodeURIComponent(
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
        throw new Error("Failed to create patient");
      }

      const updatedPatient = await response.json();
      await uploadProfilePicture(profilePicture, token, updatedPatient.patient_id);
      await Promise.all([
        uploadFiles(newFiles, token, updatedPatient.patient_id),
        uploadPatientFiles(newPatientFiles, token, updatedPatient.patient_id),
      ]);

      // Clear files and close the dialog if save is successful
      setFiles([]);
      setNewFiles([]);
      setPatientFiles([]);
      setNewPatientFiles([]);
      onSave && onSave();
      toast.success("Patient Created Successfully");
      onClose();
    } catch (error) {
      toast.error(error.message || "Error saving patient");
    } finally {
      setIsSaving(false);
    }
  };

  const uploadFiles = async (newFiles, token, patientId) => {
    const newFilePromises = newFiles.map((file) => {
      const fileType = file.name.split(".").pop();
      const fileName = cleanFileName(file.name.replace(/\.[^/.]+$/, ""));
      return fetch(
        `${import.meta.env.VITE_API_ENDPOINT}instructor/generate_presigned_url?simulation_group_id=${encodeURIComponent(
          simulationGroupId
        )}&patient_id=${encodeURIComponent(
          patientId
        )}&file_type=${encodeURIComponent(fileType)}&file_name=${encodeURIComponent(fileName)}&is_document=true`,
        {
          method: "GET",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      )
        .then((response) => response.json())
        .then((presignedUrl) =>
          fetch(presignedUrl.presignedurl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type,
            },
            body: file,
          })
        );
    });

    return await Promise.all(newFilePromises);
  };

  const uploadPatientFiles = async (newFiles, token, patientId) => {
    const newFilePromises = newFiles.map((file) => {
      const fileType = file.name.split(".").pop();
      const fileName = cleanFileName(file.name.replace(/\.[^/.]+$/, ""));

      return fetch(
        `${import.meta.env.VITE_API_ENDPOINT}instructor/generate_presigned_url?simulation_group_id=${encodeURIComponent(
          simulationGroupId
        )}&patient_id=${encodeURIComponent(
          patientId
        )}&file_type=${encodeURIComponent(fileType)}&file_name=${encodeURIComponent(fileName)}&is_document=false`,
        {
          method: "GET",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      )
        .then((response) => response.json())
        .then((presignedUrl) =>
          fetch(presignedUrl.presignedurl, {
            method: "PUT",
            headers: {
              "Content-Type": file.type,
            },
            body: file,
          })
        );
    });

    return await Promise.all(newFilePromises);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>New Patient</DialogTitle>
      <DialogContent>
        <Box display="flex" alignItems="center" justifyContent="center" marginBottom={2}>
          <Avatar src={profilePicturePreview} alt="Profile Picture" sx={{ width: 100, height: 100 }} />
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
              <Slider value={zoom} min={1} max={3} step={0.1} onChange={(e, zoom) => setZoom(zoom)} />
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

        <TextField label="Patient Name" value={patientName} onChange={(e) => setPatientName(e.target.value)} fullWidth margin="normal" />
        <TextField label="Patient Age" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} fullWidth margin="normal" />
        <FormControl fullWidth margin="normal">
          <InputLabel>Gender</InputLabel>
          <Select value={patientGender} onChange={(e) => setPatientGender(e.target.value)}>
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>
        <TextField label="Patient Prompt" value={patientPrompt} onChange={(e) => setPatientPrompt(e.target.value)} fullWidth margin="normal" multiline rows={4} />

        <Typography variant="h6" style={{ marginTop: 20 }}>LLM Upload</Typography>
        <FileManagement
          newFiles={newFiles}
          setNewFiles={setNewFiles}
          files={files}
          setFiles={setFiles}
          setDeletedFiles={setDeletedFiles}
          savedFiles={savedFiles}
          setSavedFiles={setSavedFiles}
          loading={false}
          metadata={metadata}
          setMetadata={setMetadata}
          isDocument={true}
        />

        <Typography variant="h6" style={{ marginTop: 20 }}>Patient Information Upload</Typography>
        <FileManagement
          newFiles={newPatientFiles}
          setNewFiles={setNewPatientFiles}
          files={patientFiles}
          setFiles={setPatientFiles}
          setDeletedFiles={setDeletedPatientFiles}
          savedFiles={savedPatientFiles}
          setSavedFiles={setSavedPatientFiles}
          loading={false}
          metadata={patientMetadata}
          setMetadata={setPatientMetadata}
          isDocument={false}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">Save Patient</Button>
      </DialogActions>
      <ToastContainer position="top-center" autoClose={2000} />
    </Dialog>
  );
};

export default InstructorNewPatient;
