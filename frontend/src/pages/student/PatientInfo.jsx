import { Dialog, DialogActions, DialogContent, DialogTitle, Button } from "@mui/material";

function PatientInfo({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Patient Information</DialogTitle>
      <DialogContent>
        <p>placeholder for patient information.</p>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default PatientInfo;
