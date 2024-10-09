import React, { useState } from "react";
// MUI
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
} from "@mui/material";
import ContactPageIcon from "@mui/icons-material/ContactPage";
import GroupsIcon from "@mui/icons-material/Groups";
import AddCircleIcon from "@mui/icons-material/AddCircle";

const AdminSidebar = ({
  setSelectedComponent,
  setSelectedInstructor,
  setSelectedCourse,
}) => {
  // State to control the drawer width
  const [drawerWidth, setDrawerWidth] = useState(220);

  // Function to handle mouse drag for resizing
  const handleMouseMove = (e) => {
    const newWidth = e.clientX; // Get the new width based on the mouse position
    if (newWidth >= 85 && newWidth <= 400) { // Limit the resizing range
      setDrawerWidth(newWidth);
    }
  };

  // Function to handle mouse release (stop resizing)
  const stopResizing = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.userSelect = ""; // Re-enable text selection
  };

  // Start resizing on mousedown
  const startResizing = (e) => {
    e.preventDefault(); // Prevent default behavior to avoid issues
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
    document.body.style.userSelect = "none"; // Disable text selection
  };

  return (
    <>
      {/* Drawer */}
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            background: "linear-gradient(to top, #ee7b7b, #faf5f5)",
            transition: "width 0.2s ease", // Smooth transition for resizing
            overflowX: "hidden", // Prevent horizontal scroll bar
          },
        }}
      >
        <Box
          sx={{
            overflow: "hidden", // Prevent horizontal scrolling
            paddingTop: 10,
            textAlign: drawerWidth <= 160 ? "center" : "left", // Center icons when sidebar is small
          }}
        >
          <List>
            <ListItem
              button
              onClick={() => {
                setSelectedInstructor(null);
                setSelectedCourse(null);
                setSelectedComponent("AdminInstructors");
              }}
            >
              <ListItemIcon
                sx={{
                  justifyContent: drawerWidth <= 160 ? "center" : "flex-start", // Center icons when text is hidden
                  display: "flex",
                }}
              >
                <ContactPageIcon />
              </ListItemIcon>
              {drawerWidth > 160 && ( // Hide text when sidebar is narrow
                <ListItemText primary="Instructors" />
              )}
            </ListItem>
            <Divider />
            <ListItem
              button
              onClick={() => {
                setSelectedInstructor(null);
                setSelectedCourse(null);
                setSelectedComponent("AdminSimulationGroups");
              }}
            >
              <ListItemIcon
                sx={{
                  justifyContent: drawerWidth <= 160 ? "center" : "flex-start", // Center icons when text is hidden
                  display: "flex",
                }}
              >
                <GroupsIcon />
              </ListItemIcon>
              {drawerWidth > 160 && ( // Hide text when sidebar is narrow
                <ListItemText primary="Simulation Groups" />
              )}
            </ListItem>
            <Divider />
            <ListItem
              button
              onClick={() => {
                setSelectedInstructor(null);
                setSelectedCourse(null);
                setSelectedComponent("AdminCreateSimulationGroup");
              }}
            >
              <ListItemIcon
                sx={{
                  justifyContent: drawerWidth <= 160 ? "center" : "flex-start", // Center icons when text is hidden
                  display: "flex",
                }}
              >
                <AddCircleIcon />
              </ListItemIcon>
              {drawerWidth > 160 && ( // Hide text when sidebar is narrow
                <ListItemText primary="Create Group" />
              )}
            </ListItem>
          </List>
        </Box>
      </Drawer>

      {/* Resizing Handle */}
      <div
        onMouseDown={startResizing}
        style={{
          width: "5px",
          cursor: "col-resize",
          height: "100vh",
          backgroundColor: "transparent",
          position: "absolute",
          top: 0,
          left: drawerWidth,
        }}
      />
    </>
  );
};

export default AdminSidebar;
