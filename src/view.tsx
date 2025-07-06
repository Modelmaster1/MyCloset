import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import NewItemForm from "./NewItem";
import { useClerk, useUser } from "@clerk/clerk-react";
import { Button } from "./components/ui/button";
import { DotIcon } from "lucide-react";
import { useState } from "react";

interface ClothingInfoItem {
  _id: string;
  _creationTime: number;
  brand: string;
  types: string[];
  colors: string[];
  pieces: ClothingPiece[];
  imageURL: string | null;
}

interface ClothingPiece {
  _id: string;
  _creationTime: number;
  currentLocation: {
    _id: Id<"locations">;
    name: string;
  };
  locationHistory: Id<"locationLogs">[];
  lost?: number;
}

export default function View() {
  const items = useQuery(api.clothingItems.list);
  const locations = useQuery(api.locations.list);
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const [searchTerm, setSearchTerm] = useState("");

  if (!items || !locations || !user) {
    return <div>Loading...</div>;
  }

  const filteredItems = items.filter((item) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();
    const searchWords = lowerCaseSearchTerm.split(" ").filter(Boolean); // Split by space and remove empty strings

    // If there's no search term, return all items
    if (searchWords.length === 0) {
      return true;
    }

    // Check if all search words are present in any of the item's attributes
    return searchWords.every((word) => {
      // Check if the word is in the brand
      const brandMatches = item.brand.toLowerCase().includes(word);

      // Check if the word is in any of the types
      const typeMatches = item.types.some((type) =>
        type.toLowerCase().includes(word),
      );

      // Check if the word is in any of the colors
      const colorMatches = item.colors.some((color) =>
        color.toLowerCase().includes(word),
      );

      // The word must match at least one of the conditions
      return brandMatches || typeMatches || colorMatches;
    });
  });

  return (
    <div className="flex flex-col gap-5 p-5">
      <div className="flex flex-col gap-0">
        <div className="flex items-center justify-between">
          <div className="flex gap-1 items-center">
            <div className="cursor-pointer" onClick={() => openUserProfile()}>
              {user?.fullName}
            </div>
            <DotIcon />
            <Button
              onClick={() => signOut()}
              className="p-0 cursor-pointer"
              variant="link"
            >
              Logout
            </Button>
          </div>
          <NewItemForm />
        </div>
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="text-8xl font-light uppercase focus:outline-none"
          placeholder="My Closet"
        />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 flex-wrap">
        {filteredItems.map((item) => (
          <ItemView key={item._id} item={item} />
        ))}
      </div>
    </div>
  );
}

function ItemView({ item }: { item: ClothingInfoItem }) {

  const groupedLocations: { [locationName: string]: number } = {};
  item.pieces.forEach((piece) => {
    const locationName = piece.currentLocation.name;
    groupedLocations[locationName] = (groupedLocations[locationName] || 0) + 1;
  });

  // Convert grouped locations to an array of displayable strings
  const locationStrings = Object.entries(groupedLocations).map(
    ([locationName, count]) => {
      return count === 1
        ? `1x at ${locationName}`
        : `${count}x at ${locationName}`;
    },
  );

  return (
    <div className="flex flex-col gap-2 w-full relative mb-4">
      <img
        src={item.imageURL ?? ""}
        alt={item.brand}
        className="h-62 w-full object-cover"
      />
      <div className="bg-black bg-opacity-50 text-white p-2">
        <p className="text-sm">{item.brand}</p>
        <p className="text-xs">{item.types.join(", ")}</p>
        <div className="mt-2">
          {locationStrings.map((locationString, index) => (
            <p key={index} className="text-xs">
              {locationString}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
