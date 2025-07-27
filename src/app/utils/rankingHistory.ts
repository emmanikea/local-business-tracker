export interface RankingRecord {
  id: string
  keyword: string
  location: string
  timestamp: number
  businesses: Array<{
    id: string
    name: string
    rank: number
    rating: number
    totalRatings: number
  }>
}

export interface RankingComparison {
  businessId: string
  businessName: string
  previousRank?: number
  currentRank: number
  rankChange: number
  trend: 'up' | 'down' | 'same' | 'new'
}

export class RankingHistoryManager {
  private storageKey = 'business-ranking-history'

  saveRankingData(keyword: string, location: string, businesses: Array<{id: string, name: string, rank: number, rating: number, totalRatings: number}>): void {
    const record: RankingRecord = {
      id: `${keyword}-${location}-${Date.now()}`,
      keyword: keyword.toLowerCase().trim(),
      location: location.toLowerCase().trim(),
      timestamp: Date.now(),
      businesses: businesses.map(b => ({
        id: b.id,
        name: b.name,
        rank: b.rank,
        rating: b.rating,
        totalRatings: b.totalRatings
      }))
    }

    const history = this.getHistory()
    history.push(record)
    
    // Keep only last 100 records to avoid storage bloat
    if (history.length > 100) {
      history.splice(0, history.length - 100)
    }
    
    localStorage.setItem(this.storageKey, JSON.stringify(history))
  }

  getHistory(): RankingRecord[] {
    try {
      const data = localStorage.getItem(this.storageKey)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  getRankingComparisons(keyword: string, location: string): RankingComparison[] {
    const history = this.getHistory()
    const normalizedKeyword = keyword.toLowerCase().trim()
    const normalizedLocation = location.toLowerCase().trim()
    
    const relevantRecords = history
      .filter(r => r.keyword === normalizedKeyword && r.location === normalizedLocation)
      .sort((a, b) => b.timestamp - a.timestamp)
    
    if (relevantRecords.length < 2) return []
    
    const current = relevantRecords[0]
    const previous = relevantRecords[1]
    
    const comparisons: RankingComparison[] = []
    
    current.businesses.forEach(currentBusiness => {
      const previousBusiness = previous.businesses.find(b => b.id === currentBusiness.id)
      
      let trend: 'up' | 'down' | 'same' | 'new' = 'new'
      let rankChange = 0
      
      if (previousBusiness) {
        rankChange = previousBusiness.rank - currentBusiness.rank
        if (rankChange > 0) trend = 'up'
        else if (rankChange < 0) trend = 'down'
        else trend = 'same'
      }
      
      comparisons.push({
        businessId: currentBusiness.id,
        businessName: currentBusiness.name,
        previousRank: previousBusiness?.rank,
        currentRank: currentBusiness.rank,
        rankChange,
        trend
      })
    })
    
    return comparisons.sort((a, b) => a.currentRank - b.currentRank)
  }

  getSearchHistory(limit: number = 10) {
    const history = this.getHistory()
    const searches = new Map<string, RankingRecord>()
    
    // Get unique searches (latest for each keyword-location combination)
    history.forEach(record => {
      const key = `${record.keyword}-${record.location}`
      if (!searches.has(key) || record.timestamp > searches.get(key)!.timestamp) {
        searches.set(key, record)
      }
    })
    
    return Array.from(searches.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }
}