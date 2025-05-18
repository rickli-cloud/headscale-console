package headscale

import (
	pb "github.com/rickli-cloud/headscale-console/gen/go/headscale/v1"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
)

func NewClient(addr string) (pb.HeadscaleServiceClient, error) {
	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	client := pb.NewHeadscaleServiceClient(conn)

	return client, nil
}
