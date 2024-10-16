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
  Stack,
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

const { palette } = createTheme();
const { augmentColor } = palette;
const createColor = (mainColor) => augmentColor({ color: { main: mainColor } });
const theme = createTheme({
  palette: {
    primary: createColor("#4de698"),
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
  const { isInstructorAsStudent, setIsInstructorAsStudent } = useContext(UserContext);

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

      const token = session.tokens.idToken;
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
        toast.success("Successfully Joined Group!", {
          position: "top-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        });
        fetchGroups();
        handleClose();
      } else {
        toast.error("Failed to Join Group", {
          position: "top-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored",
        });
      }
    } catch (error) {
      toast.error("Failed to Join Group", {
        position: "top-center",
        autoClose: 1000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
    }
  };

  const handleClickOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const fetchGroups = async () => {
    try {
      const session = await fetchAuthSession();
      const { email } = await fetchUserAttributes();

      const token = session.tokens.idToken;
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
          pb: 0,
        }}
      >
        <Stack
          sx={{
            flex: 1,
            width: "100%",
            padding: 2,
          }}
        >
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              width: "100%",
              padding: 2,
            }}
          >
            <Typography
              component="h1"
              variant="h5"
              color="black"
              sx={{
                fontWeight: "500",
                fontSize: "1.5rem",
              }}
              textAlign="left"
            >
              Groups
            </Typography>
            <Button
              variant="outlined"
              sx={{
                borderColor: "black",
                color: "black",
                borderWidth: "1px",
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
              <l-cardio size="50" stroke="4" speed="2" color="Black"></l-cardio>
            </Box>
          ) : (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: groups.length === 0 ? "center" : "flex-start",
                justifyContent: groups.length === 0 ? "center" : "flex-start",
                width: "100%",
                height: "calc(90vh - 100px)",
                overflowY: "auto",
                overflowX: "hidden",
                padding: 2,
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
                      mb: 2,
                      width: "100%",
                      background: "#99DFB2",
                    }}
                  >
                    <CardContent>
                      <Typography
                        variant="h6"
                        component="div"
                        sx={{
                          fontWeight: "600",
                          fontSize: "1.25rem",
                          textAlign: "left",
                        }}
                      >
                        {titleCase(group.group_name)}
                      </Typography>
                    </CardContent>
                    <CardActions
                      sx={{
                        display: "flex",
                        justifyContent: "flex-end",
                        p: 1,
                      }}
                    >
                      <Button
                        size="small"
                        sx={{
                          bgcolor: "#A8A3A3",
                          color: "black",
                          ":hover": { bgcolor: "grey" },
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
