# Resident Dashboard

This project is a Resident Dashboard application designed for administrators to view and manage resident profiles. It consists of a frontend built with React and a backend powered by Node.js and Express.

## Project Structure

The project is organized into two main directories: `frontend` and `backend`.

### Frontend

- **`package.json`**: Configuration file for npm, listing dependencies and scripts for the frontend application.
- **`tsconfig.json`**: TypeScript configuration file specifying compiler options.
- **`public/index.html`**: Main HTML file serving as the entry point for the frontend application.
- **`src/index.tsx`**: Entry point for the React application, rendering the App component.
- **`src/App.tsx`**: Main App component that sets up routing and includes the Header and Sidebar components.
- **`src/components/`**: Contains reusable components:
  - **`Header.tsx`**: Displays the title and navigation for the dashboard.
  - **`Sidebar.tsx`**: Provides navigation links for different sections of the dashboard.
  - **`ResidentCard.tsx`**: Displays individual resident information.
- **`src/pages/`**: Contains page components:
  - **`Dashboard.tsx`**: Main page for the admin to view resident records.
  - **`ResidentProfile.tsx`**: Displays detailed information about a selected resident.
- **`src/services/api.ts`**: Functions for making API calls to the backend to fetch resident data.
- **`src/types/resident.ts`**: TypeScript interfaces defining the structure of resident data.

### Backend

- **`package.json`**: Configuration file for npm, listing dependencies and scripts for the backend application.
- **`tsconfig.json`**: TypeScript configuration file specifying compiler options.
- **`.env.example`**: Example of environment variables needed for the backend application.
- **`src/index.ts`**: Entry point for the backend application, setting up the Express server and middleware.
- **`src/controllers/`**: Contains the ResidentController class for handling resident-related requests.
- **`src/routes/`**: Exports routes for resident-related API endpoints.
- **`src/models/`**: Defines the structure of resident data in the database.
- **`src/services/`**: Functions for interacting with resident data, including fetching and updating records.
- **`src/db/schema.sql`**: SQL schema for setting up the database tables related to residents.

## Getting Started

To get started with the project, follow these steps:

1. Clone the repository.
2. Navigate to the `frontend` and `backend` directories and install the dependencies using npm:
   ```
   npm install
   ```
3. Set up the database using the provided SQL schema.
4. Start the backend server:
   ```
   npm start
   ```
5. Start the frontend application:
   ```
   npm start
   ```

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.