import { useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
// MUI
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
} from "@mui/material";
import { useState } from "react";

// populate with dummy data
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

  useEffect(() => {
    const fetchSimulationGroups = async () => {
      try {
        const session = await fetchAuthSession();
        var token = session.tokens.idToken;
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

  return (
    <div>
      <Box component="main" sx={{ flexGrow: 1, p: 2, marginTop: 0.5 }}>
        <Toolbar />
        <Paper
          sx={{
            width: "150%",
            overflow: "hidden",
            marginTop: 1,
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              padding: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              color="black"
              fontStyle="semibold"
              textAlign="left"
              variant="h6"
            >
              Simulation Groups
            </Typography>
          </Box>
          <TableContainer
            sx={{
              maxHeight: "70vh",
              overflowY: "auto",
            }}
          >
            <TextField
              label="Search Groups"
              variant="outlined"
              value={searchQuery}
              onChange={handleSearchChange}
              sx={{ margin: 1, width: "90%", alignContent: "left" }}
              InputProps={{ sx: { fontSize: 14 } }} // Increased font size
              InputLabelProps={{ sx: { fontSize: 14 } }} // Increased label font size
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
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage
                      )
                      .map((row, index) => (
                        <TableRow
                          key={index}
                          onClick={() => handleGroupClick({ row })}
                          style={{ cursor: "pointer" }}
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
                              color={
                                row.status === "true" ? "primary" : "secondary"
                              }
                              sx={{ fontSize: 12, padding: "6px 12px" }} // Increased button padding and font size
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
                      fontSize: 14, // Increased font size for pagination
                      minWidth: 400,
                    }}
                  />
                </TableRow>
              </TableFooter>
            </Table>
          </TableContainer>
        </Paper>
      </Box>
    </div>
  );
};

export default AdminSimulationGroups;