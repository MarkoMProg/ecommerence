import { decrypt } from './crypto';
import { user } from './schema';

type RawUser = typeof user.$inferSelect;

export function decryptUser(rawUser: RawUser & Record<string, unknown>) {
  return {
    ...rawUser,
    email: decrypt(rawUser.emailEncrypted),
    name: rawUser.name ? decrypt(rawUser.name) : null,
  };
}
