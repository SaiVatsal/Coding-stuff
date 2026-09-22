export interface VerificationAgent {
  id: string;
  name: string;
  maxCpu: number;
  maxRamGb: number;
  maxDiskGb: number;
  maxConcurrentJobs: number;
  lastSeenAt?: string;
  createdAt: string;
}

export interface CreatedAgentResponse {
  agent: VerificationAgent;
  token: string;
}

export interface RotateTokenResponse {
  token: string;
}

export interface VerificationAgentAvailability {
  count: number;
  hasAgents: boolean;
}
