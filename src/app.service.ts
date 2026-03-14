import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus(): { message: string } {
    return {
      message: 'AI Search Retrieval Service is running',
    };
  }
}
