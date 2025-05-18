package utils

import (
	"io/fs"
	"os"
	"regexp"
)

var UnixSocketRegex = regexp.MustCompile(`^unix:\/\/`)

func IsUnixSocket(path string) (bool, error) {
	fileInfo, err := os.Stat(path)
	if err != nil {
		return false, err
	}
	return fileInfo.Mode().Type() == fs.ModeSocket, nil
}
