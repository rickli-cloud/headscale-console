package cmd

import (
	"net/http"
	"os"
	"path"
	"time"

	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	frontend "github.com/rickli-cloud/headscale-console/dist"
	"github.com/rickli-cloud/headscale-console/internal/loggingMiddleware"
)

func init() {
	serveCmd.Flags().StringP("base", "b", "/admin", "HTML base path")
	viper.BindPFlag("base", serveCmd.Flags().Lookup("base"))

	serveCmd.Flags().StringP("listen", "l", ":3000", "Server listen address")
	viper.BindPFlag("listen", serveCmd.Flags().Lookup("listen"))

	serveCmd.Flags().String("configfile", "config.json", "Path to optional config file")
	viper.BindPFlag("configfile", serveCmd.Flags().Lookup("configfile"))

	rootCmd.AddCommand(serveCmd)
}

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "A basic static web server serving embedded files",
	Args:  cobra.NoArgs,
	Run: func(cmd *cobra.Command, args []string) {
		prefix := viper.GetString("base")
		listenAddr := viper.GetString("listen")
		configfile := viper.GetString("configfile")

		var config []byte

		// Load config on startup
		if _, err := os.Stat(configfile); !os.IsNotExist(err) {
			config, err = os.ReadFile(configfile)
			if err != nil {
				log.Fatal().Err(err).Msg("Failed to read configfile")
			}
		}

		log.Info().Str("addr", listenAddr).Str("base", prefix).Msg("Starting server")

		fileServer := http.FileServer(http.FS(frontend.Embedded))

		handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			start := time.Now()
			cleanPath := path.Clean(r.URL.Path)

			if config != nil && cleanPath == "/config.json" {
				w.Header().Set("Content-Type", "application/json")
				w.Write(config)
				log.Debug().Dur("duration", time.Since(start)).Msg("Config")
				return
			}

			resource := cleanPath
			if resource == "/" || resource == "" {
				resource = "/index.html"
			}
			trimmed := resource[1:]

			if _, err := frontend.Embedded.Open(trimmed); os.IsNotExist(err) {
				// Fallback to index
				content, readErr := frontend.Embedded.ReadFile(frontend.IndexPath)
				if readErr != nil {
					log.Error().Err(readErr).Msg("Failed to read index for fallback")
					http.Error(w, "Internal server error", http.StatusInternalServerError)
					return
				}
				w.Header().Set("Content-Type", "text/html; charset=utf-8")
				w.Write(content)
				log.Debug().Dur("duration", time.Since(start)).Msg("Served fallback index")
				return
			} else if err != nil {
				log.Error().Err(err).Msg("Error opening resource")
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}

			// Serve static files
			fileServer.ServeHTTP(w, r)
			log.Debug().Str("resource", trimmed).Dur("duration", time.Since(start)).Msg("Served static resource")
		})

		mux := http.NewServeMux()

		mux.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/plain")
			w.Write([]byte("OK"))
			log.Debug().Msg("Health check complete")
		})

		mux.Handle(prefix+"/", http.StripPrefix(prefix, handler))

		if err := http.ListenAndServe(listenAddr, loggingMiddleware.NewHandler(mux)); err != nil {
			log.Fatal().Err(err).Msg("Server crashed")
		}
	},
}
