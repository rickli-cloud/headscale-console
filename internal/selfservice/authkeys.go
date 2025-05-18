package selfservice

import (
	"context"
	"encoding/json"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	pb "github.com/rickli-cloud/headscale-console/gen/go/headscale/v1"
	"github.com/rs/zerolog/log"
	"google.golang.org/protobuf/types/known/timestamppb"
)

type AuthkeyListResponse struct {
	Key        string   `json:"key"`
	Id         string   `json:"id"`
	Expiration string   `json:"expiration"`
	CreatedAt  string   `json:"createdAt"`
	Ephemeral  bool     `json:"ephemeral"`
	Reusable   bool     `json:"reusable"`
	Used       bool     `json:"used"`
	AclTags    []string `json:"tags"`
}

func mapSlice[T any, M any](a []T, f func(T) M) []M {
	n := make([]M, len(a))
	for i, e := range a {
		n[i] = f(e)
	}
	return n
}

func handleAuthKeyList(client pb.HeadscaleServiceClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userIdString, ok := r.Context().Value("userId").(string)
		if !ok {
			log.Debug().Msg("Invalid request context for userId")
			http.Error(w, "", http.StatusUnauthorized)
			return
		}
		userId, err := strconv.ParseUint(userIdString, 10, 64)
		if err != nil {
			log.Debug().Msg("Failed to parse request context userId")
			http.Error(w, "", http.StatusUnauthorized)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		data, err := client.ListPreAuthKeys(ctx, &pb.ListPreAuthKeysRequest{User: userId})
		if err != nil {
			log.Error().Err(err).Uint64("userId", userId).Msg("Failed to list authkey for user")
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}

		keys := make([]AuthkeyListResponse, len(data.PreAuthKeys))
		for i, PreAuthKey := range data.PreAuthKeys {
			keys[i] = AuthkeyListResponse{
				Key:        PreAuthKey.Key,
				Id:         strconv.FormatInt(int64(PreAuthKey.Id), 10),
				Expiration: PreAuthKey.Expiration.AsTime().String(),
				CreatedAt:  PreAuthKey.CreatedAt.AsTime().String(),
				Ephemeral:  PreAuthKey.Ephemeral,
				Reusable:   PreAuthKey.Reusable,
				Used:       PreAuthKey.Used,
				AclTags:    PreAuthKey.AclTags,
			}
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(keys)
	}
}

type AuthKeyCreateResponse struct {
	Key string `json:"key"`
	Exp string `json:"exp"`
	Id  string `json:"id"`
}

func handleAuthKeyCreate(client pb.HeadscaleServiceClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userIdString, ok := r.Context().Value("userId").(string)
		if !ok {
			log.Debug().Msg("Invalid request context for userId")
			http.Error(w, "", http.StatusUnauthorized)
			return
		}
		userId, err := strconv.ParseUint(userIdString, 10, 64)
		if err != nil {
			log.Debug().Msg("Failed to parse request context userId")
			http.Error(w, "", http.StatusUnauthorized)
			return
		}

		query := r.URL.Query()
		reusable := query.Get("reusable")
		ephemeral := query.Get("ephemeral")
		expiration := query.Get("expiration")
		// Tags are intentionally left out as they're not checked by ACL tagOwners (forced)

		exp, err := time.Parse(time.RFC3339Nano, expiration)
		if err != nil {
			log.Debug().Err(err).Msg("Failed to parse expiration")
			http.Error(w, "", http.StatusBadRequest)
			return
		}
		if exp.Unix() < time.Now().Unix() {
			log.Debug().Msg("Expiration timestamp is in the past")
			http.Error(w, "", http.StatusBadRequest)
			return
		}

		log.Debug().Time("exp", exp).Msg("Expiration set")

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		result, err := client.CreatePreAuthKey(
			ctx,
			&pb.CreatePreAuthKeyRequest{
				User:       userId,
				Reusable:   reusable == "true",
				Ephemeral:  ephemeral == "true",
				Expiration: timestamppb.New(exp),
			},
		)
		if err != nil {
			log.Error().Err(err).Msg("Failed to create authkey")
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(AuthKeyCreateResponse{
			Key: result.PreAuthKey.Key,
			Exp: result.PreAuthKey.Expiration.AsTime().String(),
			Id:  strconv.FormatInt(int64(result.PreAuthKey.Id), 10),
		})
	}
}

func handleAuthKeyExpire(client pb.HeadscaleServiceClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		userIdString, ok := r.Context().Value("userId").(string)
		if !ok {
			log.Debug().Msg("Invalid request context for userId")
			http.Error(w, "", http.StatusUnauthorized)
			return
		}
		userId, err := strconv.ParseUint(userIdString, 10, 64)
		if err != nil {
			log.Debug().Msg("Failed to parse request context userId")
			http.Error(w, "", http.StatusUnauthorized)
			return
		}

		key := mux.Vars(r)["key"]

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		_, err = client.ExpirePreAuthKey(ctx, &pb.ExpirePreAuthKeyRequest{User: userId, Key: key})
		if err != nil {
			log.Error().Err(err).Msg("Failed to expire authkey")
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}
}
