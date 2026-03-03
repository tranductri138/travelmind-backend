#!/bin/bash
set -e

IMAGE_NAME="travelmind-api"
CONTAINER_NAME="travelmind-api"
ENV_FILE=".env"
DOCKERFILE="docker/Dockerfile.dev"
NETWORK="travelmind"

# Stop & remove container cũ nếu đang chạy
if docker ps -a --format '{{.Names}}' | grep -q "^${CONTAINER_NAME}$"; then
  echo "Removing existing container: ${CONTAINER_NAME}"
  docker rm -f "$CONTAINER_NAME"
fi

# Kiểm tra network của docker-compose đã tồn tại chưa
if ! docker network ls --format '{{.Name}}' | grep -q "^${NETWORK}$"; then
  echo "ERROR: Network '${NETWORK}' not found. Run 'docker compose up -d' for infra first."
  exit 1
fi

echo "Building image: ${IMAGE_NAME}..."
docker build -t "$IMAGE_NAME" -f "$DOCKERFILE" .

echo "Running container: ${CONTAINER_NAME}..."
docker run -d \
  --name "$CONTAINER_NAME" \
  --env-file "$ENV_FILE" \
  --network "$NETWORK" \
  -p 3000:3000 \
  -p 9229:9229 \
  -v "$(pwd)":/app \
  -v /app/node_modules \
  "$IMAGE_NAME"

echo ""
echo "Container started: ${CONTAINER_NAME}"
echo "  API: http://localhost:3000/api"
echo "  Logs: docker logs -f ${CONTAINER_NAME}"
