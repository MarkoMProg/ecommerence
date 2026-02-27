import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminController } from '../admin.controller';
import { AdminGuard } from '../guards/admin.guard';
import { OrderService } from '../../order/order.service';

/**
 * AdminController integration tests.
 * Guards are overridden to bypass Better Auth for controller-level logic testing.
 */
describe('AdminController', () => {
  let controller: AdminController;
  let orderService: jest.Mocked<Partial<OrderService>>;

  const makeOrder = (overrides: Record<string, unknown> = {}) => ({
    id: 'order-1',
    userId: 'user-1',
    status: 'pending',
    shippingFullName: 'John Doe',
    shippingLine1: '123 Main St',
    shippingLine2: null,
    shippingCity: 'Boston',
    shippingStateOrProvince: 'MA',
    shippingPostalCode: '02101',
    shippingCountry: 'US',
    shippingPhone: null,
    subtotalCents: 2999,
    shippingCents: 500,
    totalCents: 3499,
    stripeSessionId: null,
    paidAt: null,
    items: [
      {
        id: 'item-1',
        productId: 'prod-1',
        quantity: 1,
        priceCentsAtOrder: 2999,
        productNameAtOrder: 'Test Tee',
      },
    ],
    createdAt: new Date('2025-01-01'),
    ...overrides,
  });

  beforeEach(async () => {
    orderService = {
      getAllOrders: jest.fn().mockResolvedValue([makeOrder()]),
      updateOrderStatus: jest.fn().mockResolvedValue(makeOrder({ status: 'paid' })),
      refundOrder: jest.fn().mockResolvedValue(makeOrder({ status: 'refunded' })),
    };

    /** Override AdminGuard so it never runs the Better Auth session check */
    const mockAdminGuard = { canActivate: jest.fn().mockResolvedValue(true) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [
        { provide: OrderService, useValue: orderService },
      ],
    })
      .overrideGuard(AdminGuard)
      .useValue(mockAdminGuard)
      .compile();

    controller = module.get<AdminController>(AdminController);
  });

  // ─── getDashboard ─────────────────────────────────────────────────────────

  describe('GET /api/v1/admin/dashboard', () => {
    it('returns success with ok:true', () => {
      const result = controller.getDashboard();
      expect(result.success).toBe(true);
      expect(result.data).toEqual({ ok: true });
    });
  });

  // ─── getOrders ────────────────────────────────────────────────────────────

  describe('GET /api/v1/admin/orders', () => {
    it('returns success with orders array', async () => {
      const result = await controller.getOrders();
      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe('order-1');
    });

    it('calls orderService.getAllOrders()', async () => {
      await controller.getOrders();
      expect(orderService.getAllOrders).toHaveBeenCalledTimes(1);
    });

    it('returns empty array when no orders', async () => {
      (orderService.getAllOrders as jest.Mock).mockResolvedValue([]);
      const result = await controller.getOrders();
      expect(result.data).toEqual([]);
    });
  });

  // ─── updateOrderStatus ────────────────────────────────────────────────────

  describe('PATCH /api/v1/admin/orders/:orderId/status', () => {
    it('updates order status and returns updated order', async () => {
      const result = await controller.updateOrderStatus('order-1', { status: 'paid' });
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('paid');
      expect(orderService.updateOrderStatus).toHaveBeenCalledWith('order-1', 'paid');
    });

    it('trims whitespace from orderId and status', async () => {
      await controller.updateOrderStatus('  order-1  ', { status: '  shipped  ' });
      expect(orderService.updateOrderStatus).toHaveBeenCalledWith('order-1', 'shipped');
    });

    it('throws BadRequestException when status is missing', async () => {
      await expect(
        controller.updateOrderStatus('order-1', {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when status is empty string', async () => {
      await expect(
        controller.updateOrderStatus('order-1', { status: '   ' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException with STATUS_REQUIRED code', async () => {
      await expect(
        controller.updateOrderStatus('order-1', {}),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          error: expect.objectContaining({ code: 'STATUS_REQUIRED' }),
        }),
      });
    });

    it('throws NotFoundException when order does not exist', async () => {
      (orderService.updateOrderStatus as jest.Mock).mockResolvedValue( null as any);
      await expect(
        controller.updateOrderStatus('nonexistent', { status: 'paid' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException with ORDER_NOT_FOUND code', async () => {
      (orderService.updateOrderStatus as jest.Mock).mockResolvedValue(null as any);
      await expect(
        controller.updateOrderStatus('nonexistent', { status: 'paid' }),
      ).rejects.toMatchObject({
        response: expect.objectContaining({
          error: expect.objectContaining({ code: 'ORDER_NOT_FOUND' }),
        }),
      });
    });
  });

  // ─── refundOrder ──────────────────────────────────────────────────────────

  describe('POST /api/v1/admin/orders/:orderId/refund', () => {
    it('refunds order and returns updated order', async () => {
      const result = await controller.refundOrder('order-1');
      expect(result.success).toBe(true);
      expect(result.data.status).toBe('refunded');
      expect(orderService.refundOrder).toHaveBeenCalledWith('order-1');
    });

    it('trims whitespace from orderId', async () => {
      await controller.refundOrder('  order-1  ');
      expect(orderService.refundOrder).toHaveBeenCalledWith('order-1');
    });

    it('throws NotFoundException when order does not exist', async () => {
      (orderService.refundOrder as jest.Mock).mockResolvedValue(null as any);
      await expect(controller.refundOrder('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('throws NotFoundException with ORDER_NOT_FOUND code', async () => {
      (orderService.refundOrder as jest.Mock).mockResolvedValue(null as any);
      await expect(controller.refundOrder('nonexistent')).rejects.toMatchObject({
        response: expect.objectContaining({
          error: expect.objectContaining({ code: 'ORDER_NOT_FOUND' }),
        }),
      });
    });

    it('returns message "Order refunded"', async () => {
      const result = await controller.refundOrder('order-1');
      expect(result.message).toBe('Order refunded');
    });
  });
});
