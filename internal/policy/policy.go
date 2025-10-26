package policy

import (
	"context"
	"time"

	pb "github.com/rickli-cloud/headscale-console/gen/go/headscale/v1"
)

type PolicyResponse struct {
	Policy    string `json:"policy"`
	UpdatedAt string `json:"updatedAt"`
}

func SetPolicy(client pb.HeadscaleServiceClient, policy string) (*PolicyResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	data, err := client.SetPolicy(ctx, &pb.SetPolicyRequest{Policy: policy})
	if err != nil {
		return nil, err
	}
	return &PolicyResponse{
		Policy:    data.Policy,
		UpdatedAt: data.UpdatedAt.AsTime().String(),
	}, nil
}

func GetPolicy(client pb.HeadscaleServiceClient) (*PolicyResponse, error) {
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	data, err := client.GetPolicy(ctx, &pb.GetPolicyRequest{})
	if err != nil {
		return nil, err
	}
	return &PolicyResponse{
		Policy:    data.Policy,
		UpdatedAt: data.UpdatedAt.AsTime().String(),
	}, nil
}
