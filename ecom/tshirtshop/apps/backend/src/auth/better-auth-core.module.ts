import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { twoFactor, bearer, captcha } from 'better-auth/plugins';
import { NodePgDatabase } from 'drizzle-orm/node-postgres/driver';
import { Resend } from 'resend';
import { DatabaseModule } from '../database/database.module';
import { DATABASE_CONNECTION } from '../database/database-connection';
import { BETTER_AUTH_INSTANCE } from './constants';

@Module({
  imports: [DatabaseModule, ConfigModule],
  providers: [
    {
      provide: BETTER_AUTH_INSTANCE,
      useFactory: (database: NodePgDatabase, configService: ConfigService) => {
        const resendApiKey = configService.get('RESEND_API_KEY');
        /** Minimal interface for email sending; stub used when RESEND_API_KEY is missing */
        type EmailSender = { emails: { send: (opts: object) => Promise<unknown> } };
        const resend: EmailSender = resendApiKey
          ? new Resend(resendApiKey)
          : {
              emails: {
                send: async () => {
                  throw new Error(
                    'RESEND_API_KEY is required for email sending. Add it to .env (see .env.example). Get a free key at https://resend.com',
                  );
                },
              },
            };
        if (!resendApiKey) {
          console.warn(
            '[BetterAuth] RESEND_API_KEY not set. Email verification and password reset will fail. Add it to .env for production.',
          );
        }
        if (!configService.get('RECAPTCHA_SECRET_KEY')) {
          console.warn(
            '[BetterAuth] RECAPTCHA_SECRET_KEY not set. Sign-up captcha disabled. Add it to .env for production.',
          );
        }
        const uiUrl = configService.get('UI_URL') ?? 'http://localhost:3001';
        const port = configService.get('PORT') ?? '3000';
        const baseURL = `http://localhost:${port}`;

        return betterAuth({
          baseURL,
          database: drizzleAdapter(database, { provider: 'pg' }),

          emailAndPassword: {
            enabled: true,
            requireEmailVerification: true,
            sendResetPassword: async ({ user, url }) => {
              try {
                const from =
                  configService.get('EMAIL_FROM') ??
                  'TShirtShop <noreply@tshirtshop.com>';
                console.log(
                  `[Resend] Attempting to send password reset email to ${user.email} from ${from}`,
                );

                const urlObj = new URL(url);
                urlObj.searchParams.set(
                  'callbackURL',
                  `${uiUrl}/auth/reset-password`,
                );
                const resetUrl = urlObj.toString();

                const result = await resend.emails.send({
                  from,
                  to: user.email,
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
                  configService.get('EMAIL_FROM') ??
                  'DND Store <noreply@dndstore.com>';
                console.log(
                  `[Resend] Attempting to send verification email to ${user.email} from ${from}`,
                );

                const urlObj = new URL(url);
                urlObj.searchParams.set('callbackURL', uiUrl);
                const verificationUrl = urlObj.toString();

                const result = await resend.emails.send({
                  from,
                  to: user.email,
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
            google: {
              clientId: configService.get('GOOGLE_CLIENT_ID') ?? '',
              clientSecret: configService.get('GOOGLE_CLIENT_SECRET') ?? '',
            },
            facebook: {
              clientId: configService.get('FACEBOOK_CLIENT_ID') ?? '',
              clientSecret: configService.get('FACEBOOK_CLIENT_SECRET') ?? '',
            },
          },

          plugins: [
            twoFactor({
              issuer: 'TShirtShop',
            }),
            bearer(),
            ...(configService.get('RECAPTCHA_SECRET_KEY')
              ? [
                  captcha({
                    provider: 'google-recaptcha',
                    secretKey: configService.get('RECAPTCHA_SECRET_KEY')!,
                    endpoints: ['sign-up'],
                  }),
                ]
              : []),
          ],

          trustedOrigins: [uiUrl],

          session: {
            expiresIn: 60 * 60 * 24 * 7,
            updateAge: 60 * 60 * 24,
          },
        });
      },
      inject: [DATABASE_CONNECTION, ConfigService],
    },
  ],
  exports: [BETTER_AUTH_INSTANCE],
})
export class BetterAuthCoreModule {}
