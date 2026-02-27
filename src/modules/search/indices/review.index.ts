export const REVIEW_INDEX = 'reviews';

export const reviewIndexMapping = {
  mappings: {
    properties: {
      id: { type: 'keyword' },
      hotelId: { type: 'keyword' },
      userId: { type: 'keyword' },
      rating: { type: 'integer' },
      title: { type: 'text' },
      comment: { type: 'text', analyzer: 'standard' },
      createdAt: { type: 'date' },
    },
  },
};
