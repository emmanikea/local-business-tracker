'use client'

import { useState } from 'react'

interface Business {
  id: string
  name: string
  address: string
  rating: number
  totalRatings: number
  priceLevel?: number
  types: string[]
  rank: number
  isOpen?: boolean
}

interface CompetitorComparisonProps {
  businesses: Business[]
  location: string
}

interface ComparisonKeyword {
  keyword: string
  rankings: { [businessId: string]: number | null }
}

export default function CompetitorComparison({ businesses, location }: CompetitorComparisonProps) {
  const [selectedBusinesses, setSelectedBusinesses] = useState<string[]>([])
  const [comparisonKeywords, setComparisonKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState('')
  const [comparisonData, setComparisonData] = useState<ComparisonKeyword[]>([])
  const [loading, setLoading] = useState(false)
  const [showComparison, setShowComparison] = useState(false)

  const handleBusinessToggle = (businessId: string) => {
    setSelectedBusinesses(prev => {
      if (prev.includes(businessId)) {
        return prev.filter(id => id !== businessId)
      } else if (prev.length < 5) { // Limit to 5 businesses
        return [...prev, businessId]
      }
      return prev
    })
  }

  const addKeyword = () => {
    if (keywordInput.trim() && !comparisonKeywords.includes(keywordInput.trim())) {
      setComparisonKeywords(prev => [...prev, keywordInput.trim()])
      setKeywordInput('')
    }
  }

  const removeKeyword = (keyword: string) => {
    setComparisonKeywords(prev => prev.filter(k => k !== keyword))
  }

  const runComparison = async () => {
    if (selectedBusinesses.length < 2 || comparisonKeywords.length === 0) {
      alert('Please select at least 2 businesses and add at least 1 keyword')
      return
    }

    setLoading(true)
    const results: ComparisonKeyword[] = []

    for (const keyword of comparisonKeywords) {
      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ keyword, location })
        })

        const data = await response.json()
        const rankings: { [businessId: string]: number | null } = {}

        selectedBusinesses.forEach(businessId => {
          const business = businesses.find(b => b.id === businessId)
          if (business) {
            const rank = data.businesses?.findIndex((b: Record<string, unknown>) => 
              b.name.toLowerCase().includes(business.name.toLowerCase()) ||
              business.name.toLowerCase().includes(b.name.toLowerCase())
            )
            rankings[businessId] = rank >= 0 ? rank + 1 : null
          }
        })

        results.push({ keyword, rankings })
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 300))
      } catch (error) {
        console.error(`Error searching for keyword ${keyword}:`, error)
      }
    }

    setComparisonData(results)
    setShowComparison(true)
    setLoading(false)
  }

  const getSelectedBusinesses = () => {
    return businesses.filter(b => selectedBusinesses.includes(b.id))
  }

  const getRankColor = (rank: number | null) => {
    if (!rank) return 'text-gray-400'
    if (rank <= 3) return 'text-green-600 font-bold'
    if (rank <= 10) return 'text-orange-600 font-medium'
    return 'text-red-600'
  }

  if (businesses.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6 mt-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Competitor Comparison</h2>
        <p className="text-gray-600">Search for businesses first to enable competitor comparison.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Competitor Comparison</h2>
      
      {!showComparison ? (
        <div className="space-y-6">
          {/* Business Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Select Businesses to Compare (2-5)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {businesses.slice(0, 10).map(business => (
                <label key={business.id} className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={selectedBusinesses.includes(business.id)}
                    onChange={() => handleBusinessToggle(business.id)}
                    disabled={!selectedBusinesses.includes(business.id) && selectedBusinesses.length >= 5}
                    className="form-checkbox h-4 w-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{business.name}</div>
                    <div className="text-sm text-gray-500">Rank #{business.rank} • ★{business.rating?.toFixed(1)}</div>
                  </div>
                </label>
              ))}
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Selected: {selectedBusinesses.length}/5 businesses
            </p>
          </div>

          {/* Keyword Input */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Keywords to Compare</h3>
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                value={keywordInput}
                onChange={(e) => setKeywordInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addKeyword()}
                placeholder="Enter keyword (e.g., 'pizza delivery')"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
              />
              <button
                onClick={addKeyword}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            
            {comparisonKeywords.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {comparisonKeywords.map(keyword => (
                  <span key={keyword} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center">
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Run Comparison Button */}
          <button
            onClick={runComparison}
            disabled={selectedBusinesses.length < 2 || comparisonKeywords.length === 0 || loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Running Comparison...' : 'Compare Rankings'}
          </button>
        </div>
      ) : (
        <div>
          {/* Comparison Results */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Comparison Results</h3>
            <button
              onClick={() => setShowComparison(false)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Back to Setup
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-300 px-4 py-2 text-left font-medium text-gray-900">
                    Keyword
                  </th>
                  {getSelectedBusinesses().map(business => (
                    <th key={business.id} className="border border-gray-300 px-4 py-2 text-center font-medium text-gray-900">
                      <div className="truncate max-w-32" title={business.name}>
                        {business.name}
                      </div>
                      <div className="text-xs text-gray-500 font-normal">
                        Rank #{business.rank}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonData.map(({ keyword, rankings }) => (
                  <tr key={keyword} className="hover:bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-medium">
                      {keyword}
                    </td>
                    {getSelectedBusinesses().map(business => (
                      <td key={business.id} className="border border-gray-300 px-4 py-2 text-center">
                        <span className={getRankColor(rankings[business.id])}>
                          {rankings[business.id] ? `#${rankings[business.id]}` : 'Not Found'}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-900 mb-2">Analysis Summary</h4>
            <div className="text-sm text-green-800">
              <p>• <span className="text-green-600 font-bold">Green rankings</span>: Top 3 positions (excellent)</p>
              <p>• <span className="text-orange-600 font-medium">Orange rankings</span>: Positions 4-10 (good)</p>
              <p>• <span className="text-red-600">Red rankings</span>: Positions 11+ (needs improvement)</p>
              <p>• <span className="text-gray-400">Not Found</span>: Business not in top 20 results</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}