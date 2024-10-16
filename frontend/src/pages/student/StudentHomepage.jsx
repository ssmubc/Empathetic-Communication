import { useEffect, useState, useContext } from "react";
import StudentHeader from "../../components/StudentHeader";
import Container from "../Container";
import { fetchAuthSession } from "aws-amplify/auth";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// pulse for loading animation
import { cardio } from 'ldrs'
cardio.register()

// MUI
import {
  Card,
  CardActions,
  CardContent,
  Button,
  Typography,
  Box,
  Grid,
  Stack,
  Skeleton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { fetchUserAttributes } from "aws-amplify/auth";
import { useNavigate } from "react-router-dom";
import { UserContext } from "../../App";
// MUI theming
const { palette } = createTheme();
const { augmentColor } = palette;
const createColor = (mainColor) => augmentColor({ color: { main: mainColor } });
const theme = createTheme({
  palette: {
    primary: createColor("#5536DA"),
    bg: createColor("#F8F9FD"),
  },
});

function titleCase(str) {
  if (typeof str !== "string") {
    return str;
  }
  return str
    .toLowerCase()
    .split(" ")
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(" ");
}

export const StudentHomepage = ({ setGroup }) => {
  const navigate = useNavigate();

  const [groups, setGroups] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const { isInstructorAsStudent, setIsInstructorAsStudent } =
    useContext(UserContext);

  useEffect(() => {
    if (!loading && groups.length === 0) {
      handleClickOpen();
    }
  }, [loading, groups]);

  const enterGroup = (group) => {
    setGroup(group);
    sessionStorage.clear();
    sessionStorage.setItem("group", JSON.stringify(group));
    navigate(`/student_group`);
  };

  const handleJoin = async (code) => {
    try {
      const session = await fetchAuthSession();
      const { email } = await fetchUserAttributes();

      var token = session.tokens.idToken
      const response = await fetch(
        `${
          import.meta.env.VITE_API_ENDPOINT
        }student/enroll_student?student_email=${encodeURIComponent(
          email
        )}&group_access_code=${encodeURIComponent(code)}`,
        {
          method: "POST",
          headers: {
            Authorization: token,
            "Content-Type": "application/json",
          },
        }
      );
      if (response.ok) {
        const data = await response.json();
        toast.success("🦄 Successfully Joined Group!", {
          position: "top-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
        fetchGroups();
        handleClose();
      } else {
        console.error("Failed to fetch groups:", response.statusText);
        toast.error("Failed to Join Group", {
          position: "top-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
      toast.error("Failed to Join Group", {
        position: "top-center",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "colored",
      });
    }
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const fetchGroups = async () => {
    try {
      const session = await fetchAuthSession();
      const { email } = await fetchUserAttributes();

      var token = session.tokens.idToken
      let response;
      if (isInstructorAsStudent) {
        response = await fetch(
          `${
            import.meta.env.VITE_API_ENDPOINT
          }instructor/student_group?email=${encodeURIComponent(email)}`,
          {
            method: "GET",
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
          }
        );
      } else {
        response = await fetch(
          `${
            import.meta.env.VITE_API_ENDPOINT
          }student/simulation_group?email=${encodeURIComponent(email)}`,
          {
            method: "GET",
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
          }
        );
      }
      if (response.ok) {
        const data = await response.json();
        setGroups(data);
        setLoading(false);
      } else {
        console.error("Failed to fetch group:", response.statusText);
      }
    } catch (error) {
      console.error("Error fetching group:", error);
    }
  };

  useEffect(() => {
    sessionStorage.removeItem("group");
    sessionStorage.removeItem("patient");

    fetchGroups();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <StudentHeader />
      <Container
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-start",
          alignItems: "stretch",
          width: "100%",
          maxWidth: "100%",
          pb: 0,
        }}
      >
        <Stack
          sx={{
            flex: 1,
            width: "100%",
            maxWidth: "100%",
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "calc(100% - 240px)",
              paddingLeft: 4,
              paddingRight: 5,
            }}
          >
            <Typography
              component="h1"
              variant="h5"
              color="black"
              sx={{
                fontWeight: "500",
                mb: 2,
                display: "flex",
                alignItems: "center",
                fontSize: "1.5rem",
              }}
              textAlign="left"
            >
              Groups
            </Typography>
            <Button
              variant="outlined"
              sx={{
                alignSelf: "flex-end",
                borderColor: "black",
                color: "black",
                borderWidth: "1px",
                marginLeft: "auto",
                marginRight: 1,
                marginBottom: "15px",
                "&:hover": {
                  bgcolor: "white",
                  borderColor: "black",
                },
              }}
              onClick={handleClickOpen}
            >
              Join Group
            </Button>
          </Box>
          {loading ? (
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                height: "80vh",
                width: "100%",
              }}
            >     
              <l-cardio
                size="50" // pulse for loading animation  
                stroke="4"
                speed="2" 
                color="Black" 
              ></l-cardio>
            </Box>
          ) : (
            <Box
              paddingLeft={3}
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: groups.length === 0 ? "center" : "flex-start",
                justifyContent: groups.length === 0 ? "center" : "flex-start",
                width: "100%",
                height: "calc(90vh - 100px)",
                overflowY: "auto",
                overflowX: "hidden",
              }}
            >
              {groups.length === 0 ? (
                <Typography
                  variant="body1"
                  sx={{
                    color: "black",
                    textAlign: "center",
                    mt: 2,
                    fontSize: "1.5rem",
                  }}
                >
                  No groups added yet, click "JOIN GROUP" to add a group
                </Typography>
              ) : (
                groups.map((group, index) => (
                  <Card
                    key={index}
                    sx={{
                      mb: 1,
                      width: "calc(100% - 285px)",
                      maxWidth: "calc(100% - 255px)",
                      minWidth: "calc(100% - 285px)",
                      minHeight: "120px",
                      bgcolor: "transparent",
                      background: `linear-gradient(10deg, rgb(83.137% 92.157% 99.608%) 0%, rgb(83.213% 92.029% 99.612%) 6.25%, rgb(83.436% 91.649% 99.623%) 12.5%, rgb(83.798% 91.033% 99.641%) 18.75%, rgb(84.286% 90.204% 99.665%) 25%, rgb(84.88% 89.194% 99.695%) 31.25%, rgb(85.558% 88.041% 99.729%) 37.5%, rgb(86.294% 86.791% 99.766%) 43.75%, rgb(87.059% 85.49% 99.804%) 50%, rgb(87.824% 84.19% 99.842%) 56.25%, rgb(88.56% 82.939% 99.879%) 62.5%, rgb(89.238% 81.786% 99.913%) 68.75%, rgb(89.832% 80.776% 99.943%) 75%, rgb(90.319% 79.947% 99.967%) 81.25%, rgb(90.682% 79.331% 99.985%) 87.5%, rgb(90.905% 78.952% 99.996%) 93.75%, rgb(90.98% 78.824% 100%) 100%)`,
                    }}
                  >
                    <CardContent sx={{ height: "50%" }}>
                      <Grid container alignItems="center">
                        <Grid item xs={8}>
                          <Typography
                            variant="h6"
                            component="div"
                            sx={{
                              textAlign: "left",
                              fontWeight: "600",
                              fontSize: "1.25rem",
                            }}
                          >
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{ textAlign: "left", mt: 1, fontSize: "1rem" }}
                          >
                            {titleCase(group.group_name)}
                          </Typography>
                        </Grid>
                        <Grid
                          item
                          xs={4}
                          sx={{
                            display: "flex",
                            alignItems: "flex-end",
                            justifyContent: "flex-end",
                          }}
                        >
                          {/* Empty grid item to push the button to the bottom right */}
                        </Grid>
                      </Grid>
                    </CardContent>
                    <CardActions
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        p: 1,
                        pr: 2,
                        height: "50%",
                      }}
                    >
                      <Button
                        size="small"
                        sx={{
                          bgcolor: "#5536DA",
                          p: 1,
                          color: "white",
                          fontWeight: "light",
                          ":hover": { bgcolor: "purple" },
                        }}
                        onClick={() => enterGroup(group)}
                      >
                        Continue
                      </Button>
                    </CardActions>
                  </Card>
                ))
              )}
            </Box>
          )}
        </Stack>
      </Container>
      <Dialog
        open={open}
        onClose={handleClose}
        PaperProps={{
          component: "form",
          onSubmit: (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const formJson = Object.fromEntries(formData.entries());
            const code = formJson.code;
            handleJoin(code);
          },
        }}
      >
        <DialogTitle>Join Group</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Please enter the access code provided by an instructor.
          </DialogContentText>
          <TextField
            autoFocus
            required
            margin="dense"
            id="name"
            name="code"
            label="Access Code"
            fullWidth
            variant="standard"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">Join</Button>
        </DialogActions>
      </Dialog>
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
    </ThemeProvider>
  );
};

export default StudentHomepage;
