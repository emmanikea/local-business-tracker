'use client'

import { useState } from 'react'
import { RankingHistoryManager } from '../utils/rankingHistory'

interface Business {
  id: string
  name: string
  rank: number
}

interface SearchFormProps {
  onSearch: (results: Business[], comparisons?: unknown[], location?: string) => void
  setLoading: (loading: boolean) => void
}

export default function SearchForm({ onSearch, setLoading }: SearchFormProps) {
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('')
  const rankingManager = new RankingHistoryManager()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!keyword.trim() || !location.trim()) {
      alert('Please enter both keyword and location')
      return
    }

    setLoading(true)
    onSearch([])

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ keyword: keyword.trim(), location: location.trim() }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Search failed')
      }

      const businesses = data.businesses || []
      
      // Save ranking data and get comparisons with previous searches
      if (businesses.length > 0) {
        rankingManager.saveRankingData(keyword.trim(), location.trim(), businesses)
        const comparisons = rankingManager.getRankingComparisons(keyword.trim(), location.trim())
        onSearch(businesses, comparisons, location.trim())
      } else {
        onSearch(businesses, [], location.trim())
      }
    } catch (error) {
      console.error('Search error:', error)
      alert(error instanceof Error ? error.message : 'Search failed')
      onSearch([], [], location.trim())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-1">
              Keyword
            </label>
            <input
              type="text"
              id="keyword"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g., pizza, dentist, coffee shop"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            />
          </div>
          
          <div>
            <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., New York, NY or 10001"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            />
          </div>
        </div>
        
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
        >
          Search Business Rankings
        </button>
      </form>
    </div>
  )
}