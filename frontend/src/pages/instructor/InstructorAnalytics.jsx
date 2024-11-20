import React, { useState, useEffect } from "react";
import { fetchAuthSession } from "aws-amplify/auth";
import {
  Container,
  Typography,
  Box,
  Tabs,
  Tab,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  LinearProgress,
  Grid,
  Paper,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

function titleCase(str) {
  if (typeof str !== "string") {
    return str;
  }
  return str
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const InstructorAnalytics = ({ groupName, simulation_group_id }) => {
  const [tabValue, setTabValue] = useState(0);
  const [data, setData] = useState([]);
  const [maxMessages, setMaxMessages] = useState(0);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens.idToken;
        const response = await fetch(
          `${
            import.meta.env.VITE_API_ENDPOINT
          }instructor/analytics?simulation_group_id=${encodeURIComponent(simulation_group_id)}`,
          {
            method: "GET",
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
          }
        );
        if (response.ok) {
          const analytics_data = await response.json();
          setData(analytics_data);
        } else {
          console.error("Failed to fetch analytics:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };

    fetchAnalytics();
  }, [simulation_group_id]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  return (
    <Container sx={{ flexGrow: 1, p: 3, marginTop: 9, overflow: "auto" }}>
      <Typography
        color="black"
        fontStyle="semibold"
        textAlign="left"
        variant="h6"
        gutterBottom
      >
        {titleCase(groupName)}
      </Typography>

      {/* Tabs for Patients */}
      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        aria-label="patient tabs"
        variant="scrollable"
        scrollButtons="auto"
      >
        {data.map((patient, index) => (
          <Tab key={index} label={titleCase(patient.patient_name)} />
        ))}
      </Tabs>

      {data.map((patient, index) => (
        <Box
          key={index}
          hidden={tabValue !== index}
          sx={{ marginTop: 4, paddingTop: 2 }}
        >
          <Typography
            variant="h6"
            color="textPrimary"
            gutterBottom
            sx={{ marginBottom: 2 }}
          >
            {titleCase(patient.patient_name)} Overview
          </Typography>

          {/* Insights Section */}
          <Box mb={4}>
            <Paper>
              <Grid
                container
                spacing={2}
                alignItems="center"
                justifyContent="space-between"
                sx={{ padding: 2 }}
              >
                <Grid item xs={12} sm={6}>
                  <Typography>Completion Percentage:</Typography>
                  <LinearProgress
                    variant="determinate"
                    value={patient.completion_percentage || 0}
                    sx={{ marginY: 1 }}
                  />
                  <Typography textAlign="right">
                    {patient.completion_percentage.toFixed(2)}%
                  </Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Typography>Student Message Count: {patient.student_message_count}</Typography>
                  <Typography>AI Message Count: {patient.ai_message_count}</Typography>
                  <Typography>Access Count: {patient.access_count}</Typography>
                </Grid>
              </Grid>
            </Paper>
          </Box>

          {/* Message Count Chart */}
          <Paper>
            <Box mb={4} sx={{ height: 350 }}>
              <Typography color="black" textAlign="left" paddingLeft={2} padding={2}>
                Message Count
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      name: "Messages",
                      StudentMessages: parseInt(patient.student_message_count, 10) || 0,
                      AIMessages: parseInt(patient.ai_message_count, 10) || 0,
                    },
                  ]}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  barSize={20}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="StudentMessages"
                    fill="#8884d8"
                    name="Student Messages"
                  />
                  <Bar
                    dataKey="AIMessages"
                    fill="#82ca9d"
                    name="AI Messages"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>

          {/* Scores and Access Chart */}
          <Paper>
            <Box mb={4} sx={{ height: 350 }}>
              <Typography color="black" textAlign="left" paddingLeft={2} padding={2}>
                Scores, Access Count, and Avg Last Access (in Days)
              </Typography>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={[
                    {
                      patient: titleCase(patient.patient_name),
                      AverageScore: parseFloat(patient.average_score) || 0,
                      PerfectScorePercentage: parseFloat(patient.perfect_score_percentage) || 0,
                      AccessCount: parseInt(patient.access_count, 10) || 0,
                      AvgLastAccessInDays:
                        patient.students &&
                        Object.values(patient.students).length > 0
                          ? Object.values(patient.students)
                              .map((student) => {
                                const lastAccess = new Date(student.last_accessed);
                                return Math.round(
                                  (new Date() - lastAccess) / (1000 * 60 * 60 * 24)
                                );
                              })
                              .reduce((a, b) => a + b, 0) /
                            Object.values(patient.students).length
                          : 0,
                    },
                  ]}
                  margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  barSize={20}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="patient" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar
                    dataKey="AverageScore"
                    fill="#ffc658"
                    name="Average Score"
                  />
                  <Bar
                    dataKey="PerfectScorePercentage"
                    fill="#8884d8"
                    name="Perfect Score %"
                  />
                  <Bar
                    dataKey="AccessCount"
                    fill="#8dd1e1"
                    name="Access Count"
                  />
                  <Bar
                    dataKey="AvgLastAccessInDays"
                    fill="#ff8042"
                    name="Avg Last Access (Days)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Box>
      ))}
    </Container>
  );
};

export default InstructorAnalytics;
