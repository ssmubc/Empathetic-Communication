import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { fetchAuthSession } from "aws-amplify/auth";
import { fetchUserAttributes } from "aws-amplify/auth";

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
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from "@mui/material";
import PageContainer from "../Container";
import FileManagement from "../../components/FileManagement";

function titleCase(str) {
  if (typeof str !== "string") {
    return str;
  }
  return str
    .toLowerCase()
    .split(" ")
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

const InstructorEditPatients = () => {
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [metadata, setMetadata] = useState({});
  const [patientMetadata, setPatientMetadata] = useState({});

  const [files, setFiles] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [savedFiles, setSavedFiles] = useState([]);
  const [deletedFiles, setDeletedFiles] = useState([]);

  const [patientFiles, setPatientFiles] = useState([]);
  const [newPatientFiles, setNewPatientFiles] = useState([]);
  const [savedPatientFiles, setSavedPatientFiles] = useState([]);
  const [deletedPatientFiles, setDeletedPatientFiles] = useState([]);

  const location = useLocation();
  const [patient, setPatient] = useState(null);
  const { patientData, simulation_group_id } = location.state || {};
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("");
  const [patientPrompt, setPatientPrompt] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleBackClick = () => {
    window.history.back();
  };

  const handleDeleteConfirmation = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
  };

  const handleConfirmDelete = async () => {
    setDialogOpen(false);
    handleDelete();
  };

  function convertDocumentFilesToArray(files) {
    const documentFiles = files.document_files;
    const resultArray = Object.entries({
      ...documentFiles,
    }).map(([fileName, url]) => ({
      fileName,
      url,
    }));

    const metadata = resultArray.reduce((acc, { fileName, url }) => {
      acc[fileName] = url.metadata;
      return acc;
    }, {});

    setMetadata(metadata);
    return resultArray;
  }

  function convertInfoFilesToArray(files) {
    const infoFiles = files.info_files;
    const resultArray = Object.entries({
      ...infoFiles,
    }).map(([fileName, url]) => ({
      fileName,
      url,
    }));

    const metadata = resultArray.reduce((acc, { fileName, url }) => {
      acc[fileName] = url.metadata;
      return acc;
    }, {});

    setPatientMetadata(metadata);
    return resultArray;
  }

  function removeFileExtension(fileName) {
    return fileName.replace(/\.[^/.]+$/, "");
  }

  const fetchFiles = async () => {
    try {
      const { token, email } = await getAuthSessionAndEmail();
      const response = await fetch(
        `${
          import.meta.env.VITE_API_ENDPOINT
        }instructor/get_all_files?simulation_group_id=${encodeURIComponent(
          simulation_group_id
        )}&patient_id=${encodeURIComponent(
          patient.patient_id
        )}&patient_name=${encodeURIComponent(patientName)}`,
        {
          method: "GET",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const fileData = await response.json();
        setFiles(convertDocumentFilesToArray(fileData));
        setPatientFiles(convertInfoFilesToArray(fileData));
      } else {
        console.error("Failed to fetch files:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching Files:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (patientData) {
      console.log("Patient Data:", patientData);
      setPatient(patientData);
      setPatientName(patientData.patient_name);
      setPatientAge(patientData.patient_age);
      setPatientGender(patientData.patient_gender);
      setPatientPrompt(patientData.patient_prompt);
    }
  }, [patientData]);

  useEffect(() => {
    if (patient) {
      fetchFiles();
    }
  }, [patient]);

  const handleDelete = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken
      const s3Response = await fetch(
        `${
          import.meta.env.VITE_API_ENDPOINT
        }instructor/delete_patient_s3?simulation_group_id=${encodeURIComponent(
          simulation_group_id
        )}&patient_id=${encodeURIComponent(
          patient.patient_id
        )}&patient_name=${encodeURIComponent(patient.patient_name)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );

      if (!s3Response.ok) {
        throw new Error("Failed to delete patient from S3");
      }
      const patientResponse = await fetch(
        `${
          import.meta.env.VITE_API_ENDPOINT
        }instructor/delete_patient?patient_id=${encodeURIComponent(
          patient.patient_id
        )}`,
        {
          method: "DELETE",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );

      if (patientResponse.ok) {
        toast.success("Successfully Deleted", {
          position: "top-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
        setTimeout(() => {
          handleBackClick();
        }, 1000);
      } else {
        throw new Error("Failed to delete patient");
      }
    } catch (error) {
      console.error(error.message);
      toast.error("Failed to delete patient", {
        position: "top-center",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    }
  };

  const handleInputChange = (e) => {
    setPatientName(e.target.value);
  };

  const getFileType = (filename) => {
    const parts = filename.split(".");
    return parts.length > 1 ? parts.pop() : "";
  };

  const updatePatient = async () => {
    const { token, email } = await getAuthSessionAndEmail();

    const editPatientResponse = await fetch(
      `${
        import.meta.env.VITE_API_ENDPOINT
      }instructor/edit_patient?patient_id=${encodeURIComponent(
        patient.patient_id
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

    if (!editPatientResponse.ok) {
      throw new Error(editPatientResponse.statusText);
    }

    return editPatientResponse;
  };

  const deleteFiles = async (deletedFiles, token) => {
    const deletePromises = deletedFiles.map((file_name) => {
      const fileType = getFileType(file_name);
      const fileName = cleanFileName(removeFileExtension(file_name));
      return fetch(
        `${
          import.meta.env.VITE_API_ENDPOINT
        }instructor/delete_file?simulation_group_id=${encodeURIComponent(
          simulation_group_id
        )}&patient_id=${encodeURIComponent(
          patient.patient_id
        )}&patient_name=${encodeURIComponent(
          patientName
        )}&file_type=${encodeURIComponent(
          fileType
        )}&file_name=${encodeURIComponent(fileName)}`,
        {
          method: "DELETE",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );
    });
    await Promise.all(deletePromises);
  };

  const cleanFileName = (fileName) => fileName.replace(/[^a-zA-Z0-9._-]/g, "_");

  const uploadFiles = async (newFiles, token) => {
    const uploadPromises = newFiles.map(async (file) => {
      const fileType = getFileType(file.name);
      const fileName = cleanFileName(removeFileExtension(file.name));

      const response = await fetch(
        `${
          import.meta.env.VITE_API_ENDPOINT
        }instructor/generate_presigned_url?simulation_group_id=${encodeURIComponent(
          simulation_group_id
        )}&patient_id=${encodeURIComponent(
          patient.patient_id
        )}&patient_name=${encodeURIComponent(
          patientName
        )}&file_type=${encodeURIComponent(
          fileType
        )}&file_name=${encodeURIComponent(fileName)}&is_document=${true}`,
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
          "Content-Type": file.type,
        },
        body: file,
      });
      return file;
    });

    const uploadedFiles = await Promise.all(uploadPromises);
    setSavedFiles((prevFiles) => [...prevFiles, ...uploadedFiles]);
  };

  const uploadPatientFiles = async (newPatientFiles, token) => {
    const uploadPromises = newPatientFiles.map(async (file) => {
      const fileType = getFileType(file.name);
      const fileName = cleanFileName(removeFileExtension(file.name));

      const response = await fetch(
        `${
          import.meta.env.VITE_API_ENDPOINT
        }instructor/generate_presigned_url?simulation_group_id=${encodeURIComponent(
          simulation_group_id
        )}&patient_id=${encodeURIComponent(
          patient.patient_id
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
      );

      const presignedUrl = await response.json();
      await fetch(presignedUrl.presignedurl, {
        method: "PUT",
        headers: {
          "Content-Type": file.type,
        },
        body: file,
      });
      return file;
    });

    const uploadedPatientFiles = await Promise.all(uploadPromises);
    setSavedPatientFiles((prevFiles) => [...prevFiles, ...uploadedPatientFiles]);
  };

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    if (!patientName) {
      toast.error("Patient Name is required.", { position: "top-center" });
      setIsSaving(false);
      return;
    }
    if (!patientAge) {
      toast.error("Patient Age is required.", { position: "top-center" });
      setIsSaving(false);
      return;
    }
    if (!patientPrompt) {
      toast.error("Patient Prompt is required.", { position: "top-center" });
      setIsSaving(false);
      return;
    }

    try {
      await updatePatient();
      const { token } = await getAuthSessionAndEmail();
      await deleteFiles(deletedFiles, token);
      await uploadFiles(newFiles, token); // Upload LLM files
      await uploadPatientFiles(newPatientFiles, token); // Upload Patient Info files

      await Promise.all([
        updateMetaData(files, token),
        updateMetaData(savedFiles, token),
        updateMetaData(newFiles, token),
      ]);

      setFiles((prevFiles) =>
        prevFiles.filter((file) => !deletedFiles.includes(file.fileName))
      );

      setDeletedFiles([]);
      setNewFiles([]);
      setDeletedPatientFiles([]);
      setNewPatientFiles([]);
      toast.success("Patient updated successfully", { position: "top-center" });

      setTimeout(() => handleBackClick(), 1000);
    } catch (error) {
      console.error("Error saving patient:", error);
      toast.error("Patient failed to update", { position: "top-center" });
    } finally {
      setIsSaving(false);
    }
  };

  const updateMetaData = (files, token) => {
    files.forEach((file) => {
      const fileNameWithExtension = file.fileName || file.name;
      const fileMetadata = metadata[fileNameWithExtension] || "";
      const fileName = cleanFileName(removeFileExtension(fileNameWithExtension));
      const fileType = getFileType(fileNameWithExtension);
      fetch(
        `${
          import.meta.env.VITE_API_ENDPOINT
        }instructor/update_metadata?patient_id=${encodeURIComponent(
          patient.patient_id
        )}&filename=${encodeURIComponent(
          fileName
        )}&filetype=${encodeURIComponent(fileType)}`,
        {
          method: "PUT",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ metadata: fileMetadata }),
        }
      );
    });
  };

  const getAuthSessionAndEmail = async () => {
    const session = await fetchAuthSession();
    const token = session.tokens.idToken;
    const { email } = await fetchUserAttributes();
    return { token, email };
  };

  if (!patient) return <Typography>Loading...</Typography>;

  return (
    <PageContainer>
      <Paper style={{ padding: 25, width: "100%", overflow: "auto" }}>
        <Typography variant="h6">
          Edit Patient {titleCase(patient.patient_name)}{" "}
        </Typography>

        <TextField
          label="Patient Name"
          name="name"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
          fullWidth
          margin="normal"
          inputProps={{ maxLength: 50 }}
        />
        
        <TextField
          label="Patient Age"
          name="age"
          value={patientAge}
          onChange={(e) => setPatientAge(e.target.value)}
          fullWidth
          margin="normal"
        />
        
        <FormControl fullWidth margin="normal">
          <InputLabel>Gender</InputLabel>
          <Select
            value={patientGender}
            onChange={(e) => setPatientGender(e.target.value)}
          >
            <MenuItem value="Male">Male</MenuItem>
            <MenuItem value="Female">Female</MenuItem>
            <MenuItem value="Other">Other</MenuItem>
          </Select>
        </FormControl>

        <TextField
          label="Patient Prompt"
          value={patientPrompt}
          onChange={(e) => setPatientPrompt(e.target.value)}
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
              <Button
                variant="contained"
                color="error"
                onClick={handleDeleteConfirmation}
                sx={{ width: "30%" }}
              >
                Delete Patient
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
      <Dialog open={dialogOpen} onClose={handleDialogClose}>
        <DialogTitle>{"Delete Patient"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this patient? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </PageContainer>
  );
};

export default InstructorEditPatients;
