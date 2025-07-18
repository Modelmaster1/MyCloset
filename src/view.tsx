import { useMutation, useQuery } from "convex/react";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  LockIcon,
  LuggageIcon,
  PlaneIcon,
  PlusIcon,
  TriangleAlertIcon,
  XIcon,
} from "lucide-react";
import { Dispatch, SetStateAction, useEffect, useState } from "react";
import DetailView from "./detailView";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import { Color } from "convex/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { Textarea } from "./components/ui/textarea";
import { SimpleDatePicker } from "./newItemInputs/simpleDatePicker";
import { Card } from "./components/ui/card";
import { formatDistanceToNow } from "date-fns";
import { Progress } from "./components/ui/progress";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./components/ui/alert-dialog";
import { Switch } from "./components/ui/switch";

export interface ClothingInfoItem {
  _id: Id<"clothingInfoItems">;
  _creationTime: number;
  brand: string;
  types: string[];
  colors: Color[];
  pieces: ClothingPiece[];
  imageURL: string | null;
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
    const searchWords = lowerCaseSearchTerm.split(" ").filter(Boolean); // Split by space and remove empty strings

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
  const groupedPackedPieces: {
    [packingListId: Id<"packingLists">]: number;
  } = {};
  const lostPiecesCount = item.pieces.filter((p) => p.lost).length;

  item.pieces.forEach((piece) => {
    if (piece.packed) {
      groupedPackedPieces[piece.packed] =
        (groupedPackedPieces[piece.packed] || 0) + 1;
    } else if (!piece.lost) {
      const locationName = piece.currentLocation.name;
      groupedLocations[locationName] =
        (groupedLocations[locationName] || 0) + 1;
    }
  });

  const [isHovered, setIsHovered] = useState(false);

  const unpackPieces = useMutation(api.clothingItems.unpackPieces);

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

  const packedPieceInfo = Object.entries(groupedPackedPieces).map(
    ([packingListId, count]) => {
      return {
        packingListId: packingListId as Id<"packingLists">,
        count: count,
      };
    },
  );

  // Placeholder function for unpacking
  const handleUnpackAndUnlock = (piece: ClothingPiece) => {
    if (!piece.packed) return;
    unpackPieces({
      pieces: [piece._id],
      packingList: piece.packed,
    });
  };

  function addToMoveItems(locName: string) {
    // Find the first available (not packed) piece at the given location
    const newPiece = item.pieces.find(
      (piece) =>
        piece.currentLocation.name === locName &&
        !piece.packed && // Only add pieces that are NOT packed
        !piece.lost &&
        !itemsToBeMoved.some((m) => m._id === piece._id),
    );

    if (newPiece) {
      setItemsToBeMoved([...itemsToBeMoved, newPiece]);
    }
  }

  function removeFromMoveItems(locName: string) {
    // Find the first movable piece at the given location that matches this item info
    // We need to find a specific piece to remove, not just any piece with the same location name
    const indexToRemove = itemsToBeMoved.findIndex(
      (obj) =>
        obj.currentLocation.name === locName &&
        obj.info === item._id &&
        !obj.packed && // Ensure we only remove non-packed items from the selection
        !obj.lost,
    );

    if (indexToRemove !== -1) {
      const newItems = [...itemsToBeMoved];
      newItems.splice(indexToRemove, 1);
      setItemsToBeMoved(newItems);
    }
  }

  function checkIfCanMove(locName: string, available: number) {
    const alreadyMoved = itemsToBeMoved.filter(
      (obj) =>
        obj.currentLocation.name === locName &&
        obj.info === item._id &&
        !obj.packed &&
        !obj.lost,
    ).length;
    return available > alreadyMoved;
  }

  function handleSelectForSinglePiece() {
    const singlePiece = item.pieces[0];
    if (singlePiece.packed || singlePiece.lost) return; // Cannot select if packed or lost

    if (itemsToBeMoved.some((obj) => obj._id === singlePiece._id)) {
      setItemsToBeMoved(
        itemsToBeMoved.filter((obj) => obj._id !== singlePiece._id),
      );
    } else {
      setItemsToBeMoved([...itemsToBeMoved, singlePiece]);
    }
  }

  const allPiecesArePacked = item.pieces.every((piece) => piece.packed);
  const allPiecesAreLost = item.pieces.every((piece) => piece.lost);
  const allPiecesAreUnavailable = item.pieces.every(
    (piece) => piece.packed || piece.lost,
  );

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

                {allPiecesArePacked ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="rounded-none">
                        <LockIcon className="h-4 w-4 mr-2" /> All Packed
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-none">
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Item is Locked (already packed)
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          All pieces of this item are currently packed for a
                          trip. To move or add them to a different packing list,
                          you need to unpack them first.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() =>
                            item.pieces.forEach((piece) =>
                              handleUnpackAndUnlock(piece),
                            )
                          }
                          className="rounded-none"
                        >
                          Unpack and Unlock All
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : allPiecesAreLost ? (
                  <Button variant="ghost" className="rounded-none" disabled>
                    <TriangleAlertIcon className="h-4 w-4 mr-2" /> All Lost
                  </Button>
                ) : allPiecesAreUnavailable ? (
                  <Button variant="ghost" className="rounded-none" disabled>
                    <LockIcon className="h-4 w-4 mr-2" /> All Unavailable
                  </Button>
                ) : item.pieces.length > 1 ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className="rounded-none">
                        {itemsToBeMoved.some(
                          (obj) =>
                            obj.info === item._id && !obj.packed && !obj.lost,
                        ) ? (
                          <div className="flex gap-2 items-center">
                            Edit Selection <ArrowRightIcon />
                          </div>
                        ) : (
                          <div className="flex gap-2 items-center">
                            Select <ArrowRightIcon />
                          </div>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="rounded-none pt-2">
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
                              className="rounded-none"
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
                                    obj.info === item._id &&
                                    !obj.packed &&
                                    !obj.lost,
                                ).length
                              }
                              className="w-20 text-center rounded-none"
                              min="0"
                              max={data.count}
                              readOnly
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="rounded-none"
                              disabled={!checkIfCanMove(data.name, data.count)}
                              onClick={() => addToMoveItems(data.name)}
                            >
                              +
                            </Button>
                          </div>
                        </div>
                      ))}
                      {packedPieceInfo.length > 0 && (
                        <div className="mt-4 border-t pt-4">
                          <h4 className="text-sm font-semibold mb-2">
                            Packed Pieces:
                          </h4>
                          {packedPieceInfo.map((packedData, index) => (
                            <div
                              key={packedData.packingListId + index}
                              className="flex items-center justify-between py-1"
                            >
                              <div className="flex items-center gap-2 text-sm text-neutral-400">
                                <LuggageIcon className="h-4 w-4" />
                                {packedData.count}x Packed
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="link"
                                    size="sm"
                                    className="rounded-none px-2"
                                  >
                                    Unpack
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent className="rounded-none">
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Unpack Item
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This piece is currently packed. Do you
                                      want to unpack it and make it available
                                      again?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-none">
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => {
                                        const piecesToUnpack =
                                          item.pieces.filter(
                                            (p) =>
                                              p.packed ===
                                              packedData.packingListId,
                                          );

                                        if (piecesToUnpack.length > 0) {
                                          unpackPieces({
                                            pieces: piecesToUnpack.map(
                                              (p) => p._id,
                                            ),
                                            packingList:
                                              packedData.packingListId,
                                          });
                                        }
                                      }}
                                      className="rounded-none"
                                    >
                                      Unpack and Unlock
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          ))}
                        </div>
                      )}
                      {lostPiecesCount > 0 && (
                        <div className="mt-4 border-t pt-4">
                          <h4 className="text-sm font-semibold mb-2">
                            Lost Pieces:
                          </h4>
                          <div className="flex items-center justify-between py-1">
                            <div className="flex items-center gap-2 text-sm text-red-500">
                              <TriangleAlertIcon className="h-4 w-4" />
                              {lostPiecesCount}x Lost
                            </div>
                          </div>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                ) : // Single piece item
                item.pieces[0]?.packed ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" className="rounded-none">
                        <LockIcon className="h-4 w-4 mr-2" /> Packed
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="rounded-none">
                      <AlertDialogHeader>
                        <AlertDialogTitle>Item is Locked</AlertDialogTitle>
                        <AlertDialogDescription>
                          This item is currently packed for a trip. To move or
                          add it to a different packing list, you need to unpack
                          it first.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-none">
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleUnpackAndUnlock(item.pieces[0])}
                          className="rounded-none"
                        >
                          Unpack and Unlock
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : item.pieces[0]?.lost ? (
                  <Button variant="ghost" className="rounded-none" disabled>
                    <LockIcon className="h-4 w-4 mr-2" /> Lost
                  </Button>
                ) : (
                  <Button
                    onClick={handleSelectForSinglePiece}
                    variant="ghost"
                    className="rounded-none"
                  >
                    {itemsToBeMoved.some((obj) => obj.info === item._id) ? (
                      <div>Deselect</div>
                    ) : (
                      <div className="flex gap-2 items-center">
                        Select <ArrowRightIcon />
                      </div>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <div className="bg-black bg-opacity-50 text-white p-2">
        <p className="text-sm">{item.brand}</p>
        <p className="text-xs">{item.types.join(", ")}</p>
        <div className="mt-2 flex overflow-x-auto hide-scrollbar whitespace-nowrap">
          {locationStrings.map((locationString, index) => (
            <p key={index} className="text-xs mr-2">
              {locationString}
            </p>
          ))}
          {packedPieceInfo.map((packedData, index) => (
            <p
              key={`packed-${index}`}
              className="text-xs mr-2 text-neutral-400"
            >
              {packedData.count}x Packed
            </p>
          ))}
          {lostPiecesCount > 0 && (
            <p className="text-xs mr-2 text-red-500">{lostPiecesCount}x Lost</p>
          )}
        </div>
      </div>
    </div>
  );
}

function PackingListSelector({
  selectPackingList,
}: {
  selectPackingList: (packingList: PackingList) => void;
}) {
  const packingLists = useQuery(api.packinglists.list, {});
  const locations = useQuery(api.locations.list); // Fetch locations for the create form

  // State for the new packing list form
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState<string | null>(null);
  const [packingLoc, setPackingLoc] = useState<Id<"locations"> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State to control dialog open/close

  const createPackingList = useMutation(api.packinglists.create);
  const createLocation = useMutation(api.locations.create);

  const resetForm = () => {
    setName("");
    setDescription(null);
    setDepartureDate(null);
    setPackingLoc(null);
  };

  async function handleCreatePackingList() {
    // Basic validation
    if (!name.trim()) {
      alert("Packing list name cannot be empty.");
      return;
    }

    try {
      await createPackingList({
        name: name,
        description: description ?? undefined,
        packingLocation: packingLoc ?? undefined,
        departureDate: departureDate ? departureDate.getTime() : undefined,
      });
      resetForm(); // Reset form fields on successful creation
      setIsDialogOpen(false); // Close the dialog
    } catch (error) {
      console.error("Failed to create packing list:", error);
      alert("Failed to create packing list. Please try again.");
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="rounded-none">
          Packing Lists <PlaneIcon className="ml-1 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="rounded-none w-64 p-0">
        <div className="p-4 border-b border-neutral-700 text-lg font-semibold">
          My Packing Lists
        </div>
        <ScrollArea className="h-[200px]">
          {packingLists && packingLists.length > 0 ? (
            <div className="flex flex-col">
              {packingLists.map((list) => (
                <Button
                  key={list._id}
                  onClick={() => selectPackingList(list)}
                  variant="ghost"
                  className="rounded-none justify-start px-4 py-2 w-full text-left hover:bg-neutral-800"
                >
                  {list.name}
                  {list.departureDate && (
                    <span className="text-xs ml-auto opacity-70">
                      (
                      {formatDistanceToNow(list.departureDate, {
                        addSuffix: true,
                      })}
                      )
                    </span>
                  )}
                </Button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-neutral-400">
              No packing lists yet.
            </div>
          )}
        </ScrollArea>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="rounded-none w-full justify-start mt-2 border-t border-neutral-700"
              onClick={resetForm} // Reset form when opening dialog
            >
              <PlusIcon className="mr-2 h-4 w-4" /> Create New
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Packing List</DialogTitle>
              <DialogDescription>
                Packing list allow you to digitally organize your clothes for a
                trip.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className="rounded-none"
                />
              </div>
              <SimpleDatePicker
                date={departureDate}
                setDate={setDepartureDate}
                name="Departure Date"
              />
              <div className="flex flex-col gap-2">
                <Label htmlFor="packing">
                  Packing Location (where are you packing for this trip?)
                </Label>
                <SearchableCreateSelect
                  options={
                    locations
                      ? locations.map((location) => ({
                          value: location._id,
                          label: location.name,
                        }))
                      : [{ value: "", label: "loading..." }]
                  }
                  value={packingLoc ?? ""}
                  onValueChange={(value) => {
                    setPackingLoc(value as Id<"locations"> | null);
                  }}
                  placeholder="Select a location..."
                  emptyMessage="No location found."
                  onCreateNew={async (newLocName) => {
                    if (newLocName.trim() === "") return;
                    const locId = await createLocation({ name: newLocName });
                    setPackingLoc(locId);
                  }}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description ?? ""}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  className="rounded-none"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleCreatePackingList}
                  className="rounded-none"
                >
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PopoverContent>
    </Popover>
  );
}

function PackingListInfo({
  packingList,
  updateSelectedPackingList,
  deselectPackingList,
}: {
  packingList: PackingList;
  updateSelectedPackingList: (list: PackingList) => void;
  deselectPackingList: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(packingList.name);
  const [description, setDescription] = useState(packingList.description ?? "");
  const [packingLoc, setPackingLoc] = useState<Id<"locations"> | null>(
    packingList.packingLocation ?? null,
  );
  const [departureDate, setDepartureDate] = useState<Date | null>(
    new Date(packingList.departureDate ?? 0),
  );

  const packingListStatus = useQuery(api.clothingItems.getPackStatus, {
    packingList: packingList._id,
  });
  const locations = useQuery(api.locations.list);
  const createLocation = useMutation(api.locations.create);

  const updatePackingList = useMutation(api.packinglists.update);
  const markPackingListExpired = useMutation(api.packinglists.markPackingListExpired);

  useEffect(() => {
    clearFields();
  }, [packingList]);

  function clearFields() {
    setName(packingList.name);
    setDescription(packingList.description ?? "");
    setDepartureDate(new Date(packingList.departureDate ?? 0));
    setPackingLoc(packingList.packingLocation ?? null);
  }

  const hasChanges =
    name !== packingList.name ||
    description !== (packingList.description ?? "") ||
    (departureDate?.getTime() ?? null) !==
      (packingList.departureDate ?? null) ||
    packingLoc !== (packingList.packingLocation ?? null);

  async function handleUpdateInfo() {
    setLoading(true);

    if (!hasChanges) {
      // No changes to save
      setLoading(false);
      return;
    }

    const newItem = await updatePackingList({
      id: packingList._id,
      name: name,
      description: description.trim() === "" ? undefined : description,
      departureDate: departureDate?.getTime(),
      packingLocation: packingLoc ?? undefined,
    });

    if (newItem) {
      updateSelectedPackingList(newItem);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <Card className="relative p-0 rounded-none w-full">
        <div className="absolute top-0 right-0 p-3">
          <button onClick={deselectPackingList} className="cursor-pointer">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-2 p-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase())}
            className="text-3xl font-light uppercase focus:outline-none"
            placeholder="Packing List Name"
          />

          <textarea
            className="rounded-none outline-none h-12"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex justify-between items-end">
            <div className="flex gap-2">
              <div className="flex flex-col gap-3">
                <Label htmlFor="packing">Packing Location</Label>
                <SearchableCreateSelect
                  disabled={(packingListStatus?.packedPieces.length ?? 5) > 0}
                  options={
                    locations
                      ? locations.map((location) => ({
                          value: location._id,
                          label: location.name,
                        }))
                      : [{ value: "", label: "loading..." }]
                  }
                  value={packingLoc ?? ""}
                  onValueChange={(value) => {
                    setPackingLoc(value as Id<"locations"> | null);
                  }}
                  placeholder="Select a location..."
                  emptyMessage="No location found."
                  onCreateNew={async (newLocName) => {
                    if (newLocName.trim() === "") return;
                    const locId = await createLocation({ name: newLocName });
                    setPackingLoc(locId);
                  }}
                />
              </div>
              <div className="flex items-end gap-1">
                <SimpleDatePicker
                  name="Departure date"
                  date={departureDate}
                  setDate={setDepartureDate}
                />

                {departureDate && (
                  <div className="opacity-50 p-1.5">
                    ({formatDistanceToNow(departureDate, { addSuffix: true })})
                  </div>
                )}
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="rounded-none cursor-pointer opacity-50 hover:opacity-100 transition-opacity w-fit"
                >
                  Mark as Expired
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-none">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently disable
                    your packing list and remove its packed items.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-none">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="rounded-none"
                    onClick={() => {
                      setLoading(true);
                      markPackingListExpired({
                        packingList: packingList._id,
                      });
                      deselectPackingList();
                      setLoading(false);
                    }}
                  >
                    {loading ? (
                      <LoaderCircleIcon className="animate-spin" />
                    ) : (
                      "Yes, mark as expired"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <Progress
              className="rounded-none"
              value={packingListStatus?.percentagePacked}
            />
            <div className="w-fit text-sm opacity-50">
              {packingListStatus?.packedPieces.length} of{" "}
              {packingListStatus?.totalPieces.length} items packed
            </div>
          </div>
        </div>
        {hasChanges && (
          <div className="absolute bottom-0 right-0">
            <div className="flex justify-end gap-3 items-center m-3 p-1 ps-4 bg-neutral-900">
              <button
                onClick={clearFields}
                className="opacity-80 cursor-pointer"
              >
                Revert Changes
              </button>

              <Button
                onClick={handleUpdateInfo}
                className="rounded-none cursor-pointer"
              >
                {loading ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
