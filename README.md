# Local Business Tracker

A Next.js application that tracks local business rankings for specific keywords and locations using the Google Places API.

## Features

- Search for businesses by keyword and location
- Display ranked results with business details
- Show ratings, reviews, price levels, and business types
- Responsive design with Tailwind CSS
- Real-time search with loading states

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Get Google Places API Key:**
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Places API
   - Create credentials (API Key)
   - Restrict the API key to Google Places API for security

3. **Configure environment variables:**
   - Update `.env.local` with your Google Places API key:
   ```
   GOOGLE_PLACES_API_KEY=your_actual_api_key_here
   ```

4. **Run the development server:**
   ```bash
   npm run dev
   ```

5. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

1. Enter a keyword (e.g., "pizza", "dentist", "coffee shop")
2. Enter a location (e.g., "New York, NY" or "10001")
3. Click "Search Business Rankings"
4. View the ranked results with business details

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   └── search/
│   │       └── route.ts          # Google Places API integration
│   ├── components/
│   │   ├── SearchForm.tsx        # Search input form
│   │   └── BusinessResults.tsx   # Results display component
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Main page component
```

## API Endpoints

- `POST /api/search` - Search for businesses using Google Places API
  - Body: `{ keyword: string, location: string }`
  - Returns: `{ businesses: Business[] }`

## Technologies Used

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Google Places API** - Business data

## Important Notes

- Rankings are based on Google Places API results and may differ from actual search engine rankings
- Results are ordered by relevance and proximity to the searched location
- API usage is subject to Google Places API quotas and pricing
- Always keep your API key secure and restrict its usage appropriately
