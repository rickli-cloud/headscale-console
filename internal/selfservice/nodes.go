package selfservice

import (
	"context"
	"errors"
	"strconv"
	"time"

	pb "github.com/rickli-cloud/headscale-console/gen/go/headscale/v1"
	"github.com/rs/zerolog/log"
)

func ExpireNode(client pb.HeadscaleServiceClient, nodeId string, userId string) error {
	node, err := ensureNodeOwnership(nodeId, userId, client)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err = client.ExpireNode(ctx, &pb.ExpireNodeRequest{NodeId: node.Id})
	if err != nil {
		return err
	}

	return nil
}

func DeleteNode(client pb.HeadscaleServiceClient, nodeId string, userId string) error {
	node, err := ensureNodeOwnership(nodeId, userId, client)
	if err != nil {
		return err
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err = client.DeleteNode(ctx, &pb.DeleteNodeRequest{NodeId: node.Id})
	if err != nil {
		return err
	}

	return nil
}

func ensureNodeOwnership(nodeId string, userId string, client pb.HeadscaleServiceClient) (*pb.Node, error) {
	if nodeId == "" {
		return nil, errors.New("Bad Request: missing nodeId")
	}

	nodeIdUint64, err := strconv.ParseUint(nodeId, 10, 64)
	if err != nil {
		return nil, errors.New("Bad Request: invalid nodeId")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	nodeRes, err := client.GetNode(ctx, &pb.GetNodeRequest{NodeId: nodeIdUint64})
	if err != nil {
		return nil, err
	}

	if strconv.FormatUint(nodeRes.Node.User.Id, 10) != userId {
		log.Warn().
			Str("userId", userId).
			Str("nodeId", strconv.FormatUint(nodeRes.Node.Id, 10)).
			Str("nodeUserID", strconv.FormatUint(nodeRes.Node.User.Id, 10)).
			Msg("User tried to perform forbidden action on machine!")
		return nil, errors.New("Unauthorized to access this node")
	}

	return nodeRes.Node, nil
}
