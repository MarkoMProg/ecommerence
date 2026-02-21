import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BetterAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { OrderService } from '../order/order.service';

@Controller('api/v1/admin')
@UseGuards(BetterAuthGuard, AdminGuard)
export class AdminController {
  constructor(private readonly orderService: OrderService) {}

  /**
   * Health check for admin access. Returns 200 if user is admin.
   */
  @Get('dashboard')
  getDashboard() {
    return { success: true, data: { ok: true }, message: 'Admin access' };
  }

  /**
   * List all orders (admin only).
   */
  @Get('orders')
  async getOrders() {
    const orders = await this.orderService.getAllOrders();
    return {
      success: true,
      data: orders,
      message: 'Orders retrieved',
    };
  }

  /**
   * Update order status (admin). Same lifecycle rules as ORD-003.
   */
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
}
