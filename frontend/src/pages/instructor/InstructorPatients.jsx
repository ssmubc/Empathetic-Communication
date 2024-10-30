import { useEffect, useMemo, useState } from "react";
import { Button, Box, Toolbar, Typography, Paper } from "@mui/material";
import { fetchAuthSession, fetchUserAttributes } from "aws-amplify/auth";
import { MRT_TableContainer, useMaterialReactTable } from "material-react-table";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import InstructorNewPatient from "./InstructorNewPatient"; 
import InstructorEditPatients from "./InstructorEditPatients"; // Import the edit patient dialog component

function groupTitleCase(str) {
  if (typeof str !== "string") return str;
  const words = str.split(" ");
  return words
    .map((word, index) => (index === 0 ? word.toUpperCase() : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(" ");
}

function titleCase(str) {
  if (typeof str !== "string") return str;
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const InstructorPatients = ({ groupName, simulation_group_id }) => {
  const [data, setData] = useState([]);
  const [openNewPatientDialog, setOpenNewPatientDialog] = useState(false);
  const [openEditPatientDialog, setOpenEditPatientDialog] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const columns = useMemo(
    () => [
      {
        accessorKey: "patient_name",
        header: "Patient Name",
        Cell: ({ cell }) => titleCase(cell.getValue()),
      },
      {
        accessorKey: "patient_age",
        header: "Age",
      },
      {
        accessorKey: "patient_gender",
        header: "Gender",
      },
      {
        accessorKey: "actions",
        header: "Actions",
        Cell: ({ row }) => (
          <Button
            variant="contained"
            color="primary"
            onClick={() => handleEditClick(row.original)}
          >
            Edit
          </Button>
        ),
      },
    ],
    []
  );

  const table = useMaterialReactTable({
    autoResetPageIndex: false,
    columns,
    data,
    enableRowOrdering: true,
    enableSorting: false,
    initialState: { pagination: { pageSize: 1000, pageIndex: 1 } },
    muiRowDragHandleProps: ({ table }) => ({
      onDragEnd: () => {
        const { draggingRow, hoveredRow } = table.getState();
        if (hoveredRow && draggingRow) {
          data.splice(
            hoveredRow.index,
            0,
            data.splice(draggingRow.index, 1)[0]
          );
          setData([...data]);
        }
      },
    }),
  });

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens.idToken;
        const response = await fetch(
          `${import.meta.env.VITE_API_ENDPOINT}instructor/view_patients?simulation_group_id=${encodeURIComponent(
            simulation_group_id
          )}`,
          {
            method: "GET",
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.ok) {
          const patientData = await response.json();
          setData(patientData);
        } else {
          console.error("Failed to fetch patients:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching patients:", error);
      }
    };

    fetchPatients();
  }, [simulation_group_id]);

  const handleEditClick = (patientData) => {
    setSelectedPatient(patientData);
    setOpenEditPatientDialog(true);
  };

  const handleCloseEditPatientDialog = () => {
    setOpenEditPatientDialog(false);
    setSelectedPatient(null);
    // Optionally, refetch data to show updated patient list immediately
  };

  const handleCreatePatientClick = () => {
    setOpenNewPatientDialog(true);
  };

  const handleCloseNewPatientDialog = () => {
    setOpenNewPatientDialog(false);
    // Optionally, refetch data to show the new patient in the list immediately
  };

  const handleSaveChanges = async () => {
    try {
      const session = await fetchAuthSession();
      const token = session.tokens.idToken;
      const { email } = await fetchUserAttributes();

      const updatePromises = data.map((patient, index) => {
        const patientNumber = index + 1;
        return fetch(
          `${import.meta.env.VITE_API_ENDPOINT}instructor/reorder_patient?patient_id=${encodeURIComponent(
            patient.patient_id
          )}&patient_number=${patientNumber}&instructor_email=${encodeURIComponent(email)}`,
          {
            method: "PUT",
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              patient_name: patient.patient_name,
            }),
          }
        ).then((response) => {
          if (!response.ok) {
            console.error(`Failed to update patient ${patient.patient_id}:`, response.statusText);
            toast.error("Patient Order Update Failed", {
              position: "top-center",
              autoClose: 1000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "colored",
            });
            return { success: false };
          } else {
            return response.json().then(() => ({ success: true }));
          }
        });
      });

      const updateResults = await Promise.all(updatePromises);
      const allUpdatesSuccessful = updateResults.every((result) => result.success);

      if (allUpdatesSuccessful) {
        toast.success("Patient Order Updated Successfully", {
          position: "top-center",
          autoClose: 1000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "colored",
        });
      } else {
        toast.error("Some patient updates failed", {
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
      console.error("Error saving changes:", error);
      toast.error("An error occurred while saving changes", {
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

  return (
    <Box component="main" sx={{ flexGrow: 1, p: 3, marginTop: 1, overflow: "auto" }}>
      <Toolbar />
      <Typography color="black" fontStyle="semibold" textAlign="left" variant="h6">
        {groupTitleCase(groupName)}
      </Typography>
      <Paper sx={{ width: "100%", overflow: "hidden", marginTop: 2 }}>
        <Box sx={{ maxHeight: "400px", overflowY: "auto" }}>
          <MRT_TableContainer table={table} />
        </Box>
      </Paper>
      <Box
        sx={{
          marginTop: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Button variant="contained" color="primary" onClick={handleCreatePatientClick}>
          Create New Patient
        </Button>
        <Button variant="contained" color="primary" onClick={handleSaveChanges}>
          Save Changes
        </Button>
      </Box>
      <ToastContainer position="top-center" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />

      <InstructorNewPatient
        open={openNewPatientDialog}
        onClose={handleCloseNewPatientDialog}
        simulationGroupId={simulation_group_id}
        onSave={() => {
          handleCloseNewPatientDialog();
        }}
      />
      <InstructorEditPatients
        open={openEditPatientDialog}
        onClose={handleCloseEditPatientDialog}
        patientData={selectedPatient}
        simulationGroupId={simulation_group_id}
        onSave={() => {
          handleCloseEditPatientDialog();
        }}
      />
    </Box>
  );
};

export default InstructorPatients;
