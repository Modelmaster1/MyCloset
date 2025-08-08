"use client";

import { Authenticated, Unauthenticated } from "convex/react";
import View from "./view";
import LandingPage from "./HomeView";

export default function App() {
  return (
    <>
      <Authenticated>
        <View />
      </Authenticated>
      <Unauthenticated>
        <LandingPage />
      </Unauthenticated>
    </>
  );
}
