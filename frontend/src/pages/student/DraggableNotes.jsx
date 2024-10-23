import React, { useState, useRef, useEffect } from "react";

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

  // Save the note content to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("studentNotes", noteContent);
  }, [noteContent]);

  const handleNoteChange = (e) => {
    setNoteContent(e.target.value);
  };

  const handleMouseDown = (e) => {
    // Prevent dragging if the target is the textarea or resize handle
    if (e.target.tagName.toLowerCase() === "textarea" || isResizing.current)
      return;

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

  // Handle resizing the outer box
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
        width: newWidth > 200 ? newWidth : 200, // Enforce minimum width
        height: newHeight > 150 ? newHeight : 150, // Enforce minimum height
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
        width: `${dimensions.width}px`, // Bound width to state
        height: `${dimensions.height}px`, // Bound height to state
        backgroundColor: "#fff",
        border: "1px solid #ccc",
        boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
        resize: "none", // Disable native resizing for the outer container
        overflow: "hidden", // Prevent overflow issues
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
          position: "relative", // Ensures the 'x' button stays in the right corner
        }}
      >
        {/* Small "x" button inside the textarea */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            right: "0",  // Adjusted to perfectly align in the top-right corner
            top: "0",    // Adjusted to perfectly align in the top-right corner
            background: "transparent",
            border: "none",
            color: "red",
            fontSize: "12px",
            padding: "5px",  // Added some padding for better clickable area
            cursor: "pointer",
            zIndex: 10,
          }}
        >
          x
        </button>
        <span style={{ fontWeight: "bold", color: "black" }}>Notes</span> {/* Notes text is centered and black */}
      </div>

      {/* Textarea with draggable functionality */}
      <div style={{ height: "calc(100% - 35px)", width: "100%" }}>
        <textarea
          style={{
            width: "100%", // Matches the outer container's width
            height: "100%", // Matches the outer container's height
            padding: "10px",
            borderRadius: "4px",
            border: "1px solid #ccc",
            resize: "none", // Disable resizing inside the textarea
            backgroundColor: "#f9f9f9",
            color: "#000", // Ensure the text color is black
            whiteSpace: "pre-wrap", // Preserve line breaks and formatting
            overflowWrap: "break-word", // Ensure words wrap properly
          }}
          placeholder="Write your notes here..."
          value={noteContent}
          onChange={handleNoteChange}
          rows={10}
        />
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
    </div>
  );
}

export default DraggableNotes;
