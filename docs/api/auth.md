# Authentication Endpoints

## Login

- URL: `/api/auth/login`
- Method: `POST`
- Auth Required: No

### Request

{
  "email": "string",
  "password": "string"
}

### Response

{
  "success": true,
  "data": {
    "token": "string"
  }
}

## Refresh Token

- URL: `/api/auth/refresh-token`
- Method: `POST`

## Logout

- URL: `/api/auth/logout`
- Method: `POST`