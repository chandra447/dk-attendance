import "server-only";
import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
    tokenStore: "nextjs-cookie",
    urls: {
        forgotPassword: '/auth/forgot-password',
        passwordReset: '/auth/reset-password'
    }
});
