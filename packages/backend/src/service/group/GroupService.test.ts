import { describe, expect, it } from 'vitest';

import { nameFromEmail } from './GroupService';

describe('nameFromEmail', () => {
  it('returns a name', () => {
    (
      [
        ['hello@example.com', 'Hello'],
        ['hello.world@example.com', 'Hello World'],
        ['hello🤠world@example.com', 'Hello World'],
        ['hello_%#_world$2342foo_bar@example.com', 'Hello World Foo Bar'],
        ['fübar@example.com', 'F Bar'],
      ] as const
    ).forEach(([email, expectedName]) => {
      expect(nameFromEmail(email)).toBe(expectedName);
    });
  });
});
