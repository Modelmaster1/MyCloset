import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import NewItemForm, { SearchableCreateSelect } from "./NewItem";
import { useClerk, useUser } from "@clerk/clerk-react";
import { Button } from "./components/ui/button";
import {
  DotIcon,
  LoaderCircleIcon,
  XIcon,
} from "lucide-react";
import { useState } from "react";
import DetailView from "./detailView";
import { Label } from "./components/ui/label";
import { Color } from "convex/schema";
import { Switch } from "./components/ui/switch";
import { ItemView } from "./lib/viewCom/itemView";
import { PackingListSelector } from "./lib/viewCom/packingListSelector";
import { PackingListInfo } from "./lib/viewCom/packingListInfo";
import { ConvertAlertScreen } from "./convertAlertScreen";

export interface ClothingInfoItem {
  _id: Id<"clothingInfoItems">;
  _creationTime: number;
  brand?: string;
  types: string[];
  colors: Color[];
  pieces: ClothingPiece[];
  imageURL: string | null;
  contentType?: string;
  storageId: Id<"_storage">;
}

export interface PackingList {
  _id: Id<"packingLists">;
  _creationTime: number;
  name: string;
  description?: string;
  departureDate?: number;
  packingLocation?: Id<"locations">;
  items: Id<"clothingPieces">[];
  expired?: boolean;
}

export interface ClothingPiece {
  _id: Id<"clothingPieces">;
  _creationTime: number;
  packed?: Id<"packingLists">;
  currentLocation: {
    _id: Id<"locations">;
    name: string;
  };
  info: Id<"clothingInfoItems">;
  locationHistory: Id<"locationLogs">[];
  lost?: number;
}

export default function View() {
  const [selectedItems, setSelectedItems] = useState<ClothingPiece[]>([]);
  const [openDetail, setOpenDetail] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ClothingInfoItem | null>(
    null,
  );
  const [packingListToMoveTo, setPackingListToMoveTo] =
    useState<PackingList | null>(null);
  const [selectedPackingList, setSelectedPackingList] =
    useState<PackingList | null>(null);
  const [loading, setLoading] = useState(false);
  const items = useQuery(api.clothingItems.list);
  const locations = useQuery(api.locations.list);

  const { user } = useUser();

  const { signOut, openUserProfile } = useClerk();

  const [searchTerm, setSearchTerm] = useState("");
  const [location, setLocation] = useState<Id<"locations"> | null>(null);
  const createLocation = useMutation(api.locations.create);
  const movePieces = useMutation(api.clothingItems.move);
  const packingLists = useQuery(api.packinglists.list, {});
  const addItemsToPackingList = useMutation(
    api.packinglists.addItemsToPackingList,
  );
  const packItems = useMutation(api.clothingItems.packPieces);
  const removeItemsFromPackingList = useMutation(
    api.packinglists.removeItemsFromPackingList,
  );
  const [filterLocation, setFilterLocation] = useState<Id<"locations"> | null>(
    null,
  );
  const [hidePacked, setHidePacked] = useState(false);
  const [nextAction, setNextAction] = useState<"move" | "addToPackingList">(
    "move",
  );

  const [nextActionInPackingList, setNextActionInPackingList] = useState<
    "pack" | "removeFromPackingList"
  >("pack");

  function deselectPackingList() {
    setSelectedPackingList(null);
  }

  function handleSelectItem(item: ClothingInfoItem) {
    setSelectedItem(item);
    setOpenDetail(true);
  }

  function updateSelectedPackingList(list: PackingList) {
    setSelectedPackingList(list);
  }

  async function handlePiecesAction() {
    setLoading(true);

    if (selectedPackingList) {
      if (nextActionInPackingList === "removeFromPackingList") {
        const newPackingList = await removeItemsFromPackingList({
          pieces: selectedItems.map((piece) => piece._id),
          packingList: selectedPackingList._id,
        });
        if (newPackingList) {
          setSelectedPackingList(newPackingList);
        }
      }
      if (
        selectedPackingList.packingLocation &&
        nextActionInPackingList === "pack"
      ) {
        await packItems({
          pieces: selectedItems.map((piece) => piece._id),
          packingList: selectedPackingList._id,
          packLocation: selectedPackingList.packingLocation,
        });
      } else if (
        nextActionInPackingList === "pack" &&
        !selectedPackingList.packingLocation
      ) {
        alert("Please select a packing location first");
      }
    }

    if (nextAction === "move" && location) {
      await movePieces({
        pieces: selectedItems.map((piece) => ({
          _id: piece._id,
          currentLocationId: piece.currentLocation._id,
          locationHistory: piece.locationHistory,
        })),
        newLocation: location,
      });
    }

    if (nextAction === "addToPackingList" && packingListToMoveTo) {
      const newPackingList = await addItemsToPackingList({
        items: selectedItems.map((piece) => piece._id),
        id: packingListToMoveTo._id,
      });
      if (newPackingList) {
        setSelectedPackingList(newPackingList);
      }
      setPackingListToMoveTo(null);
    }

    setSelectedItems([]);
    setLoading(false);
  }

  if (!items || !locations || !user) {
    return <div>Loading...</div>;
  }

  const filteredItems = items.filter((item) => {
    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    // Separate positive and negative search terms
    const positiveSearchWords = lowerCaseSearchTerm
      .split(" ")
      .filter((word) => word && !word.startsWith("!")); // Words that don't start with "!"
    
    const negativeSearchWords = lowerCaseSearchTerm
      .split(" ")
      .filter((word) => word && word.startsWith("!")) // Words that start with "!"
      .map((word) => word.substring(1)) // Remove the "!" prefix
      .filter((word) => word.length > 0); // Remove empty strings

    if (selectedPackingList) {
      const piecesInPackingList = item.pieces.filter((piece) =>
        selectedPackingList.items.some((pieceId) => pieceId === piece._id),
      );

      if (piecesInPackingList.length === 0) return false;

      if (hidePacked) {
        const allPiecesArePacked = piecesInPackingList.every(
          (piece) => piece.packed == selectedPackingList._id,
        );
        if (allPiecesArePacked) return false;
      }
    }

    // Handle negative filtering first if any negative terms exist
    if (negativeSearchWords.length > 0) {
      const itemContainsNegativeTerm = negativeSearchWords.some((word) => {
        const brandMatches = item.brand
          ? item.brand.toLowerCase() == word.toLowerCase()
          : false;
        const typeMatches = item.types.some((type) =>
          type.toLowerCase() == word.toLowerCase(),
        );
        const colorMatches = item.colors.some((color) =>
          color.toLowerCase() == word.toLowerCase(),
        );
        return brandMatches || typeMatches || colorMatches;
      });

      // If the item contains any of the negative terms, it should be filtered OUT
      if (itemContainsNegativeTerm) {
        return false;
      }
    }

    // If there are no positive search terms, return true (after potential negative filtering)
    // This means if you only search for "!sport", and an item doesn't have "sport", it will be returned.
    if (positiveSearchWords.length === 0) {
      return true;
    }

    // Check if all positive search words are present in any of the item's attributes
    return positiveSearchWords.every((word) => {
      const brandMatches = item.brand
        ? item.brand.toLowerCase().includes(word)
        : false;

      const typeMatches = item.types.some((type) =>
        type.toLowerCase().includes(word),
      );

      const colorMatches = item.colors.some((color) =>
        color.toLowerCase().includes(word),
      );

      return brandMatches || typeMatches || colorMatches;
    });
  });

  const filteredItemsWithLocationFilter = filteredItems.filter((item) => {
    if (filterLocation) {
      const locationMatches = item.pieces.filter(
        (piece) => piece.currentLocation._id === filterLocation,
      ).length;
      if (locationMatches === 0) return false;
    }

    return true;
  });

  return (
    <div className="relative h-screen">
      <ConvertAlertScreen items={items} />
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
                {user?.fullName ?? user.emailAddresses[0].emailAddress}
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
            <div className="flex items-center gap-2">
              <PackingListSelector
                selectPackingList={(list) => {
                  setSelectedPackingList(list);
                }}
              />
              <NewItemForm />
            </div>
          </div>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-8xl font-light uppercase focus:outline-none"
            placeholder={selectedPackingList ? `Packing list` : "My Closet"}
          />
        </div>

        {selectedPackingList && (
          <PackingListInfo
            packingList={selectedPackingList}
            updateSelectedPackingList={updateSelectedPackingList}
            deselectPackingList={deselectPackingList}
          />
        )}

        <div className="flex justify-between items-center gap-2">
          <div className="flex gap-2 items-start">
            <button
              className={`cursor-pointer w-fit ${filterLocation === null && "border-b-2 border-neutral-400"}`}
              onClick={() => setFilterLocation(null)}
            >
              All Items({filteredItems.length})
            </button>
            {(locations ?? []).map((location) => {
              const count = filteredItems
                .map((item) => ({
                  ...item,
                  pieces: item.pieces.filter(
                    (piece) => piece.currentLocation._id === location._id,
                  ),
                }))
                .filter((info) => info.pieces.length > 0).length;

              if (count === 0) return null;
              return (
                <button
                  onClick={() => setFilterLocation(location._id)}
                  className={`cursor-pointer w-fit ${filterLocation === location._id && "border-b-2 border-neutral-400"}`}
                  key={location._id}
                >
                  {location.name}({count})
                </button>
              );
            })}
          </div>

          {selectedPackingList && (
            <div className="flex items-center space-x-2">
              <Label htmlFor="hidePacked-mode">Hide packed items</Label>
              <Switch
                checked={hidePacked}
                onCheckedChange={setHidePacked}
                className="rounded-none"
                id="hidePacked-mode"
              />
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 mb-40">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 flex-wrap">
            {filteredItemsWithLocationFilter.map((item) => (
              <ItemView
                itemsToBeMoved={selectedItems}
                setItemsToBeMoved={setSelectedItems}
                selectItem={handleSelectItem}
                key={item._id}
                item={{
                  ...item,
                  pieces: selectedPackingList
                    ? item.pieces.filter((piece) =>
                        selectedPackingList.items.some(
                          (pieceId) => pieceId === piece._id,
                        ),
                      )
                    : item.pieces,
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {selectedItems.length > 0 && (
        <div className="absolute bottom-0 left-0 p-2 bg-neutral-800 w-full">
          <div className="flex items-center gap-2 justify-between">
            <div className="flex gap-5 items-center">
              <button
                onClick={() => setSelectedItems([])}
                className="cursor-pointer"
              >
                <XIcon className="h-4 w-4" />
              </button>

              {!selectedPackingList ? (
                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => setNextAction("move")}
                    className={`cursor-pointer w-fit ${nextAction === "move" && "border-b-2 border-neutral-400"}`}
                  >
                    Move
                  </button>
                  <div className="rounded-full bg-neutral-400 h-1 w-1"></div>
                  <button
                    onClick={() => setNextAction("addToPackingList")}
                    className={`cursor-pointer w-fit ${nextAction === "addToPackingList" && "border-b-2 border-neutral-400"}`}
                  >
                    Add to Packing List
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => setNextActionInPackingList("pack")}
                    className={`cursor-pointer w-fit ${nextActionInPackingList === "pack" && "border-b-2 border-neutral-400"}`}
                  >
                    Pack Items
                  </button>
                  <div className="rounded-full bg-neutral-400 h-1 w-1"></div>
                  <button
                    onClick={() =>
                      setNextActionInPackingList("removeFromPackingList")
                    }
                    className={`cursor-pointer w-fit ${nextActionInPackingList === "removeFromPackingList" && "border-b-2 border-neutral-400"}`}
                  >
                    Remove from Packing List
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-2 max-w-full overflow-auto">
                {selectedItems.map((item) => {
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
              {selectedPackingList ? (
                nextActionInPackingList === "pack" ? (
                  <Button
                    variant="default"
                    className="rounded-none"
                    onClick={handlePiecesAction}
                    disabled={loading}
                  >
                    {loading ? (
                      <LoaderCircleIcon className="animate-spin" />
                    ) : (
                      `Pack ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""}`
                    )}
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    className="rounded-none"
                    onClick={handlePiecesAction}
                    disabled={loading}
                  >
                    {loading ? (
                      <LoaderCircleIcon className="animate-spin" />
                    ) : (
                      `Remove ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""} from packing list`
                    )}
                  </Button>
                )
              ) : nextAction === "move" ? (
                <>
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
                    onClick={handlePiecesAction}
                    className="rounded-none"
                    disabled={loading}
                  >
                    {loading ? (
                      <LoaderCircleIcon className="animate-spin" />
                    ) : (
                      `Move ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""}`
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <SearchableCreateSelect
                    options={
                      packingLists
                        ? packingLists.map((item) => ({
                            value: item._id,
                            label: item.name,
                          }))
                        : [{ value: "", label: "loading..." }]
                    }
                    value={packingListToMoveTo?._id ?? ""}
                    onValueChange={(value) => {
                      if (!packingLists) return;
                      setPackingListToMoveTo(
                        packingLists.find((list) => list._id === value) ?? null,
                      );
                    }}
                    placeholder="Select a packing list..."
                    emptyMessage="No packing list found."
                    onCreateNew={async (newItemName) => {
                      console.log(newItemName);
                    }}
                  />
                  <Button
                    variant="default"
                    onClick={handlePiecesAction}
                    className="rounded-none"
                    disabled={loading}
                  >
                    {loading ? (
                      <LoaderCircleIcon className="animate-spin" />
                    ) : (
                      `Add ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""} to packing list`
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
