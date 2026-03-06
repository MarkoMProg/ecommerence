import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { MulterFile } from '../../common/multer-file.types';
import { AdminController } from '../admin.controller';
import { AdminGuard } from '../guards/admin.guard';
import { OrderService } from '../../order/order.service';
import { CatalogService } from '../../catalog/catalog.service';
import { BulkUploadService } from '../../catalog/bulk-upload.service';

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
        { provide: CatalogService, useValue: { createProduct: jest.fn() } },
        { provide: BulkUploadService, useValue: new BulkUploadService() },
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

  // ─── bulkUploadProducts — friendly error messages ─────────────────────────

  describe('POST /api/v1/admin/products/bulk — friendly errors', () => {
    let catalogService: { createProduct: jest.Mock };

    beforeEach(() => {
      catalogService = controller['catalogService'] as unknown as { createProduct: jest.Mock };
      catalogService.createProduct = jest.fn();
    });

    const makeMockFile = (content: string, name = 'products.json'): MulterFile => ({
      buffer: Buffer.from(content),
      originalname: name,
      fieldname: 'file',
      encoding: 'utf-8',
      mimetype: 'application/json',
      size: content.length,
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    });

    const validEntry = {
      name: 'Tee',
      description: 'A tee',
      priceCents: 2999,
      categoryId: 'BAD_ID',
      brand: 'B',
    };

    it('converts foreign key violation to user-friendly category message', async () => {
      catalogService.createProduct.mockRejectedValue(
        new Error('insert or update on table "product" violates foreign key constraint "product_category_id_category_id_fk" - Key (category_id)=(BAD_ID) is not present in table "category"'),
      );

      const file = makeMockFile(JSON.stringify([validEntry]));
      const result = await controller.bulkUploadProducts(file);

      expect(result.data.results[0].error).toContain('does not match any existing category');
      expect(result.data.results[0].error).not.toContain('insert');
      expect(result.data.results[0].error).not.toContain('query');
    });

    it('converts duplicate key error to friendly message', async () => {
      catalogService.createProduct.mockRejectedValue(
        new Error('duplicate key value violates unique constraint "product_pkey"'),
      );

      const file = makeMockFile(JSON.stringify([validEntry]));
      const result = await controller.bulkUploadProducts(file);

      expect(result.data.results[0].error).toContain('already exists');
    });

    it('converts not-null constraint error to friendly message', async () => {
      catalogService.createProduct.mockRejectedValue(
        new Error('null value in column "brand" of relation "product" violates not-null constraint'),
      );

      const file = makeMockFile(JSON.stringify([validEntry]));
      const result = await controller.bulkUploadProducts(file);

      expect(result.data.results[0].error).toContain('brand');
      expect(result.data.results[0].error).toContain('required');
    });

    it('converts invalid input syntax error to friendly message', async () => {
      catalogService.createProduct.mockRejectedValue(
        new Error('invalid input syntax for type integer: "abc"'),
      );

      const file = makeMockFile(JSON.stringify([validEntry]));
      const result = await controller.bulkUploadProducts(file);

      expect(result.data.results[0].error).toContain('invalid format');
    });

    it('returns generic friendly message for unknown errors', async () => {
      catalogService.createProduct.mockRejectedValue(
        new Error('some obscure internal error XYZ'),
      );

      const file = makeMockFile(JSON.stringify([validEntry]));
      const result = await controller.bulkUploadProducts(file);

      expect(result.data.results[0].error).toContain('Something went wrong');
      expect(result.data.results[0].error).not.toContain('obscure');
    });

    it('never leaks SQL query text in error messages', async () => {
      catalogService.createProduct.mockRejectedValue(
        new Error('Failed query: insert into "product" ("id") values ($1) params: abc-123'),
      );

      const file = makeMockFile(JSON.stringify([validEntry]));
      const result = await controller.bulkUploadProducts(file);

      expect(result.data.results[0].error).not.toContain('insert into');
      expect(result.data.results[0].error).not.toContain('params:');
      expect(result.data.results[0].error).not.toContain('Failed query');
    });
  });
});
