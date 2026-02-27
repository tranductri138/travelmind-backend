export class ReviewDeletedEvent {
  constructor(
    public readonly reviewId: string,
    public readonly hotelId: string,
  ) {}
}
