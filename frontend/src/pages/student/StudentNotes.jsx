import { useState } from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle, Button, TextField, Box } from "@mui/material";

function StudentNotes({ open, onClose }) {
  const [noteContent, setNoteContent] = useState("");
  const handleNoteChange = (e) => {
    setNoteContent(e.target.value);
  };
  
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Note</DialogTitle> {/* Title */}
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Note Content" // Label for the note content
            multiline
            fullWidth
            rows={10} // Number of rows in the text box
            value={noteContent}
            onChange={handleNoteChange}
            variant="outlined"
            sx={{ mt: 2 }} // Added margin-top to move the text box lower
            InputProps={{
              style: { whiteSpace: 'pre-wrap' }, // Ensures newlines are respected
            }}
            inputProps={{
              maxLength: 10000, // Maximum number of characters
            }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default StudentNotes;
