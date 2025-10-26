package tsnet

import (
	"net"

	"github.com/rs/zerolog/log"
	"tailscale.com/client/local"
	tsnetImpl "tailscale.com/tsnet"
)

type Config struct {
	Authkey    string
	ControlURL string
	StateDir   string
	Hostname   string
}

func NewTsnetServer(config Config) (*tsnetImpl.Server, *local.Client, net.Listener, error) {
	stateStore, err := newFileStateStore(config.StateDir)
	if err != nil {
		return nil, nil, nil, err
	}

	srv := &tsnetImpl.Server{
		AuthKey:    config.Authkey,
		ControlURL: config.ControlURL,
		Hostname:   config.Hostname,
		Store:      stateStore,
		Logf:       log.Printf,
		Port:       80,
	}

	localClient, err := srv.LocalClient()
	if err != nil {
		return nil, nil, nil, err
	}

	httpListener, err := srv.Listen("tcp", ":80")
	if err != nil {
		return nil, nil, nil, err
	}

	return srv, localClient, httpListener, nil
}
