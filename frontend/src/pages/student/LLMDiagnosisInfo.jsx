import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
} from "@mui/material";
import { fetchAuthSession } from "aws-amplify/auth";
import { fetchUserAttributes } from "aws-amplify/auth";

const LLMDiagnosisInfo = ({ open, onClose, simulationGroupId, patientId }) => {
  const [llmFiles, setLlmFiles] = useState([]); // To store the LLM files
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchLlmFiles(); // Fetch files only when the dialog opens
    }
  }, [open]);

  const fetchLlmFiles = async () => {
    setLoading(true);

    try {
      const session = await fetchAuthSession();
      const { email } = await fetchUserAttributes();
      const token = session.tokens.idToken;

      const response = await fetch(
        `${
          import.meta.env.VITE_API_ENDPOINT
        }student/get_llm_files?simulation_group_id=${encodeURIComponent(
          simulationGroupId
        )}&patient_id=${encodeURIComponent(patientId)}&student_email=${encodeURIComponent(email)}`,
        {
          method: "GET",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const files = await response.json();
        setLlmFiles(files);
      } else {
        console.error("Failed to fetch LLM files:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching LLM files:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>LLM Patient Diagnosis</DialogTitle>
      <DialogContent>
        {loading ? (
          <CircularProgress />
        ) : llmFiles.length > 0 ? (
          <List>
            {llmFiles.map((file) => (
              <ListItem
                key={file.file_name}
                button
                component="a"
                href={file.presigned_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ListItemText primary={file.file_name} />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body1" color="textSecondary">
            No LLM files available for this patient.
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LLMDiagnosisInfo;
