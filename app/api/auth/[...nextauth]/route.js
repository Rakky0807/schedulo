/**
 * app/api/auth/[...nextauth]/route.js
 * NextAuth v5 route handler — re-exports GET and POST from root auth.js
 */

import { handlers } from "@/auth";

export const { GET, POST } = handlers;
