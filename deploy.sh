#!/usr/bin/env bash
# One-shot deploy to Cloud Run (asia-south1). Requires an authenticated gcloud.
set -euo pipefail

PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null)}"
REGION="${REGION:-asia-south1}"
SERVICE="${SERVICE:-arogyapulse}"
REPO="${REPO:-arogyapulse}"
IMAGE="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO}/${SERVICE}:$(date +%Y%m%d-%H%M%S)"

echo "Project: ${PROJECT_ID}  Region: ${REGION}  Service: ${SERVICE}"

gcloud services enable run.googleapis.com cloudbuild.googleapis.com \
  artifactregistry.googleapis.com firestore.googleapis.com secretmanager.googleapis.com \
  --project "${PROJECT_ID}"

gcloud artifacts repositories describe "${REPO}" --location "${REGION}" --project "${PROJECT_ID}" >/dev/null 2>&1 || \
  gcloud artifacts repositories create "${REPO}" --repository-format=docker \
    --location "${REGION}" --project "${PROJECT_ID}" --description="ArogyaPulse images"

gcloud builds submit --tag "${IMAGE}" --project "${PROJECT_ID}" .

# Optional Gemini key: store once, reference by secret.
SECRET_FLAG=""
if [[ -n "${GEMINI_API_KEY:-}" ]]; then
  printf '%s' "${GEMINI_API_KEY}" | gcloud secrets create gemini-api-key --data-file=- \
    --project "${PROJECT_ID}" 2>/dev/null || \
  printf '%s' "${GEMINI_API_KEY}" | gcloud secrets versions add gemini-api-key --data-file=- \
    --project "${PROJECT_ID}"
  SECRET_FLAG="--set-secrets GEMINI_API_KEY=gemini-api-key:latest"
fi

gcloud run deploy "${SERVICE}" \
  --image "${IMAGE}" \
  --region "${REGION}" \
  --platform managed \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --min-instances=1 \
  --max-instances=10 \
  --timeout 60 \
  --set-env-vars "NODE_ENV=production,REPOSITORY=auto,SEED_ON_BOOT=true,SESSION_SECRET=${SESSION_SECRET:-$(openssl rand -hex 32)},GEMINI_MODEL=${GEMINI_MODEL:-gemini-2.5-flash}" \
  ${SECRET_FLAG} \
  --project "${PROJECT_ID}"

URL="$(gcloud run services describe "${SERVICE}" --region "${REGION}" --project "${PROJECT_ID}" --format='value(status.url)')"
echo
echo "Live: ${URL}"
curl -fsS "${URL}/healthz" >/dev/null && echo "Health check: OK"
