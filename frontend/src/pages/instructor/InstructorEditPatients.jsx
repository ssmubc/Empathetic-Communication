import { useState, useEffect } from "react";
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
  DialogContentText,
  Slider,
} from "@mui/material";
import FileManagement from "../../components/FileManagement";

function titleCase(str) {
  if (typeof str !== "string") return str;
  return str
    .toLowerCase()
    .split(" ")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const InstructorEditPatients = ({ open, onClose, patientData, simulationGroupId, onSave }) => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [metadata, setMetadata] = useState({});
  const [patientMetadata, setPatientMetadata] = useState({});
  const [llmFiles, setLlmFiles] = useState([]);
  const [newLlmFiles, setNewLlmFiles] = useState([]);
  const [savedLlmFiles, setSavedLlmFiles] = useState([]);
  const [deletedLlmFiles, setDeletedLlmFiles] = useState([]);
  const [patientFiles, setPatientFiles] = useState([]);
  const [newPatientFiles, setNewPatientFiles] = useState([]);
  const [savedPatientFiles, setSavedPatientFiles] = useState([]);
  const [deletedPatientFiles, setDeletedPatientFiles] = useState([]);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [patientPrompt, setPatientPrompt] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    if (patientData) {
      setPatientName(patientData.patient_name);
      setPatientAge(patientData.patient_age);
      setPatientGender(patientData.patient_gender);
      setPatientPrompt(patientData.patient_prompt);
      if (patientData.profilePicture) {
        setProfilePicturePreview(patientData.profilePicture);
      }
      fetchFiles();
    }
  }, [patientData]);

  const cleanFileName = fileName => fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const { token } = await getAuthSessionAndEmail();
      const response = await fetch(
        `${import.meta.env.VITE_API_ENDPOINT}instructor/get_all_files?simulation_group_id=${encodeURIComponent(
          simulationGroupId
        )}&patient_id=${encodeURIComponent(patientData.patient_id)}`,
        {
          method: "GET",
          headers: { Authorization: token, "Content-Type": "application/json" },
        }
      );
      if (response.ok) {
        const fileData = await response.json();
        setLlmFiles(convertFilesToArray(fileData.document_files));
        setPatientFiles(convertFilesToArray(fileData.info_files));
      } else {
        console.error("Failed to fetch files:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching files:", error);
    }
    setLoading(false);
  };

  const convertFilesToArray = (files) => {
    return Object.entries(files || {}).map(([fileName, url]) => ({
      fileName,
      url,
    }));
  };

  const handleDeleteConfirmation = () => setDialogOpen(true);
  const handleDialogClose = () => setDialogOpen(false);

  const handleConfirmDelete = async () => {
    setDialogOpen(false);
    handleDelete();
  };

  const handleDelete = async () => {
    try {
      const { token } = await getAuthSessionAndEmail();
      const s3Response = await fetch(
        `${import.meta.env.VITE_API_ENDPOINT}instructor/delete_patient_s3?simulation_group_id=${encodeURIComponent(
          simulationGroupId
        )}&patient_id=${encodeURIComponent(patientData.patient_id)}`,
        {
          method: "DELETE",
          headers: { Authorization: token, "Content-Type": "application/json" },
        }
      );

      if (!s3Response.ok) throw new Error("Failed to delete patient from S3");

      const patientResponse = await fetch(
        `${import.meta.env.VITE_API_ENDPOINT}instructor/delete_patient?patient_id=${encodeURIComponent(
          patientData.patient_id
        )}`,
        {
          method: "DELETE",
          headers: { Authorization: token, "Content-Type": "application/json" },
        }
      );

      if (patientResponse.ok) {
        toast.success("Successfully Deleted");
        onSave && onSave();
        onClose();
      } else throw new Error("Failed to delete patient");
    } catch (error) {
      console.error("Error deleting patient:", error);
      toast.error("Failed to delete patient");
    }
  };

  const handleSave = async () => {
    if (isSaving) return;

    if (!patientName || !patientAge || !patientGender || !patientPrompt) {
      toast.error("All fields (Name, Age, Gender, Prompt) are required");
      return;
    }

    setIsSaving(true);

    try {
      await updatePatientInfo();
      const { token } = await getAuthSessionAndEmail();

      await Promise.all([
        deleteFiles(deletedLlmFiles, token, true),
        deleteFiles(deletedPatientFiles, token, false),
        uploadFiles(newLlmFiles, token, true),
        uploadFiles(newPatientFiles, token, false),
      ]);

      if (profilePicture) {
        await uploadProfilePicture(profilePicture, token, patientData.patient_id);
      }

      toast.success("Patient updated successfully");
      onSave && onSave();
      onClose();
    } catch (error) {
      console.error("Error saving patient:", error);
      toast.error(`Patient failed to update: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const updatePatientInfo = async () => {
    const { token, email } = await getAuthSessionAndEmail();
    const response = await fetch(
      `${import.meta.env.VITE_API_ENDPOINT}instructor/edit_patient?patient_id=${encodeURIComponent(
        patientData.patient_id
      )}&instructor_email=${encodeURIComponent(email)}`,
      {
        method: "PUT",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          patient_name: patientName,
          patient_age: patientAge,
          patient_gender: patientGender,
          patient_prompt: patientPrompt,
        }),
      }
    );

    if (!response.ok) {
      const errorMessage = await response.text();
      throw new Error(`Failed to update patient: ${errorMessage}`);
    }
  };

  const deleteFiles = async (deletedFiles, token, isLlm) => {
    const fileType = isLlm ? "llm" : "patient";
    const deletePromises = deletedFiles.map(file => {
      const fileName = cleanFileName(file.fileName);
      return fetch(
        `${import.meta.env.VITE_API_ENDPOINT}instructor/delete_file?simulation_group_id=${encodeURIComponent(
          simulationGroupId
        )}&patient_id=${encodeURIComponent(patientData.patient_id)}&file_name=${encodeURIComponent(fileName)}&file_type=${fileType}`,
        {
          method: "DELETE",
          headers: { Authorization: token, "Content-Type": "application/json" },
        }
      );
    });
    await Promise.all(deletePromises);
  };

  const uploadFiles = async (newFiles, token, isLlm) => {
    const fileType = isLlm ? "llm" : "patient";
    const uploadPromises = newFiles.map(async file => {
      const fileName = cleanFileName(file.name);
      const response = await fetch(
        `${import.meta.env.VITE_API_ENDPOINT}instructor/generate_presigned_url?simulation_group_id=${encodeURIComponent(
          simulationGroupId
        )}&patient_id=${encodeURIComponent(patientData.patient_id)}&file_name=${encodeURIComponent(fileName)}&file_type=${fileType}`,
        {
          method: "GET",
          headers: { Authorization: token, "Content-Type": "application/json" },
        }
      );
      const { presignedurl } = await response.json();
      await fetch(presignedurl.presignedurl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
    });
    await Promise.all(uploadPromises);
  };

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

  const getAuthSessionAndEmail = async () => {
    const session = await fetchAuthSession();
    const token = session.tokens.idToken;
    const { email } = await fetchUserAttributes();
    return { token, email };
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Patient</DialogTitle>
      <DialogContent>
        <Box display="flex" alignItems="center" justifyContent="center" mb={2}>
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
        <TextField label="Patient Name" value={patientName} onChange={(e) => setPatientName(e.target.value)} fullWidth margin="normal" required />
        <TextField label="Patient Age" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} fullWidth margin="normal" required />
        <FormControl fullWidth margin="normal" required>
          <InputLabel>Gender</InputLabel>
          <Select value={patientGender} onChange={(e) => setPatientGender(e.target.value)}>
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>
        <TextField label="Patient Prompt" value={patientPrompt} onChange={(e) => setPatientPrompt(e.target.value)} fullWidth margin="normal" multiline rows={4} required />

        <Typography variant="h6" sx={{ mt: 2 }}>LLM Files</Typography>
        <FileManagement
          newFiles={newLlmFiles}
          setNewFiles={setNewLlmFiles}
          files={llmFiles}
          setFiles={setLlmFiles}
          setDeletedFiles={setDeletedLlmFiles}
          savedFiles={savedLlmFiles}
          setSavedFiles={setSavedLlmFiles}
          loading={loading}
          metadata={metadata}
          setMetadata={setMetadata}
        />
        <Typography variant="h6" sx={{ mt: 2 }}>Patient Information Files</Typography>
        <FileManagement
          newFiles={newPatientFiles}
          setNewFiles={setNewPatientFiles}
          files={patientFiles}
          setFiles={setPatientFiles}
          setDeletedFiles={setDeletedPatientFiles}
          savedFiles={savedPatientFiles}
          setSavedFiles={setSavedPatientFiles}
          loading={loading}
          metadata={metadata}
          setMetadata={setMetadata}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="secondary">Cancel</Button>
        <Button onClick={handleDeleteConfirmation} color="error">Delete Patient</Button>
        <Button onClick={handleSave} variant="contained" color="primary">Save Patient</Button>
      </DialogActions>
      <ToastContainer position="top-center" autoClose={2000} />
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>Delete Patient</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this patient? This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">Confirm</Button>
        </DialogActions>
      </Dialog>
    </Dialog>
  );
};

export default InstructorEditPatients;
