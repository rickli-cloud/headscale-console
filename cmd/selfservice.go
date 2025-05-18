package cmd

import (
	"context"
	"fmt"
	"net/http"
	"time"

	pb "github.com/rickli-cloud/headscale-console/gen/go/headscale/v1"
	"github.com/rickli-cloud/headscale-console/internal/headscale"
	"github.com/rickli-cloud/headscale-console/internal/ipnState"
	"github.com/rickli-cloud/headscale-console/internal/loggingMiddleware"
	"github.com/rickli-cloud/headscale-console/internal/selfservice"
	"github.com/rickli-cloud/headscale-console/internal/utils"
	"github.com/rs/zerolog/log"
	"github.com/spf13/cobra"
	"github.com/spf13/viper"
	"google.golang.org/protobuf/types/known/timestamppb"
	"tailscale.com/tsnet"
)

func init() {
	selfServiceCmd.Flags().StringP("control-url", "c", "", "Public control url of Headscale, used for tsnet connection (required)")
	viper.BindPFlag("control-url", selfServiceCmd.Flags().Lookup("control-url"))
	selfServiceCmd.MarkFlagRequired("control-url")

	selfServiceCmd.Flags().StringP("grpc-endpoint", "g", "unix:///var/run/headscale/headscale.sock", "Headscale GRPC endpoint")
	viper.BindPFlag("grpc-endpoint", selfServiceCmd.Flags().Lookup("grpc-endpoint"))

	selfServiceCmd.Flags().String("state-dir", "data", "Session data storage location")
	viper.BindPFlag("state-dir", selfServiceCmd.Flags().Lookup("state-dir"))

	selfServiceCmd.Flags().String("hostname", "self-service", "Node hostname")
	viper.BindPFlag("hostname", selfServiceCmd.Flags().Lookup("hostname"))

	selfServiceCmd.Flags().String("user", "services@", "User that owns node")
	viper.BindPFlag("user", selfServiceCmd.Flags().Lookup("user"))

	selfServiceCmd.Flags().StringArrayP("advertise-tags", "t", nil, "Advertise tags for this device")
	viper.BindPFlag("advertise-tags", selfServiceCmd.Flags().Lookup("advertise-tags"))

	selfServiceCmd.Flags().Bool("allow-authkeys", false, "Allow users to create self-owned authkeys")
	viper.BindPFlag("allow-authkeys", selfServiceCmd.Flags().Lookup("allow-authkeys"))

	selfServiceCmd.Flags().Bool("allow-node-deletion", false, "Allow users to delete their own nodes")
	viper.BindPFlag("allow-node-deletion", selfServiceCmd.Flags().Lookup("allow-node-deletion"))

	selfServiceCmd.Flags().Bool("allow-non-js", false, "Allow non-js nodes to access the API (not recommended)")
	viper.BindPFlag("allow-non-js", selfServiceCmd.Flags().Lookup("allow-non-js"))

	rootCmd.AddCommand(selfServiceCmd)
}

var selfServiceCmd = &cobra.Command{
	Use:   "selfservice",
	Short: "A self-service tsnet server based on the headscale GRPC API",
	Args:  cobra.NoArgs,
	Run: func(cmd *cobra.Command, args []string) {
		grpcEndpoint := viper.GetString("grpc-endpoint")
		controlUrl := viper.GetString("control-url")
		stateDir := viper.GetString("state-dir")
		hostname := viper.GetString("hostname")
		user := viper.GetString("user")
		tags := viper.GetStringSlice("advertise-tags")

		allowAuthkeys := viper.GetBool("allow-authkeys")
		allowNodeDeletion := viper.GetBool("allow-node-deletion")
		allowNonJS := viper.GetBool("allow-non-js")

		config := selfservice.Config{
			AllowAuthkeys:     allowAuthkeys,
			AllowNodeDeletion: allowNodeDeletion,
			AllowNonJS:        allowNonJS,
		}

		if len(grpcEndpoint) > 7 && utils.UnixSocketRegex.Match([]byte(grpcEndpoint)) {
			isSocket, err := utils.IsUnixSocket(utils.UnixSocketRegex.ReplaceAllLiteralString(grpcEndpoint, ""))
			if err != nil {
				log.Fatal().Err(err).Msg("Failed to determine if provided unix grpc-endpoint is a socket")
			}
			if !isSocket {
				log.Fatal().Msg("Provided grpc-endpoint seems to be defined as unix socket but could not be opened. Does it exist?")
			}
		}

		client, err := headscale.NewClient(grpcEndpoint)
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to create GRPC client")
		}

		ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
		defer cancel()

		var userId uint64

		serviceUserResponse, err := client.ListUsers(ctx, &pb.ListUsersRequest{Name: user})
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to check if user already exists")
		}
		if len(serviceUserResponse.Users) == 1 {
			userId = serviceUserResponse.Users[0].Id
		} else {
			newUser, err := client.CreateUser(ctx, &pb.CreateUserRequest{Name: user, DisplayName: user})
			if err != nil {
				log.Fatal().Err(err).Msg("Failed to create new user")
			}
			userId = newUser.User.Id
			log.Info().Interface("user", newUser.User).Msg("User did not exist, created a new one")
		}

		expiration := timestamppb.New(time.Now().Add(1 * time.Minute))
		log.Debug().Str("expiration", expiration.AsTime().Format("2006-01-02T15:04:05.000Z")).Msg("Creating a new authkey")

		// TODO: Generates a new key at each startup; if a session already exists, this step could be skipped
		authkey, err := client.CreatePreAuthKey(ctx, &pb.CreatePreAuthKeyRequest{
			Expiration: expiration,
			AclTags:    tags,
			User:       userId,
			Reusable:   false,
			Ephemeral:  false,
		})
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to create a new Authkey")
		}

		stateStore, err := ipnState.NewFileStateStore(stateDir)
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to create state storage")
		}
		log.Debug().Str("location", stateDir).Msg("State storage handler created")

		srv := &tsnet.Server{
			AuthKey:    authkey.PreAuthKey.Key,
			ControlURL: controlUrl,
			Hostname:   hostname,
			Logf:       log.Printf,
			Port:       80,
			Store:      stateStore,
		}

		localClient, err := srv.LocalClient()
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to grab local tsnet client")
		}

		httpListener, err := srv.Listen("tcp", ":80")
		if err != nil {
			log.Fatal().Err(err).Msg("Failed to start tsnet server")
		}

		httpHandler := loggingMiddleware.NewHandler(enforceCorsPolicy(selfservice.NewHandler(config, client, localClient)))

		log.Info().Str("addr", fmt.Sprintf("http://%s/", hostname)).Msg("Server starting")

		if err = http.Serve(httpListener, httpHandler); err != nil {
			log.Fatal().Err(err).Msg("Failed to attach http handler")
		}
	},
}

func enforceCorsPolicy(h http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.Header().Add("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; script-src 'none'; script-src-elem 'none'; script-src-attr 'none'; style-src 'none'")
		w.Header().Add("X-Content-Type-Options", "nosniff")
		w.Header().Add("X-Frame-Options", "DENY")

		if r.Header.Get("Sec-Fetch-Site") != "same-origin" {
			requestId := r.Context().Value("requestId").(string)
			log.Debug().Str("requestId", requestId).Msg("Request does not satisfy CORS policy")
			http.Error(w, "", http.StatusBadRequest)
			return
		}

		h.ServeHTTP(w, r)
	})
}
