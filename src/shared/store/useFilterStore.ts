import { create } from 'zustand'

import { SearchRequestFilter } from '../api/types/SearchRequest/SearchRequestFilter'

interface FilterState {
	savedFilters: SearchRequestFilter
	setFilters: (filters: SearchRequestFilter) => void
	resetFilters: () => void
}

export const useFilterStore = create<FilterState>(set => ({
	savedFilters: [],
	setFilters: filters => set({ savedFilters: filters }),
	resetFilters: () => set({ savedFilters: [] })
}))
