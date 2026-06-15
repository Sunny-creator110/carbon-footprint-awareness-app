# EcoTrace: Carbon Footprint Awareness Platform

A production-ready, accessible, scalable Carbon Footprint Awareness Platform built on the MERN stack (MongoDB, Express, React, Node.js) and optimized for containerized deployment on Google Cloud Run.

---

## Technical Stack & Architecture

- **Backend (/backend)**: Node.js, Express, Mongoose, Jest, Supertest. Implements a strict **Controller-Service-Repository** pattern.
- **Frontend (/frontend)**: React 18, Tailwind CSS, Lucide icons, Vitest, React Testing Library. Designed to target **100/100 Accessibility (A11y)** guidelines.
- **Containerization**: Multi-stage `Dockerfile` and `docker-compose.yml` for unified local/production service execution.

### Architectural Flowchart

```mermaid
graph TD
    classDef primary fill:#15803d,stroke:#22c55e,stroke-width:2px,color:#fff;
    classDef secondary fill:#0f172a,stroke:#334155,stroke-width:1px,color:#e2e8f0;
    classDef highlight fill:#d97706,stroke:#f59e0b,stroke-width:2px,color:#fff;
    classDef success fill:#16a34a,stroke:#4ade80,stroke-width:2px,color:#fff;

    Start([Start EcoTrace App]) --> Auth{User Auth Status}
    Auth -- Unauthenticated --> LoginRegister[Login / Register UI]
    LoginRegister --> |Success & JWT Token| Dashboard[Dashboard Core UI]
    Auth -- Authenticated --> Dashboard

    subgraph Frontend [A11y Dashboard UI]
        Dashboard --> Form[Activity Log Form]
        Dashboard --> Budget[Carbon Budget Tracker]
        Dashboard --> Analytics[Real-Time Analytics]
        Dashboard --> Insights[Dynamic Reduction Insights]
    end

    Form --> |Submit Params + JWT| Validator[Express Validator Layer]
    
    subgraph Backend [Controller-Service-Repository API]
        Validator --> |Sanitized Data| Engine[Estimation Engine]
        Engine --> |Calculate CO2 kg| Service[Footprint Service]
        Service --> |Query/Aggregate| Repo[Footprint Repository]
    end

    Repo --> |Mongoose| DB[(MongoDB Atlas)]
    DB --> |Persisted Entry| Repo
    Repo --> |Analytics & History JSON| Dashboard
    
    subgraph Gamification [Gamification & Tips Engine]
        Analytics --> |Check Highest Contributor| Tips[Tailored Reduction Tips]
        Analytics --> |Evaluate Limits| EcoPoints[Eco Points Accumulator]
        Analytics --> |Check Benchmarks| Badges[Climate Badges Unlocked]
    end

    class Start,Dashboard,Form,Analytics primary;
    class LoginRegister,Validator,Engine,Service,Repo secondary;
    class Budget,EcoPoints,Badges success;
    class Tips,Insights highlight;
```

---

## Getting Started Locally

### Prerequisites
- Node.js (v18+)
- MongoDB running locally (or via Docker)

### Run Backend Tests
1. Navigate to `/backend`:
   ```bash
   cd backend
   npm install
   npm test
   ```

### Run Frontend Tests
1. Navigate to `/frontend`:
   ```bash
   cd frontend
   npm install
   npm run test
   ```

### Start Development Stack
1. Start the API Server (`localhost:5000`):
   ```bash
   cd backend
   npm run dev
   ```
2. Start the Vite React client (`localhost:3000`):
   ```bash
   cd frontend
   npm run dev
   ```

---

## Deployment to Google Cloud Run

To build and push your container to Artifact Registry and deploy it on Cloud Run:

```bash
# Build & tag Docker image using Google Cloud Build
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/ecotrace:latest

# Deploy to Cloud Run
gcloud run deploy ecotrace \
  --image gcr.io/YOUR_PROJECT_ID/ecotrace:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## Secure Environment Variable Management with GCP Secret Manager

In a production environment (especially on Google Cloud Run), you should **never** hardcode passwords, database connection strings, or JWT secret keys. Instead, manage them securely using **Google Cloud Secret Manager**.

### Step 1: Create Secrets in GCP
Create secrets for your sensitive variables:
```bash
# Create MongoDB connection string secret
echo -n "mongodb+srv://user:password@cluster.mongodb.net/prod" | \
  gcloud secrets create MONGODB_URI --data-file=-

# Create JWT token signing secret
echo -n "your-super-long-secure-production-jwt-key" | \
  gcloud secrets create JWT_SECRET --data-file=-
```

### Step 2: Grant Permissions to Cloud Run Service Account
Cloud Run uses its runtime service account (usually the `Compute Engine default service account` or a custom user-managed service account) to pull secret values. Ensure the service account has the **Secret Manager Secret Accessor** (`roles/secretmanager.secretAccessor`) role:

```bash
# Grant access permission
gcloud secrets add-iam-policy-binding MONGODB_URI \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"

gcloud secrets add-iam-policy-binding JWT_SECRET \
  --member="serviceAccount:YOUR_PROJECT_NUMBER-compute@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Step 3: Reference Secrets in Cloud Run Deployment
You can mount secret values as environment variables directly inside the Cloud Run deployment. The variables will then be accessible in Node.js via `process.env.MONGODB_URI` and `process.env.JWT_SECRET`:

```bash
gcloud run deploy ecotrace \
  --image gcr.io/YOUR_PROJECT_ID/ecotrace:latest \
  --set-secrets="MONGODB_URI=MONGODB_URI:latest,JWT_SECRET=JWT_SECRET:latest" \
  --update-env-vars="NODE_ENV=production"
```
This strategy ensures zero secrets are baked into your container image, committed to source control, or exposed in plain text.
