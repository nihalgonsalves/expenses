import { nanoid } from 'nanoid';

export const getUserData = () => {
  const userId = nanoid(8);
  const name = `E2E ${userId}`;
  const email = `${userId}@example.com`;
  const password = nanoid(8);

  return { userId, name, email, password };
};
