package cmd

import (
	"context"
	"net/http"
	"os"
	"time"

	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	frontend "github.com/rickli-cloud/headscale-console/dist"
)

func init() {
	serveCmd.Flags().StringP("base", "b", "/admin", "HTML base path")
	viper.BindPFlag("serve.base", serveCmd.Flags().Lookup("base"))

	serveCmd.Flags().StringP("listen", "l", ":3000", "Server listen address")
	viper.BindPFlag("serve.listen", serveCmd.Flags().Lookup("listen"))

	serveCmd.Flags().String("configfile", "config.json", "Path to optional config file")
	viper.BindPFlag("serve.configfile", serveCmd.Flags().Lookup("configfile"))

	rootCmd.AddCommand(serveCmd)
}

var serveCmd = &cobra.Command{
	Use:   "serve",
	Short: "A basic static web server serving embedded files",
	Args:  cobra.NoArgs,
	Run: func(cmd *cobra.Command, args []string) {
		prefix := viper.GetString("serve.base")
		listenAddr := viper.GetString("serve.listen")
		configfile := viper.GetString("serve.configfile")

		var config []byte

		if _, err := os.Stat(configfile); !os.IsNotExist(err) {
			config, err = os.ReadFile(configfile)
			if err != nil {
				log.Fatal().Err(err).Msg("Failed to read configfile")
			}
		}

		router := http.NewServeMux()
		subrouter := http.NewServeMux()
		fileServer := http.FileServer(http.FS(frontend.Embedded))

		router.Handle(prefix+"/", http.StripPrefix(prefix, subrouter))

		subrouter.Handle("/", http.HandlerFunc(fileServer.ServeHTTP))

		if config != nil {
			subrouter.HandleFunc("/config", func(w http.ResponseWriter, r *http.Request) {
				w.Header().Set("Content-Type", "application/json")
				_, err := w.Write(config)
				if err != nil {
					log.Error().
						Err(err).
						Str("requestId", r.Context().Value("requestId").(string)).
						Msg("Failed to send response")
					http.Error(w, "", http.StatusInternalServerError)
				}
			})
		}

		subrouter.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "text/plain")
			_, err := w.Write([]byte("OK"))
			if err != nil {
				log.Error().
					Err(err).
					Str("requestId", r.Context().Value("requestId").(string)).
					Msg("Failed to send response")
				http.Error(w, "", http.StatusInternalServerError)
			}
		})

		log.Info().Str("addr", listenAddr).Str("base", prefix).Msg("Starting server")

		if err := http.ListenAndServe(listenAddr, newLoggingMiddleware(router)); err != nil {
			log.Fatal().Err(err).Msg("Failed to start server")
		}
	},
}

func newLoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		lrw := &loggingMiddlewareResponseWriter{
			ResponseWriter: w,
			statusCode:     http.StatusOK,
		}

		ctx := r.Context()
		requestId := uuid.New()
		ctx = context.WithValue(ctx, "requestId", requestId.String())

		next.ServeHTTP(lrw, r.WithContext(ctx))

		duration := time.Since(start)

		log.Trace().
			Str("requestId", requestId.String()).
			Str("remote", r.RemoteAddr).
			Str("method", r.Method).
			Str("path", r.URL.Path).
			Int("code", lrw.statusCode).
			Dur("duration", duration).
			Msg("Request completed")
	})
}

type loggingMiddlewareResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (lrw *loggingMiddlewareResponseWriter) WriteHeader(code int) {
	lrw.statusCode = code
	lrw.ResponseWriter.WriteHeader(code)
}
