package selfservice

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	pb "github.com/rickli-cloud/headscale-console/gen/go/headscale/v1"
	"github.com/rs/zerolog/log"
	"tailscale.com/client/local"
)

type Config struct {
	AllowAuthkeys     bool `json:"authkeys"`
	AllowNodeDeletion bool `json:"nodeDeletion"`
	AllowNonJS        bool `json:"-"`
}

func NewHandler(config Config, client pb.HeadscaleServiceClient, localClient *local.Client) http.Handler {
	router := mux.NewRouter()

	router.HandleFunc("/healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("OK"))
	})

	apiRouter := router.PathPrefix("/api/v1/").Subrouter()

	apiRouter.Use(
		func(next http.Handler) http.Handler {
			return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				ctx := r.Context()

				whois, err := localClient.WhoIs(ctx, r.RemoteAddr)
				if err != nil {
					requestId := r.Context().Value("requestId").(string)
					log.Error().Str("requestId", requestId).Err(err).Msg("Failed to get WhoIs context")
					http.Error(w, "Internal Server Error", http.StatusUnauthorized)
					return
				}

				if config.AllowNonJS != true && whois.Node.Hostinfo.OS() != "js" {
					requestId := r.Context().Value("requestId").(string)
					log.Warn().Str("requestId", requestId).Msg("Non javascript machine tried to access API")
					http.Error(w, "Internal Server Error", http.StatusForbidden)
					return
				}

				ctx = context.WithValue(ctx, "userId", strconv.FormatInt(int64(whois.UserProfile.ID), 10))
				ctx = context.WithValue(ctx, "displayname", whois.UserProfile.DisplayName)
				ctx = context.WithValue(ctx, "username", whois.UserProfile.LoginName)
				ctx = context.WithValue(ctx, "nodeId", strconv.FormatInt(int64(whois.Node.ID), 10))

				next.ServeHTTP(w, r.WithContext(ctx))
			})
		},
	)

	apiRouter.HandleFunc("/cap", handleCap(config)).Methods("GET")

	apiRouter.HandleFunc("/node/{nodeId}", handleNodeExpire(client)).Methods("PATCH")

	if config.AllowNodeDeletion {
		apiRouter.HandleFunc("/node/{nodeId}", handleNodeDelete(client)).Methods("DELETE")
	}

	apiRouter.HandleFunc("/authkey", handleAuthKeyList(client)).Methods("GET")

	apiRouter.HandleFunc("/authkey/{key}", handleAuthKeyExpire(client)).Methods("PATCH")

	if config.AllowAuthkeys {
		apiRouter.HandleFunc("/authkey", handleAuthKeyCreate(client)).Methods("PUT")
	}

	return router
}

func handleCap(config Config) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(config)
	}
}
