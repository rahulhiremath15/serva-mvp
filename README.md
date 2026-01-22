# Booking Wizard

A React component for device repair booking with multi-step form wizard.

## Features

- **Step 1**: Device Type selection (Smartphone / Laptop)
- **Step 2**: Issue selection (Broken Screen, Battery, Software, etc.)
- **Step 3**: Upload photo of the issue with preview
- **Step 4**: Select preferred time and enter address
- **Step 5**: Summary and confirmation
- **API Integration**: POST data to `/api/v1/bookings`
- **Mobile-friendly**: Responsive design with Tailwind CSS
- **Brand Color**: Uses `#0A5FFF` for primary actions

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Component Structure

- `src/components/BookingWizard.js` - Main wizard component
- `src/App.js` - App component that renders the wizard
- `src/index.css` - Global styles with Tailwind CSS
- `tailwind.config.js` - Tailwind configuration with brand color

## API Integration

The wizard submits booking data to `/api/v1/bookings` as FormData with the following fields:
- `deviceType` - Selected device type
- `issue` - Selected issue type
- `photo` - Uploaded image file (optional)
- `preferredTime` - Selected time slot
- `address` - Service address

## Technologies Used

- React 18
- Tailwind CSS
- HTML5 File API for photo uploads
- Fetch API for HTTP requests
