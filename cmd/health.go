package cmd

import (
	"net/http"
	"net/url"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

func init() {
	healthCmd.Flags().StringP("base", "b", "/admin", "HTML base path")
	viper.BindPFlag("health.base", healthCmd.Flags().Lookup("base"))

	healthCmd.Flags().String("host", "http://localhost:3000", "Server host")
	viper.BindPFlag("health.host", healthCmd.Flags().Lookup("host"))

	healthCmd.Flags().Int("timeout", 5, "Request timeout in seconds")
	viper.BindPFlag("health.timeout", healthCmd.Flags().Lookup("timeout"))

	rootCmd.AddCommand(healthCmd)
}

var healthCmd = &cobra.Command{
	Use:   "health",
	Short: "Check the healthz endpoint for a 200 OK",
	Args:  cobra.NoArgs,
	Run: func(cmd *cobra.Command, args []string) {
		prefix := viper.GetString("health.base")
		base := viper.GetString("health.host")
		timeout := viper.GetInt("health.timeout")

		uri, err := url.JoinPath(base, prefix, "healthz")
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to build URI")
		}

		client := &http.Client{
			Timeout: time.Duration(timeout) * time.Second,
		}

		log.Debug().
			Str("endpoint", uri).
			Msg("Performing health check")

		resp, err := client.Get(uri)
		if err != nil {
			log.Fatal().
				Err(err).
				Str("uri", uri).
				Msg("Error connecting to server")
		}
		defer resp.Body.Close()

		if resp.StatusCode != http.StatusOK {
			log.Fatal().
				Str("uri", uri).
				Int("status", resp.StatusCode).
				Msg("Health check failed")
		}

		log.Info().
			Str("uri", uri).
			Int("status", resp.StatusCode).
			Msg("Health check successful")
	},
}
