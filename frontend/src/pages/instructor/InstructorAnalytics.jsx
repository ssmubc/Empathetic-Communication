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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

function titleCase(str) {
  if (typeof str !== "string") {
    return str;
  }
  return str
    .split(" ")
    .map(function (word) {
      return word.charAt(0).toUpperCase() + word.slice(1); // Capitalize only the first letter, leave the rest of the word unchanged
    })
    .join(" ");
}

const InstructorAnalytics = ({ groupName, simulation_group_id }) => {
  const [value, setValue] = useState(0);
  const [graphData, setGraphData] = useState([]);
  const [data, setData] = useState([]);
  const [maxMessages, setMaxMessages] = useState(0);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens.idToken
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
          const graphDataFormatted = analytics_data.map((patient) => ({
            patient: patient.patient_name,
            Messages: patient.message_count,
          }));
          setGraphData(graphDataFormatted);
        } else {
          console.error("Failed to fetch analytics:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };

    fetchAnalytics();
  }, [simulation_group_id]);

  useEffect(() => {
    if (graphData.length > 0) {
      const max = Math.max(...graphData.map((data) => data.Messages));
      setMaxMessages(max);
    }
  }, [graphData]);

  const handleChange = (event, newValue) => {
    setValue(newValue);
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
      <Paper>
        <Box mb={4}>
          <Typography
            color="black"
            textAlign="left"
            paddingLeft={10}
            padding={2}
          >
            Message Count
          </Typography>
          {graphData.length > 0 ? (
            <LineChart
              width={900}
              height={300}
              data={graphData}
              margin={{
                top: 5,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="patient"
                tick={{ fontSize: 12 }}
                tickFormatter={(tick) => titleCase(tick)}
              />
              <YAxis domain={[0, maxMessages + 3]} />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="Messages"
                stroke="#8884d8"
                activeDot={{ r: 8 }}
              />
            </LineChart>
          ) : (
            <Typography
              variant="h6"
              color="textSecondary"
              textAlign="center"
              padding={4}
            >
              No data found
            </Typography>
          )}
        </Box>
      </Paper>

      <Tabs value={value} onChange={handleChange} aria-label="grade tabs">
        <Tab label="Insights" />
      </Tabs>

      {value === 0 ? (
        data.length > 0 ? (
          <Box mt={2}>
            {data.map((patient, index) => (
              <Accordion key={index}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Typography>{titleCase(patient.patient_name)}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Box width="100%">
                    <Grid
                      container
                      spacing={1}
                      alignItems="center"
                      direction="column"
                    >
                      <Grid item width="80%">
                        <Typography textAlign="right">
                          Completion Percentage:{" "}
                          {patient.perfect_score_percentage.toFixed(2)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={patient.perfect_score_percentage}
                        />
                      </Grid>
                      <Grid item>
                        <Typography>Message Count</Typography>
                        <Typography>{patient.message_count}</Typography>
                      </Grid>
                      <Grid item>
                        <Typography>Access Count</Typography>
                        <Typography>{patient.access_count}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        ) : (
          <Typography
            variant="h6"
            color="textSecondary"
            textAlign="center"
            padding={4}
          >
            No insights available
          </Typography>
        )
      ) : null}
    </Container>
  );
};

export default InstructorAnalytics;
