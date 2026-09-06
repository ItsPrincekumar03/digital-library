# Category Endpoints

## Get All Categories

- URL: `/api/categories`
- Method: `GET`
- Auth Required: No

### Response

{
  "success": true,
  "data": {
    "categories": [
      {
        "id": "string",
        "name": "string"
      }
    ]
  }
}