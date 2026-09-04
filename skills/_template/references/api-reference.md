# API Technical Reference

## Endpoints Overview

| Method | Endpoint | Description | Authentication |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/resource` | List all resources with pagination. | Bearer Token |
| `POST` | `/api/v1/resource` | Create a new resource item. | Bearer Token |
| `GET` | `/api/v1/resource/:id` | Fetch specific resource details by ID. | Bearer Token |

## Error Codes Reference

| Error Code | HTTP Status | Root Cause | Recommended Mitigation |
| :--- | :--- | :--- | :--- |
| `INVALID_PAYLOAD` | `400 Bad Request` | Request body fails schema validation. | Re-check input payload against `assets/schema.json`. |
| `UNAUTHORIZED` | `401 Unauthorized` | Invalid or expired API Key / Bearer Token. | Verify `API_KEY` configuration in environment. |
| `RATE_LIMIT_EXCEEDED` | `429 Too Many Requests` | Exceeded hourly request quota. | Implement exponential backoff and retry. |
