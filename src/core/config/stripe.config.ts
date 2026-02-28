import { registerAs } from '@nestjs/config';

export const stripeConfig = registerAs('stripe', () => ({
  // LianLian Bank simulated payment — no external API keys needed
}));
