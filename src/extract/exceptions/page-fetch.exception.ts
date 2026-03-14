import { BadGatewayException } from '@nestjs/common';

export class PageFetchException extends BadGatewayException {
  constructor() {
    super('One or more pages could not be fetched.');
  }
}
