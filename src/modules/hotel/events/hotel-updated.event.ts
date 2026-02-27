export class HotelUpdatedEvent {
  constructor(
    public readonly hotelId: string,
    public readonly name: string,
    public readonly city: string,
  ) {}
}
