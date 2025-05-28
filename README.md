# Delivery Tracking System

A real-time delivery tracking application with vendor management, delivery partner assignment, and customer tracking interfaces.

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

## Features

- **Multi-tenant Vendor Dashboard**: Manage orders and delivery partners
- **Delivery Partner App**: Update location and manage assigned deliveries
- **Customer Tracking**: Real-time order tracking interface
- **Real-time Updates**: Using Socket.IO for live location updates
- **Authentication**: JWT-based auth for all user types

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript, TailwindCSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: MongoDB
- **Real-time Communication**: Socket.IO
- **Authentication**: JWT

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