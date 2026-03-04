import {
  validateCreateReview,
  validateUpdateReview,
} from '../dto/review.dto';

describe('Review DTO Validators', () => {
  // ─── validateCreateReview ───────────────────────────────────────────────

  const validCreate = {
    rating: 4,
    body: 'Great quality t-shirt, fits perfectly!',
  };

  describe('validateCreateReview', () => {
    it('should return no errors for valid input (without title)', () => {
      const errors = validateCreateReview(validCreate);
      expect(errors).toHaveLength(0);
    });

    it('should return no errors for valid input (with title)', () => {
      const errors = validateCreateReview({ ...validCreate, title: 'Love it!' });
      expect(errors).toHaveLength(0);
    });

    // rating
    it('should error on missing rating', () => {
      const errors = validateCreateReview({ body: 'Nice shirt' });
      expect(errors.some((e) => e.field === 'rating')).toBe(true);
    });

    it('should error on rating less than 1', () => {
      const errors = validateCreateReview({ ...validCreate, rating: 0 });
      expect(errors.some((e) => e.field === 'rating')).toBe(true);
    });

    it('should error on rating greater than 5', () => {
      const errors = validateCreateReview({ ...validCreate, rating: 6 });
      expect(errors.some((e) => e.field === 'rating')).toBe(true);
    });

    it('should error on non-integer rating', () => {
      const errors = validateCreateReview({ ...validCreate, rating: 3.5 });
      expect(errors.some((e) => e.field === 'rating')).toBe(true);
    });

    it('should error on string rating', () => {
      const errors = validateCreateReview({ ...validCreate, rating: '4' as unknown as number });
      expect(errors.some((e) => e.field === 'rating')).toBe(true);
    });

    it('should accept rating of exactly 1', () => {
      const errors = validateCreateReview({ ...validCreate, rating: 1 });
      expect(errors).toHaveLength(0);
    });

    it('should accept rating of exactly 5', () => {
      const errors = validateCreateReview({ ...validCreate, rating: 5 });
      expect(errors).toHaveLength(0);
    });

    // title (optional)
    it('should error on title exceeding 255 characters', () => {
      const errors = validateCreateReview({ ...validCreate, title: 'x'.repeat(256) });
      expect(errors.some((e) => e.field === 'title')).toBe(true);
    });

    it('should accept title of exactly 255 characters', () => {
      const errors = validateCreateReview({ ...validCreate, title: 'x'.repeat(255) });
      expect(errors).toHaveLength(0);
    });

    it('should error when title is not a string', () => {
      const errors = validateCreateReview({ ...validCreate, title: 123 as unknown as string });
      expect(errors.some((e) => e.field === 'title')).toBe(true);
    });

    // body
    it('should error on missing body', () => {
      const errors = validateCreateReview({ rating: 3 });
      expect(errors.some((e) => e.field === 'body')).toBe(true);
    });

    it('should error on empty body', () => {
      const errors = validateCreateReview({ ...validCreate, body: '   ' });
      expect(errors.some((e) => e.field === 'body')).toBe(true);
    });

    it('should error on body exceeding 5000 characters', () => {
      const errors = validateCreateReview({ ...validCreate, body: 'x'.repeat(5001) });
      expect(errors.some((e) => e.field === 'body')).toBe(true);
    });

    it('should accept body of exactly 5000 characters', () => {
      const errors = validateCreateReview({ ...validCreate, body: 'x'.repeat(5000) });
      expect(errors).toHaveLength(0);
    });

    it('should error when body is not a string', () => {
      const errors = validateCreateReview({ ...validCreate, body: 42 as unknown as string });
      expect(errors.some((e) => e.field === 'body')).toBe(true);
    });

    // multiple errors
    it('should accumulate multiple errors', () => {
      const errors = validateCreateReview({});
      expect(errors.length).toBeGreaterThanOrEqual(2);
      expect(errors.some((e) => e.field === 'rating')).toBe(true);
      expect(errors.some((e) => e.field === 'body')).toBe(true);
    });
  });

  // ─── validateUpdateReview ───────────────────────────────────────────────

  describe('validateUpdateReview', () => {
    it('should error when no fields are provided', () => {
      const errors = validateUpdateReview({});
      expect(errors.some((e) => e.field === '_')).toBe(true);
    });

    // rating
    it('should return no errors when only valid rating provided', () => {
      const errors = validateUpdateReview({ rating: 3 });
      expect(errors).toHaveLength(0);
    });

    it('should error on rating less than 1', () => {
      const errors = validateUpdateReview({ rating: 0 });
      expect(errors.some((e) => e.field === 'rating')).toBe(true);
    });

    it('should error on rating greater than 5', () => {
      const errors = validateUpdateReview({ rating: 6 });
      expect(errors.some((e) => e.field === 'rating')).toBe(true);
    });

    it('should error on non-integer rating', () => {
      const errors = validateUpdateReview({ rating: 2.7 });
      expect(errors.some((e) => e.field === 'rating')).toBe(true);
    });

    it('should error on string rating', () => {
      const errors = validateUpdateReview({ rating: '5' as unknown as number });
      expect(errors.some((e) => e.field === 'rating')).toBe(true);
    });

    // title
    it('should return no errors when only valid title provided', () => {
      const errors = validateUpdateReview({ title: 'Updated title' });
      expect(errors).toHaveLength(0);
    });

    it('should error on title exceeding 255 characters', () => {
      const errors = validateUpdateReview({ title: 'x'.repeat(256) });
      expect(errors.some((e) => e.field === 'title')).toBe(true);
    });

    it('should error when title is not a string', () => {
      const errors = validateUpdateReview({ title: 999 as unknown as string });
      expect(errors.some((e) => e.field === 'title')).toBe(true);
    });

    // body
    it('should return no errors when only valid body provided', () => {
      const errors = validateUpdateReview({ body: 'Updated content' });
      expect(errors).toHaveLength(0);
    });

    it('should error on empty body when body is provided', () => {
      const errors = validateUpdateReview({ body: '   ' });
      expect(errors.some((e) => e.field === 'body')).toBe(true);
    });

    it('should error on body exceeding 5000 characters', () => {
      const errors = validateUpdateReview({ body: 'x'.repeat(5001) });
      expect(errors.some((e) => e.field === 'body')).toBe(true);
    });

    it('should error when body is not a string', () => {
      const errors = validateUpdateReview({ body: true as unknown as string });
      expect(errors.some((e) => e.field === 'body')).toBe(true);
    });

    // mixed valid updates
    it('should accept multiple valid fields together', () => {
      const errors = validateUpdateReview({ rating: 5, body: 'Amazing!' });
      expect(errors).toHaveLength(0);
    });
  });
});
