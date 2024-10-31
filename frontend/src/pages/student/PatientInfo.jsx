import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import { useState, useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";

function PatientInfo({ open, onClose, patientId, patientName, simulationGroupId }) {
  const [patientInfoFiles, setPatientInfoFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null); // State to store selected file for viewing

  useEffect(() => {
    const fetchPatientInfoFiles = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens.idToken;

        const response = await fetch(
          `${import.meta.env.VITE_API_ENDPOINT}student/get_all_files?simulation_group_id=${encodeURIComponent(
            simulationGroupId
          )}&patient_id=${encodeURIComponent(
            patientId
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
          const data = await response.json();
          const infoFiles = Object.entries(data.info_files).map(
            ([fileName, fileDetails]) => ({
              name: fileName,
              url: fileDetails.url,
            })
          );
          setPatientInfoFiles(infoFiles);
        } else {
          console.error("Failed to fetch patient info files:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching patient info files:", error);
      }
    };

    if (open) {
      fetchPatientInfoFiles();
    }
  }, [open, patientId, simulationGroupId]);

  const handleFileClick = (file) => {
    setSelectedFile(file);
  };

  const handleCloseFileViewer = () => {
    setSelectedFile(null);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Patient Information Files</DialogTitle>
      <DialogContent>
        {patientInfoFiles.length === 0 ? (
          <Typography>No patient information files available.</Typography>
        ) : (
          <List>
            {patientInfoFiles.map((file, index) => (
              <ListItem
                key={index}
                button
                onClick={() => handleFileClick(file)}
              >
                <ListItemText primary={file.name} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {/* File Viewer Dialog */}
      {selectedFile && (
        <Dialog open={!!selectedFile} onClose={handleCloseFileViewer} fullWidth maxWidth="lg">
          <DialogTitle>{selectedFile.name}</DialogTitle>
          <DialogContent>
            <iframe
              src={selectedFile.url}
              title={selectedFile.name}
              width="100%"
              height="600px"
              style={{ border: "none" }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseFileViewer} color="primary">
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Dialog>
  );
}

export default PatientInfo;
