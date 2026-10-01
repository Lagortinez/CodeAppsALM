# CodeApps Repository

This repository contains:

- [CodeApp_NeonReactor](CodeApp_NeonReactor/README.md): React + TypeScript Power Apps Code App POC.
- [pipeline-dev.yml](pipeline-dev.yml): DEV build and deploy pipeline for the code app.
- [pipeline-prod.yml](pipeline-prod.yml): Promotion pipeline that exports solution, waits for approval, and imports to PROD.

## Azure DevOps Pipeline Variables

### DEV Pipeline ([pipeline-dev.yml](pipeline-dev.yml))

Required variables:

- CODEAPP_DIR
- NODE_VERSION
- PAC_CLI_VERSION
- SERVICE_USERNAME
- TENANT_ID
- ENVIRONMENT_URL
- SERVICE_PASSWORD (secret)

Example values:

```text
CODEAPP_DIR=
NODE_VERSION=22.x
PAC_CLI_VERSION=2.8.1
SERVICE_USERNAME=service@powerplatform.top
TENANT_ID=dcee9b15-6454-467c-8428-2a2a3eea1bf1
ENVIRONMENT_URL=https://lagodev.crm4.dynamics.com
SERVICE_PASSWORD=********
```

Notes:

- Set SERVICE_PASSWORD as secret in Azure DevOps.
- ENVIRONMENT_ID is not used by [pipeline-dev.yml](pipeline-dev.yml).

### PROD Pipeline ([pipeline-prod.yml](pipeline-prod.yml))

Required variables:

- SOLUTION_UNIQUE_NAME
- SOURCE_ENVIRONMENT_URL
- SOURCE_USERNAME
- SOURCE_TENANT_ID
- SOURCE_PASSWORD (secret)
- PROD_ENVIRONMENT_URL
- PROD_USERNAME
- PROD_PASSWORD (secret)
- TARGET_TENANT_ID (preferred) or PROD_TENANT_ID

Example values:

```text
SOLUTION_UNIQUE_NAME=Neon_Reactor
SOURCE_ENVIRONMENT_URL=https://lagodev.crm4.dynamics.com
SOURCE_USERNAME=service@powerplatform.top
SOURCE_TENANT_ID=dcee9b15-6454-467c-8428-2a2a3eea1bf1
SOURCE_PASSWORD=********
PROD_ENVIRONMENT_URL=https://your-prod-org.crm4.dynamics.com
PROD_USERNAME=service-prod@powerplatform.top
PROD_PASSWORD=********
TARGET_TENANT_ID=dcee9b15-6454-467c-8428-2a2a3eea1bf1
```

Pipeline behavior:

- Manual trigger only.
- Master branch guard.
- Export managed solution from source.
- Manual approval gate before PROD import.
- Import managed solution into PROD.
