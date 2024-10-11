import { useEffect, useState } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  Typography,
  Box,
  Toolbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  TableFooter,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";
import AdminCreateSimulationGroup from "./AdminCreateSimulationGroup";

const createData = (groupName, accessCode, status, id) => {
  return { groupName, accessCode, status, id };
};

function getSimulationGroupInfo(groupsArray) {
  return groupsArray.map((group) =>
    createData(
      `${group.group_name}`,
      `${group.group_access_code}`,
      `${group.group_student_access}`,
      `${group.simulation_group_id}`
    )
  );
}

export const AdminSimulationGroups = ({ setSelectedGroup }) => {
  const [rows, setRows] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const fetchSimulationGroups = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens.idToken;
        const response = await fetch(
          `${import.meta.env.VITE_API_ENDPOINT}admin/simulation_groups`,
          {
            method: "GET",
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setRows(getSimulationGroupInfo(data));
          setLoading(false);
        } else {
          console.error("Failed to fetch simulation groups:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching simulation groups:", error);
      }
    };

    fetchSimulationGroups();
  }, []);

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const filteredRows = rows.filter((row) =>
    row.groupName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleGroupClick = (group) => {
    setSelectedGroup(group);
  };

  const handleOpenDialog = () => {
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
  };

  return (
    <Box component="main" sx={{ flexGrow: 1, p: 2, marginTop: 0.5 }}>
      <Toolbar />
      <Paper
        sx={{
          width: "100%",
          overflow: "hidden",
          marginTop: 1,
          borderRadius: 2,
          p: 3,
          maxHeight: "85vh",
        }}
      >
        <Box
          sx={{
            padding: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
          }}
        >
          <Typography color="black" fontStyle="semibold" variant="h6" sx={{ textAlign: { xs: "center", sm: "left" } }}>
            Simulation Groups
          </Typography>
          <Button
            variant="contained"
            color="primary"
            onClick={handleOpenDialog}
            sx={{ fontSize: 14 }}
            endIcon={<AddCircleIcon />}
          >
            Create Group
          </Button>
        </Box>
        <TableContainer
          sx={{
            maxHeight: "70vh",
            overflowY: "auto",
            px: { xs: 1, sm: 2 },
          }}
        >
          <TextField
            label="Search Groups"
            variant="outlined"
            value={searchQuery}
            onChange={handleSearchChange}
            sx={{
              my: 1,
              width: "100%",
              maxWidth: 500,
              mx: "auto",
              display: "block",
            }}
            InputProps={{ sx: { fontSize: 14 } }}
            InputLabelProps={{ sx: { fontSize: 14 } }}
          />
          <Table aria-label="simulation group table">
            {!loading ? (
              <>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ width: "30%", fontSize: 14 }}>
                      Group Name
                    </TableCell>
                    <TableCell sx={{ fontSize: 14 }}>
                      Group Access Code
                    </TableCell>
                    <TableCell sx={{ fontSize: 14 }}>
                      Status
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredRows
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((row, index) => (
                      <TableRow
                        key={index}
                        onClick={() => handleGroupClick(row)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell sx={{ fontSize: 14 }}>
                          {row.groupName.toUpperCase()}
                        </TableCell>
                        <TableCell sx={{ fontSize: 14 }}>
                          {row.accessCode}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="contained"
                            color={row.status === "true" ? "primary" : "secondary"}
                            sx={{ fontSize: 12, padding: "6px 12px" }}
                          >
                            {row.status === "true" ? "Active" : "Inactive"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </>
            ) : (
              <TableBody>loading...</TableBody>
            )}
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 25]}
                  component="div"
                  count={filteredRows.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                  sx={{
                    fontSize: 14,
                    minWidth: 400,
                  }}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog for Creating New Simulation Group */}
      <Dialog open={open} onClose={handleCloseDialog} fullWidth maxWidth="md">
        <DialogTitle>Create New Simulation Group</DialogTitle>
        <DialogContent>
          <AdminCreateSimulationGroup setSelectedComponent={() => setOpen(false)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminSimulationGroups;
