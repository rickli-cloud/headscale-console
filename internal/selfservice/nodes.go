package selfservice

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	pb "github.com/rickli-cloud/headscale-console/gen/go/headscale/v1"
	"github.com/rs/zerolog/log"
)

func handleNodeExpire(client pb.HeadscaleServiceClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		node, status := ensureNodeOwnership(mux.Vars(r)["nodeId"], r, client)
		if status != http.StatusOK {
			http.Error(w, "", status)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		_, err := client.ExpireNode(ctx, &pb.ExpireNodeRequest{NodeId: node.Id})
		if err != nil {
			log.Error().Err(err).Msg("Failed to expire node")
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}
}

func handleNodeDelete(client pb.HeadscaleServiceClient) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		node, status := ensureNodeOwnership(mux.Vars(r)["nodeId"], r, client)
		if status != http.StatusOK {
			http.Error(w, "", status)
			return
		}

		ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
		defer cancel()

		_, err := client.DeleteNode(ctx, &pb.DeleteNodeRequest{NodeId: node.Id})
		if err != nil {
			log.Error().Err(err).Msg("Failed to delete node")
			w.WriteHeader(http.StatusInternalServerError)
			w.Write([]byte(err.Error()))
			return
		}

		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}
}

func ensureNodeOwnership(id string, r *http.Request, client pb.HeadscaleServiceClient) (*pb.Node, int) {
	if id == "" {
		log.Debug().Msg("Request lacks nodeId")
		return nil, http.StatusBadRequest
	}

	nodeID, err := strconv.ParseUint(id, 10, 64)
	if err != nil {
		log.Debug().Err(err).Msg("Failed to parse nodeId")
		return nil, http.StatusBadRequest
	}

	userId, ok := r.Context().Value("userId").(string)
	if !ok || len(userId) == 0 {
		log.Debug().Msg("Invalid request context for userId")
		return nil, http.StatusUnauthorized
	}

	ctx, cancel := context.WithTimeout(r.Context(), 10*time.Second)
	defer cancel()

	nodeRes, err := client.GetNode(ctx, &pb.GetNodeRequest{NodeId: nodeID})
	if err != nil {
		log.Error().Err(err).Msg("Failed to grab node based on user provided id")
		return nil, http.StatusInternalServerError
	}

	if strconv.FormatUint(nodeRes.Node.User.Id, 10) != userId {
		log.Warn().
			Str("userId", userId).
			Uint64("nodeId", nodeRes.Node.Id).
			Uint64("nodeUserID", nodeRes.Node.User.Id).
			Msg("User tried to perform forbidden action on machine!")
		return nil, http.StatusForbidden
	}

	return nodeRes.Node, http.StatusOK
}
