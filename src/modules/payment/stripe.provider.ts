import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export const STRIPE_CLIENT = 'STRIPE_CLIENT';

export const StripeProvider: Provider = {
  provide: STRIPE_CLIENT,
  useFactory: (configService: ConfigService) => {
    return new Stripe(configService.get<string>('stripe.secretKey', ''));
  },
  inject: [ConfigService],
};
