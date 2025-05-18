package ipnState

import (
	"os"
	"path/filepath"

	"tailscale.com/ipn"
)

type FileStateStore struct {
	rootDir string
}

func NewFileStateStore(rootDir string) (*FileStateStore, error) {
	if err := os.MkdirAll(rootDir, 0700); err != nil {
		return nil, err
	}
	return &FileStateStore{rootDir: rootDir}, nil
}

func (fs *FileStateStore) path(id ipn.StateKey) string {
	return filepath.Join(fs.rootDir, string(id))
}

func (fs *FileStateStore) ReadState(id ipn.StateKey) ([]byte, error) {
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

func (fs *FileStateStore) WriteState(id ipn.StateKey, bs []byte) error {
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
