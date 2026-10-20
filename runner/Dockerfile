FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends python3 gcc g++ golang-go rustc default-jdk-headless \
    && rm -rf /var/lib/apt/lists/*
COPY execute.cjs /runner/execute.cjs
USER 65534:65534
WORKDIR /work
ENTRYPOINT ["node", "/runner/execute.cjs"]
