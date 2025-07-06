"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton } from "@clerk/clerk-react";
import View from "./view";

export default function App() {
  return (
    <>
      <Authenticated>
        <View />
      </Authenticated>
      <Unauthenticated>
        <SignInButton mode="modal" />
      </Unauthenticated>
    </>
  );
}