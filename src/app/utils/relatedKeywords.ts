export interface KeywordGroup {
  category: string
  keywords: string[]
}

export const BUSINESS_KEYWORDS: Record<string, string[]> = {
  'restaurant': [
    'restaurant', 'dining', 'food', 'eatery', 'bistro', 'cafe',
    'takeout', 'delivery', 'fast food', 'fine dining'
  ],
  'marketing': [
    'marketing agency', 'digital marketing', 'advertising agency',
    'web design', 'seo services', 'social media marketing',
    'marketing consultant', 'branding agency', 'ppc management'
  ],
  'healthcare': [
    'doctor', 'physician', 'medical clinic', 'healthcare',
    'family doctor', 'primary care', 'medical services',
    'clinic', 'health center'
  ],
  'dental': [
    'dentist', 'dental clinic', 'dental care', 'orthodontist',
    'dental services', 'teeth cleaning', 'oral health',
    'family dentist', 'cosmetic dentist'
  ],
  'legal': [
    'lawyer', 'attorney', 'law firm', 'legal services',
    'personal injury lawyer', 'divorce attorney', 'criminal lawyer',
    'business lawyer', 'legal counsel'
  ],
  'automotive': [
    'auto repair', 'car service', 'mechanic', 'automotive',
    'car maintenance', 'brake service', 'oil change',
    'auto shop', 'car repair'
  ],
  'beauty': [
    'hair salon', 'beauty salon', 'barber shop', 'spa',
    'nail salon', 'hair stylist', 'beauty services',
    'massage therapy', 'skincare'
  ],
  'fitness': [
    'gym', 'fitness center', 'personal trainer', 'yoga studio',
    'pilates', 'crossfit', 'fitness classes', 'health club',
    'workout facility'
  ],
  'real_estate': [
    'real estate', 'realtor', 'real estate agent', 'property management',
    'home sales', 'real estate broker', 'property sales',
    'real estate services', 'home buying'
  ],
  'home_services': [
    'plumber', 'electrician', 'hvac', 'contractor',
    'home repair', 'handyman', 'roofing', 'flooring',
    'painting', 'landscaping'
  ]
}

export function detectBusinessCategory(businessTypes: string[], businessName: string): string[] {
  const name = businessName.toLowerCase()
  const types = businessTypes.map(t => t.toLowerCase())
  
  const detectedCategories: string[] = []
  
  // Check business types first
  for (const [category, keywords] of Object.entries(BUSINESS_KEYWORDS)) {
    const hasMatchingType = types.some(type => 
      keywords.some(keyword => 
        type.includes(keyword.replace(' ', '_')) || 
        keyword.replace(' ', '_').includes(type)
      )
    )
    
    const hasMatchingName = keywords.some(keyword => 
      name.includes(keyword) || keyword.includes(name.split(' ')[0])
    )
    
    if (hasMatchingType || hasMatchingName) {
      detectedCategories.push(category)
    }
  }
  
  // Fallback to generic business keywords if no specific category found
  if (detectedCategories.length === 0) {
    return ['general']
  }
  
  return detectedCategories
}

export function getRelatedKeywords(categories: string[]): string[] {
  const allKeywords = new Set<string>()
  
  categories.forEach(category => {
    if (BUSINESS_KEYWORDS[category]) {
      BUSINESS_KEYWORDS[category].forEach(keyword => allKeywords.add(keyword))
    }
  })
  
  // Add some general business keywords
  if (categories.includes('general')) {
    ['business', 'services', 'company', 'local business'].forEach(k => allKeywords.add(k))
  }
  
  return Array.from(allKeywords).slice(0, 10) // Limit to prevent too many API calls
}

export async function analyzeBusinessKeywords(
  businessName: string, 
  businessTypes: string[],
  location: string
): Promise<Array<{keyword: string, rank: number | null, found: boolean}>> {
  const categories = detectBusinessCategory(businessTypes, businessName)
  const keywords = getRelatedKeywords(categories)
  
  const results = []
  
  for (const keyword of keywords) {
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword, location })
      })
      
      const data = await response.json()
      
      if (response.ok && data.businesses) {
        const businessRank = data.businesses.findIndex(
          (b: Record<string, unknown>) => String(b.name).toLowerCase().includes(businessName.toLowerCase()) ||
                     businessName.toLowerCase().includes(String(b.name).toLowerCase())
        )
        
        results.push({
          keyword,
          rank: businessRank >= 0 ? businessRank + 1 : null,
          found: businessRank >= 0
        })
      } else {
        results.push({ keyword, rank: null, found: false })
      }
      
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200))
      
    } catch (error) {
      console.error(`Error searching for keyword ${keyword}:`, error)
      results.push({ keyword, rank: null, found: false })
    }
  }
  
  return results.sort((a, b) => {
    if (a.found && !b.found) return -1
    if (!a.found && b.found) return 1
    if (a.rank && b.rank) return a.rank - b.rank
    return 0
  })
}