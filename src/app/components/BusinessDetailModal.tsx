'use client'

import { useState, useEffect } from 'react'
import { analyzeBusinessKeywords } from '../utils/relatedKeywords'

interface Business {
  id: string
  name: string
  address: string
  rating: number
  totalRatings: number
  rank: number
  types: string[]
  priceLevel?: number
  isOpen?: boolean
}

interface BusinessDetailModalProps {
  business: Business
  location: string
  isOpen: boolean
  onClose: () => void
}

export default function BusinessDetailModal({ business, location, isOpen, onClose }: BusinessDetailModalProps) {
  const [keywordAnalysis, setKeywordAnalysis] = useState<Array<{keyword: string, rank: number | null, found: boolean}>>([])
  const [loading, setLoading] = useState(false)

  const analyzeKeywords = async () => {
    setLoading(true)
    try {
      const results = await analyzeBusinessKeywords(business.name, business.types, location)
      setKeywordAnalysis(results)
    } catch (error) {
      console.error('Error analyzing keywords:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen && business) {
      analyzeKeywords()
    }
  }, [isOpen, business])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">{business.name}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
            >
              ×
            </button>
          </div>
          <p className="text-gray-600 mt-1">{business.address}</p>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Business Info */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Business Information</h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <span className="text-yellow-500 mr-2">★</span>
                  <span className="font-medium">{business.rating?.toFixed(1) || 'N/A'}</span>
                  <span className="text-gray-500 ml-2">({business.totalRatings || 0} reviews)</span>
                </div>
                
                <div>
                  <span className="font-medium">Current Rank: </span>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm">#{business.rank}</span>
                </div>

                {business.priceLevel && (
                  <div>
                    <span className="font-medium">Price Level: </span>
                    <span className="text-green-600">{'$'.repeat(business.priceLevel)}</span>
                  </div>
                )}

                {business.isOpen !== undefined && (
                  <div>
                    <span className="font-medium">Status: </span>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      business.isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {business.isOpen ? 'Open Now' : 'Closed'}
                    </span>
                  </div>
                )}

                <div>
                  <span className="font-medium">Business Type: </span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {business.types.slice(0, 3).map((type: string, index: number) => (
                      <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                        {type.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Keyword Analysis */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Keyword Rankings Analysis</h3>
              
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Analyzing keyword rankings...</span>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {keywordAnalysis.length > 0 ? (
                    keywordAnalysis.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-gray-800">{item.keyword}</span>
                        <div className="flex items-center">
                          {item.found ? (
                            <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-sm font-medium">
                              Rank #{item.rank}
                            </span>
                          ) : (
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                              Not in top 20
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-center py-4">
                      Click &quot;Analyze Keywords&quot; to see where this business ranks for related terms
                    </p>
                  )}
                </div>
              )}

              {!loading && keywordAnalysis.length === 0 && (
                <button
                  onClick={analyzeKeywords}
                  className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors mt-4"
                >
                  Analyze Keywords
                </button>
              )}
            </div>
          </div>

          {keywordAnalysis.length > 0 && (
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Analysis Summary</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {keywordAnalysis.filter(k => k.found).length}
                  </div>
                  <div className="text-blue-800">Keywords Found</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {keywordAnalysis.filter(k => k.rank && k.rank <= 3).length}
                  </div>
                  <div className="text-green-800">Top 3 Rankings</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {keywordAnalysis.filter(k => k.rank && k.rank <= 10 && k.rank > 3).length}
                  </div>
                  <div className="text-orange-800">Top 10 Rankings</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-gray-600">
                    {keywordAnalysis.filter(k => !k.found).length}
                  </div>
                  <div className="text-gray-800">Not Ranking</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}