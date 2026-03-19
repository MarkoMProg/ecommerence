import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { betterAuth } from 'better-auth';
import { openAPI } from 'better-auth/plugins';
import { createAuthMiddleware } from 'better-auth/api';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { twoFactor, bearer, captcha, admin } from 'better-auth/plugins';
import { createHash, randomBytes, randomUUID } from 'crypto';
import { and, eq, isNull } from 'drizzle-orm';
import { NodePgDatabase } from 'drizzle-orm/node-postgres/driver';
import { Resend } from 'resend';
import { DatabaseModule } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { BETTER_AUTH_INSTANCE } from './constants';
import { encrypt, decrypt, blindIndex, blindEmail } from './crypto';
import * as authSchema from './schema';

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [
    {
      provide: BETTER_AUTH_INSTANCE,
      useFactory: (database: NodePgDatabase, configService: ConfigService) => {
        // Fail fast: auth requires these for user creation (blind index + encryption).
        const blindSecret = configService.get<string>('BLIND_INDEX_SECRET');
        const encKey = configService.get<string>('ENCRYPTION_KEY');
        if (!blindSecret) {
          throw new Error(
            '[BetterAuth] BLIND_INDEX_SECRET must be set in .env. ' +
              "Generate: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
          );
        }
        if (!encKey || encKey.length !== 64) {
          throw new Error(
            '[BetterAuth] ENCRYPTION_KEY must be a 64-char hex string in .env. ' +
              "Generate: node -e \"console.log(require('crypto').randomBytes(32).toString('hex'))\"",
          );
        }

        const buildRefreshTokenValue = () =>
          randomBytes(48).toString('base64url');
        const buildTokenHash = (token: string) =>
          createHash('sha256').update(token).digest('hex');
        const refreshTokenTtlMs = 1000 * 60 * 60 * 24 * 14;

        const resendApiKey = configService.get<string>('RESEND_API_KEY');
        const resend = resendApiKey
          ? new Resend(resendApiKey)
          : {
              emails: {
                send: () =>
                  Promise.reject(
                    new Error(
                      'RESEND_API_KEY is required for email sending. Add it to .env (see .env.example). Get a free key at https://resend.com',
                    ),
                  ),
              },
            };
        if (!resendApiKey) {
          console.warn(
            '[BetterAuth] RESEND_API_KEY not set. Email verification and password reset will fail. Add it to .env for production.',
          );
        }

        if (!configService.get('RECAPTCHA_SECRET_KEY')) {
          const isProd = configService.get('NODE_ENV') === 'production';
          console.warn(
            `[BetterAuth] RECAPTCHA_SECRET_KEY not set. Sign-up captcha disabled.${isProd ? ' REQUIRED for production (AUTH-008).' : ' Add it to .env for production.'}`,
          );
        }
        const uiUrl =
          configService.get<string>('UI_URL') ?? 'http://localhost:3001';
        const port = configService.get<string>('PORT') ?? '3000';
        const configuredBaseUrl = configService.get<string>(
          'BETTER_AUTH_BASE_URL',
        );
        const useHttps = ['1', 'true'].includes(
          (configService.get<string>('USE_HTTPS') ?? '').toLowerCase(),
        );
        const protocol = useHttps ? 'https' : 'http';
        const baseURL =
          configuredBaseUrl ?? `${protocol}://localhost:${port}/api/auth`;

        const persistRefreshToken = async (
          userId: string,
          sessionId: string,
        ) => {
          const token = buildRefreshTokenValue();
          const now = new Date();
          const expiresAt = new Date(now.getTime() + refreshTokenTtlMs);

          await database.insert(authSchema.manualRefreshToken).values({
            id: randomUUID(),
            userId,
            sessionId,
            tokenHash: buildTokenHash(token),
            expiresAt,
            createdAt: now,
          });

          return { token, expiresAt };
        };

        const rotateRefreshToken = async (
          oldRefreshToken: string | undefined,
          newSessionId: string | undefined,
        ) => {
          const token = oldRefreshToken?.trim();
          if (!token) {
            return null;
          }

          const tokenHash = buildTokenHash(token);
          const [existing] = await database
            .select()
            .from(authSchema.manualRefreshToken)
            .where(eq(authSchema.manualRefreshToken.tokenHash, tokenHash))
            .limit(1);

          if (!existing || existing.usedAt) {
            return null;
          }

          if (existing.expiresAt.getTime() <= Date.now()) {
            return null;
          }

          const [consumed] = await database
            .update(authSchema.manualRefreshToken)
            .set({ usedAt: new Date() })
            .where(
              and(
                eq(authSchema.manualRefreshToken.id, existing.id),
                isNull(authSchema.manualRefreshToken.usedAt),
              ),
            )
            .returning({
              userId: authSchema.manualRefreshToken.userId,
            });

          if (!consumed) {
            return null;
          }

          const sessionIdForNewToken = newSessionId || existing.sessionId;
          if (!sessionIdForNewToken) {
            return null;
          }

          return persistRefreshToken(consumed.userId, sessionIdForNewToken);
        };

        const invalidateSession = async (sessionId: string | undefined) => {
          if (!sessionId) {
            return;
          }

          await database
            .delete(authSchema.session)
            .where(eq(authSchema.session.id, sessionId));
        };

        return betterAuth({
          baseURL,
          basePath: '/api/auth',
          secret: configService.get<string>('BETTER_AUTH_SECRET'),
          appName: 'Darkloom',
          database: drizzleAdapter(database, {
            provider: 'pg',
            schema: authSchema,
          }),

          emailAndPassword: {
            enabled: true,
            requireEmailVerification: true,
            sendResetPassword: async ({ user, url }) => {
              try {
                const from =
                  configService.get<string>('EMAIL_FROM') ??
                  'Darkloom <noreply@lugriv.com>';
                // email field in DB is the blind index — decrypt the real address
                const u = user as { emailEncrypted?: string; email?: string };
                const realEmail = u.emailEncrypted
                  ? decrypt(u.emailEncrypted)
                  : u.email;
                if (!realEmail) {
                  throw new Error('User email required for password reset');
                }
                console.log(
                  `[Resend] Attempting to send password reset email to ${realEmail} from ${from}`,
                );

                const urlObj = new URL(url);
                urlObj.searchParams.set(
                  'callbackURL',
                  `${uiUrl}/auth/reset-password`,
                );
                const resetUrl = urlObj.toString();

                const result = await resend.emails.send({
                  from,
                  to: realEmail,
                  subject:
                    'Reset your password for the DND store, we still have much to explore together!',
                  html: `
                    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
                      <h2>Password Reset</h2>
                      <p>Click below to reset your password:</p>
                      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
                        Reset Password
                      </a>
                      <p style="color:#666;font-size:13px;margin-top:24px;">
                        This link expires in 1 hour. If you didn't request this, ignore this email.
                      </p>
                    </div>`,
                });
                console.log(`Password reset email sent successfully:`, result);
              } catch (error) {
                console.error(' Failed to send reset password email:', error);
                throw error;
              }
            },
          },

          emailVerification: {
            sendOnSignUp: true,
            sendVerificationEmail: async ({ user, url }) => {
              try {
                const from =
                  configService.get<string>('EMAIL_FROM') ??
                  'Darkloom <noreply@lugriv.com>';
                // email field in DB is the blind index — decrypt the real address
                const u = user as { emailEncrypted?: string; email?: string };
                const realEmail = u.emailEncrypted
                  ? decrypt(u.emailEncrypted)
                  : u.email;
                if (!realEmail) {
                  throw new Error('User email required for verification');
                }
                console.log(
                  `[Resend] Attempting to send verification email to ${realEmail} from ${from}`,
                );

                const urlObj = new URL(url);
                urlObj.searchParams.set('callbackURL', uiUrl);
                const verificationUrl = urlObj.toString();

                const result = await resend.emails.send({
                  from,
                  to: realEmail,
                  subject: 'Welcome to the DND store! Please verify your email',
                  html: `
                    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;">
                      <h2>Welcome to the DND store!</h2>
                      <p>Please verify your email address:</p>
                      <a href="${verificationUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;">
                        Verify Email
                      </a>
                      <p style="color:#666;font-size:13px;margin-top:24px;">
                        If you didn't create an account, ignore this email.
                      </p>
                    </div>`,
                });
                console.log(` Verification email sent successfully:`, result);
              } catch (error) {
                console.error(' Failed to send verification email:', error);
                throw error;
              }
            },
          },

          socialProviders: {
            ...(configService.get<string>('GOOGLE_CLIENT_ID') &&
            configService.get<string>('GOOGLE_CLIENT_SECRET')
              ? {
                  google: {
                    clientId: configService.get<string>('GOOGLE_CLIENT_ID')!,
                    clientSecret: configService.get<string>(
                      'GOOGLE_CLIENT_SECRET',
                    )!,
                  },
                }
              : {}),
            ...(configService.get<string>('FACEBOOK_CLIENT_ID') &&
            configService.get<string>('FACEBOOK_CLIENT_SECRET')
              ? {
                  facebook: {
                    clientId: configService.get<string>('FACEBOOK_CLIENT_ID')!,
                    clientSecret: configService.get<string>(
                      'FACEBOOK_CLIENT_SECRET',
                    )!,
                  },
                }
              : {}),
          },

          user: {
            additionalFields: {
              emailEncrypted: {
                type: 'string',
                required: false,
                input: false,
                // returned:true is required for Better Auth's adapter to include
                // the hook value in the INSERT. The guard strips it before sending to clients.
                returned: true,
              },
              emailIndex: {
                type: 'string',
                required: false,
                input: false,
                // Same — must be true for the hook value to reach the DB column.
                returned: true,
              },
            },
          },

          databaseHooks: {
            user: {
              create: {
                before: (user) =>
                  Promise.resolve({
                    data: {
                      ...user,
                      emailEncrypted: encrypt(user.email),
                      emailIndex: blindIndex(user.email),
                      // Store the blind index as a valid email-shaped token so that
                      // Better Auth's internal Zod email-format validation passes.
                      // Format: {hmac-hex}@blind.index
                      email: blindEmail(user.email),
                      name: encrypt(user.name),
                    },
                  }),
              },
              update: {
                before: (user) =>
                  Promise.resolve({
                    data: {
                      ...user,
                      ...(user.email && {
                        emailEncrypted: encrypt(user.email),
                        emailIndex: blindIndex(user.email),
                        email: blindEmail(user.email),
                      }),
                      ...(user.name && { name: encrypt(user.name) }),
                    },
                  }),
              },
            },
          },

          plugins: [
            openAPI(),
            twoFactor({
              issuer: 'Darkloom',
            }),
            bearer(),
            admin({
              defaultRole: 'user',
            }),
            ...(configService.get<string>('RECAPTCHA_SECRET_KEY')
              ? [
                  captcha({
                    provider: 'google-recaptcha',
                    secretKey: configService.get<string>(
                      'RECAPTCHA_SECRET_KEY',
                    )!,
                    endpoints: ['sign-up'],
                  }),
                ]
              : []),
          ],

          hooks: {
            /**
             * Blind-index the email on any Better Auth HTTP route that accepts
             * an email as input for a DB lookup.  This covers direct client
             * calls that bypass our custom /api/v1/auth/* endpoints.
             * Note: sign-up is handled entirely via databaseHooks.user.create.before.
             */
            before: createAuthMiddleware((ctx) => {
              const emailLookupPaths = [
                '/sign-in/email',
                '/forget-password',
                '/request-password-reset',
              ];
              if (
                emailLookupPaths.includes(ctx.path) &&
                ctx.body &&
                typeof (ctx.body as Record<string, unknown>).email === 'string'
              ) {
                (ctx.body as Record<string, unknown>).email = blindEmail(
                  (ctx.body as Record<string, unknown>).email as string,
                );
              }
              return Promise.resolve();
            }),

            after: createAuthMiddleware(async (ctx) => {
              const newSession = ctx.context.newSession;
              if (!newSession?.session?.userId) {
                if (ctx.path !== '/get-session') {
                  return;
                }

                const sessionDataCookieName =
                  ctx.context.authCookies.sessionData.name;
                const setCookieHeader =
                  ctx.context.responseHeaders?.get('set-cookie') ?? '';
                const cacheCookieRefreshed = setCookieHeader
                  .toLowerCase()
                  .includes(`${sessionDataCookieName.toLowerCase()}=`);

                if (!cacheCookieRefreshed) {
                  return;
                }

                const ctxSession = ctx.context as {
                  session?: { id?: string };
                };
                const currentSession = ctxSession.session;
                const currentSessionId = currentSession?.id;

                const oldRefreshToken =
                  ctx.getCookie('refresh_token') ?? undefined;
                const rotated = await rotateRefreshToken(
                  oldRefreshToken,
                  currentSessionId,
                );
                if (!rotated) {
                  const authCookies = ctx.context.authCookies as {
                    sessionToken?: { name: string };
                    sessionData?: { name: string };
                  };

                  await invalidateSession(currentSessionId);

                  ctx.setCookie('refresh_token', '', {
                    httpOnly: true,
                    sameSite: 'lax',
                    secure: useHttps,
                    path: '/',
                    maxAge: 0,
                  });

                  if (authCookies.sessionToken?.name) {
                    ctx.setCookie(authCookies.sessionToken.name, '', {
                      httpOnly: true,
                      sameSite: 'lax',
                      secure: useHttps,
                      path: '/',
                      maxAge: 0,
                    });
                  }

                  if (authCookies.sessionData?.name) {
                    ctx.setCookie(authCookies.sessionData.name, '', {
                      httpOnly: true,
                      sameSite: 'lax',
                      secure: useHttps,
                      path: '/',
                      maxAge: 0,
                    });
                  }

                  return;
                }

                ctx.setCookie('refresh_token', rotated.token, {
                  httpOnly: true,
                  sameSite: 'lax',
                  secure: useHttps,
                  path: '/',
                  expires: rotated.expiresAt,
                });
                return;
              }

              const { token, expiresAt } = await persistRefreshToken(
                newSession.session.userId,
                newSession.session.id,
              );

              ctx.setCookie('refresh_token', token, {
                httpOnly: true,
                sameSite: 'lax',
                secure: useHttps,
                path: '/',
                expires: expiresAt,
              });
            }),
          },

          trustedOrigins: [uiUrl],

          session: {
            expiresIn: 60 * 60 * 24 * 2,
            updateAge: 60 * 60 * 24,
            cookieCache: {
              enabled: true,
              maxAge: 60 * 5,
              strategy: 'jwt',
            },
          },
        });
      },
      inject: [DATABASE_CONNECTION, ConfigService],
    },
  ],
  exports: [BETTER_AUTH_INSTANCE],
})
export class BetterAuthCoreModule {}
