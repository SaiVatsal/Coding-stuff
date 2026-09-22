package system_agent

var agentController = &AgentController{}

func GetAgentController() *AgentController {
	return agentController
}
