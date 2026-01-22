# Serva Booking API Server

Express.js server for handling device repair booking submissions.

## Installation

```bash
cd server
npm install
```

## Usage

### Development
```bash
npm start
```

The server will start on port 5000 (or PORT environment variable).

### API Endpoints

#### POST /api/v1/bookings
Accepts multipart/form-data for booking submissions.

**Request Body:**
- `deviceType` (string, required): Device type (smartphone/laptop)
- `issue` (string, required): Issue type or 'other'
- `customIssueDescription` (string, optional): Required when issue is 'other'
- `preferredTime` (string, required): Preferred service time
- `address` (string, required): Service address
- `photo` (file, optional): Image file (max 10MB, images only)

**Response:**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "bookingId": "BK1A2B3C4D5E6F7G8",
  "booking": {
    "bookingId": "BK1A2B3C4D5E6F7G8",
    "deviceType": "smartphone",
    "issue": "broken-screen",
    "preferredTime": "10:00 AM",
    "status": "pending"
  }
}
```

#### GET /api/v1/bookings
Retrieves all bookings (for testing purposes).

**Response:**
```json
{
  "success": true,
  "bookings": [
    {
      "bookingId": "BK1A2B3C4D5E6F7G8",
      "deviceType": "smartphone",
      "issue": "broken-screen",
      "preferredTime": "10:00 AM",
      "address": "123 Main St",
      "photo": {
        "filename": "photo-1234567890-123456789.jpg",
        "originalName": "device-photo.jpg",
        "path": "uploads/photo-1234567890-123456789.jpg",
        "size": 1024000
      },
      "createdAt": "2024-01-22T10:14:08.000Z",
      "status": "pending"
    }
  ]
}
```

#### GET /uploads/:filename
Serves uploaded image files.

## Features

- **File Upload**: Handles image uploads with multer
- **Validation**: Validates required fields and file types
- **Error Handling**: Comprehensive error handling with proper HTTP status codes
- **CORS**: Cross-Origin Resource Sharing enabled
- **Unique IDs**: Generates unique booking IDs
- **Local Storage**: Saves bookings to `bookings.json` file

## File Structure

```
server/
├── index.js          # Main server file
├── package.json      # Dependencies and scripts
├── bookings.json     # Booking data storage (created automatically)
└── uploads/         # Uploaded images (created automatically)
```

## Dependencies

- `express`: Web framework
- `cors`: Cross-Origin Resource Sharing
- `multer`: File upload handling

## Error Responses

```json
{
  "success": false,
  "message": "Error description"
}
```

Common error scenarios:
- Missing required fields (400)
- Invalid file type (400)
- File too large (400)
- Server errors (500)
