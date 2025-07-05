"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import { SignInButton, UserButton } from "@clerk/clerk-react";
import ClothingItemForm from "./ClothingForm";
import View from "./view";

export default function App() {
  return (
    <>
      <Authenticated>
        <UserButton />
        <div>Logged in</div>
        <ClothingItemForm />
        <View />
      </Authenticated>
      <Unauthenticated>
        <SignInButton mode="modal" />
      </Unauthenticated>
    </>
  );
}
