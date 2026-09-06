# Book Endpoints

## Get All Books

- URL: `/api/books`
- Method: `GET`
- Auth Required: No

### Query Parameters

- page
- limit
- sort

### Response

{
  "success": true,
  "data": {
    "books": [
      {
        "id": "string",
        "title": "string"
      }
    ]
  }
}