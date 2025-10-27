package tsnet

import (
	"os"
	"path/filepath"

	"tailscale.com/ipn"
)

type fileStateStore struct {
	rootDir string
}

func newFileStateStore(rootDir string) (*fileStateStore, error) {
	if err := os.MkdirAll(rootDir, 0700); err != nil {
		return nil, err
	}
	return &fileStateStore{rootDir: rootDir}, nil
}

func (fs *fileStateStore) path(id ipn.StateKey) string {
	return filepath.Join(fs.rootDir, string(id))
}

func (fs *fileStateStore) ReadState(id ipn.StateKey) ([]byte, error) {
	p := fs.path(id)
	bs, err := os.ReadFile(p)
	if err != nil {
		if os.IsNotExist(err) {
			return nil, ipn.ErrStateNotExist
		}
		return nil, err
	}
	return bs, nil
}

func (fs *fileStateStore) WriteState(id ipn.StateKey, bs []byte) error {
	p := fs.path(id)
	dir := filepath.Dir(p)
	if err := os.MkdirAll(dir, 0700); err != nil {
		return err
	}
	tmp := p + ".tmp"
	if err := os.WriteFile(tmp, bs, 0600); err != nil {
		return err
	}
	return os.Rename(tmp, p)
}
