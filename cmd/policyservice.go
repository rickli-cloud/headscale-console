package cmd

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"

	"github.com/rickli-cloud/headscale-console/internal/headscale"
	"github.com/rickli-cloud/headscale-console/internal/loggingMiddleware"
	"github.com/rickli-cloud/headscale-console/internal/policy"
	"github.com/rickli-cloud/headscale-console/internal/tsnet"
)

func init() {
	policyServiceCmd.Flags().StringP("control-url", "c", "", "Public control url of Headscale, used for tsnet connection (required)")
	viper.BindPFlag("control-url", policyServiceCmd.Flags().Lookup("control-url"))
	policyServiceCmd.MarkFlagRequired("control-url")

	policyServiceCmd.Flags().StringP("grpc-endpoint", "g", "unix:///var/run/headscale/headscale.sock", "Headscale GRPC endpoint")
	viper.BindPFlag("grpc-endpoint", policyServiceCmd.Flags().Lookup("grpc-endpoint"))

	policyServiceCmd.Flags().String("state-dir", "data", "Session data storage location")
	viper.BindPFlag("state-dir", policyServiceCmd.Flags().Lookup("state-dir"))

	policyServiceCmd.Flags().String("hostname", "policy-service", "Node hostname")
	viper.BindPFlag("hostname", policyServiceCmd.Flags().Lookup("hostname"))

	policyServiceCmd.Flags().String("user", "services@", "User that owns node")
	viper.BindPFlag("user", policyServiceCmd.Flags().Lookup("user"))

	policyServiceCmd.Flags().StringArrayP("advertise-tags", "t", nil, "Advertise tags for this device")
	viper.BindPFlag("advertise-tags", policyServiceCmd.Flags().Lookup("advertise-tags"))

	rootCmd.AddCommand(policyServiceCmd)
}

var policyServiceCmd = &cobra.Command{
	Use:   "serve",
	Short: "Run server",
	Args:  cobra.NoArgs,
	Run: func(cmd *cobra.Command, args []string) {
		grpcEndpoint := viper.GetString("grpc-endpoint")
		controlUrl := viper.GetString("control-url")
		stateDir := viper.GetString("state-dir")
		hostname := viper.GetString("hostname")
		user := viper.GetString("user")
		tags := viper.GetStringSlice("advertise-tags")

		client, err := headscale.NewClient(grpcEndpoint)
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to create gRPC client")
		}

		authkey, err := headscale.GrabAuthkey(client, headscale.AuthkeyOptions{
			Tags: tags,
			User: user,
		})
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to create a new Authkey")
		}

		_, localClient, httpListener, err := tsnet.NewTsnetServer(tsnet.Config{
			Authkey:    *authkey,
			ControlURL: controlUrl,
			StateDir:   stateDir,
		})

		router := mux.NewRouter()

		router.Use(loggingMiddleware.NewHandler)
		router.Use(tsnet.EnforceClientPolicy(localClient))

		router.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("OK"))
		})

		apiRouter := router.PathPrefix("/api/v1/").Subrouter()

		apiRouter.HandleFunc("/policy", func(w http.ResponseWriter, r *http.Request) {
			data, err := policy.GetPolicy(client)
			if err != nil {
				log.Error().Str("requestId", r.Context().Value("requestId").(string)).Err(err).Msg("Failed to get policy")
				http.Error(w, "", http.StatusInternalServerError)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(data)
		}).Methods("GET")

		apiRouter.HandleFunc("/policy", func(w http.ResponseWriter, r *http.Request) {
			bytedata, err := io.ReadAll(r.Body)
			if err != nil {
				log.Debug().Str("requestId", r.Context().Value("requestId").(string)).Err(err).Msg("Failed to read request body")
				http.Error(w, "", http.StatusBadRequest)
				return
			}

			data, err := policy.SetPolicy(client, string(bytedata))
			if err != nil {
				log.Error().Str("requestId", r.Context().Value("requestId").(string)).Err(err).Msg("Failed to update policy")
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(data)
		}).Methods("POST")

		log.Info().Str("addr", fmt.Sprintf("http://%s/", hostname)).Msg("Server starting")

		if err = http.Serve(httpListener, router); err != nil {
			log.Fatal().Err(err).Msg("Failed to attach http handler")
		}
	},
}
