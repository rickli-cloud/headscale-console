package headscale

import (
	"context"
	"errors"
	"io/fs"
	"os"
	"regexp"
	"time"

	pb "github.com/rickli-cloud/headscale-console/gen/go/headscale/v1"
	"github.com/rs/zerolog/log"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/protobuf/types/known/timestamppb"
)

func NewClient(addr string) (pb.HeadscaleServiceClient, error) {
	err := grpcEndpointCheck(addr)
	if err != nil {
		return nil, err
	}

	conn, err := grpc.NewClient(addr, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, err
	}

	client := pb.NewHeadscaleServiceClient(conn)

	return client, nil
}

type AuthkeyOptions struct {
	Tags     []string
	User     string
	Reusable bool
}

func GrabAuthkey(client pb.HeadscaleServiceClient, opt AuthkeyOptions) (*string, error) {
	// TODO: Generates a new key at each startup; if a session already exists, this step could be skipped
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	var userId uint64

	serviceUserResponse, err := client.ListUsers(ctx, &pb.ListUsersRequest{Name: opt.User})
	if err != nil {
		return nil, err
	}
	if len(serviceUserResponse.Users) == 1 {
		userId = serviceUserResponse.Users[0].Id
	} else {
		newUser, err := client.CreateUser(ctx, &pb.CreateUserRequest{Name: opt.User, DisplayName: opt.User})
		if err != nil {
			return nil, err
		}
		userId = newUser.User.Id
		log.Debug().Interface("user", newUser.User).Msg("User did not exist, created a new one")
	}

	expiration := timestamppb.New(time.Now().Add(1 * time.Minute))
	log.Debug().Str("expiration", expiration.AsTime().Format("2006-01-02T15:04:05.000Z")).Msg("Creating a new authkey")

	authkey, err := client.CreatePreAuthKey(ctx, &pb.CreatePreAuthKeyRequest{
		Expiration: expiration,
		AclTags:    opt.Tags,
		User:       userId,
		Reusable:   false,
		Ephemeral:  false,
	})
	if err != nil {
		return nil, err
	}

	return &authkey.PreAuthKey.Key, nil
}

var unixSocketRegex = regexp.MustCompile(`^unix:\/\/`)

// Checks if the provided path is a unix socket and exists.
func grpcEndpointCheck(rawPath string) error {
	if !unixSocketRegex.Match([]byte(rawPath)) {
		return nil
	}

	fileInfo, err := os.Stat(unixSocketRegex.ReplaceAllLiteralString(rawPath, ""))
	if err != nil {
		return err
	}

	if fileInfo.Mode().Type() != fs.ModeSocket {
		return errors.New("gRPC unix socket but could not be opened. Does it exist?")
	}

	return nil
}
