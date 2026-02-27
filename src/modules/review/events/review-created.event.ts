export class ReviewCreatedEvent {
  constructor(
    public readonly reviewId: string,
    public readonly hotelId: string,
    public readonly rating: number,
  ) {}
}
