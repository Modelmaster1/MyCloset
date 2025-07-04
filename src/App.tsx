"use client";

import {
  Authenticated,
  Unauthenticated,
} from "convex/react";
import { SignInButton, UserButton } from "@clerk/clerk-react";

export default function App() {
  return (
    <>
      <Authenticated>
        <div>Logged in</div>
        <UserButton />
      </Authenticated>
      <Unauthenticated>
        <SignInButton mode="modal" />
      </Unauthenticated>
    </>
  );
}
