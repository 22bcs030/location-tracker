# Real-Time Location Tracker for Multivendor Delivery Platform

A comprehensive real-time delivery tracking system that enables vendors to assign delivery partners to orders and customers to track their deliveries in real-time on an interactive map.

## Architecture

### Frontend Architecture
```
/
├── app/                   # Next.js pages and routes
│   ├── track/             # Customer tracking interface
│   ├── delivery/          # Delivery partner dashboard
│   └── vendor/            # Vendor dashboard
├── components/            # Reusable UI components
│   ├── map-component.tsx  # Leaflet map integration
│   ├── order-timeline.tsx # Order status visualization
│   ├── eta-calculator.tsx # Delivery time estimation
│   └── ...                # Other UI components
├── hooks/                 # Custom React hooks
│   └── use-location-tracker.ts # Geolocation management
├── services/              # API and socket services
│   ├── api.ts             # REST API client
│   └── socket.ts          # Socket.IO client
├── types/                 # TypeScript type definitions
│   └── delivery.ts        # Shared type interfaces
└── utils/                 # Utility functions
```

### Backend Architecture
```
/backend
├── src/
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Express middleware
│   │   └── authMiddleware.ts # JWT authentication
│   ├── models/            # Database schemas
│   │   ├── User.model.ts  # User authentication
│   │   └── Order.model.ts # Order tracking
│   ├── routes/            # API endpoints
│   │   ├── auth.routes.ts # Authentication routes
│   │   ├── order.routes.ts # Order management
│   │   └── tracking.routes.ts # Public tracking
│   ├── sockets/           # Real-time communication
│   │   └── index.ts       # Socket.IO implementation
│   ├── types/             # TypeScript interfaces
│   ├── utils/             # Helper functions
│   ├── app.ts             # Express application
│   └── index.ts           # Entry point
└── package.json           # Dependencies
```

### Current Application Flow
1. **Assignment**: Vendor views available orders and assigns a specific delivery partner
2. **Delivery Access**: Only assigned orders appear in the delivery partner's dashboard
3. **Tracking Start**: Delivery partner accepts the order and starts location tracking
4. **Location Updates**: Delivery partner's app sends real-time location updates via Socket.IO
5. **Status Updates**: Delivery partner updates order status (picked up, in transit, delivered)
6. **Customer Tracking**: Customer can use order id to view the real-time location of their assigned delivery partner on a map.

### Multi-tenant Data Isolation
- Each vendor can only view and manage their own orders
- Delivery partners can only see orders assigned specifically to them
- Customers can only track their own orders with a secure tracking token

## Setup Instructions

### Prerequisites
- Node.js (v16 or later)
- MongoDB (local or Atlas)
- npm or yarn

### Frontend Setup
1. Clone the repository
   ```bash
   git clone <repository-url>
   cd <project-directory>
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5001/api
   NEXT_PUBLIC_SOCKET_URL=http://localhost:5001
   ```

4. Start the development server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### Backend Setup
1. Navigate to the backend directory
   ```bash
   cd backend
   ```

2. Install dependencies
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the backend directory:
   ```
   PORT=5001
   MONGO_URI=mongodb://localhost:27017/delivery-tracker
   JWT_SECRET=your_secure_jwt_secret
   CORS_ORIGIN=http://localhost:3000
   ```

4. Start the backend server
   ```bash
   npm run dev
   # or
   yarn dev
   ```

### Quick Start with PowerShell Scripts
For Windows users, we provide convenience scripts:

1. Start both frontend and backend in separate windows:
   ```powershell
   .\start-app.ps1
   ```

2. Start both in a single terminal:
   ```powershell
   .\start-both.ps1
   ```

## Features

### Vendor Dashboard
- View all orders created by the vendor
- Assign delivery partners to pending orders
- Monitor real-time delivery status of all assigned orders
- View real-time locations of delivery partners on a map
- Multi-tenant system ensures vendors only see their own orders
- Filter orders by status (pending, assigned, in transit, delivered)

### Delivery Partner Interface
- View only orders specifically assigned to the delivery partner
- Accept or reject assigned orders
- Start/stop location tracking for active deliveries
- Update order status (picked up, in transit, delivered)
- Navigation assistance to pickup and delivery locations
- Performance metrics dashboard showing earnings and statistics

### Customer Tracking
- Secure tracking page accessible via order number
- Real-time map showing assigned delivery partner's location
- Order status timeline with accurate timestamps
- ETA calculations based on real-time location data
- Order details and delivery information
- Option to contact the delivery partner or vendor

### Core Technical Features
- **Real-time Location Tracking**: Using browser's Geolocation API with fallbacks
- **Interactive Maps**: Leaflet.js integration with custom markers and routes
- **WebSocket Communication**: Socket.IO for instant updates
- **JWT Authentication**: Secure role-based access control
- **Multi-tenant Architecture**: Data isolation between vendors
- **Responsive Design**: Mobile-friendly interfaces for all user types

## Implementation Notes

### Mock Data
The application includes mock data generators for demonstration purposes:
- The frontend can generate mock orders when real backend data is unavailable
- Demo mode is available on the tracking page for testing without backend
- These mock implementations can be removed when connecting to a production backend

### Current Limitations and Improvement Areas
1. **Order Creation Flow**: The current implementation does not include the order creation step in the vendor dashboard. This should be added to complete the flow.

2. **Tracking Security**: The customer tracking page currently uses only an order number for access. This should be enhanced with a secure tracking token as implemented in the backend routes.

3. **Delivery Partner Assignment**: In the delivery dashboard, partners can self-assign orders. This should be modified to only show orders that vendors have specifically assigned to them.this is implemented just for test.

4. **Status Synchronization**: There are some inconsistencies in status naming between frontend and backend (e.g., "picked" vs "picked_up"). These should be standardized.

5. **Mock Data Removal**: Several components use mock data that should be replaced with real API calls in production.

## Testing
Run the integration test to verify frontend-backend communication:
```bash
node test-integration.js
```

## License
[MIT](LICENSE) 