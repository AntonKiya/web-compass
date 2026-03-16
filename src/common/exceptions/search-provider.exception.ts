import { BadGatewayException } from '@nestjs/common';

export class SearchProviderException extends BadGatewayException {
  constructor() {
    super(
      'Search provider is temporarily unavailable. Please try again later.',
    );
  }
}
