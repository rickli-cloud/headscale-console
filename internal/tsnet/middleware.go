package tsnet

import (
	"context"
	"net/http"
	"strconv"

	"github.com/rs/zerolog/log"
	"tailscale.com/client/local"
)

func EnforceClientPolicy(localClient *local.Client) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			ctx := r.Context()

			whois, err := localClient.WhoIs(ctx, r.RemoteAddr)
			if err != nil {
				requestId := r.Context().Value("requestId").(string)
				log.Warn().Str("requestId", requestId).Err(err).Msg("Failed to get WhoIs context")
				http.Error(w, "Internal Server Error", http.StatusUnauthorized)
				return
			}

			if whois.Node.Hostinfo.OS() != "js" {
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
	}
}
