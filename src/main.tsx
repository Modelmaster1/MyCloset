import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import "./index.css";
import App from "./App.tsx";
import { ErrorBoundary } from "./ErrorBoundary.tsx";
import { ThemeProvider } from "./components/theme-provider.tsx";
import { dark } from "@clerk/themes"; // <--- Add this import

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <ClerkProvider
        publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
        appearance={{
          baseTheme: dark,

          variables: {
            colorBackground: "#0A0A0A", // Your desired very dark background
            borderRadius: "0rem", // Set global border radius to 0
            // You might not need to change many other variables if dark theme provides good defaults
            // colorPrimary: "...", // Only override if you want a different accent color
            // colorText: "...",    // Only override if you want a different main text color
          },


  
          // Override specific elements. Only list what you want to change.
          elements: {
            card: {
              // Override the card background if it's not exactly what `colorBackground` sets for it,
              // or if you want a subtle difference for the card specifically.
              // Often, `colorBackground` in `variables` will handle this for `card`.
              backgroundColor: "#0A0A0A", // Ensure card background matches your desired dark color
              boxShadow: "none", // Optional: remove any default shadow the dark theme might apply
              borderRadius: "0rem", // Ensure card corners are sharp (redundant if variables.borderRadius is 0)
              border: "1px solid hsl(217.2 32.6% 17.5%)", // Optional: Add a subtle border
            },
            formFieldInput: {
              borderRadius: "0rem", // Ensure input corners are sharp
            },
            formButtonPrimary: {
              borderRadius: "0rem", // Ensure primary button corners are sharp
            },
            socialButtonsBlockButton: {
              borderRadius: "0rem", // Ensure social button corners are sharp
            },
            otpCodeField: {
              borderRadius: "0rem", // Ensure OTP field corners are sharp
            },
            userButtonAvatarBox: {
              borderRadius: "0rem", // For user button avatar
            },
            userButtonPopoverCard: {
              borderRadius: "0rem", // For user button popover
              backgroundColor: "hsl(222.2 84% 4.9%)", // Ensure it's dark
            }}
        }}
      >
        <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        <ThemeProvider
          defaultTheme="dark"
          storageKey="vite-ui-theme"
          attribute="class"
        >
          <App />
        </ThemeProvider>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    </ErrorBoundary>
  </StrictMode>,
);
