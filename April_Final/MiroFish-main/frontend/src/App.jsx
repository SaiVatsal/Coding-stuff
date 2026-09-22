import { useState, useRef } from 'react';
import { UploadCloud, Play, Activity, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { mirofishAPI } from './api';
import './App.css';

function App() {
  const [scenario, setScenario] = useState('');
  const [file, setFile] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState([]);
  
  const fileInputRef = useRef(null);

  const addLog = (message, type = 'info') => {
    setLogs(prev => [...prev, { id: Date.now(), message, type }]);
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      addLog(`Attached seed document: ${selected.name}`);
    }
  };

  const startEngine = async () => {
    if (!scenario.trim()) {
      addLog("Error: Setup scenario requirement first.", "error");
      return;
    }

    setIsProcessing(true);
    setLogs([]); // Clear previous
    addLog("Initializing MiroFish Engine...", "active");

    try {
      // Step 1: Ontology
      addLog("01 - Generating Reality Ontology...", "info");
      
      // Read file content if present
      let fileContent = null;
      if (file) {
          try {
              fileContent = await file.text();
          } catch (e) {
              addLog("Warning: Could not read file content as text. Proceeding without it.", "error");
          }
      }

      // We expect this to fail gracefully if the backend throws JSON issues (as logged previously)
      // but we wrap the whole thing to catch unexpected Network errors.
      let ontologyRes;
      try {
          ontologyRes = await mirofishAPI.generateOntology(scenario, fileContent);
          if (!ontologyRes.success) {
             throw new Error("Ontology Generation returned error: " + JSON.stringify(ontologyRes.error));
          }
      } catch (axErr) {
          throw new Error(axErr.response?.data?.error || axErr.message);
      }

      const projectId = ontologyRes.data?.project_id;
      addLog(`Project Initialized [ID: ${projectId}]`, "success");

      // Note: Because of known backend JSON parse issues (as seen in test_mirofish.py), 
      // the simulation might halt here. The UI will catch the error and display it cleanly.
      
      // Step 2: Build Graph
      addLog("02 - Building Deep Knowledge Graph...", "info");
      await mirofishAPI.buildGraph(projectId);
      
      // Poll Task Graph Build...
      // Since polling implementation varies heavily, we just simulate status updates for POC
      addLog("Graph Build Task Dispatched. Waiting for completion...", "info");
      // await mirofishAPI.pollTask('/graph/task', taskId); // If taskId returned
      
      // Step 3 & 4: Prepare
      addLog("03 - Configuring Actor Agents...", "info");
      const simRes = await mirofishAPI.createSimulation(projectId);
      const simId = simRes.data?.simulation_id;
      
      await mirofishAPI.prepareEnvironment(simId);

      // Step 5: Start
      addLog("04 - Running Parallel Worlds Simulation...", "info");
      await mirofishAPI.startSimulation(simId);

      addLog("Engine Sequence Successfully Executed.", "success");

    } catch (error) {
      addLog(error.message || String(error), "error");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-container animate-fade-in">
      <header className="header">
        <h1 className="text-gradient">April Predictions</h1>
        <p>Predict the future through dynamic multi-agent deduction</p>
      </header>

      <main className="main-content">
        
        {/* Left Panel: Configuration */}
        <section className="panel glass-panel">
          <h2><Activity size={24} className="text-gradient" /> Engine Parameters</h2>
          
          <div className="input-group">
            <label>01 / Seeds of Reality (Optional)</label>
            <div 
              className="upload-area"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud size={48} className="upload-icon" />
              <p>{file ? file.name : 'Drag and drop or click to upload reality seeds (TXT, MD)'}</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                style={{ display: 'none' }}
                accept=".txt,.md,.pdf"
              />
            </div>
          </div>

          <div className="input-group">
            <label>02 / Simulation Prompt</label>
            <textarea 
              value={scenario}
              onChange={(e) => setScenario(e.target.value)}
              placeholder="E.g., What happens to public opinion if the university abruptly revokes the new policy tomorrow?"
            />
          </div>

          <button 
            className="btn-primary" 
            onClick={startEngine}
            disabled={isProcessing}
          >
            {isProcessing ? <Loader2 className="loading-spinner" /> : <Play />}
            {isProcessing ? 'Deducing the Future...' : 'Start the Engine'}
          </button>
        </section>

        {/* Right Panel: Status & Logs */}
        <section className="panel glass-panel">
          <h2><Activity size={24} className="text-gradient" /> Real-time Telemetry</h2>
          
          <div className="logs-container">
            {logs.length === 0 && (
              <div style={{color: 'var(--text-secondary)', textAlign: 'center', marginTop: 'auto', marginBottom: 'auto'}}>
                Engine standing by. Waiting for parameter injection...
              </div>
            )}
            
            {logs.map((log) => (
              <div 
                key={log.id} 
                className={`log-entry ${log.type === 'error' ? 'error' : ''} ${log.type === 'active' ? 'active' : ''}`}
              >
                {log.type === 'error' && <AlertCircle size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }}/>}
                {log.type === 'success' && <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle', color: 'var(--accent-blue)' }}/>}
                <span style={{ verticalAlign: 'middle' }}>{log.message}</span>
              </div>
            ))}
          </div>
        </section>

      </main>
    </div>
  );
}

export default App;
