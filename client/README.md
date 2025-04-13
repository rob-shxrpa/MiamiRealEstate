# Miami Real Estate Analytics - Frontend

This is the frontend application for Miami Real Estate Analytics, providing interactive maps and data visualization for property data in Miami-Dade County.

## Features

- Interactive map with property and points of interest (POI) visualization
- Property details with permit information
- Distance calculations to nearby POIs
- Permit search and filtering
- POIs management and search
- Admin dashboard for data management

## Tech Stack

- React.js
- React Router for navigation
- React Query for data fetching
- Chakra UI for component library
- MapboxGL for interactive maps
- Axios for API requests

## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- Mapbox API token (required for maps)

### Installation

1. Clone the repository
2. Navigate to the client directory:
   ```
   cd client
   ```
3. Install dependencies:
   ```
   npm install
   ```
   or
   ```
   yarn
   ```
4. Copy the .env.example file to .env and update with your API URLs and tokens:
   ```
   cp .env.example .env
   ```
5. Edit the .env file with your API URL and Mapbox token

### Development

Start the development server:

```
npm start
```

or

```
yarn start
```

The application will be available at http://localhost:3000

### Building for Production

To create a production build:

```
npm run build
```

or

```
yarn build
```

## Project Structure

```
/client
  /public          # Static files
  /src
    /components    # Reusable UI components
    /hooks         # Custom React hooks
    /pages         # Page components
    /services      # API services
    /utils         # Helper functions
    App.js         # Main App component with routes
    index.js       # Entry point
    theme.js       # Chakra UI theme configuration
```

## Environment Variables

- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_MAPBOX_TOKEN`: Mapbox API token for maps
- `REACT_APP_GOOGLE_MAPS_API_KEY`: (Optional) Google Maps API key for distance calculations

## License

This project is licensed under the MIT License. 