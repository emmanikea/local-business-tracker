'use client'

import { useState } from 'react'
import BusinessDetailModal from './BusinessDetailModal'

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

interface RankingComparison {
  businessId: string
  businessName: string
  previousRank?: number
  currentRank: number
  rankChange: number
  trend: 'up' | 'down' | 'same' | 'new'
}

interface BusinessResultsProps {
  results: Business[]
  loading: boolean
  comparisons?: RankingComparison[]
  location?: string
}

export default function BusinessResults({ results, loading, comparisons = [], location = '' }: BusinessResultsProps) {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleBusinessClick = (business: Business) => {
    setSelectedBusiness(business)
    setIsModalOpen(true)
  }

  const getRankingChange = (businessId: string) => {
    return comparisons.find(c => c.businessId === businessId)
  }
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Searching for businesses...</p>
      </div>
    )
  }

  if (results.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-600">No search results yet. Enter a keyword and location to get started.</p>
      </div>
    )
  }

  const getPriceLevelText = (level?: number) => {
    if (!level) return 'Price not available'
    return '$'.repeat(level)
  }

  const getBusinessType = (types: string[]) => {
    const relevantTypes = types.filter(type => 
      !['establishment', 'point_of_interest'].includes(type)
    )
    return relevantTypes[0]?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Business'
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        Search Results ({results.length} businesses found)
      </h2>
      
      {results.map((business, index) => {
        const rankingChange = getRankingChange(business.id)
        return (
          <div 
            key={business.id} 
            className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleBusinessClick(business)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center mb-2">
                  <span className="bg-blue-600 text-white text-sm font-bold px-2 py-1 rounded-full mr-3">
                    #{business.rank}
                  </span>
                  
                  {rankingChange && (
                    <div className="flex items-center mr-3">
                      {rankingChange.trend === 'up' && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 text-xs rounded-full flex items-center">
                          ↑ +{rankingChange.rankChange}
                        </span>
                      )}
                      {rankingChange.trend === 'down' && (
                        <span className="bg-red-100 text-red-800 px-2 py-1 text-xs rounded-full flex items-center">
                          ↓ -{Math.abs(rankingChange.rankChange)}
                        </span>
                      )}
                      {rankingChange.trend === 'same' && (
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 text-xs rounded-full flex items-center">
                          → No change
                        </span>
                      )}
                      {rankingChange.trend === 'new' && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 text-xs rounded-full flex items-center">
                          New
                        </span>
                      )}
                    </div>
                  )}
                  
                  <h3 className="text-xl font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                    {business.name}
                  </h3>
                  {business.isOpen !== undefined && (
                    <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                      business.isOpen 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {business.isOpen ? 'Open' : 'Closed'}
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 mb-2">{business.address}</p>
              
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                <div className="flex items-center">
                  <span className="text-yellow-500 mr-1">★</span>
                  <span className="font-medium">{business.rating?.toFixed(1) || 'N/A'}</span>
                  <span className="ml-1">({business.totalRatings || 0} reviews)</span>
                </div>
                
                <div>
                  <span className="font-medium">{getPriceLevelText(business.priceLevel)}</span>
                </div>
                
                <div>
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs">
                    {getBusinessType(business.types)}
                  </span>
                </div>
                
                </div>
                
                <div className="mt-2 text-sm text-blue-600 hover:text-blue-800">
                  Click to analyze keyword rankings →
                </div>
              </div>
            </div>
          </div>
        )
      })}
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Rankings shown are based on Google Places API search results and may vary from actual search engine results. 
          Results are ordered by relevance and proximity to the searched location.
          {comparisons.length > 0 && (
            <>
              <br /><br />
              <strong>Ranking Changes:</strong> Green arrows (↑) indicate improved rankings, red arrows (↓) indicate drops, 
              and "New" indicates businesses that weren't in previous searches.
            </>
          )}
        </p>
      </div>

      {selectedBusiness && (
        <BusinessDetailModal
          business={selectedBusiness}
          location={location}
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedBusiness(null)
          }}
        />
      )}
    </div>
  )
}