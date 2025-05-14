# Property Analysis Tool

A React-based application for analyzing commercial and residential properties, providing comprehensive insights on traffic patterns, nearby businesses, demographics, and more using HERE Maps API integration.

<img width="1512" alt="image" src="https://github.com/user-attachments/assets/974e87f8-84b9-493c-aef5-adcfc6ac00fb" />


## Features

- **Address Search**: Easily search for any property address
- **Traffic Analysis**: Get detailed traffic patterns, vehicle counts, and peak hours
- **Nearby Businesses**: Discover restaurants, retail, and services near the property
- **Location Mapping**: Interactive maps showing the exact property location
- **Demographics Data**: Population and income statistics for the area
- **Zoning Information**: Zoning classification and bylaw links
- **Property Notes**: Add and track notes for each analyzed property
- **Saved Properties**: Automatically save and access previously analyzed properties

## Technical Implementation Details

### Traffic Estimation

The application uses surrounding routes to estimate property traffic by:

1. Creating points around the property location
2. Getting routes between these points to analyze traffic patterns
3. Calculating average traffic delays and conditions
4. Estimating daily vehicle counts based on road type and time of day
5. Determining foot traffic based on vehicle count and location characteristics

### Interactive Maps

Maps are implemented using the HERE Maps JavaScript API v3, with features including:

- Custom property markers
- Dynamic map initialization
- Responsive sizing
- Expanded view in modal dialog

### Data Storage

Property search history is stored in the browser's localStorage, allowing users to:

- Save property analyses between sessions
- Quickly access previously analyzed properties
- Track property analysis statistics

------------------------------------------------------------------------------------------------------------------
## Getting Started

### Prerequisites

- Node.js (v14+)
- npm or yarn
- HERE Maps API credentials

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/property-analysis-tool.git
   cd property-analysis-tool
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env` file in the root directory with your HERE Maps API credentials:
   ```
   REACT_APP_HERE_API_KEY=your_api_key_here
   REACT_APP_HERE_APP_ID=your_app_id_here
   ```

4. Start the development server:
   ```bash
   npm start
   # or
   yarn start
   ```

### Obtaining HERE Maps API Credentials

1. Sign up for a developer account at [HERE Developer Portal](https://developer.here.com/)
2. Create a new project in the developer dashboard
3. Generate API keys for your project
4. Add the API key and App ID to your `.env` file as shown above

## Usage

1. **Search for a Property**:
   - Enter a property address in the search bar and click "Analyze Property"
   - The application will geocode the address and retrieve relevant data

2. **Viewing Property Data**:
   - Traffic data shows estimated vehicle counts, peak hours, and pedestrian activity
   - Nearby businesses panel displays local restaurants and retail options
   - Map panel shows the exact location of the property
   - Additional panels show demographics, zoning information, and property notes

3. **Detailed Information**:
   - Click "More Info" on any panel to view detailed data in a modal
   - Traffic data includes current conditions and comprehensive statistics
   - Business data shows categorized nearby establishments with distances
   - Map view provides an expanded interactive map with the property marker

4. **Saved Properties**:
   - Previously analyzed properties are automatically saved in the left sidebar
   - Click on any saved property to quickly retrieve its analysis again


## License

Distributed under the MIT License. See `LICENSE` for more information.

## Acknowledgements

- [HERE Maps API](https://developer.here.com/) for location services
- [React](https://reactjs.org/) for the UI framework
- [Tailwind CSS](https://tailwindcss.com/) for styling
