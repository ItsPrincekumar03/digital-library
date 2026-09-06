# Chapter Endpoints

## Get All Chapters

- URL: `/api/chapters`
- Method: `GET`
- Auth Required: No

### Response

{
  "success": true,
  "data": {
    "chapters": [
      {
        "id": "string",
        "title": "string",
        "bookId": "string"
      }
    ]
  }
}