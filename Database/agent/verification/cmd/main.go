package main

import (
	"errors"
	"flag"
	"fmt"
	"log/slog"
	"os"
	"path/filepath"
	"strings"

	"databasus-verification-agent/internal/config"
	"databasus-verification-agent/internal/features/api"
	"databasus-verification-agent/internal/features/start"
	"databasus-verification-agent/internal/features/upgrade"
	"databasus-verification-agent/internal/logger"
)

var Version = "dev"

func main() {
	if len(os.Args) < 2 {
		printUsage()
		os.Exit(1)
	}

	switch os.Args[1] {
	case "start":
		runStart(os.Args[2:])
	case "run":
		runAgent(os.Args[2:])
	case "_run":
		runDaemon(os.Args[2:])
	case "stop":
		runStop()
	case "status":
		runStatus()
	case "version":
		fmt.Println(Version)
	default:
		fmt.Fprintf(os.Stderr, "unknown command: %s\n", os.Args[1])
		printUsage()
		os.Exit(1)
	}
}

func runStart(args []string) {
	fs := flag.NewFlagSet("start", flag.ExitOnError)

	isSkipUpdate := fs.Bool("skip-update", false, "Skip auto-update check")

	cfg := &config.Config{}
	cfg.LoadFromJSONAndArgs(fs, args)

	if err := cfg.SaveToJSON(); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to save config: %v\n", err)
	}

	log := logger.GetLogger()

	isDev := checkIsDevelopment()
	runUpdateCheck(cfg.DatabasusHost, *isSkipUpdate, isDev, log)

	if err := start.Start(cfg, Version, isDev, log); err != nil {
		if errors.Is(err, upgrade.ErrUpgradeRestart) {
			reexecAfterUpgrade(log)
		}

		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

func runAgent(args []string) {
	fs := flag.NewFlagSet("run", flag.ExitOnError)

	isSkipUpdate := fs.Bool("skip-update", false, "Skip auto-update check")

	cfg := &config.Config{}
	cfg.LoadFromJSONAndArgs(fs, args)

	if err := cfg.SaveToJSON(); err != nil {
		fmt.Fprintf(os.Stderr, "Failed to save config: %v\n", err)
	}

	log := logger.GetLogger()

	isDev := checkIsDevelopment()
	runUpdateCheck(cfg.DatabasusHost, *isSkipUpdate, isDev, log)

	if err := start.RunDaemon(cfg, Version, isDev, log); err != nil {
		if errors.Is(err, upgrade.ErrUpgradeRestart) {
			reexecAfterUpgrade(log)
		}

		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

func runDaemon(args []string) {
	fs := flag.NewFlagSet("_run", flag.ExitOnError)

	if err := fs.Parse(args); err != nil {
		os.Exit(1)
	}

	log := logger.GetLogger()

	cfg := &config.Config{}
	cfg.LoadFromJSON()

	if err := start.RunDaemon(cfg, Version, checkIsDevelopment(), log); err != nil {
		if errors.Is(err, upgrade.ErrUpgradeRestart) {
			reexecAfterUpgrade(log)
		}

		log.Error("Agent exited with error", "error", err)
		os.Exit(1)
	}
}

func runStop() {
	log := logger.GetLogger()

	if err := start.Stop(log); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

func runStatus() {
	log := logger.GetLogger()

	if err := start.Status(log); err != nil {
		fmt.Fprintf(os.Stderr, "Error: %v\n", err)
		os.Exit(1)
	}
}

func printUsage() {
	fmt.Fprintln(os.Stderr, "Usage: databasus-verification-agent <command> [flags]")
	fmt.Fprintln(os.Stderr, "")
	fmt.Fprintln(os.Stderr, "Commands:")
	fmt.Fprintln(os.Stderr, "  start    Start the verification agent in the background (daemon)")
	fmt.Fprintln(os.Stderr, "  run      Run the verification agent in the foreground (systemd / container)")
	fmt.Fprintln(os.Stderr, "  stop     Stop a running agent")
	fmt.Fprintln(os.Stderr, "  status   Show agent status")
	fmt.Fprintln(os.Stderr, "  version  Print agent version")
}

func runUpdateCheck(host string, isSkipUpdate, isDev bool, log *slog.Logger) {
	if isSkipUpdate {
		return
	}

	if host == "" {
		return
	}

	apiClient := api.NewClient(host, "", "", log)

	isUpgraded, err := upgrade.CheckAndUpdate(apiClient, Version, isDev, log)
	if err != nil {
		log.Error("Auto-update failed", "error", err)
		os.Exit(1)
	}

	if isUpgraded {
		reexecAfterUpgrade(log)
	}
}

func checkIsDevelopment() bool {
	dir, err := os.Getwd()
	if err != nil {
		return false
	}

	for range 3 {
		if data, err := os.ReadFile(filepath.Join(dir, ".env")); err == nil {
			return parseEnvMode(data)
		}

		if _, err := os.Stat(filepath.Join(dir, "go.mod")); err == nil {
			return false
		}

		dir = filepath.Dir(dir)
	}

	return false
}

func parseEnvMode(data []byte) bool {
	for line := range strings.SplitSeq(string(data), "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 && strings.TrimSpace(parts[0]) == "ENV_MODE" {
			return strings.TrimSpace(parts[1]) == "development"
		}
	}

	return false
}
