import { SignInButton } from "@clerk/clerk-react";
import { Button } from "./components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { Package, Plane, PlusCircle } from "lucide-react";

export default function HomePage() {
  return (
    <div
      className="relative flex flex-col items-center justify-center min-h-screen bg-cover bg-center text-white p-8"
      style={{
        backgroundImage:
          "url('https://o22hkooeka.ufs.sh/f/lPGe37SChSc8wq5t7FYCXwJlf4qYdAi9BK0UpnWEvSs75CxP')",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/80 z-0" style={{backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)"}} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center w-full h-full">
        <header className="text-center mb-16">
          <h1 className="text-6xl font-extrabold mb-4 tracking-tight">
            MyCloset
          </h1>
          <p className="text-xl text-neutral-300 max-w-2xl mx-auto">
            Your digital closet for effortless packing and organization. Never
            lose track of an item again.
          </p>
        </header>

        <main className="w-full max-w-5xl">
          <section className="grid md:grid-cols-3 gap-8 text-center mb-16">
            <Card className="bg-neutral-900/70 backdrop-blur-sm border-neutral-700 rounded-none">
              <CardHeader>
                <CardTitle className="flex flex-col items-center gap-3">
                  <PlusCircle className="h-10 w-10 text-green-400" />
                  <span className="text-xl font-semibold">
                    Add Your Clothes
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-300">
                  Easily catalog your entire wardrobe. Add details like brand,
                  type, color, and a photo for each item.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-neutral-900/70 backdrop-blur-sm border-neutral-700 rounded-none">
              <CardHeader>
                <CardTitle className="flex flex-col items-center gap-3">
                  <Package className="h-10 w-10 text-blue-400" />
                  <span className="text-xl font-semibold">
                    Organize Your Closet
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-300">
                  Keep track of where each item is located, whether it's in
                  your wardrobe, in the laundry, or packed away.
                </p>
              </CardContent>
            </Card>
            <Card className="bg-neutral-900/70 backdrop-blur-sm border-neutral-700 rounded-none">
              <CardHeader>
                <CardTitle className="flex flex-col items-center gap-3">
                  <Plane className="h-10 w-10 text-purple-400" />
                  <span className="text-xl font-semibold">Pack for Trips</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-neutral-300">
                  Create smart packing lists for your travels. The app helps
                  you remember everything you need.
                </p>
              </CardContent>
            </Card>
          </section>

          <section className="text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="text-neutral-300 mb-8">
              Sign in to start managing your closet like a pro. It's free!
            </p>
            <SignInButton mode="modal">
              <Button
                size="lg"
                className="rounded-none text-lg px-8 py-6"
              >
                Sign In & Get Started
              </Button>
            </SignInButton>
          </section>
        </main>

        <footer className="mt-16 text-center text-neutral-400">
          <p>&copy; 2025 MyCloset. No idea how to reserve rights.</p>
        </footer>
      </div>
    </div>
  );
}