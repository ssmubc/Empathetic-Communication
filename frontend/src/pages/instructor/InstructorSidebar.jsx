import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import HomeIcon from "@mui/icons-material/Home"; // old icon
import ViewTimelineIcon from "@mui/icons-material/ViewTimeline";
import EditIcon from "@mui/icons-material/Edit";
import PsychologyIcon from "@mui/icons-material/Psychology";
import GroupIcon from "@mui/icons-material/Group";

import GroupsIcon from '@mui/icons-material/Groups';
import ShowChartIcon from '@mui/icons-material/ShowChart';

const InstructorSidebar = ({ setSelectedComponent }) => {
  const navigate = useNavigate();
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

  const handleNavigation = (component) => {
    if (component === "InstructorAllCourses") {
      navigate("/home"); 
    } else {
      setSelectedComponent(component);
    }
  };

  return (
    <>
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
            textAlign: drawerWidth <= 160 ? "center" : "left",
          }}
        >
          <List>
            <ListItem button onClick={() => handleNavigation("InstructorAllCourses")}>
              <ListItemIcon sx={{ justifyContent: drawerWidth <= 160 ? "center" : "flex-start" }}>
                <GroupsIcon />
              </ListItemIcon>
              {drawerWidth > 160 && <ListItemText primary="All Groups" />}
            </ListItem>
            <Divider />
            <ListItem button onClick={() => handleNavigation("InstructorAnalytics")}>
              <ListItemIcon sx={{ justifyContent: drawerWidth <= 160 ? "center" : "flex-start" }}>
                <ShowChartIcon />
              </ListItemIcon>
              {drawerWidth > 160 && <ListItemText primary="Analytics" />}
            </ListItem>
            <Divider />
            <ListItem button onClick={() => handleNavigation("InstructorEditConcepts")}>
              <ListItemIcon sx={{ justifyContent: drawerWidth <= 160 ? "center" : "flex-start" }}>
                <EditIcon />
              </ListItemIcon>
              {drawerWidth > 160 && <ListItemText primary="Edit Patients" />}
            </ListItem>
            <Divider />
            <ListItem button onClick={() => handleNavigation("PromptSettings")}>
              <ListItemIcon sx={{ justifyContent: drawerWidth <= 160 ? "center" : "flex-start" }}>
                <PsychologyIcon />
              </ListItemIcon>
              {drawerWidth > 160 && <ListItemText primary="Prompt Settings" />}
            </ListItem>
            <Divider />
            <ListItem button onClick={() => handleNavigation("ViewStudents")}>
              <ListItemIcon sx={{ justifyContent: drawerWidth <= 160 ? "center" : "flex-start" }}>
                <GroupIcon />
              </ListItemIcon>
              {drawerWidth > 160 && <ListItemText primary="View Students" />}
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

export default InstructorSidebar;
