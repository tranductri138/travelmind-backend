export class HotelDeletedEvent {
  constructor(
    public readonly hotelId: string,
    public readonly permanent: boolean,
  ) {}
}
