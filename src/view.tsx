import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import NewItemForm, { SearchableCreateSelect } from "./NewItem";
import { useClerk, useUser } from "@clerk/clerk-react";
import { Button } from "./components/ui/button";
import {
  ArrowRightIcon,
  DotIcon,
  EyeIcon,
  LoaderCircleIcon,
} from "lucide-react";
import { Dispatch, SetStateAction, useState } from "react";
import DetailView from "./detailView";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import { Color } from "convex/schema";

export interface ClothingInfoItem {
  _id: string;
  _creationTime: number;
  brand: string;
  types: string[];
  colors: Color[];
  pieces: ClothingPiece[];
  imageURL: string | null;
}

export interface ClothingPiece {
  _id: Id<"clothingPieces">;
  _creationTime: number;
  currentLocation: {
    _id: Id<"locations">;
    name: string;
  };
  info: Id<"clothingInfoItems">;
  locationHistory: Id<"locationLogs">[];
  lost?: number;
}

export default function View() {
  const [itemsToBeMoved, setItemsToBeMoved] = useState<ClothingPiece[]>([]);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingInfoItem | null>(
    null,
  );
  const [loading, setLoading] = useState(false);
  const items = useQuery(api.clothingItems.list);
  const locations = useQuery(api.locations.list);
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState<Id<"locations"> | null>(null);
  const createLocation = useMutation(api.locations.create);
  const movePieces = useMutation(api.clothingItems.move);

  function handleSelectItem(item: ClothingInfoItem) {
    setSelectedItem(item);
    setOpenDetail(true);
  }

  async function handleMovePieces() {
    setLoading(true);
    if (!location) {
      setLoading(false);
      return;
    }
    await movePieces({
      pieces: itemsToBeMoved.map((piece) => ({
        _id: piece._id,
        locationHistory: piece.locationHistory,
      })),
      newLocation: location,
    });

    setItemsToBeMoved([]);
    setLoading(false);
  }

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
    <div className="relative max-h-screen">
      <div className="flex flex-col gap-5 p-5 max-h-screen overflow-auto">
        {selectedItem && (
          <DetailView
            open={openDetail}
            setOpen={setOpenDetail}
            item={selectedItem}
          />
        )}
        <div className="flex flex-col gap-0">
          <div className="flex items-center justify-between">
            <div className="flex gap-0 items-center">
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 flex-wrap mb-40">
          {filteredItems.map((item) => (
            <ItemView
              itemsToBeMoved={itemsToBeMoved}
              setItemsToBeMoved={setItemsToBeMoved}
              selectItem={handleSelectItem}
              key={item._id}
              item={item}
            />
          ))}
        </div>
      </div>

      {itemsToBeMoved.length > 0 && (
        <div className="absolute bottom-0 left-0 p-2 bg-neutral-800 w-full">
          <div className="flex items-center gap-2 justify-end">
            <div className="flex gap-2 max-w-full overflow-auto">
              {itemsToBeMoved.map((item) => {
                const info = items.find((i) => i._id === item.info);
                if (!info) return null; // should never happen
                return (
                  <div key={item._id} className="flex gap-2 items-center">
                    <img
                      src={info.imageURL ?? ""}
                      alt={info.brand}
                      className="h-8 w-8 rounded-sm object-cover"
                    />
                  </div>
                );
              })}
            </div>
            <SearchableCreateSelect
              options={
                locations
                  ? locations.map((location) => ({
                      value: location._id,
                      label: location.name,
                    }))
                  : [{ value: "", label: "loading..." }]
              }
              value={location ?? ""}
              onValueChange={(value) => {
                setLocation(value as Id<"locations"> | null);
              }}
              placeholder="Select a location..."
              emptyMessage="No location found."
              onCreateNew={async (newLocName) => {
                if (newLocName.trim() === "") return;
                const locId = await createLocation({ name: newLocName });
                setLocation(locId);
              }}
            />
            <Button
              variant="default"
              onClick={handleMovePieces}
              disabled={loading}
            >
              {loading ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                `Move ${itemsToBeMoved.length} item${itemsToBeMoved.length > 1 ? "s" : ""}`
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function ItemView({
  item,
  selectItem,
  itemsToBeMoved,
  setItemsToBeMoved,
}: {
  item: ClothingInfoItem;
  selectItem: (item: ClothingInfoItem) => void;
  itemsToBeMoved: ClothingPiece[];
  setItemsToBeMoved: Dispatch<SetStateAction<ClothingPiece[]>>;
}) {
  const groupedLocations: { [locationName: string]: number } = {};
  item.pieces.forEach((piece) => {
    const locationName = piece.currentLocation.name;
    groupedLocations[locationName] = (groupedLocations[locationName] || 0) + 1;
  });

  const [isHovered, setIsHovered] = useState(false);

  // Convert grouped locations to an array of displayable strings
  const locationStrings = Object.entries(groupedLocations).map(
    ([locationName, count]) => {
      return count === 1
        ? `1x at ${locationName}`
        : `${count}x at ${locationName}`;
    },
  );

  const uniqueLocData = Object.entries(groupedLocations).map(
    ([locationName, count]) => {
      return {
        name: locationName,
        count: count,
      };
    },
  );

  function addToMoveItems(locName: string) {
    const newPiece = item.pieces.find(
      (piece) =>
        piece.currentLocation.name === locName &&
        !itemsToBeMoved.some((m) => m._id === piece._id),
    );

    if (newPiece) {
      setItemsToBeMoved([...itemsToBeMoved, newPiece]);
    }
  }

  function removeFromMoveItems(locName: string) {
    const indexToRemove = itemsToBeMoved.findIndex(
      (obj) => obj.currentLocation.name === locName && obj.info === item._id,
    );

    if (indexToRemove !== -1) {
      const newItems = [...itemsToBeMoved];
      newItems.splice(indexToRemove, 1);
      setItemsToBeMoved(newItems);
    }
  }

  function checkIfCanMove(locName: string, available: number) {
    const alreadyMoved = itemsToBeMoved.filter(
      (obj) => obj.currentLocation.name === locName && obj.info === item._id,
    ).length;
    return available > alreadyMoved;
  }

  return (
    <div className="flex flex-col gap-2 w-full relative mb-4">
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={item.imageURL ?? ""}
          alt={item.brand}
          className="h-62 w-full object-cover"
        />
        {isHovered && (
          <div className="absolute top-0 p-2 h-full w-full bg-black/50">
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => selectItem(item)}
                  variant="ghost"
                  className="rounded-none"
                >
                  View Details <EyeIcon />
                </Button>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" className="rounded-none">
                      Move <ArrowRightIcon />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent>
                    {uniqueLocData.map((data, index) => (
                      <div
                        key={data.name + index}
                        className="grid w-full items-center gap-3 mt-4"
                      >
                        <Label htmlFor="amount">
                          {data.name} ({data.count} available)
                        </Label>
                        <div className="flex items-center gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => removeFromMoveItems(data.name)}
                          >
                            -
                          </Button>
                          <Input
                            type="number"
                            id="amount"
                            value={
                              itemsToBeMoved.filter(
                                (obj) =>
                                  obj.currentLocation.name === data.name &&
                                  obj.info === item._id,
                              ).length
                            }
                            className="w-20 text-center"
                            min="0"
                            max={data.count}
                            readOnly
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            disabled={!checkIfCanMove(data.name, data.count)}
                            onClick={() => addToMoveItems(data.name)}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                    ))}
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>
        )}
      </div>
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
