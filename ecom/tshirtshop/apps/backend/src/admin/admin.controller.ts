import { Controller, Get, Patch, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BetterAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { OrderService } from '../order/order.service';
import { AdminUsersService } from './admin-users.service';

@Controller('api/v1/admin')
@UseGuards(BetterAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly orderService: OrderService,
    private readonly adminUsersService: AdminUsersService,
  ) {}

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

  /**
   * List users (ADM-004). Paginated, optional search by email or name.
   */
  @Get('users')
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const result = await this.adminUsersService.listUsers(
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
      search,
    );
    return {
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: 'Users retrieved',
    };
  }

  /**
   * Get user by ID (ADM-004).
   */
  @Get('users/:userId')
  async getUser(@Param('userId') userId: string) {
    const user = await this.adminUsersService.getUserById(userId.trim());
    if (!user) {
      throw new NotFoundException({
        success: false,
        error: { code: 'USER_NOT_FOUND', message: 'User not found' },
      });
    }
    return {
      success: true,
      data: user,
      message: 'User retrieved',
    };
  }

  /**
   * Refund order (ORD-005). Only paid, shipped, or completed orders can be refunded.
   */
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
