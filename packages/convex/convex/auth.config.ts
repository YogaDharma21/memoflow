// ponytail: Convex runtime injects process.env at deploy time without full node stdlib
declare const process: { env: Record<string, string | undefined> };

export default {
  providers: [
    {
      // ponytail: set via `npx convex env set CLERK_JWT_ISSUER_DOMAIN <url>`
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
