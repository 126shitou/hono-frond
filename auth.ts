import NextAuth from "next-auth"
import Google from "next-auth/providers/google";
import { customError, customSuccess } from "./lib/utils/log";
import { handleAuthCallback } from "./actions/auth";

export const { handlers, signIn, signOut, auth } = NextAuth({
    trustHost: true,
    providers: [Google({
        clientId: process.env.AUTH_GOOGLE_ID!,
        clientSecret: process.env.AUTH_GOOGLE_SECRET!,
    })],
    callbacks: {
        async signIn({ user, account, profile, email, credentials }) {
            let newUSer = null;
            try {

                const result = await handleAuthCallback({
                    type: account?.type || 'oidc',
                    account,
                    user,
                });

                customError(`signInBack response: ${JSON.stringify(result)}`);

                if (!result.success) {
                    customError(`auth.ts > signIn result ${result.message}`);
                    return true;
                }

                newUSer = result.data;

            } catch (error) {
                customError(`auth.ts > signIn error: ${error}`);
                // 即使出错也允许登录继续
                return true;
            }
            if (newUSer) {
                customSuccess(
                    "auth.ts > signIn newUSer success·" + JSON.stringify(newUSer)
                );
                // 修改user对象的属性，而不是重新赋值
                user.id = newUSer.sid; // 使用数据库中的sid作为id
                user.name = newUSer.name;
                user.email = newUSer.email;
                user.image = newUSer.avatar;
            }
            return true;
        },
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
                token.email = user.email;
                token.name = user.name;
                token.image = user.image;
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.email = token.email as string;
                session.user.name = token.name as string;
                session.user.image = token.image as string;
            }
            return session;
        },
    },
    session: {
        strategy: "jwt",

    },
    debug: process.env.NODE_ENV === "development",

})