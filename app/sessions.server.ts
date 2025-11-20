import { env } from "cloudflare:workers";
import { createCookieSessionStorage } from "react-router";

type SessionData = {
  username: string;
  password: string;
};

type SessionFlashData = {
  error: string;
};

const secret = await env.SESSION_SECRET;

const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlashData>({
    // a Cookie from `createCookie` or the CookieOptions to create one
    cookie: {
      name: "__session",
      httpOnly: true,
      maxAge: 24 * 60 * 60,
      path: "/",
      sameSite: true,
      secrets: [secret],
      secure: true,
    },
  });

export { getSession, commitSession, destroySession };
