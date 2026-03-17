import { Injectable } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import type { ContactDto } from './dto/contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly emailService: EmailService) {}

  /**
   * Process contact form submission. Sends email via EmailService when configured.
   * Always returns success from API perspective — email failures are logged, not thrown.
   */
  async submit(data: ContactDto): Promise<void> {
    await this.emailService.sendContactEmail(
      data.name,
      data.email,
      data.subject ?? '',
      data.message,
    );
  }
}
