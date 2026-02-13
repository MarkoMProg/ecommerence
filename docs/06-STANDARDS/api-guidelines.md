
# API Guidelines

All APIs follow REST conventions.

Endpoints:
/api/v1/resource

Response format:
{
  success: true,
  data: {},
  message: ""
}

Protected routes require Bearer JWT tokens.
