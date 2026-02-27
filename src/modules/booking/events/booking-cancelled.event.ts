export class BookingCancelledEvent {
  constructor(
    public readonly bookingId: string,
    public readonly userId: string,
    public readonly roomId: string,
    public readonly checkIn: Date,
    public readonly checkOut: Date,
  ) {}
}
