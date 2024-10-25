import React, { useState, useRef, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function DraggableNotes({ onClose }) {
  const [noteContent, setNoteContent] = useState("");
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [dimensions, setDimensions] = useState({ width: 400, height: 300 });
  const noteRef = useRef(null);
  const isDragging = useRef(false);
  const isResizing = useRef(false);

  // Load the note content from localStorage when the component mounts
  useEffect(() => {
    const savedNotes = localStorage.getItem("studentNotes");
    if (savedNotes) {
      setNoteContent(savedNotes); // Restore saved note content
    }
  }, []);

  const handleNoteChange = (e) => {
    setNoteContent(e.target.value);
  };

  // Function to save notes manually
  const handleSave = () => {
    localStorage.setItem("studentNotes", noteContent);
    
    // Display toast notification (consistent with other parts of the app)
    toast.success("Notes saved successfully!", {
      position: "top-center",
      autoClose: 1000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "colored",
    });
  };

  const handleMouseDown = (e) => {
    if (e.target.tagName.toLowerCase() === "textarea" || isResizing.current) return;

    isDragging.current = true;
    noteRef.current.style.cursor = "grabbing";

    const offsetX = e.clientX - position.x;
    const offsetY = e.clientY - position.y;

    const handleMouseMove = (moveEvent) => {
      if (isDragging.current) {
        setPosition({
          x: moveEvent.clientX - offsetX,
          y: moveEvent.clientY - offsetY,
        });
      }
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      noteRef.current.style.cursor = "grab";
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleResizeMouseDown = (e) => {
    e.preventDefault();
    isResizing.current = true;
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = dimensions.width;
    const startHeight = dimensions.height;

    const onMouseMove = (moveEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      const newHeight = startHeight + (moveEvent.clientY - startY);

      setDimensions({
        width: newWidth > 200 ? newWidth : 200,
        height: newHeight > 150 ? newHeight : 150,
      });
    };

    const onMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  };

  return (
    <div
      ref={noteRef}
      onMouseDown={handleMouseDown}
      style={{
        position: "absolute",
        top: `${position.y}px`,
        left: `${position.x}px`,
        width: `${dimensions.width}px`,
        height: `${dimensions.height}px`,
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        resize: "none",
        overflow: "hidden",
        cursor: "grab",
        zIndex: 1000,
      }}
    >
      {/* Draggable header area */}
      <div
        style={{
          backgroundColor: "#f0f0f0",
          padding: "5px 10px",
          cursor: "grab",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          position: "relative",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            right: "0",
            top: "0",
            background: "transparent",
            border: "none",
            color: "red",
            fontSize: "12px",
            padding: "5px",
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          x
        </button>
        <span style={{ fontWeight: "bold", color: "black" }}>Notes</span>
      </div>

      {/* Textarea with draggable functionality */}
      <div style={{ height: "calc(100% - 80px)", width: "100%" }}>
        <textarea
          style={{
            width: "100%",
            height: "100%",
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            resize: "none",
            backgroundColor: "#f9f9f9",
            color: "#000",
            whiteSpace: "pre-wrap",
            overflowWrap: "break-word",
          }}
          placeholder="Write your notes here..."
          value={noteContent}
          onChange={handleNoteChange}
          rows={10}
        />
      </div>

      {/* Save button */}
      <div style={{ padding: "5px 10px", textAlign: "right", marginTop: "5px", marginBottom: "10px" }}>
        <button
          onClick={handleSave}
          style={{
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            padding: "5px 10px",
            fontSize: "12px",
            borderRadius: "4px",
            cursor: "pointer",
            width: "80px", 
          }}
        >
          Save
        </button>
      </div>

      {/* Resizer Handle */}
      <div
        onMouseDown={handleResizeMouseDown}
        style={{
          width: "10px",
          height: "10px",
          backgroundColor: "#ccc",
          position: "absolute",
          right: "0",
          bottom: "0",
          cursor: "nwse-resize",
        }}
      ></div>

      <ToastContainer
        position="top-center"
        autoClose={1000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </div>
  );
}

export default DraggableNotes;
            padding: "5px 10px",
