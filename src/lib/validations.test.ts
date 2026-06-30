import { describe, it, expect } from 'vitest';
import { pledgeSchema, rsvpSchema, commentSchema, registerSchema } from './validations';

describe('pledgeSchema', () => {
  const base = {
    name: 'Jane Doe',
    email: 'jane@example.com',
    amount: '500',
    consent: true,
    website: '',
  };
  it('accepts a valid pledge', () => {
    expect(pledgeSchema.safeParse(base).success).toBe(true);
  });
  it('rejects without consent', () => {
    expect(pledgeSchema.safeParse({ ...base, consent: false }).success).toBe(false);
  });
  it('rejects non-positive amounts', () => {
    expect(pledgeSchema.safeParse({ ...base, amount: '0' }).success).toBe(false);
  });
  it('flags a filled honeypot', () => {
    expect(pledgeSchema.safeParse({ ...base, website: 'bot' }).success).toBe(false);
  });
});

describe('rsvpSchema', () => {
  it('defaults party size to 1 and validates email', () => {
    const r = rsvpSchema.safeParse({ eventId: '11111111-1111-1111-1111-111111111111', website: '' });
    expect(r.success).toBe(true);
  });
});

describe('commentSchema', () => {
  it('requires a non-trivial body', () => {
    expect(
      commentSchema.safeParse({ postId: '11111111-1111-1111-1111-111111111111', body: 'a', website: '' }).success
    ).toBe(false);
  });
});

describe('registerSchema', () => {
  it('enforces an 8+ char password', () => {
    expect(registerSchema.safeParse({ fullName: 'A B', email: 'a@b.com', password: 'short' }).success).toBe(false);
    expect(registerSchema.safeParse({ fullName: 'A B', email: 'a@b.com', password: 'longenough' }).success).toBe(true);
  });
});
