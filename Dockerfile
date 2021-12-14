FROM nodered/node-red

USER root

RUN apk update \
    && apk add  --no-cache bash \
    && rm -rf /var/cache/apk/*