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
  IconButton,
} from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import RefreshIcon from "@mui/icons-material/Refresh";
import RotateRightIcon from "@mui/icons-material/RotateRight";
import { useState, useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import { hourglass } from "ldrs";

hourglass.register();

const IMAGE_FILE_TYPES = [
  "bmp", "gif", "jpeg", "jpg", "j2k", "jp2", "png", "ppm", "pgm", "pbm", 
  "sgi", "tga", "tiff", "tif", "webp", "xbm"
];

function PatientInfo({ open, onClose, patientId, patientName, simulationGroupId }) {
  const [patientInfoFiles, setPatientInfoFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const fetchPatientInfoFiles = async () => {
      setIsLoading(true);
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
              type: fileName.split('.').pop().toLowerCase(), 
            })
          );
          setPatientInfoFiles(infoFiles);
        } else {
          console.error("Failed to fetch patient info files:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching patient info files:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchPatientInfoFiles();
    }
  }, [open, patientId, simulationGroupId]);

  const handleFileClick = (file) => {
    setSelectedFile(file);
    setScale(1); 
    setPosition({ x: 0, y: 0 }); 
    setRotation(0); 
  };

  const handleCloseFileViewer = () => {
    setSelectedFile(null);
  };

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + 0.2, 3)); 
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - 0.2, 1)); 
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0); 
  };

  const handleRotate = () => {
    setRotation((prevRotation) => (prevRotation + 90) % 360); 
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX - position.x;
    const startY = e.clientY - position.y;

    const handleMouseMove = (moveEvent) => {
      setPosition({
        x: moveEvent.clientX - startX,
        y: moveEvent.clientY - startY,
      });
    };

    const handleMouseUp = () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  const isImageFile = (fileType) => IMAGE_FILE_TYPES.includes(fileType);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Patient Information Files</DialogTitle>
      <DialogContent>
        {isLoading ? (
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "200px" }}>
            <l-hourglass size="40" bg-opacity="0.1" speed="1.75" color="black" />
          </div>
        ) : patientInfoFiles.length === 0 ? (
          <Typography>No patient information files available.</Typography>
        ) : (
          <List>
            {patientInfoFiles.map((file, index) => (
              <ListItem key={index} button onClick={() => handleFileClick(file)}>
                <ListItemText primary={file.name} />
              </ListItem>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>

      {selectedFile && (
        <Dialog open={!!selectedFile} onClose={handleCloseFileViewer} fullWidth maxWidth="lg">
          <DialogTitle>{selectedFile.name}</DialogTitle>
          <DialogContent>
            {isImageFile(selectedFile.type) ? (
              <div
                style={{
                  overflow: "hidden",
                  cursor: "grab",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "600px",
                  position: "relative",
                }}
                onMouseDown={handleMouseDown}
              >
                <img
                  src={selectedFile.url}
                  alt={selectedFile.name}
                  style={{
                    transform: `scale(${scale}) translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
                    transition: "transform 0.1s ease-out",
                    maxWidth: "100%",
                    maxHeight: "100%",
                    cursor: "grab",
                  }}
                />
              </div>
            ) : (
              <iframe
                src={selectedFile.url}
                title={selectedFile.name}
                width="100%"
                height="600px"
                style={{ border: "none" }}
              />
            )}
          </DialogContent>
          <DialogActions>
            {isImageFile(selectedFile.type) && (
              <>
                <IconButton onClick={handleZoomIn} color="primary">
                  <ZoomInIcon />
                </IconButton>
                <IconButton onClick={handleZoomOut} color="primary">
                  <ZoomOutIcon />
                </IconButton>
                <IconButton onClick={handleRotate} color="primary">
                  <RotateRightIcon />
                </IconButton>
                <IconButton onClick={handleReset} color="primary">
                  <RefreshIcon />
                </IconButton>
              </>
            )}
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
