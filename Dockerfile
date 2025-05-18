FROM golang:latest AS build

ARG HEADSCALE_CONSOLE_VERSION

WORKDIR /work

COPY internal/ internal/
COPY main.go main.go
COPY gen/ gen/
COPY cmd/ cmd/
COPY go.* ./

COPY dist/ dist/
COPY frontend.go.tmpl dist/frontend.go

RUN CGO_ENABLED=0 GOOS=linux GOARCH=$TARGETARCH go build -ldflags "-X tailscale.com/version.shortStamp=1.82.5 -X tailscale.com/version.longStamp=1.82.5-HeadscaleConsole-${HEADSCALE_CONSOLE_VERSION}" main.go


FROM scratch

ENV PATH=/

LABEL maintainer=github.com/rickli-cloud

COPY --from=build /work/main headscale-console

EXPOSE 3000

ENTRYPOINT [ "/headscale-console" ]
CMD [ "serve" ]
