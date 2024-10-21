import { useState } from "react";
import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  TextField,
  Box,
} from "@mui/material";

function StudentNotes({ open, onClose }) {
  const [notes, setNotes] = useState([]);
  const [activeNote, setActiveNote] = useState(null);
  const [newNoteTitle, setNewNoteTitle] = useState("");

  const handleAddNewNote = () => {
    const newNote = {
      id: Date.now(),
      title: newNoteTitle || `Note ${notes.length + 1}`,
      content: "",
    };
    setNotes((prevNotes) => [...prevNotes, newNote]);
    setActiveNote(newNote);
    setNewNoteTitle("");
  };

  const handleNoteChange = (e) => {
    const updatedNote = { ...activeNote, content: e.target.value };
    setActiveNote(updatedNote);
    setNotes((prevNotes) =>
      prevNotes.map((note) => (note.id === activeNote.id ? updatedNote : note))
    );
  };

  const handleDeleteNote = (noteId) => {
    setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
    if (activeNote && activeNote.id === noteId) {
      setActiveNote(null);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>Student Notes</DialogTitle>
      <DialogContent>
        <Box display="flex" flexDirection="column" gap={2}>
          <Box>
            <TextField
              label="New Note Title"
              value={newNoteTitle}
              onChange={(e) => setNewNoteTitle(e.target.value)}
              fullWidth
              variant="outlined"
            />
            <Button onClick={handleAddNewNote} sx={{ mt: 1 }}>
              Add New Note
            </Button>
          </Box>
          <Box>
            <h3>Notes List</h3>
            {notes.map((note) => (
              <Box
                key={note.id}
                sx={{ cursor: "pointer", borderBottom: "1px solid #ccc", mb: 1 }}
                onClick={() => setActiveNote(note)}
              >
                {note.title}
                <Button
                  onClick={() => handleDeleteNote(note.id)}
                  color="error"
                  sx={{ ml: 2 }}
                >
                  Delete
                </Button>
              </Box>
            ))}
          </Box>

          {activeNote && (
            <Box>
              <h3>{activeNote.title}</h3>
              <TextField
                label="Note Content"
                multiline
                fullWidth
                rows={6}
                value={activeNote.content}
                onChange={handleNoteChange}
                sx={{ mt: 1 }} // Added margin-top to slightly lower the Note Content field
              />
            </Box>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default StudentNotes;
