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

const AdminSidebar = ({
  setSelectedComponent,
  setSelectedInstructor,
  setSelectedGroup,
}) => {
  const [drawerWidth, setDrawerWidth] = useState(220);

  const handleMouseMove = (e) => {
    const newWidth = e.clientX;
    if (newWidth >= 85 && newWidth <= 400) {
      setDrawerWidth(newWidth);
    }
  };

  const stopResizing = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.userSelect = "";
  };

  const startResizing = (e) => {
    e.preventDefault();
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
    document.body.style.userSelect = "none";
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
            backgroundColor: "#4de698",
            boxShadow: "none",
            transition: "width 0.2s ease",
            overflowX: "hidden",
          },
        }}
      >
        <Box
          sx={{
            overflow: "hidden",
            paddingTop: 10,
          }}
        >
          <List>
            <ListItem
              button
              onClick={() => {
                setSelectedInstructor(null);
                setSelectedGroup(null);
                setSelectedComponent("AdminInstructors");
              }}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row", // Ensures icon and text are in a row
              }}
            >
              <ListItemIcon
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minWidth: "40px", // Ensures space for the icon
                }}
              >
                <ContactPageIcon />
              </ListItemIcon>
              {drawerWidth > 160 && (
                <ListItemText
                  primary="Instructors"
                  sx={{
                    textAlign: "left", // Aligns text with the icon when expanded
                    marginLeft: 2, // Adds spacing between icon and text
                  }}
                />
              )}
            </ListItem>
            <Divider />
            <ListItem
              button
              onClick={() => {
                setSelectedInstructor(null);
                setSelectedGroup(null);
                setSelectedComponent("AdminSimulationGroups");
              }}
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                flexDirection: "row", // Ensures icon and text are in a row
              }}
            >
              <ListItemIcon
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minWidth: "40px", // Ensures space for the icon
                }}
              >
                <GroupsIcon />
              </ListItemIcon>
              {drawerWidth > 160 && (
                <ListItemText
                  primary="Simulation Groups"
                  sx={{
                    textAlign: "left", // Aligns text with the icon when expanded
                    marginLeft: 2, // Adds spacing between icon and text
                  }}
                />
              )}
            </ListItem>
            <Divider />
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
