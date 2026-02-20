import { validateShippingAddress } from '../dto/checkout.dto';

describe('Checkout DTO Validators (CHK-002)', () => {
  const validAddress = {
    fullName: 'Jane Doe',
    line1: '123 Main St',
    line2: 'Apt 4',
    city: 'Austin',
    stateOrProvince: 'TX',
    postalCode: '78701',
    country: 'US',
    phone: '+1 (555) 123-4567',
  };

  describe('validateShippingAddress', () => {
    it('should return no errors for valid US address', () => {
      const errors = validateShippingAddress(validAddress);
      expect(errors).toHaveLength(0);
    });

    it('should return no errors for valid CA address', () => {
      const errors = validateShippingAddress({
        ...validAddress,
        postalCode: 'K1A 0B1',
        country: 'CA',
      });
      expect(errors).toHaveLength(0);
    });

    it('should return no errors for valid GB address', () => {
      const errors = validateShippingAddress({
        ...validAddress,
        postalCode: 'SW1A 1AA',
        country: 'GB',
      });
      expect(errors).toHaveLength(0);
    });

    it('should error when shippingAddress is missing', () => {
      const errors = validateShippingAddress(undefined);
      expect(errors).toContainEqual({ field: 'shippingAddress', message: 'shippingAddress is required' });
    });

    it('should error when shippingAddress is not an object', () => {
      const errors = validateShippingAddress('invalid');
      expect(errors).toContainEqual({ field: 'shippingAddress', message: 'shippingAddress is required' });
    });

    it('should error on missing fullName', () => {
      const errors = validateShippingAddress({ ...validAddress, fullName: '' });
      expect(errors.some((e) => e.field === 'shippingAddress.fullName')).toBe(true);
    });

    it('should error on fullName exceeding max length', () => {
      const errors = validateShippingAddress({
        ...validAddress,
        fullName: 'x'.repeat(201),
      });
      expect(errors.some((e) => e.field === 'shippingAddress.fullName' && e.message.includes('exceed'))).toBe(true);
    });

    it('should error on missing line1', () => {
      const errors = validateShippingAddress({ ...validAddress, line1: '' });
      expect(errors.some((e) => e.field === 'shippingAddress.line1')).toBe(true);
    });

    it('should error on missing city', () => {
      const errors = validateShippingAddress({ ...validAddress, city: '' });
      expect(errors.some((e) => e.field === 'shippingAddress.city')).toBe(true);
    });

    it('should error on missing stateOrProvince', () => {
      const errors = validateShippingAddress({ ...validAddress, stateOrProvince: '' });
      expect(errors.some((e) => e.field === 'shippingAddress.stateOrProvince')).toBe(true);
    });

    it('should error on missing postalCode', () => {
      const errors = validateShippingAddress({ ...validAddress, postalCode: '' });
      expect(errors.some((e) => e.field === 'shippingAddress.postalCode')).toBe(true);
    });

    it('should error on missing country', () => {
      const errors = validateShippingAddress({ ...validAddress, country: '' });
      expect(errors.some((e) => e.field === 'shippingAddress.country')).toBe(true);
    });

    it('should error on unsupported country', () => {
      const errors = validateShippingAddress({
        ...validAddress,
        country: 'XX',
      });
      expect(errors.some((e) => e.field === 'shippingAddress.country' && e.message.includes('US, CA, GB'))).toBe(true);
    });

    it('should error on invalid US postal code', () => {
      const errors = validateShippingAddress({
        ...validAddress,
        country: 'US',
        postalCode: 'invalid',
      });
      expect(errors.some((e) => e.field === 'shippingAddress.postalCode' && e.message.includes('invalid'))).toBe(true);
    });

    it('should accept US 5+4 postal code', () => {
      const errors = validateShippingAddress({
        ...validAddress,
        postalCode: '78701-1234',
        country: 'US',
      });
      expect(errors).toHaveLength(0);
    });

    it('should error on invalid CA postal code', () => {
      const errors = validateShippingAddress({
        ...validAddress,
        country: 'CA',
        postalCode: '12345',
      });
      expect(errors.some((e) => e.field === 'shippingAddress.postalCode')).toBe(true);
    });

    it('should error on phone with too few digits', () => {
      const errors = validateShippingAddress({
        ...validAddress,
        phone: '(555) 123-4', // 7 digits, passes format
      });
      expect(errors.some((e) => e.field === 'shippingAddress.phone' && e.message.includes('10 digits'))).toBe(true);
    });

    it('should error on phone with invalid characters', () => {
      const errors = validateShippingAddress({
        ...validAddress,
        phone: '555-1234@5678',
      });
      expect(errors.some((e) => e.field === 'shippingAddress.phone')).toBe(true);
    });

    it('should accept address without phone', () => {
      const { phone, ...addr } = validAddress;
      const errors = validateShippingAddress(addr);
      expect(errors).toHaveLength(0);
    });

    it('should accept line2 empty', () => {
      const errors = validateShippingAddress({ ...validAddress, line2: '' });
      expect(errors).toHaveLength(0);
    });

    it('should error on fullName with control characters', () => {
      const errors = validateShippingAddress({
        ...validAddress,
        fullName: 'Jane\x00Doe',
      });
      expect(errors.some((e) => e.field === 'shippingAddress.fullName' && e.message.includes('invalid'))).toBe(true);
    });
  });
});
