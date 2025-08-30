package frontend

import "embed"

var (
	//go:embed *
	Embedded   embed.FS
	StaticPath string = "dist"
	IndexPath  string = "index.html"
)
