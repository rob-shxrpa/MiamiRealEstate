# Miami Real Estate Analytics

A comprehensive web application for analyzing real estate data in Miami, including property information, construction permits, and Miami-Dade County property data.

## Features

- **Interactive Map**: View properties, permits, and points of interest on an interactive map
- **Property Search**: Search properties by address, folio number, or neighborhood
- **Permit Analysis**: View and filter construction permits to identify development trends
- **Miami-Dade County Data**: Integration with official property data from Miami-Dade County
- **Development Opportunities**: Filter properties based on zoning, permits, and other criteria
- **Data Visualization**: Charts and graphs to visualize real estate trends

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL 13+ with PostGIS extension
- PowerShell 7+ (recommended for Windows users)

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/MiamiRealEstate.git
   cd MiamiRealEstate
   ```

2. Install dependencies:
   ```
   # Install server dependencies
   cd server
   npm install
   
   # Install client dependencies
   cd ../client
   npm install
   ```

3. Configure the database:
   - Create a PostgreSQL database
   - Run the database setup scripts in the `database` directory
   - Copy `.env.example` to `.env` in the server directory and update with your database credentials

### Starting the Application

#### Using PowerShell (Recommended)

The easiest way to start the application is using the PowerShell script:

```powershell
# From the project root
.\Start-MiamiRealEstate.ps1
```

This script will:
1. Check dependencies
2. Offer to import Miami-Dade County data if available
3. Start the API server and client application
4. Display application information

#### Manual Start

If you prefer to start components manually:

1. Start the server:
   ```
   cd server
   npm run dev
   ```

2. Start the client (in a separate terminal):
   ```
   cd client
   npm start
   ```

3. Access the application:
   - API Server: http://localhost:3001/api
   - Web Application: http://localhost:3000

## Miami-Dade County Property Data Integration

This application can integrate with the Miami-Dade County property data extract ("MunRoll - 00 RE - All Properties.csv"). To import this data:

1. Place the CSV file in the `Files` directory
2. Run the import script:
   ```powershell
   # Using PowerShell (recommended)
   .\server\scripts\Import-PropertyData.ps1
   
   # Or manually run each step
   .\server\scripts\Install-Dependencies.ps1  # Install dependencies
   # [Run database migration]
   node server\scripts\import_property_data.js  # Import data
   ```

After import, you can verify the import was successful:
```powershell
.\server\scripts\Test-PropertyDataImport.ps1
```

For more details, see the [Property Data Import README](server/scripts/README.md).

## API Endpoints

- `/api/properties` - Property information
- `/api/permits` - Construction permit data
- `/api/property-data` - Miami-Dade County property data
- `/api/pois` - Points of interest
- `/api/distances` - Distance calculations

## Development

The application consists of two main components:

- **Server**: Node.js/Express API backend with PostgreSQL database
- **Client**: React frontend with Mapbox for visualization

### Project Structure

```
MiamiRealEstate/
├── client/                  # React frontend
├── server/                  # Node.js API backend
│   ├── scripts/             # Import and utility scripts
│   └── src/                 # Source code
├── database/                # Database migrations and setup
├── Files/                   # Data files (including Miami-Dade CSV)
├── Start-MiamiRealEstate.ps1 # Main startup script
└── README.md                # This file
```

## License

This project is licensed under the MIT License - see the LICENSE file for details. 