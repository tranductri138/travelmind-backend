export const CACHE_KEYS = {
  HOTEL_LIST: 'hotels:list',
  HOTEL_DETAIL: (id: string) => `hotels:${id}`,
  HOTEL_ROOMS: (hotelId: string) => `hotels:${hotelId}:rooms`,
  USER_PROFILE: (id: string) => `users:${id}`,
  SEARCH_RESULTS: (query: string) => `search:${query}`,
} as const;
