import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { ContactService } from './contact.service';
import { validateContactDto, type ContactDto } from './dto/contact.dto';

@Controller('api/v1/contact')
@AllowAnonymous()
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  /** Submit contact form. Sends email when Resend is configured. */
  @Post()
  @HttpCode(HttpStatus.OK)
  async submit(@Body() body: unknown) {
    const errors = validateContactDto(body);
    if (errors.length > 0) {
      throw new BadRequestException({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: errors,
        },
      });
    }
    const data = body as ContactDto;
    await this.contactService.submit(data);
    return { success: true, message: 'Thank you for your message.' };
  }
}
