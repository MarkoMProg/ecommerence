import { Logger } from '@nestjs/common';
import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { OrderService } from './order.service';
import { PAYMENT_EVENTS_QUEUE } from './payment-queue.constants';

export { PAYMENT_EVENTS_QUEUE };

export interface PaymentSuccessJobData {
  orderId: string;
  sessionId?: string;
}


@Processor(PAYMENT_EVENTS_QUEUE)
export class PaymentEventsProcessor extends WorkerHost {
  private readonly logger = new Logger(PaymentEventsProcessor.name);

  constructor(private readonly orderService: OrderService) {
    super();
  }

  async process(job: Job<PaymentSuccessJobData>): Promise<void> {
    if (job.name === 'payment.success') {
      this.logger.log(
        `[job:${job.id}] payment.success — orderId=${job.data.orderId} attempt=${job.attemptsMade + 1}`,
      );
      await this.orderService.markOrderPaidIfPending(job.data.orderId, {
        stripeSessionId: job.data.sessionId,
      });
      this.logger.log(
        `[job:${job.id}] payment.success completed — orderId=${job.data.orderId}`,
      );
    } else if (job.name === 'payment.notify') {
      this.logger.log(
        `[job:${job.id}] payment.notify — sending confirmation email for orderId=${job.data.orderId}`,
      );
      await this.orderService.triggerOrderNotification(job.data.orderId);
      this.logger.log(
        `[job:${job.id}] payment.notify completed — orderId=${job.data.orderId}`,
      );
    } else if (job.name === 'payment.failed') {
      this.logger.log(
        `[job:${job.id}] payment.failed — sending failed payment email for orderId=${job.data.orderId}`,
      );
      await this.orderService.triggerPaymentFailedNotification(job.data.orderId);
      this.logger.log(
        `[job:${job.id}] payment.failed completed — orderId=${job.data.orderId}`,
      );
    } else {
      this.logger.warn(`[job:${job.id}] Unknown job name: ${job.name}`);
    }
  }
}
