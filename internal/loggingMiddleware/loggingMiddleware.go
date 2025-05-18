package loggingMiddleware

import (
	"context"
	"net/http"

	"github.com/google/uuid"
	"github.com/rs/zerolog/log"
)

func NewHandler(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		lrw := &LoggingMiddlewareResponseWriter{ResponseWriter: w, statusCode: http.StatusOK}
		ctx := r.Context()
		requestId := uuid.New()
		ctx = context.WithValue(ctx, "requestId", requestId.String())
		next.ServeHTTP(lrw, r.WithContext(ctx))
		log.Debug().
			Str("requestId", requestId.String()).
			Str("remote", r.RemoteAddr).
			Str("method", r.Method).
			Str("path", r.URL.Path).
			Int("code", lrw.statusCode).
			Msg("Request completed")
	})
}

type LoggingMiddlewareResponseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (lrw *LoggingMiddlewareResponseWriter) WriteHeader(code int) {
	lrw.statusCode = code
	lrw.ResponseWriter.WriteHeader(code)
}
