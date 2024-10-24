import { Dialog, DialogActions, DialogContent, DialogTitle, Button, Typography } from '@mui/material';
import { useState, useEffect } from 'react';

function PatientInfo({ open, onClose, patientId }) {
  const [patientFiles, setPatientFiles] = useState([]);

  useEffect(() => {
    
    const fetchPatientFiles = async () => {
      const response = await fetch(`/api/get_patient_files?patientId=${patientId}`);
      const data = await response.json();
      setPatientFiles(data);  
    };

    if (open) {
      fetchPatientFiles();
    }
  }, [open, patientId]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Patient Information</DialogTitle>
      <DialogContent>
        {patientFiles.length === 0 ? (
          <Typography>No patient information available.</Typography>
        ) : (
          <ul>
            {patientFiles.map((file, index) => (
              <li key={index}>{file}</li>
            ))}
          </ul>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default PatientInfo;
