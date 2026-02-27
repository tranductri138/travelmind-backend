export const HOTEL_INDEX = 'hotels';

export const hotelIndexMapping = {
  mappings: {
    properties: {
      id: { type: 'keyword' },
      name: { type: 'text', analyzer: 'standard' },
      description: { type: 'text', analyzer: 'standard' },
      address: { type: 'text' },
      city: { type: 'keyword' },
      country: { type: 'keyword' },
      location: { type: 'geo_point' },
      stars: { type: 'integer' },
      rating: { type: 'float' },
      reviewCount: { type: 'integer' },
      amenities: { type: 'keyword' },
      price: { type: 'float' },
      isActive: { type: 'boolean' },
      updatedAt: { type: 'date' },
    },
  },
};
