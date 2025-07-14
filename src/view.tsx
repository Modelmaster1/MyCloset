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
  const packingLists = useQuery(api.packinglists.list);
  const addItemsToPackingList = useMutation(
    api.packinglists.addItemsToPackingList,
  );
  const packItems = useMutation(api.clothingItems.packPieces);
  const [filterLocation, setFilterLocation] = useState<Id<"locations"> | null>(
    null,
  );
  const [nextAction, setNextAction] = useState<"move" | "addToPackingList">(
    "move",
  );

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

    if (selectedPackingList && selectedPackingList.packingLocation) {
      await packItems({
        pieces: selectedItems.map((piece) => piece._id),
        packingList: selectedPackingList._id,
        packLocation: selectedPackingList.packingLocation,
      });
    } else if (selectedPackingList && !selectedPackingList.packingLocation) {
      alert("Please select a packing location first");
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
      const packingListPieces = selectedPackingList.items.filter((pieceId) =>
        item.pieces.find((piece) => piece._id === pieceId),
      );
      if (packingListPieces.length === 0) return false;
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

        <div className="flex flex-col gap-2 mb-40">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 flex-wrap">
            {filteredItemsWithLocationFilter.map((item) => (
              <ItemView
                itemsToBeMoved={selectedItems}
                setItemsToBeMoved={setSelectedItems}
                selectItem={handleSelectItem}
                key={item._id}
                item={item}
              />
            ))}
          </div>

          {selectedPackingList && (
            <div className="flex w-full justify-center">
              <button className="rounded-none cursor-pointer ">
                Add More Items
              </button>
            </div>
          )}
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
                <button
                  className={`cursor-pointer w-fit border-b-2 border-neutral-400`}
                >
                  Pack Items
                </button>
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
                      Select <ArrowRightIcon />
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
                                  obj.info === item._id,
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
        <div className="mt-2 flex overflow-x-auto hide-scrollbar whitespace-nowrap">
          {locationStrings.map((locationString, index) => (
            <p key={index} className="text-xs mr-2">
              {locationString}
            </p>
          ))}
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
  const packingLists = useQuery(api.packinglists.list);

  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState<string | null>(null);
  const createPackingList = useMutation(api.packinglists.create);
  const [packingLoc, setPackingLoc] = useState<Id<"locations"> | null>(null);

  const locations = useQuery(api.locations.list);
  const createLocation = useMutation(api.locations.create);

  async function handleCreatePackingList() {
    await createPackingList({
      name: name,
      description: description ?? undefined,
      packingLocation: packingLoc ?? undefined,
      departureDate: departureDate ? departureDate.getTime() : undefined,
    });
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="rounded-none">
          Packing List <ArrowRightIcon />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="rounded-none pt-2">
        {packingLists &&
          packingLists.map((list) => (
            <div
              key={list._id}
              onClick={() => selectPackingList(list)}
              className="flex gap-2 items-center"
            >
              <div>{list.name}</div>
            </div>
          ))}
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" className="rounded-none">
              Create New Packing List
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none">
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

          <div className="flex gap-2">
            <div className="flex flex-col gap-3">
              <Label htmlFor="packing">Packing Location</Label>
              <SearchableCreateSelect
                disabled={true}
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
