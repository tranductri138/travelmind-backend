export class HotelCreatedEvent {
  constructor(
    public readonly hotelId: string,
    public readonly name: string,
    public readonly city: string,
  ) {}
}
