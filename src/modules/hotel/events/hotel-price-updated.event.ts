export class HotelPriceUpdatedEvent {
  constructor(
    public readonly hotelId: string,
    public readonly oldPrice: number,
    public readonly newPrice: number,
  ) {}
}
