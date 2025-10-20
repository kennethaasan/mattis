import { createAuthClient } from "better-auth/react";

import { amzContentSha256FetchPlugin } from "@/lib/api/amz-content-sha256";

export const authClient = createAuthClient({
  fetchOptions: {
    plugins: [amzContentSha256FetchPlugin],
  },
});

export const { useSession, signIn, signOut } = authClient;
