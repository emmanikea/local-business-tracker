'use client'

import { useState } from 'react'
import SearchForm from './components/SearchForm'
import BusinessResults from './components/BusinessResults'
import CompetitorComparison from './components/CompetitorComparison'
import BatchLocationSearch from './components/BatchLocationSearch'

export default function Home() {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [comparisons, setComparisons] = useState([])
  const [currentLocation, setCurrentLocation] = useState('')
  const [batchResults, setBatchResults] = useState([])
  const [activeTab, setActiveTab] = useState('search') // 'search', 'competitor', 'batch'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Local Business Tracker
          </h1>
          <p className="text-gray-600">
            Track local business rankings for keywords and locations
          </p>
        </header>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-lg shadow-md mb-8">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('search')}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === 'search'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Single Search
            </button>
            <button
              onClick={() => setActiveTab('competitor')}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === 'competitor'
                  ? 'text-green-600 border-b-2 border-green-600 bg-green-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Competitor Analysis
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`flex-1 py-3 px-4 text-center font-medium ${
                activeTab === 'batch'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Batch Locations
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'search' && (
          <>
            <SearchForm 
              onSearch={(results, comparisons, location) => {
                setResults(results)
                if (comparisons) setComparisons(comparisons)
                if (location) setCurrentLocation(location)
              }}
              setLoading={setLoading}
            />
            
            <BusinessResults 
              results={results} 
              loading={loading}
              comparisons={comparisons}
              location={currentLocation}
            />
          </>
        )}

        {activeTab === 'competitor' && (
          <CompetitorComparison 
            businesses={results}
            location={currentLocation}
          />
        )}

        {activeTab === 'batch' && (
          <>
            <BatchLocationSearch 
              onResultsUpdate={setBatchResults}
            />
            
            {batchResults.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Detailed Results by Location</h2>
                {batchResults.map((result) => (
                  <div key={result.location} className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      {result.location} ({result.businesses.length} results)
                    </h3>
                    <BusinessResults 
                      results={result.businesses} 
                      loading={result.loading}
                      location={result.location}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
