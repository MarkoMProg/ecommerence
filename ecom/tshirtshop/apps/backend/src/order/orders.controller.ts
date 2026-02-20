import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { OrderService } from './order.service';

@Controller('api/v1/orders')
@AllowAnonymous()
export class OrdersController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Cancel order (ORD-004). Only pending or paid orders can be cancelled.
   */
  @Post(':orderId/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelOrder(@Param('orderId') orderId: string) {
    const order = await this.orderService.cancelOrder(orderId.trim());
    if (!order) {
      throw new NotFoundException({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      });
    }
    return {
      success: true,
      data: order,
      message: 'Order cancelled',
    };
  }

  /**
   * Update order status (ORD-003). Validates lifecycle transitions.
   * PATCH body: { status: "paid" | "shipped" | "completed" | "cancelled" }
   */
  @Patch(':orderId/status')
  async updateStatus(
    @Param('orderId') orderId: string,
    @Body() body: { status?: string },
  ) {
    if (!body?.status?.trim()) {
      throw new BadRequestException({
        success: false,
        error: { code: 'STATUS_REQUIRED', message: 'status is required' },
      });
    }
    const order = await this.orderService.updateOrderStatus(orderId.trim(), body.status.trim());
    if (!order) {
      throw new NotFoundException({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      });
    }
    return {
      success: true,
      data: order,
      message: 'Order status updated',
    };
  }

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
