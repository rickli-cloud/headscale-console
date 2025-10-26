package selfservice

import (
	"context"
	"errors"
	"strconv"
	"time"

	pb "github.com/rickli-cloud/headscale-console/gen/go/headscale/v1"
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

func ListAuthkeys(client pb.HeadscaleServiceClient, userId string) (*[]AuthkeyListResponse, error) {
	userIdUnit64, err := strconv.ParseUint(userId, 10, 64)
	if err != nil {
		return nil, errors.New("Failed to parse user ID")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	data, err := client.ListPreAuthKeys(ctx, &pb.ListPreAuthKeysRequest{User: userIdUnit64})
	if err != nil {
		return nil, err
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

	return &keys, nil
}

func ExpireAuthkey(client pb.HeadscaleServiceClient, userId string, key string) error {
	userIdUnit64, err := strconv.ParseUint(userId, 10, 64)
	if err != nil {
		return errors.New("Failed to parse user ID")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	_, err = client.ExpirePreAuthKey(ctx, &pb.ExpirePreAuthKeyRequest{User: userIdUnit64, Key: key})
	if err != nil {
		return err
	}

	return nil
}

type CreateAuthkeyOptions struct {
	Reusable   string
	Ephemeral  string
	Expiration string
}

type CreateAuthKeyResponse struct {
	Key string `json:"key"`
	Exp string `json:"exp"`
	Id  string `json:"id"`
}

func CreateAuthkey(client pb.HeadscaleServiceClient, userId string, opt CreateAuthkeyOptions) (*CreateAuthKeyResponse, error) {
	userIdUnit64, err := strconv.ParseUint(userId, 10, 64)
	if err != nil {
		return nil, errors.New("Failed to parse user ID")
	}

	exp, err := time.Parse(time.RFC3339Nano, opt.Expiration)
	if err != nil {
		return nil, errors.New("Failed to parse expiration")
	}
	if exp.Unix() < time.Now().Unix() {
		return nil, errors.New("Expiration timestamp is in the past")
	}

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	result, err := client.CreatePreAuthKey(
		ctx,
		&pb.CreatePreAuthKeyRequest{
			User:       userIdUnit64,
			Reusable:   opt.Reusable == "true",
			Ephemeral:  opt.Ephemeral == "true",
			Expiration: timestamppb.New(exp),
		},
	)

	return &CreateAuthKeyResponse{
		Key: result.PreAuthKey.Key,
		Exp: result.PreAuthKey.Expiration.AsTime().String(),
		Id:  strconv.FormatInt(int64(result.PreAuthKey.Id), 10),
	}, nil
}

func mapSlice[T any, M any](a []T, f func(T) M) []M {
	n := make([]M, len(a))
	for i, e := range a {
		n[i] = f(e)
	}
	return n
}
