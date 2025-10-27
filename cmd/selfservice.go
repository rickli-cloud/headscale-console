package cmd

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/gorilla/mux"
	"github.com/rickli-cloud/headscale-console/internal/headscale"
	"github.com/rickli-cloud/headscale-console/internal/loggingMiddleware"
	"github.com/rickli-cloud/headscale-console/internal/selfservice"
	"github.com/rickli-cloud/headscale-console/internal/tsnet"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
)

func init() {
	selfServiceCmd.Flags().StringP("control-url", "c", "", "Public control url of Headscale, used for tsnet connection (required)")
	viper.BindPFlag("selfservice.control-url", selfServiceCmd.Flags().Lookup("control-url"))
	selfServiceCmd.MarkFlagRequired("control-url")

	selfServiceCmd.Flags().StringP("grpc-endpoint", "g", "unix:///var/run/headscale/headscale.sock", "Headscale GRPC endpoint")
	viper.BindPFlag("selfservice.grpc-endpoint", selfServiceCmd.Flags().Lookup("grpc-endpoint"))

	selfServiceCmd.Flags().String("state-dir", "data", "Session data storage location")
	viper.BindPFlag("selfservice.state-dir", selfServiceCmd.Flags().Lookup("state-dir"))

	selfServiceCmd.Flags().String("hostname", "self-service", "Node hostname")
	viper.BindPFlag("selfservice.hostname", selfServiceCmd.Flags().Lookup("hostname"))

	selfServiceCmd.Flags().String("user", "services@", "User that owns node")
	viper.BindPFlag("selfservice.user", selfServiceCmd.Flags().Lookup("user"))

	selfServiceCmd.Flags().StringArrayP("advertise-tags", "t", nil, "Advertise tags for this device")
	viper.BindPFlag("selfservice.advertise-tags", selfServiceCmd.Flags().Lookup("advertise-tags"))

	selfServiceCmd.Flags().Bool("allow-authkeys", false, "Allow users to create self-owned authkeys")
	viper.BindPFlag("selfservice.allow-authkeys", selfServiceCmd.Flags().Lookup("allow-authkeys"))

	selfServiceCmd.Flags().Bool("allow-node-deletion", false, "Allow users to delete their own nodes")
	viper.BindPFlag("selfservice.allow-node-deletion", selfServiceCmd.Flags().Lookup("allow-node-deletion"))

	rootCmd.AddCommand(selfServiceCmd)
}

var selfServiceCmd = &cobra.Command{
	Use:   "selfservice",
	Short: "A self-service tsnet server based on the headscale gRPC API",
	Args:  cobra.NoArgs,
	Run: func(cmd *cobra.Command, args []string) {
		grpcEndpoint := viper.GetString("selfservice.grpc-endpoint")
		controlUrl := viper.GetString("selfservice.control-url")
		stateDir := viper.GetString("selfservice.state-dir")
		hostname := viper.GetString("selfservice.hostname")
		user := viper.GetString("selfservice.user")
		tags := viper.GetStringSlice("selfservice.advertise-tags")

		allowAuthkeys := viper.GetBool("selfservice.allow-authkeys")
		allowNodeDeletion := viper.GetBool("selfservice.allow-node-deletion")

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
			Hostname:   hostname,
			StateDir:   stateDir,
		})

		router := mux.NewRouter()

		router.Use(loggingMiddleware.NewHandler)
		router.Use(tsnet.EnforceClientPolicy(localClient))

		router.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
			w.Write([]byte("OK"))
		})

		apiRouter := router.PathPrefix("/api/v1/").Subrouter()

		apiRouter.HandleFunc("/cap", func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(capMap{
				AllowAuthkeys:     allowAuthkeys,
				AllowNodeDeletion: allowNodeDeletion,
			})
		}).Methods("GET")

		apiRouter.HandleFunc("/node/{nodeId}", func(w http.ResponseWriter, r *http.Request) {
			userId, ok := r.Context().Value("userId").(string)
			if !ok {
				log.Debug().Msg("Invalid request context for userId")
				http.Error(w, "", http.StatusUnauthorized)
				return
			}

			nodeId := mux.Vars(r)["nodeId"]

			err := selfservice.ExpireNode(client, nodeId, userId)
			if err != nil {
				log.Error().Str("requestId", r.Context().Value("requestId").(string)).Err(err).Msg("Failed to expire node")
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			w.WriteHeader(http.StatusOK)
			w.Write([]byte("OK"))
		}).Methods("PATCH")

		if allowNodeDeletion {
			apiRouter.HandleFunc("/node/{nodeId}", func(w http.ResponseWriter, r *http.Request) {
				userId, ok := r.Context().Value("userId").(string)
				if !ok {
					log.Debug().Msg("Invalid request context for userId")
					http.Error(w, "", http.StatusUnauthorized)
					return
				}

				nodeId := mux.Vars(r)["nodeId"]

				err := selfservice.DeleteNode(client, nodeId, userId)
				if err != nil {
					log.Error().Str("requestId", r.Context().Value("requestId").(string)).Err(err).Msg("Failed to delete node")
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}

				w.WriteHeader(http.StatusOK)
				w.Write([]byte("OK"))
			}).Methods("DELETE")
		}

		apiRouter.HandleFunc("/authkey", func(w http.ResponseWriter, r *http.Request) {
			userId, ok := r.Context().Value("userId").(string)
			if !ok {
				log.Debug().Msg("Invalid request context for userId")
				http.Error(w, "", http.StatusUnauthorized)
				return
			}

			keys, err := selfservice.ListAuthkeys(client, userId)

			if err != nil {
				log.Error().Str("requestId", r.Context().Value("requestId").(string)).Err(err).Msg("Failed to list authkeys")
				http.Error(w, "", http.StatusInternalServerError)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(keys)
		}).Methods("GET")

		apiRouter.HandleFunc("/authkey/{key}", func(w http.ResponseWriter, r *http.Request) {
			userId, ok := r.Context().Value("userId").(string)
			if !ok {
				log.Debug().Msg("Invalid request context for userId")
				http.Error(w, "", http.StatusUnauthorized)
				return
			}

			key := mux.Vars(r)["key"]

			err := selfservice.ExpireAuthkey(client, userId, key)

			if err != nil {
				log.Error().Str("requestId", r.Context().Value("requestId").(string)).Err(err).Msg("Failed to expire authkey")
				http.Error(w, err.Error(), http.StatusInternalServerError)
				return
			}

			w.WriteHeader(http.StatusOK)
			w.Write([]byte("OK"))
		}).Methods("PATCH")

		if allowAuthkeys {
			apiRouter.HandleFunc("/authkey", func(w http.ResponseWriter, r *http.Request) {
				userId, ok := r.Context().Value("userId").(string)
				if !ok {
					log.Debug().Msg("Invalid request context for userId")
					http.Error(w, "", http.StatusUnauthorized)
					return
				}

				opt := selfservice.CreateAuthkeyOptions{
					Reusable:   r.URL.Query().Get("reusable"),
					Ephemeral:  r.URL.Query().Get("ephemeral"),
					Expiration: r.URL.Query().Get("expiration"),
				}

				key, err := selfservice.CreateAuthkey(client, userId, opt)
				if err != nil {
					log.Error().Str("requestId", r.Context().Value("requestId").(string)).Err(err).Msg("Failed to create authkey")
					http.Error(w, err.Error(), http.StatusInternalServerError)
					return
				}

				w.Header().Set("Content-Type", "application/json")
				json.NewEncoder(w).Encode(key)
			}).Methods("PUT")
		}

		log.Info().Str("addr", fmt.Sprintf("http://%s/", hostname)).Msg("Server starting")

		if err = http.Serve(httpListener, router); err != nil {
			log.Fatal().Err(err).Msg("Failed to attach http handler")
		}
	},
}

type capMap struct {
	AllowAuthkeys     bool `json:"authkeys"`
	AllowNodeDeletion bool `json:"nodeDeletion"`
}
