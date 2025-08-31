// The frontend.go inside the dist/ folder is just a placeholder for dependabot workflows
// When building the frontend, this file is replaced with the one from public/frontend.go

package frontend

import "embed"

var (
	//go:embed *
	Embedded   embed.FS
	StaticPath string = "dist"
	IndexPath  string = "index.html"
)
