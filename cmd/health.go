package cmd

import (
	"net/http"
	"os"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

func init() {
	healthCmd.Flags().StringP("endpoint", "e", "http://localhost:3000/healthz", "Health check endpoint URL")
	viper.BindPFlag("endpoint", healthCmd.Flags().Lookup("endpoint"))

	rootCmd.AddCommand(healthCmd)
}

var healthCmd = &cobra.Command{
	Use:   "health",
	Short: "Check the healthz endpoint for a 200 OK",
	Args:  cobra.NoArgs,
	Run: func(cmd *cobra.Command, args []string) {
		endpoint := viper.GetString("endpoint")
		client := &http.Client{Timeout: 5 * time.Second}

		log.Debug().Str("endpoint", endpoint).Msg("Performing health check")

		resp, err := client.Get(endpoint)
		if err != nil {
			log.Error().Err(err).Str("endpoint", endpoint).Msg("Error connecting to endpoint")
			os.Exit(1)
		}

		defer resp.Body.Close()

		if resp.StatusCode == http.StatusOK {
			log.Info().Str("endpoint", endpoint).Int("status", resp.StatusCode).Msg("Health check successful")
			os.Exit(0)
		}

		log.Error().Str("endpoint", endpoint).Int("status", resp.StatusCode).Msg("Health check failed")
		os.Exit(1)
	},
}
