package main

import (
	"embed"
	"flag"
	"io/fs"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"
)

var (
	//go:embed dist/*
	embedded   embed.FS
	staticPath string = "dist"
	indexPath  string = "index.html"
)

func main() {
	prefix := flag.String("base", "/admin", "HTML base path")
	listenAddr := flag.String("listen", ":3000", "Server listen address")

	flag.Parse()

	sub, err := fs.Sub(embedded, staticPath)
	if err != nil {
		log.Fatalf("Failed to get embedded frontend subdirectory: %s\n", err.Error())
	}

	fileServer := http.FileServer(http.FS(sub))

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		path, err := filepath.Abs(r.URL.Path)
		if err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		if path == "/healthz" {
			w.Header().Set("Content-Type", "text/plain")
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("OK"))
			return
		}

		path = filepath.Join(staticPath, path)

		_, err = embedded.Open(path)
		if os.IsNotExist(err) {
			index, err := embedded.ReadFile(filepath.Join(staticPath, indexPath))
			if err != nil {
				log.Printf("Failed to read file: %s\n", err.Error())
				http.Error(w, "Internal server error", http.StatusInternalServerError)
				return
			}
			w.Header().Set("Content-Type", "text/html; charset=utf-8")
			w.WriteHeader(http.StatusOK)
			w.Write(index)
			return
		}
		if err != nil {
			log.Printf("Failed to open file: %s\n", err.Error())
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		fileServer.ServeHTTP(w, r)
	})

	log.Fatal(http.ListenAndServe(*listenAddr, loggingMiddleware(http.StripPrefix(*prefix, handler))))
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		startTime := time.Now()
		lrw := &loggingResponseWriter{ResponseWriter: w}
		next.ServeHTTP(lrw, r)
		log.Printf("%s \"%s %s %s\" %d %v \"%s\"", r.RemoteAddr, r.Method, r.URL.Path, r.Proto, lrw.statusCode, time.Since(startTime), r.UserAgent())
	})
}

type loggingResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (lrw *loggingResponseWriter) WriteHeader(statusCode int) {
	lrw.statusCode = statusCode
	lrw.ResponseWriter.WriteHeader(statusCode)
}
