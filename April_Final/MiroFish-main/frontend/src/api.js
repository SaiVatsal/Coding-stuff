import axios from 'axios';

// Matches the backend Flask endpoint exposed natively by MiroFish
const API_BASE = 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const mirofishAPI = {
  // 1. Generate Ontology from reality seed
  generateOntology: async (scenarioText, fileContent = null) => {
    // Note: The Python backend accepts multipart/form-data for this specific endpoint
    // In our simplified custom UI, we'll try to push it either as a file or text blob
    // For direct text integration to match Python backend graph/ontology/generate:
    const formData = new FormData();
    formData.append('project_name', 'Custom_Engine_Run');
    formData.append('simulation_requirement', scenarioText);

    if (fileContent) {
      // Simulate a file upload blob if provided
      const blob = new Blob([fileContent], { type: 'text/plain' });
      formData.append('files', blob, 'seed.txt');
    }

    const { data } = await api.post('/graph/ontology/generate', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return data;
  },

  // 2. Build the Knowledge Graph
  buildGraph: async (projectId) => {
    const { data } = await api.post('/graph/build', { project_id: projectId });
    return data; 
  },
  
  // 3. Create Simulation Instance
  createSimulation: async (projectId) => {
    const { data } = await api.post('/simulation/create', { project_id: projectId });
    return data;
  },

  // 4. Prepare Environment
  prepareEnvironment: async (simulationId) => {
    const { data } = await api.post('/simulation/prepare', { simulation_id: simulationId });
    return data;
  },

  // 5. Start Simulation Engine
  startSimulation: async (simulationId, maxRounds = 5) => {
    const { data } = await api.post('/simulation/start', { 
        simulation_id: simulationId,
        max_rounds: maxRounds
    });
    return data;
  },

  // 6. Generate Final Report
  generateReport: async (simulationId) => {
    const { data } = await api.post('/report/generate', { simulation_id: simulationId });
    return data;
  },
  
  // Helper to Poll any task that returns a task_id
  pollTask: async (pollEndpoint, taskId, interval = 2000) => {
      // Very basic polling implementation
      return new Promise((resolve, reject) => {
          const timer = setInterval(async () => {
              try {
                  // Usually polling is GET, though backend varies. Assuming GET for standard REST.
                  // E.g., /graph/task/<task_id>
                  let endpoint = pollEndpoint.endsWith('/') ? pollEndpoint + taskId : pollEndpoint + '/' + taskId;
                  const { data } = await api.get(endpoint);
                  
                  if (!data.success) {
                      clearInterval(timer);
                      reject(data.error || 'Polling Failed');
                      return;
                  }
                  
                  // if completed
                  if (data.data.status === 'completed' || data.data.status === 'ready') {
                      clearInterval(timer);
                      resolve(data.data);
                  }
              } catch (e) {
                  // Wait and try again if temporary connection issue
                  console.error("Poll err:", e);
              }
          }, interval);
      });
  }
};
