import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { OrderService } from '../order.service';
import { DATABASE_CONNECTION } from '../../database/database-connection';
import { InventoryService } from '../../inventory/inventory.service';
import { StripeService } from '../stripe.service';
import { EmailService } from '../../email/email.service';
import { PAYMENT_EVENTS_QUEUE } from '../payment-queue.constants';
import type { OrderDto } from '../order.service';

describe('OrderService — markOrderPaidIfPending (stock + payment)', () => {
  let service: OrderService;
  let mockDb: {
    transaction: jest.Mock;
    select: jest.Mock;
    update: jest.Mock;
  };
  let mockInventory: { decrementStockForOrderWithTx: jest.Mock };
  let mockStripe: {
    isConfigured: jest.Mock;
    createRefundForSession: jest.Mock;
  };
  let mockQueue: { add: jest.Mock };

  const pendingOrderDto: OrderDto = {
    id: 'order-1',
    userId: 'user-1',
    status: 'pending',
    shippingFullName: 'Jane',
    shippingLine1: '1 Main',
    shippingLine2: null,
    shippingCity: 'Austin',
    shippingStateOrProvince: 'TX',
    shippingPostalCode: '78701',
    shippingCountry: 'US',
    shippingPhone: null,
    subtotalCents: 2800,
    shippingCents: 0,
    totalCents: 2800,
    deliveryOptionId: null,
    stripeSessionId: null,
    paidAt: null,
    stripeRefundId: null,
    refundedAt: null,
    items: [
      {
        id: 'li-1',
        productId: 'prod-1',
        quantity: 1,
        priceCentsAtOrder: 2800,
        productNameAtOrder: 'Poster',
        selectedOptionAtOrder: null,
      },
    ],
    createdAt: new Date(),
  };

  const paidOrderDto: OrderDto = { ...pendingOrderDto, status: 'paid' };

  const oversoldOrderDto: OrderDto = {
    ...pendingOrderDto,
    status: 'oversold',
    paidAt: new Date(),
    stripeSessionId: 'cs_test_abc',
  };

  const refundedOrderDto: OrderDto = {
    ...oversoldOrderDto,
    status: 'refunded',
    stripeRefundId: 're_xxx',
    refundedAt: new Date(),
  };

  beforeEach(async () => {
    mockDb = {
      transaction: jest.fn(),
      select: jest.fn(),
      update: jest.fn(() => ({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      })),
    };

    mockInventory = {
      decrementStockForOrderWithTx: jest.fn(),
    };

    mockStripe = {
      isConfigured: jest.fn().mockReturnValue(true),
      createRefundForSession: jest.fn().mockResolvedValue({ refundId: 're_xxx' }),
    };

    mockQueue = { add: jest.fn().mockResolvedValue(undefined) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderService,
        { provide: DATABASE_CONNECTION, useValue: mockDb },
        { provide: InventoryService, useValue: mockInventory },
        { provide: StripeService, useValue: mockStripe },
        {
          provide: EmailService,
          useValue: { isConfigured: jest.fn().mockReturnValue(false) },
        },
        {
          provide: getQueueToken(PAYMENT_EVENTS_QUEUE),
          useValue: mockQueue,
        },
      ],
    }).compile();

    service = module.get<OrderService>(OrderService);
  });

  function setupTransactionWithOutcome(
    outcome: 'paid' | 'oversold',
    failures?: { productId: string; productName: string; required: number; available: number }[],
  ): void {
    mockDb.transaction.mockImplementation(async (fn: (tx: unknown) => Promise<void>) => {
      const tx = {
        execute: jest.fn().mockResolvedValue({ rows: [] }),
        select: jest.fn(),
        update: jest.fn(() => ({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(undefined),
          }),
        })),
      };

      let selectCall = 0;
      tx.select.mockImplementation(() => ({
        from: jest.fn(() => ({
          where: jest.fn(() => {
            selectCall += 1;
            if (selectCall === 1) {
              return Promise.resolve([
                {
                  id: 'order-1',
                  status: 'pending',
                  userId: 'user-1',
                  stripeSessionId: null,
                  shippingFullName: 'x',
                  shippingLine1: 'x',
                  shippingLine2: null,
                  shippingCity: 'x',
                  shippingStateOrProvince: 'x',
                  shippingPostalCode: 'x',
                  shippingCountry: 'US',
                  shippingPhone: null,
                  subtotalCents: 2800,
                  shippingCents: 0,
                  totalCents: 2800,
                  deliveryOptionId: null,
                  paidAt: null,
                  stripeRefundId: null,
                  refundedAt: null,
                  refundAmountCents: null,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                },
              ]);
            }
            return Promise.resolve([{ productId: 'prod-1', quantity: 1 }]);
          }),
        })),
      }));

      if (outcome === 'paid') {
        mockInventory.decrementStockForOrderWithTx.mockResolvedValue({ ok: true });
      } else {
        mockInventory.decrementStockForOrderWithTx.mockResolvedValue({
          ok: false,
          failures:
            failures ??
            [
              {
                productId: 'prod-1',
                productName: 'Poster',
                required: 1,
                available: 0,
              },
            ],
        });
      }

      await fn(tx);
    });
  }

  it('sets paid and enqueues notification when stock allocation succeeds', async () => {
    setupTransactionWithOutcome('paid');
    jest
      .spyOn(service, 'getOrderById')
      .mockResolvedValueOnce(pendingOrderDto)
      .mockResolvedValueOnce(paidOrderDto);

    const result = await service.markOrderPaidIfPending('order-1', {
      stripeSessionId: 'cs_test_abc',
    });

    expect(result?.status).toBe('paid');
    expect(mockInventory.decrementStockForOrderWithTx).toHaveBeenCalled();
    expect(mockQueue.add).toHaveBeenCalledWith(
      'payment.notify',
      { orderId: 'order-1' },
      expect.any(Object),
    );
    expect(mockStripe.createRefundForSession).not.toHaveBeenCalled();
  });

  it('sets oversold when stock fails, logs path, then auto-refunds to refunded', async () => {
    setupTransactionWithOutcome('oversold');
    jest
      .spyOn(service, 'getOrderById')
      .mockResolvedValueOnce(pendingOrderDto)
      .mockResolvedValueOnce(oversoldOrderDto)
      .mockResolvedValueOnce(refundedOrderDto);

    const result = await service.markOrderPaidIfPending('order-1', {
      stripeSessionId: 'cs_test_abc',
    });

    expect(result?.status).toBe('refunded');
    expect(mockStripe.createRefundForSession).toHaveBeenCalledWith(
      'cs_test_abc',
      2800,
    );
    expect(mockQueue.add).not.toHaveBeenCalledWith(
      'payment.notify',
      expect.any(Object),
      expect.any(Object),
    );
  });

  it('does not enqueue duplicate payment.notify when already paid (idempotent)', async () => {
    jest.spyOn(service, 'getOrderById').mockResolvedValue(paidOrderDto);

    const result = await service.markOrderPaidIfPending('order-1', {
      stripeSessionId: 'cs_x',
    });

    expect(result?.status).toBe('paid');
    expect(mockDb.transaction).not.toHaveBeenCalled();
    expect(mockQueue.add).not.toHaveBeenCalled();
  });

  it('retries oversold refund when webhook replays (oversold without refund yet)', async () => {
    jest
      .spyOn(service, 'getOrderById')
      .mockResolvedValueOnce(oversoldOrderDto)
      .mockResolvedValueOnce(refundedOrderDto);

    const result = await service.markOrderPaidIfPending('order-1', {
      stripeSessionId: 'cs_test_abc',
    });

    expect(mockStripe.createRefundForSession).toHaveBeenCalled();
    expect(result?.status).toBe('refunded');
  });

  it('does not refund twice when already refunded (idempotent)', async () => {
    jest.spyOn(service, 'getOrderById').mockResolvedValue(refundedOrderDto);

    const result = await service.markOrderPaidIfPending('order-1', {});

    expect(result?.status).toBe('refunded');
    expect(mockDb.transaction).not.toHaveBeenCalled();
    expect(mockStripe.createRefundForSession).not.toHaveBeenCalled();
  });
});
