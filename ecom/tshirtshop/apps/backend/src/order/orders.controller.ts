import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { OrderService } from './order.service';

@Controller('api/v1/orders')
@AllowAnonymous()
export class OrdersController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Get order by ID (CHK-004). Used for order confirmation page.
   */
  @Get(':orderId')
  async getOrder(@Param('orderId') orderId: string) {
    const order = await this.orderService.getOrderById(orderId.trim());
    if (!order) {
      throw new NotFoundException({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      });
    }
    return {
      success: true,
      data: order,
      message: 'Order retrieved',
    };
  }
}
