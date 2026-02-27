import { Controller, Get, Patch, Post, Param, Body, UseGuards } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminGuard } from './guards/admin.guard';
import { OrderService } from '../order/order.service';


@Controller('api/v1/admin')
@UseGuards(AdminGuard)
export class AdminController {
  constructor(private readonly orderService: OrderService) {}

 
  @Get('dashboard')
  getDashboard() {
    return { success: true, data: { ok: true }, message: 'Admin access' };
  }

 
  @Get('orders')
  async getOrders() {
    const orders = await this.orderService.getAllOrders();
    return {
      success: true,
      data: orders,
      message: 'Orders retrieved',
    };
  }

  @Patch('orders/:orderId/status')
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body() body: { status?: string },
  ) {
    if (!body?.status?.trim()) {
      throw new BadRequestException({
        success: false,
        error: { code: 'STATUS_REQUIRED', message: 'status is required' },
      });
    }
    const order = await this.orderService.updateOrderStatus(
      orderId.trim(),
      body.status.trim(),
    );
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

 
  @Post('orders/:orderId/refund')
  async refundOrder(@Param('orderId') orderId: string) {
    const order = await this.orderService.refundOrder(orderId.trim());
    if (!order) {
      throw new NotFoundException({
        success: false,
        error: { code: 'ORDER_NOT_FOUND', message: 'Order not found' },
      });
    }
    return {
      success: true,
      data: order,
      message: 'Order refunded',
    };
  }
}
