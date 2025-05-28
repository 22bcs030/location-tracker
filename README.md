# Delivery Tracking System

A real-time delivery tracking application with vendor, delivery partner, and customer interfaces.

## Project Structure

```
/
├── app/                   # Next.js frontend
├── backend/               # Node.js + Express backend
│   ├── src/
│   │   ├── config/        # Configuration files
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   ├── sockets/       # Socket.IO implementation
│   │   ├── types/         # TypeScript types/interfaces
│   │   ├── utils/         # Utility functions
│   │   ├── app.ts         # Express app setup
│   │   └── index.ts       # Entry point
│   ├── .env               # Environment variables
│   ├── package.json       # Backend dependencies
│   └── tsconfig.json      # TypeScript configuration
└── [Frontend files...]    # Existing Next.js files
```

## Getting Started

### Prerequisites

- Node.js (v14.x or later)
- npm (v6.x or later)
- MongoDB (local or Atlas)

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
cd backend && npm install
```

### Configuration

Create a `.env.local` file in the root directory with:

```
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
```

Create a `.env` file in the `backend` directory with:

```
PORT=5001
MONGO_URI=mongodb://localhost:27017/delivery-tracking
JWT_SECRET=your_jwt_secret
```

### Running the Application

#### Using PowerShell Scripts

We provide two PowerShell scripts to start both frontend and backend:

1. **Multiple Windows**: Opens separate windows for frontend and backend
   ```powershell
   .\start-app.ps1
   ```

2. **Single Window**: Runs both services in the current window
   ```powershell
   .\start-both.ps1
   ```

#### Manual Start

To start the backend:
```powershell
cd backend; npm start
```

To start the frontend (in a new terminal):
```powershell
npm run dev
```

### Testing the Integration

To verify that frontend and backend are correctly integrated:
```powershell
node test-integration.js
```

## Features

- **Multi-tenant Vendor Dashboard**: Manage orders and delivery partners
- **Delivery Partner App**: Update location and manage assigned deliveries
- **Customer Tracking**: Real-time order tracking interface
- **Real-time Updates**: Using Socket.IO for live location updates
- **Authentication**: JWT-based auth for all user types
- **Interactive map interface**: Visualize deliveries on a map
- **Order management system**: Manage orders and deliveries efficiently

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB
- **Real-time Communication**: Socket.IO
- **Authentication**: JWT

## Technologies

- **Frontend**: Next.js, TypeScript, Tailwind CSS, Leaflet maps
- **Backend**: Node.js, Express, TypeScript, MongoDB
- **Real-time updates**: Socket.IO

## Getting Started

### Frontend

```bash
# Install dependencies
npm install

# Run development server
npm run dev
```

### Backend (After setup)

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Run development server
npm run dev
``` 