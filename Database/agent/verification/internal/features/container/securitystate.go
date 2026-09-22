package container

// SecurityState is read back from the live container so each job re-asserts its
// own hardening landed (a daemon glitch fails that job, never the process).
type SecurityState struct {
	NoNewPrivileges bool
	CapDropAll      bool
	ReadonlyRootfs  bool
	HasHostBinds    bool
}
