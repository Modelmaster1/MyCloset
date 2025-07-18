"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import View from "./view";
import HomePage from "./HomePage";

export default function App() {
  return (
    <>
      <Authenticated>
        <View />
      </Authenticated>
      <Unauthenticated>
        <HomePage />
      </Unauthenticated>
    </>
  );
}
