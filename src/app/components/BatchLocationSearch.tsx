'use client'

import { useState } from 'react'

interface Business {
  id: string
  name: string
  rating: number
  isOpen?: boolean
}

interface BatchSearchResult {
  location: string
  businesses: Business[]
  loading: boolean
  error?: string
}

interface BatchLocationSearchProps {
  onResultsUpdate: (results: BatchSearchResult[]) => void
}

export default function BatchLocationSearch({ onResultsUpdate }: BatchLocationSearchProps) {
  const [keyword, setKeyword] = useState('')
  const [locations, setLocations] = useState<string[]>([])
  const [locationInput, setLocationInput] = useState('')
  const [batchResults, setBatchResults] = useState<BatchSearchResult[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const addLocation = () => {
    if (locationInput.trim() && !locations.includes(locationInput.trim())) {
      const newLocations = [...locations, locationInput.trim()]
      setLocations(newLocations)
      setLocationInput('')
    }
  }

  const removeLocation = (location: string) => {
    const newLocations = locations.filter(l => l !== location)
    setLocations(newLocations)
  }

  const runBatchSearch = async () => {
    if (!keyword.trim() || locations.length === 0) {
      alert('Please enter a keyword and add at least one location')
      return
    }

    setIsSearching(true)
    
    // Initialize results
    const initialResults: BatchSearchResult[] = locations.map(location => ({
      location,
      businesses: [],
      loading: true
    }))
    
    setBatchResults(initialResults)
    onResultsUpdate(initialResults)

    // Search each location
    const finalResults: BatchSearchResult[] = []
    
    for (let i = 0; i < locations.length; i++) {
      const location = locations[i]
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword: keyword.trim(), location })
        })

        const data = await response.json()

        if (response.ok) {
          finalResults.push({
            location,
            businesses: data.businesses || [],
            loading: false
          })
        } else {
          finalResults.push({
            location,
            businesses: [],
            loading: false,
            error: data.error || 'Search failed'
          })
        }

        // Update results as we go
        const updatedResults = [...finalResults]
        // Add remaining loading locations
        for (let j = i + 1; j < locations.length; j++) {
          updatedResults.push({
            location: locations[j],
            businesses: [],
            loading: true
          })
        }
        
        setBatchResults(updatedResults)
        onResultsUpdate(updatedResults)

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500))
        
      } catch {
        finalResults.push({
          location,
          businesses: [],
          loading: false,
          error: 'Network error'
        })
      }
    }

    setIsSearching(false)
  }

  const clearResults = () => {
    setBatchResults([])
    onResultsUpdate([])
  }

  const getTopBusiness = (businesses: Business[]) => {
    return businesses.length > 0 ? businesses[0] : null
  }

  const getAverageRating = (businesses: Business[]) => {
    if (businesses.length === 0) return 0
    const sum = businesses.reduce((acc, b) => acc + (b.rating || 0), 0)
    return (sum / businesses.length).toFixed(1)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Batch Location Search</h2>
      <p className="text-gray-600 mb-6">Search the same keyword across multiple locations to compare markets</p>
      
      {batchResults.length === 0 ? (
        <div className="space-y-6">
          {/* Keyword Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Keyword
            </label>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., pizza, dentist, coffee shop"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
            />
          </div>

          {/* Location Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Locations
            </label>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addLocation()}
                placeholder="Enter location (e.g., 'New York, NY')"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
              <button
                onClick={addLocation}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            
            {locations.length > 0 && (
              <div className="space-y-2">
                {locations.map((location, index) => (
                  <div key={location} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                    <span className="text-gray-900">{index + 1}. {location}</span>
                    <button
                      onClick={() => removeLocation(location)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Search Button */}
          <button
            onClick={runBatchSearch}
            disabled={!keyword.trim() || locations.length === 0 || isSearching}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSearching ? 'Searching Locations...' : `Search ${locations.length} Location${locations.length !== 1 ? 's' : ''}`}
          </button>
        </div>
      ) : (
        <div>
          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">
              Results for &quot;{keyword}&quot; across {locations.length} location{locations.length !== 1 ? 's' : ''}
            </h3>
            <button
              onClick={clearResults}
              className="text-purple-600 hover:text-purple-800 text-sm"
            >
              ← New Search
            </button>
          </div>

          {/* Results Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {batchResults.map((result, index) => (
              <div key={result.location} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{result.location}</h4>
                  <span className="text-sm text-gray-500">#{index + 1}</span>
                </div>

                {result.loading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                    <span className="ml-2 text-gray-600">Searching...</span>
                  </div>
                ) : result.error ? (
                  <div className="text-red-600 text-center py-4">
                    Error: {result.error}
                  </div>
                ) : (
                  <div>
                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-lg font-bold text-gray-900">{result.businesses.length}</div>
                        <div className="text-xs text-gray-600">Results</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-lg font-bold text-yellow-600">
                          {getAverageRating(result.businesses)}★
                        </div>
                        <div className="text-xs text-gray-600">Avg Rating</div>
                      </div>
                      <div className="bg-gray-50 p-2 rounded">
                        <div className="text-lg font-bold text-green-600">
                          {result.businesses.filter(b => b.isOpen).length}
                        </div>
                        <div className="text-xs text-gray-600">Open Now</div>
                      </div>
                    </div>

                    {/* Top Business */}
                    {getTopBusiness(result.businesses) && (
                      <div className="border-l-4 border-purple-500 pl-3 mb-3">
                        <h5 className="font-medium text-gray-900">
                          #{1} {getTopBusiness(result.businesses).name}
                        </h5>
                        <p className="text-sm text-gray-600">
                          ★{getTopBusiness(result.businesses).rating?.toFixed(1)} • 
                          {getTopBusiness(result.businesses).totalRatings} reviews
                        </p>
                      </div>
                    )}

                    {/* Quick List */}
                    <div className="space-y-1">
                      {result.businesses.slice(1, 4).map((business, idx) => (
                        <div key={business.id} className="text-sm text-gray-600 flex justify-between">
                          <span>#{idx + 2} {business.name.substring(0, 30)}{business.name.length > 30 ? '...' : ''}</span>
                          <span>★{business.rating?.toFixed(1)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Summary Comparison */}
          {batchResults.every(r => !r.loading && !r.error) && (
            <div className="mt-8 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-3">Market Comparison Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <h5 className="font-medium text-purple-800">Most Competitive</h5>
                  <p className="text-purple-700">
                    {batchResults.reduce((max, r) => r.businesses.length > max.businesses.length ? r : max).location}
                    <span className="text-purple-600"> ({batchResults.reduce((max, r) => r.businesses.length > max.businesses.length ? r : max).businesses.length} results)</span>
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-purple-800">Highest Rated Market</h5>
                  <p className="text-purple-700">
                    {batchResults.reduce((max, r) => parseFloat(getAverageRating(r.businesses)) > parseFloat(getAverageRating(max.businesses)) ? r : max).location}
                    <span className="text-purple-600"> (★{batchResults.reduce((max, r) => parseFloat(getAverageRating(r.businesses)) > parseFloat(getAverageRating(max.businesses)) ? r : max, batchResults[0]) && getAverageRating(batchResults.reduce((max, r) => parseFloat(getAverageRating(r.businesses)) > parseFloat(getAverageRating(max.businesses)) ? r : max).businesses)} avg)</span>
                  </p>
                </div>
                <div>
                  <h5 className="font-medium text-purple-800">Best Opportunity</h5>
                  <p className="text-purple-700">
                    {batchResults.reduce((min, r) => r.businesses.length < min.businesses.length ? r : min).location}
                    <span className="text-purple-600"> (less competition)</span>
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}