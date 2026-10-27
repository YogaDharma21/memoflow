export default {
  providers: [
    {
      // ponytail: set via `npx convex env set CLERK_JWT_ISSUER_DOMAIN <url>`
      domain: process.env.CLERK_JWT_ISSUER_DOMAIN,
      applicationID: "convex",
    },
  ],
};
