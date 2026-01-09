# Vehicle Allocation API Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Architecture](#project-architecture)
4. [Database Models](#database-models)
5. [API Endpoints](#api-endpoints)
6. [Authentication and Authorization](#authentication-and-authorization)
7. [Business Logic](#business-logic)
8. [Error Handling](#error-handling)
9. [Testing](#testing)
10. [Deployment](#deployment)

## Project Overview

The Vehicle Allocation API is a backend system designed to manage and streamline the process of vehicle allocation for travel requests within an organization. The system allows users to create travel requisitions, managers to approve these requests, and administrators to allocate vehicles and drivers to approved trips.

### Key Features
- User authentication and role-based access control
- Travel requisition creation and management
- Approval workflow for travel requests
- Vehicle and driver allocation
- Trip scheduling and tracking
- Reporting functionality
- Department management
- User management

## Technology Stack

### Backend Framework
- **Node.js**: JavaScript runtime environment
- **Express.js**: Web application framework for Node.js

### Database
- **MySQL**: Relational database management system
- **Sequelize**: ORM (Object-Relational Mapping) for Node.js

### Authentication
- **JSON Web Tokens (JWT)**: For secure authentication
- **Passport.js**: Authentication middleware for Node.js

### Email Services
- **Nodemailer**: Module for email sending

### Development Tools
- **Nodemon**: Utility for monitoring changes and automatically restarting the server
- **Jest**: JavaScript testing framework

### Other Dependencies
- **body-parser**: Middleware for parsing request bodies
- **cors**: Middleware for enabling CORS (Cross-Origin Resource Sharing)
- **dotenv**: Module for loading environment variables
- **express-session**: Session middleware for Express
- **morgan**: HTTP request logger middleware

## Project Architecture

The project follows a modular architecture with clear separation of concerns:

### System Architecture Diagram
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│  Client         │────▶│  Express Server │────▶│  Database       │
│  (Frontend)     │     │  (Backend API)  │     │  (MySQL)        │
│                 │◀────│                 │◀────│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │  ▲
                               │  │
                               ▼  │
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Middleware Layer                                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Auth        │  │ Validation  │  │ Error       │             │
│  │ Middleware  │  │ Middleware  │  │ Handling    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                               │  ▲
                               │  │
                               ▼  │
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Application Layer                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Controllers │  │ Handlers    │  │ Services    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                               │  ▲
                               │  │
                               ▼  │
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Data Access Layer                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │ Models      │  │ Sequelize   │  │ Database    │             │
│  │ (Sequelize) │  │ ORM         │  │ Connection  │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Directory Structure
- **config/**: Configuration files for database, authentication, and role-based access
- **controller/**: Controllers handling business logic
- **handlers/**: Specialized handlers for specific operations
- **middleware/**: Custom middleware functions
- **models/**: Database models using Sequelize
- **routes/**: API route definitions
- **utils/**: Utility functions and error handlers
- **__test__/**: Test files

### Architecture Flow
1. Client sends a request to the API
2. Request is processed through middleware (authentication, validation, etc.)
3. Router directs the request to the appropriate controller
4. Controller uses handlers and models to process the request
5. Response is sent back to the client

## Database Models

The application uses the following database models:

### User Model
- **Fields**: id, firstName, lastName, email, phone, grade, designation, departmentId, available, password, salt
- **Relationships**: Belongs to Department, has many Roles
- **Purpose**: Stores user information for authentication and identification

### Department Model
- **Fields**: id, name, description
- **Relationships**: Has many Users
- **Purpose**: Organizes users into departments

### Role Model
- **Fields**: id, name, description
- **Relationships**: Many-to-many with Users
- **Purpose**: Defines roles for role-based access control

### Vehicle Model
- **Fields**: id, make, model, registrationNumber, capacity, available
- **Relationships**: Has many Trips
- **Purpose**: Stores information about available vehicles

### Trip Model
- **Fields**: id, userId, departmentId, purpose, pickupPoint, destination, travellersCount, pickupDate, pickupTime, returnDate, returnTime, numberOfDays, travelStatus, approvalStatus, approverId, vehicleId, driverId, allocationMode, allocatorId, allocatorNote, startTime, endTime, denialReason
- **Relationships**: Belongs to User, Department, Vehicle
- **Purpose**: Stores information about travel requests and their status

### Schedule Model
- **Fields**: id, tripId, date, startTime, endTime
- **Relationships**: Belongs to Trip
- **Purpose**: Manages scheduling of trips

### Signature Model
- **Fields**: id, userId, signature
- **Relationships**: Belongs to User
- **Purpose**: Stores digital signatures for approvals

## API Endpoints

The API is organized into three main route groups:

### Authentication Routes (`/ebk/auth/`)
- **POST /login**: Authenticate user and generate JWT token
- **GET /logout**: Log out user
- **PUT /updatePassword/:id**: Update user password
- **POST /refreshToken**: Refresh JWT token
- **PUT /getCode**: Get password reset code
- **PUT /verifyCode**: Verify password reset code
- **PUT /changePassword/:id**: Change password after verification
- **POST /signature/create**: Create digital signature

### Trip Management Routes (`/ebk/trip/`)
- **POST /create**: Create a new travel requisition
- **PUT /update/:id**: Update a travel requisition
- **GET /read**: Get all travel requisitions
- **GET /read/:id**: Get a specific travel requisition
- **GET /read/department/:id**: Get travel requisitions by department
- **GET /read/user/:id**: Get travel requisitions by user
- **PUT /approve/:id**: Approve a travel requisition
- **PUT /assign/:id**: Allocate vehicle and driver to a trip
- **PUT /ownMeans/:id**: Mark trip as using own means of transport
- **PUT /startEnd/:id**: Update trip start/end times
- **DELETE /recall/:id**: Delete/recall a trip
- **PUT /deallocate/:id**: Deallocate vehicle from a trip
- **PUT /vehicle/available**: Check available vehicles
- **GET /reports**: Generate reports for all trips
- **GET /reports/:id**: Generate reports for department trips

### Reservation Management Routes (`/ebk/reservation/`)
- **POST /create**: Create a new reservation
- **GET /read**: Get all reservations
- **GET /read/:id**: Get a specific reservation
- **PUT /update/:id**: Update a reservation
- **PUT /delete/:id**: Delete a reservation

### Schedule Management Routes (`/ebk/schedule/`)
- **GET /read**: Get all schedules

### Administrative Routes (`/ebk/`)
- **User Management**:
  - **POST /user/create**: Create a new user
  - **GET /users/read**: Get all users
  - **GET /user/role/:role**: Get users by role
  - **GET /users/read/:id**: Get a specific user
  - **GET /users/read/department/:id**: Get users by department
  - **PUT /users/update/:id**: Update a user
  - **DELETE /users/delete/:id**: Delete a user

- **Department Management**:
  - **POST /dpt/create**: Create a new department
  - **GET /dpt/read**: Get all departments
  - **GET /dpt/read/:id**: Get a specific department
  - **GET /dpt/read/user/:id**: Get department by user
  - **PUT /dpt/update/:id**: Update a department
  - **DELETE /dpt/delete/:id**: Delete a department

- **Role Management**:
  - **POST /role/create**: Create a new role
  - **POST /role/createMany**: Create multiple roles
  - **GET /role/read**: Get all roles
  - **GET /role/read/:id**: Get a specific role
  - **GET /role/read/department/:id**: Get roles by department
  - **GET /role/read/user/:id**: Get roles by user
  - **PUT /role/update/:id**: Update a role
  - **DELETE /role/delete/:id**: Delete a role

- **Vehicle Management**:
  - **POST /vehicle/create**: Create a new vehicle
  - **GET /vehicle/read**: Get all vehicles
  - **GET /vehicle/read/:id**: Get a specific vehicle
  - **PUT /vehicle/update/:id**: Update a vehicle
  - **DELETE /vehicle/delete/:id**: Delete a vehicle

## Authentication and Authorization

### Authentication
The application uses JWT (JSON Web Tokens) for authentication:
- Users log in with their credentials
- The server validates the credentials and issues a JWT token
- The token is included in subsequent requests in the Authorization header
- The server validates the token for each protected route
- Token refresh mechanism is available for extending sessions

### Authorization
The application implements role-based access control:
- Users are assigned one or more roles
- Each role has a set of privileges
- Routes are protected with middleware that checks for required privileges
- Access is granted only if the user has the necessary privileges

### Roles and Privileges
- **admin**: Has all privileges
- **manager**: Can apply for trips and approve them
- **hrm**: Has extensive privileges for user management, vehicle management, and trip management
- **driver**: Can start and end trips
- **applicant**: Can only apply for trips

## Business Logic

### Travel Request Workflow
1. User creates a travel requisition
2. Manager approves or rejects the requisition
3. If approved, HRM allocates a vehicle and driver or approves own means
4. Driver starts the trip at the scheduled time
5. Driver ends the trip upon completion
6. System updates the status and availability of vehicles and drivers

### Vehicle Allocation Logic
- System checks for available vehicles based on capacity and schedule
- HRM assigns appropriate vehicle and driver to the trip
- System updates vehicle and driver availability
- If no suitable vehicle is available, HRM can approve own means of transport

### Reporting
- System generates reports on trips by department, user, or date range
- Reports include details on vehicle usage, trip purposes, and costs

## Error Handling

The application implements a robust error handling mechanism:
- Custom error handlers for development and production environments
- Centralized error handling middleware
- Error logging and reporting
- Appropriate HTTP status codes and error messages

## Testing

The application uses Jest for testing:
- Unit tests for individual functions and components
- Integration tests for API endpoints
- Mock objects and functions for database and external services
- Test coverage reporting

## Deployment

The application can be deployed using the following steps:
1. Set up a production database
2. Configure environment variables
3. Install dependencies
4. Build the application
5. Start the server

### Environment Variables
- **PORT**: Server port
- **DB_HOST**: Database host
- **DB_USER**: Database user
- **DB_PASSWORD**: Database password
- **DB_NAME**: Database name
- **JWT_SECRET**: Secret key for JWT
- **NODE_ENV**: Environment (development/production)
- **EMAIL_USER**: Email for sending notifications
- **EMAIL_PASS**: Email password
