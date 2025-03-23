FROM golang:latest as build

WORKDIR /work

COPY dist/ dist/
COPY server.go server.go

RUN CGO_ENABLED=0 GOOS=linux GOARCH=$TARGETARCH go build $PWD/server.go

FROM scratch

LABEL maintainer=github.com/rickli-cloud

COPY --from=build /work/server .

EXPOSE 3000

ENTRYPOINT [ "/server" ]