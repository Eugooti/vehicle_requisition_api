
# Vehicle Allocation API

## Project Overview

The **Vehicle Allocation API** provides a robust backend solution for managing vehicle requisitions within an organization. It allows users to create accounts, manage departments, vehicles, and requisitions. The system includes features for managers to approve requisitions, HR to allocate resources, and drivers to manage trips. Additionally, the API can generate requisition reports.

## Features

- **User Management**: Allows creation and authentication of users.
- **Company Department Management**: Adds and manages company departments.
- **Vehicle Management**: Allows adding and managing vehicles within the organization.
- **Vehicle Requisition**: Users can make requisitions for vehicles.
- **Manager Requisition Approval**: Managers can approve or reject vehicle requisitions.
- **Human Resource Resource Allocation**: HR can allocate resources to approved requisitions.
- **Vehicle Reservation**: Allows users to make reservations for vehicles.
- **Driver Trip Management**: Drivers can manage trips by starting and ending them.
- **Requisition Reports**: Generate detailed reports for vehicle requisitions.

## Technologies Used

- **Express.js**: Web framework for Node.js.
- **Sequelize**: ORM for interacting with MySQL databases.
- **MySQL2**: Database connector for MySQL.
- **Passport.js**: Authentication middleware for user management.
- **JWT (JSON Web Token)**: Secure authentication with token-based systems.
- **Nodemailer**: Email sending utility for notifications.
- **Google APIs**: Integration with Google services for additional functionality.
- **CORS**: Middleware for handling cross-origin resource sharing.
- **Body-parser**: Middleware to parse incoming request bodies.
- **Cookie-parser**: Middleware to parse cookies.
- **Morgan**: HTTP request logger middleware.
- **dotenv**: Loads environment variables from a `.env` file.
- **Nodemon**: Tool for automatic server restart during development.

## Setup Instructions

### 1. Clone the repository

Clone the repository to your local machine:

```bash
git clone https://github.com/Eugooti/vehicle_requisition_api.git
```

### 2. Install dependencies

Navigate into the project directory and install the required dependencies:

```bash
cd vehicle_allocation_api
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root of the project and add your environment variables. Example:

```ini
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=yourpassword
DB_NAME=vehicle_allocation_db
JWT_SECRET=yourjwtsecret
EMAIL_USER=youremail@gmail.com
EMAIL_PASS=yourpassword
```

### 4. Start the server

Start the API server using Nodemon for automatic reloading during development:

```bash
npm start
```

The API will be available at `http://localhost:3000` (or the port specified in your `.env` file).

## API Endpoints

### 1. **User Management**

- **POST /users/register**: Create a new user.
- **POST /users/login**: Authenticate a user and generate a JWT token.

### 2. **Company Department Management**

- **POST /departments**: Add a new department to the company.

### 3. **Vehicle Management**

- **POST /vehicles**: Add a new vehicle to the system.
- **GET /vehicles**: Retrieve all vehicles.

### 4. **Vehicle Requisition**

- **POST /requisitions**: Create a new vehicle requisition.
- **GET /requisitions**: Retrieve all requisitions.

### 5. **Requisition Approval (Manager)**

- **PUT /requisitions/:id/approve**: Approve a vehicle requisition.
- **PUT /requisitions/:id/reject**: Reject a vehicle requisition.

### 6. **Resource Allocation (HR)**

- **PUT /requisitions/:id/allocate**: Allocate resources to an approved requisition.

### 7. **Vehicle Reservation**

- **POST /reservations**: Make a reservation for a vehicle.
- **GET /reservations**: View all reservations.

### 8. **Driver Trip Management**

- **PUT /trips/:id/start**: Start a trip.
- **PUT /trips/:id/end**: End a trip.

### 9. **Requisition Reports**

- **GET /reports/requisitions**: Generate requisition reports.

## Testing

This project does not currently have tests set up. You can run the following command to check for errors:

```bash
npm test
```

However, you will need to add test cases and frameworks (such as Mocha, Chai, etc.) to enable proper testing.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
```

### Notes:

1. **Replace** `yourusername` with your actual GitHub username or repository path.
2. Ensure that you add the correct details for your environment variables in the `.env` section.
3. You can add more details as the project grows, such as additional features, more API routes, or specifics on how to test the API.

Let me know if you need any further adjustments!