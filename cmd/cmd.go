package cmd

import (
	"fmt"
	"os"
	"time"

	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

type Error string

func (e Error) Error() string { return string(e) }

var (
	rootCmd = &cobra.Command{
		Use:   "headscale-console",
		Short: "headscale-console",
		Long:  `A web-based SSH, VNC, and RDP client interface for @juanfont/headscale.`,
		CompletionOptions: cobra.CompletionOptions{
			DisableDefaultCmd: true,
		},
		PersistentPreRun: func(cmd *cobra.Command, args []string) {
			initLogging()
		},
	}
)

func init() {
	// Global flag: log level
	rootCmd.PersistentFlags().String("log-level", "info", "Log level (debug, info, warn, error)")
	viper.BindPFlag("log-level", rootCmd.PersistentFlags().Lookup("log-level"))

	viper.SetEnvPrefix("HEADSCALE_CONSOLE")
	viper.AutomaticEnv()

	cobra.OnInitialize()
}

func initLogging() {
	levelStr := viper.GetString("log-level")

	level, err := zerolog.ParseLevel(levelStr)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Invalid log level '%s', defaulting to 'info'\n", levelStr)
		level = zerolog.InfoLevel
	}

	zerolog.SetGlobalLevel(level)

	log.Logger = log.Output(
		zerolog.ConsoleWriter{
			Out:        os.Stderr,
			TimeFormat: time.RFC3339,
		},
	)

	log.Info().Str("log-level", level.String()).Msg("Logger initialized")
}

func Execute() {
	if err := rootCmd.Execute(); err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
