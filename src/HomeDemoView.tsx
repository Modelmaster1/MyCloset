import { useMemo, useState } from "react";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import { Input } from "./components/ui/input";
import { Switch } from "./components/ui/switch";
import { Progress } from "./components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./components/ui/popover";
import { ScrollArea } from "./components/ui/scroll-area";
import { Label } from "./components/ui/label";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ArrowRightIcon,
  LuggageIcon,
  PlaneIcon,
  PlusIcon,
  XIcon,
  LoaderCircleIcon,
} from "lucide-react";
import { SignInButton } from "@clerk/clerk-react";


// Types aligned with your app style
type Id = string;

type Location = {
  _id: Id;
  name: string;
};

type PackingList = {
  _id: Id;
  _creationTime: number;
  name: string;
  description?: string;
  departureDate?: number;
  packingLocation?: Id;
  items: Id[]; // piece ids
  expired?: boolean;
};

type ClothingPiece = {
  _id: Id;
  _creationTime: number;
  packed?: Id; // packing list id
  currentLocation: {
    _id: Id;
    name: string;
  };
  info: Id;
  lost?: number; // timestamp if lost (truthy => lost)
};

type ClothingInfoItem = {
  _id: Id;
  _creationTime: number;
  brand?: string;
  types: string[];
  colors: string[];
  pieces: ClothingPiece[];
  imageURL: string | null;
};

// Demo seed data
const demoLocations: Location[] = [
  { _id: "loc-1", name: "Mom's House" },
  { _id: "loc-2", name: "City Apartment" },
  { _id: "loc-3", name: "Lake House" },
];

const now = Date.now();

const demoItems: ClothingInfoItem[] = [
  {
    _id: "info-1",
    _creationTime: now - 1000000,
    brand: "Ralph Lauren",
    types: ["polo", "casual"],
    colors: ["beige"],
    imageURL:
      "https://o22hkooeka.ufs.sh/f/lPGe37SChSc88YVcaqoZGox6C7MUXdDAhEKTFmSVaOpu53RB",
    pieces: [
      {
        _id: "p-1",
        _creationTime: now - 999000,
        info: "info-1",
        currentLocation: demoLocations[0],
      },
      {
        _id: "p-2",
        _creationTime: now - 998000,
        info: "info-1",
        currentLocation: demoLocations[1],
      },
      {
        _id: "p-3",
        _creationTime: now - 997000,
        info: "info-1",
        currentLocation: demoLocations[2],
      },
    ],
  },
  {
    _id: "info-2",
    _creationTime: now - 900000,
    brand: "Nike",
    types: ["hoodie", "sport"],
    colors: ["black"],
    imageURL:
      "https://o22hkooeka.ufs.sh/f/lPGe37SChSc89HElsP73NbcWh6AGeSuVoEiUPpgzwxC7nsLj",
    pieces: [
      {
        _id: "p-4",
        _creationTime: now - 899000,
        info: "info-2",
        currentLocation: demoLocations[1],
      },
      {
        _id: "p-5",
        _creationTime: now - 898000,
        info: "info-2",
        currentLocation: demoLocations[1],
      },
    ],
  },
  {
    _id: "info-3",
    _creationTime: now - 800000,
    brand: "Uniqlo",
    types: ["t-shirt", "basic"],
    colors: ["white"],
    imageURL:
      "https://o22hkooeka.ufs.sh/f/lPGe37SChSc8ZRqHcf2NekbHM7lPxOKm49JGItsdCc0AfDaV",
    pieces: [
      {
        _id: "p-6",
        _creationTime: now - 799000,
        info: "info-3",
        currentLocation: demoLocations[0],
      },
    ],
  },
  {
    _id: "info-4",
    _creationTime: now - 700000,
    brand: "Levi's",
    types: ["jeans", "denim"],
    colors: ["blue"],
    imageURL:
      "https://o22hkooeka.ufs.sh/f/lPGe37SChSc8BTKF59muiqIJ9YPa2mM5ZksLOypcdntXo3BC",
    pieces: [
      {
        _id: "p-7",
        _creationTime: now - 699000,
        info: "info-4",
        currentLocation: demoLocations[0],
      },
      {
        _id: "p-8",
        _creationTime: now - 698000,
        info: "info-4",
        currentLocation: demoLocations[2],
      },
    ],
  },
  {
    _id: "info-5",
    _creationTime: now - 600000,
    brand: "Patagonia",
    types: ["jacket", "outdoor"],
    colors: ["blue"],
    imageURL:
      "https://o22hkooeka.ufs.sh/f/lPGe37SChSc8aksoTrlI1gU7sTBOYPrVMdRKbQ9NFLGviEkf",
    pieces: [
      {
        _id: "p-9",
        _creationTime: now - 599000,
        info: "info-5",
        currentLocation: demoLocations[2],
      },
      {
        _id: "p-10",
        _creationTime: now - 598000,
        info: "info-5",
        currentLocation: demoLocations[1],
      },
    ],
  },
];

// Small helper to find location by id
const locById = (locs: Location[], id?: Id | null) =>
  locs.find((l) => l._id === id) ?? null;

// Demo packing lists
const demoPackingLists: PackingList[] = [
  {
    _id: "pl-berlin",
    _creationTime: now - 500000,
    name: "Berlin Trip",
    description: "Weekend city break",
    packingLocation: "loc-2",
    departureDate: now + 10 * 24 * 3600 * 1000,
    items: ["p-2", "p-7", "p-4"], // just associated, not packed yet
  },
  {
    _id: "pl-ski",
    _creationTime: now - 400000,
    name: "Ski Trip",
    description: "Alps adventure",
    packingLocation: "loc-3",
    departureDate: now + 25 * 24 * 3600 * 1000,
    items: ["p-10"],
  },
];

export default function HomeDemoView() {
  // Demo state
  const [items, setItems] = useState<ClothingInfoItem[]>(demoItems);
  const [locations, setLocations] = useState<Location[]>(demoLocations);
  const [packingLists, setPackingLists] =
    useState<PackingList[]>(demoPackingLists);

  // UI state similar to View
  const [selectedItems, setSelectedItems] = useState<ClothingPiece[]>([]);
  const [selectedPackingList, setSelectedPackingList] =
    useState<PackingList | null>(null);
  const [packingListToMoveTo, setPackingListToMoveTo] =
    useState<PackingList | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState<Id | null>(null);
  const [hidePacked, setHidePacked] = useState(false);
  const [nextAction, setNextAction] = useState<"move" | "addToPackingList">(
    "move",
  );
  const [nextActionInPackingList, setNextActionInPackingList] = useState<
    "pack" | "removeFromPackingList"
  >("pack");
  const [destinationLoc, setDestinationLoc] = useState<Id | null>(null);
  const [loading, setLoading] = useState(false);

  function openPackingList(list: PackingList) {
    setSelectedPackingList(list);
  }

  function deselectPackingList() {
    setSelectedPackingList(null);
    setHidePacked(false);
  }

  // Filtering like in your view
  const filteredItems = useMemo(() => {
    const lowerTerm = searchTerm.toLowerCase();

    const positive = lowerTerm
      .split(" ")
      .filter((w) => w && !w.startsWith("!"));

    const negative = lowerTerm
      .split(" ")
      .filter((w) => w && w.startsWith("!"))
      .map((w) => w.substring(1))
      .filter((w) => w.length > 0);

    return items.filter((item) => {
      // Packing list filter first
      if (selectedPackingList) {
        const piecesInList = item.pieces.filter((piece) =>
          selectedPackingList.items.includes(piece._id),
        );
        if (piecesInList.length === 0) return false;

        if (hidePacked) {
          const allPiecesPacked = piecesInList.every(
            (p) => p.packed === selectedPackingList._id,
          );
          if (allPiecesPacked) return false;
        }
      }

      // Negative search words => equality match
      if (negative.length > 0) {
        const hitNeg = negative.some((word) => {
          const brandEq = item.brand
            ? item.brand.toLowerCase() === word.toLowerCase()
            : false;
          const typeEq = item.types.some(
            (t) => t.toLowerCase() === word.toLowerCase(),
          );
          const colorEq = item.colors.some(
            (c) => c.toLowerCase() === word.toLowerCase(),
          );
          return brandEq || typeEq || colorEq;
        });
        if (hitNeg) return false;
      }

      // If no positive terms, pass
      if (positive.length === 0) return true;

      // Positives => includes
      return positive.every((word) => {
        const brandHit = item.brand
          ? item.brand.toLowerCase().includes(word)
          : false;
        const typeHit = item.types.some((t) =>
          t.toLowerCase().includes(word),
        );
        const colorHit = item.colors.some((c) =>
          c.toLowerCase().includes(word),
        );
        return brandHit || typeHit || colorHit;
      });
    });
  }, [items, searchTerm, selectedPackingList, hidePacked]);

  const filteredItemsWithLocation = useMemo(() => {
    if (!filterLocation) return filteredItems;
    return filteredItems.filter((item) =>
      item.pieces.some((p) => p.currentLocation._id === filterLocation),
    );
  }, [filteredItems, filterLocation]);

  // Bottom action handlers
  async function handlePiecesAction() {
    setLoading(true);

    if (selectedPackingList) {
      if (nextActionInPackingList === "removeFromPackingList") {
        removeItemsFromPackingList(
          selectedItems.map((p) => p._id),
          selectedPackingList._id,
        );
      }
      if (nextActionInPackingList === "pack") {
        if (!selectedPackingList.packingLocation) {
          alert("Please select a packing location first");
        } else {
          packItems(
            selectedItems.map((p) => p._id),
            selectedPackingList._id,
          );
        }
      }
    } else {
      if (nextAction === "move" && destinationLoc) {
        movePieces(
          selectedItems.map((p) => p._id),
          destinationLoc,
        );
      } else if (
        nextAction === "addToPackingList" &&
        packingListToMoveTo
      ) {
        addItemsToPackingList(
          selectedItems.map((p) => p._id),
          packingListToMoveTo._id,
        );
        setSelectedPackingList(packingListToMoveTo);
        setPackingListToMoveTo(null);
      }
    }

    setSelectedItems([]);
    setLoading(false);
  }

  // Local-state "mutations"
  function movePieces(pieceIds: Id[], newLoc: Id) {
    setItems((prev) =>
      prev.map((info) => ({
        ...info,
        pieces: info.pieces.map((p) =>
          pieceIds.includes(p._id)
            ? {
              ...p,
              currentLocation:
                locById(locations, newLoc) ?? p.currentLocation,
            }
            : p,
        ),
      })),
    );
  }

  function addItemsToPackingList(pieceIds: Id[], listId: Id) {
    setPackingLists((prev) =>
      prev.map((list) =>
        list._id === listId
          ? {
            ...list,
            items: Array.from(new Set([...list.items, ...pieceIds])),
          }
          : list,
      ),
    );
  }

  function packItems(pieceIds: Id[], listId: Id) {
    setItems((prev) =>
      prev.map((info) => ({
        ...info,
        pieces: info.pieces.map((p) =>
          pieceIds.includes(p._id) ? { ...p, packed: listId } : p,
        ),
      })),
    );
  }

  function removeItemsFromPackingList(pieceIds: Id[], listId: Id) {
    setPackingLists((prev) =>
      prev.map((list) =>
        list._id === listId
          ? {
            ...list,
            items: list.items.filter((id) => !pieceIds.includes(id)),
          }
          : list,
      ),
    );
    // Also un-pack if packed in that list
    setItems((prev) =>
      prev.map((info) => ({
        ...info,
        pieces: info.pieces.map((p) =>
          pieceIds.includes(p._id) && p.packed === listId
            ? { ...p, packed: undefined }
            : p,
        ),
      })),
    );
  }

  function updateSelectedPackingList(next: PackingList) {
    setPackingLists((prev) =>
      prev.map((pl) => (pl._id === next._id ? next : pl)),
    );
    setSelectedPackingList(next);
  }

  const filteredCount = filteredItems.length;

  return (
    <div className="relative h-screen">
      <div className="flex flex-col gap-5 p-5 max-h-screen overflow-auto">
        {/* Header */}
        <div className="flex flex-col gap-0">
          <div className="flex items-center justify-between">
            <div className="flex gap-0 items-center">
              <div className="cursor-default">
                Demo User
              </div>
            </div>
            <div className="flex items-center gap-2">
              <PackingListSelectorDemo
                packingLists={packingLists}
                locations={locations}
                onCreate={(pl) => {
                  setPackingLists((prev) => [pl, ...prev]);
                }}
                onSelect={(pl) => openPackingList(pl)}
              />
              <SignInButton mode="modal">
                <Button
                  className="rounded-none"
                >
                  Get Started
                </Button>
              </SignInButton>
            </div>
          </div>

          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="text-8xl font-light uppercase focus:outline-none"
            placeholder={
              selectedPackingList ? `Packing list` : "My Closet"
            }
          />
        </div>

        {/* Packing list info (demo) */}
        {selectedPackingList && (
          <PackingListInfoDemo
            packingList={selectedPackingList}
            locations={locations}
            pieces={items.flatMap((i) => i.pieces)}
            updateSelectedPackingList={updateSelectedPackingList}
            deselectPackingList={deselectPackingList}
          />
        )}

        {/* Location filters + hide packed */}
        <div className="flex justify-between items-center gap-2">
          <div className="flex gap-2 items-start">
            <button
              className={`cursor-pointer w-fit ${filterLocation === null &&
                "border-b-2 border-neutral-400"
                }`}
              onClick={() => setFilterLocation(null)}
            >
              All Items({filteredCount})
            </button>
            {locations.map((loc) => {
              const count = filteredItems
                .map((it) => ({
                  ...it,
                  pieces: it.pieces.filter(
                    (p) => p.currentLocation._id === loc._id,
                  ),
                }))
                .filter((info) => info.pieces.length > 0).length;

              if (count === 0) return null;
              return (
                <button
                  onClick={() => setFilterLocation(loc._id)}
                  className={`cursor-pointer w-fit ${filterLocation === loc._id &&
                    "border-b-2 border-neutral-400"
                    }`}
                  key={loc._id}
                >
                  {loc.name}({count})
                </button>
              );
            })}
          </div>

          {selectedPackingList && (
            <div className="flex items-center space-x-2">
              <Label htmlFor="hidePacked-mode">
                Hide packed items
              </Label>
              <Switch
                checked={hidePacked}
                onCheckedChange={setHidePacked}
                className="rounded-none"
                id="hidePacked-mode"
              />
            </div>
          )}
        </div>

        {/* Grid of items (like ItemView) */}
        <div className="flex flex-col gap-2 mb-40">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1 flex-wrap">
            {filteredItemsWithLocation.map((item) => (
              <ItemTile
                key={item._id}
                item={{
                  ...item,
                  pieces: selectedPackingList
                    ? item.pieces.filter((p) =>
                      selectedPackingList.items.includes(p._id),
                    )
                    : item.pieces,
                }}
                itemsToBeMoved={selectedItems}
                setItemsToBeMoved={setSelectedItems}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom selection bar */}
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
                    className={`cursor-pointer w-fit ${nextAction === "move" &&
                      "border-b-2 border-neutral-400"
                      }`}
                  >
                    Move
                  </button>
                  <div className="rounded-full bg-neutral-400 h-1 w-1" />
                  <button
                    onClick={() => setNextAction("addToPackingList")}
                    className={`cursor-pointer w-fit ${nextAction === "addToPackingList" &&
                      "border-b-2 border-neutral-400"
                      }`}
                  >
                    Add to Packing List
                  </button>
                </div>
              ) : (
                <div className="flex gap-3 items-center">
                  <button
                    onClick={() => setNextActionInPackingList("pack")}
                    className={`cursor-pointer w-fit ${nextActionInPackingList === "pack" &&
                      "border-b-2 border-neutral-400"
                      }`}
                  >
                    Pack Items
                  </button>
                  <div className="rounded-full bg-neutral-400 h-1 w-1" />
                  <button
                    onClick={() =>
                      setNextActionInPackingList("removeFromPackingList")
                    }
                    className={`cursor-pointer w-fit ${nextActionInPackingList ===
                      "removeFromPackingList" &&
                      "border-b-2 border-neutral-400"
                      }`}
                  >
                    Remove from Packing List
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-2 max-w-full overflow-auto">
                {selectedItems.map((piece) => {
                  const info = items.find((i) => i._id === piece.info);
                  if (!info) return null;
                  return (
                    <div
                      key={piece._id}
                      className="flex gap-2 items-center"
                    >
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
                      `Pack ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""
                      }`
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
                      `Remove ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""
                      } from packing list`
                    )}
                  </Button>
                )
              ) : nextAction === "move" ? (
                <>
                  <SearchableCreateSelect
                    options={locations.map((l) => ({
                      value: l._id,
                      label: l.name,
                    }))}
                    value={destinationLoc ?? ""}
                    onValueChange={(v) =>
                      setDestinationLoc((v as Id) || null)
                    }
                    placeholder="Select a location..."
                    emptyMessage="No location found."
                    onCreateNew={(name) => {
                      const trimmed = name.trim();
                      if (!trimmed) return;
                      const id = `loc-${Math.random()
                        .toString(36)
                        .slice(2, 8)}`;
                      const newLoc = { _id: id, name: trimmed };
                      setLocations((prev) => [...prev, newLoc]);
                      setDestinationLoc(id);
                    }}
                  />
                  <Button
                    variant="default"
                    onClick={handlePiecesAction}
                    className="rounded-none"
                    disabled={loading || !destinationLoc}
                  >
                    {loading ? (
                      <LoaderCircleIcon className="animate-spin" />
                    ) : (
                      `Move ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""
                      }`
                    )}
                  </Button>
                </>
              ) : (
                <>
                  <SearchableCreateSelect
                    options={packingLists.map((pl) => ({
                      value: pl._id,
                      label: pl.name,
                    }))}
                    value={packingListToMoveTo?._id ?? ""}
                    onValueChange={(v) => {
                      const chosen = packingLists.find(
                        (pl) => pl._id === v,
                      );
                      setPackingListToMoveTo(chosen ?? null);
                    }}
                    placeholder="Select a packing list..."
                    emptyMessage="No packing list found."
                    onCreateNew={(name) => {
                      const trimmed = name.trim();
                      if (!trimmed) return;
                      const id = `pl-${Math.random()
                        .toString(36)
                        .slice(2, 8)}`;
                      const newList: PackingList = {
                        _id: id,
                        _creationTime: Date.now(),
                        name: trimmed,
                        items: [],
                      };
                      setPackingLists((prev) => [newList, ...prev]);
                      setPackingListToMoveTo(newList);
                    }}
                  />
                  <Button
                    variant="default"
                    onClick={handlePiecesAction}
                    className="rounded-none"
                    disabled={loading || !packingListToMoveTo}
                  >
                    {loading ? (
                      <LoaderCircleIcon className="animate-spin" />
                    ) : (
                      `Add ${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""
                      } to packing list`
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

function ItemTile({
  item,
  itemsToBeMoved,
  setItemsToBeMoved,
}: {
  item: ClothingInfoItem;
  itemsToBeMoved: ClothingPiece[];
  setItemsToBeMoved: React.Dispatch<
    React.SetStateAction<ClothingPiece[]>
  >;
}) {
  const [isHovered, setIsHovered] = useState(false);

  // Grouped data (like ItemView)
  const groupedLocations: { [locName: string]: number } = {};
  const groupedPacked: { [packingListId: Id]: number } = {};
  const lostPiecesCount = item.pieces.filter((p) => p.lost).length;

  item.pieces.forEach((piece) => {
    if (piece.packed) {
      groupedPacked[piece.packed] = (groupedPacked[piece.packed] || 0) + 1;
    } else if (!piece.lost) {
      const locName = piece.currentLocation.name;
      groupedLocations[locName] = (groupedLocations[locName] || 0) + 1;
    }
  });

  const locationStrings = Object.entries(groupedLocations).map(
    ([name, count]) => (count === 1 ? `1x at ${name}` : `${count}x at ${name}`),
  );

  const uniqueLocData = Object.entries(groupedLocations).map(
    ([name, count]) => ({ name, count }),
  );

  const packedPieceInfo = Object.entries(groupedPacked).map(
    ([packingListId, count]) => ({
      packingListId: packingListId as Id,
      count,
    }),
  );

  function addToMoveItems(locName: string) {
    const newPiece = item.pieces.find(
      (piece) =>
        piece.currentLocation.name === locName &&
        !piece.packed &&
        !piece.lost &&
        !itemsToBeMoved.some((m) => m._id === piece._id),
    );
    if (newPiece) {
      setItemsToBeMoved((prev) => [...prev, newPiece]);
    }
  }

  function removeFromMoveItems(locName: string) {
    const indexToRemove = itemsToBeMoved.findIndex(
      (obj) =>
        obj.currentLocation.name === locName &&
        obj.info === item._id &&
        !obj.packed &&
        !obj.lost,
    );
    if (indexToRemove !== -1) {
      setItemsToBeMoved((prev) => {
        const next = [...prev];
        next.splice(indexToRemove, 1);
        return next;
      });
    }
  }

  function checkIfCanMove(locName: string, available: number) {
    const already = itemsToBeMoved.filter(
      (obj) =>
        obj.currentLocation.name === locName &&
        obj.info === item._id &&
        !obj.packed &&
        !obj.lost,
    ).length;
    return available > already;
  }

  function handleSelectForSinglePiece() {
    const singlePiece = item.pieces[0];
    if (!singlePiece || singlePiece.packed || singlePiece.lost) return;
    if (itemsToBeMoved.some((obj) => obj._id === singlePiece._id)) {
      setItemsToBeMoved((prev) =>
        prev.filter((obj) => obj._id !== singlePiece._id),
      );
    } else {
      setItemsToBeMoved((prev) => [...prev, singlePiece]);
    }
  }

  const allPacked = item.pieces.length > 0 &&
    item.pieces.every((p) => p.packed);
  const allLost = item.pieces.length > 0 &&
    item.pieces.every((p) => p.lost);
  const allUnavailable = item.pieces.every((p) => p.packed || p.lost);

  return (
    <div className="flex flex-col gap-2 w-full relative mb-4">
      <div
        className="relative"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <img
          src={item.imageURL ?? ""}
          alt={item.brand ?? "item"}
          className="h-62 w-full object-cover"
        />
        {isHovered && (
          <div className="absolute top-0 p-2 h-full w-full bg-black/50">
            <div className="flex h-full w-full items-center justify-center">
              <div className="flex flex-col gap-2">
                {allPacked ? (
                  <Button variant="ghost" className="rounded-none">
                    <LuggageIcon className="h-4 w-4 mr-2" />
                    All Packed
                  </Button>
                ) : allLost ? (
                  <Button
                    variant="ghost"
                    className="rounded-none"
                    disabled
                  >
                    All Lost
                  </Button>
                ) : allUnavailable ? (
                  <Button
                    variant="ghost"
                    className="rounded-none"
                    disabled
                  >
                    All Unavailable
                  </Button>
                ) : item.pieces.length > 1 ? (
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" className="rounded-none">
                        {itemsToBeMoved.some(
                          (o) =>
                            o.info === item._id && !o.packed && !o.lost,
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
                      {uniqueLocData.map((d, idx) => (
                        <div
                          key={d.name + idx}
                          className="grid w-full items-center gap-3 mt-4"
                        >
                          <Label>{d.name} ({d.count} available)</Label>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="rounded-none"
                              onClick={() => removeFromMoveItems(d.name)}
                            >
                              -
                            </Button>
                            <Input
                              type="number"
                              value={
                                itemsToBeMoved.filter(
                                  (obj) =>
                                    obj.currentLocation.name ===
                                    d.name &&
                                    obj.info === item._id &&
                                    !obj.packed &&
                                    !obj.lost,
                                ).length
                              }
                              className="w-20 text-center rounded-none"
                              min={0}
                              max={d.count}
                              readOnly
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="rounded-none"
                              disabled={!checkIfCanMove(d.name, d.count)}
                              onClick={() => addToMoveItems(d.name)}
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
                          {packedPieceInfo.map((pp, idx) => (
                            <div
                              key={pp.packingListId + "-" + idx}
                              className="flex items-center justify-between py-1 text-neutral-400"
                            >
                              <div className="flex items-center gap-2 text-sm">
                                <LuggageIcon className="h-4 w-4" />
                                {pp.count}x Packed
                              </div>
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
                              {lostPiecesCount}x Lost
                            </div>
                          </div>
                        </div>
                      )}
                    </PopoverContent>
                  </Popover>
                ) : item.pieces[0]?.packed ? (
                  <Button variant="ghost" className="rounded-none">
                    <LuggageIcon className="h-4 w-4 mr-2" />
                    Packed
                  </Button>
                ) : item.pieces[0]?.lost ? (
                  <Button
                    variant="ghost"
                    className="rounded-none"
                    disabled
                  >
                    Lost
                  </Button>
                ) : (
                  <Button
                    onClick={handleSelectForSinglePiece}
                    variant="ghost"
                    className="rounded-none"
                  >
                    {itemsToBeMoved.some((o) => o.info === item._id) ? (
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
        <p className="text-sm" style={{ opacity: item.brand ? 1 : 0.5 }}>
          {item.brand ?? "N/A"}
        </p>
        <p className="text-xs">{item.types.join(", ")}</p>
        <div className="mt-2 flex overflow-x-auto whitespace-nowrap">
          {locationStrings.map((str, idx) => (
            <p key={idx} className="text-xs mr-2">
              {str}
            </p>
          ))}
          {packedPieceInfo.map((p, idx) => (
            <p key={"packed-" + idx} className="text-xs mr-2 text-neutral-400">
              {p.count}x Packed
            </p>
          ))}
          {lostPiecesCount > 0 && (
            <p className="text-xs mr-2 text-red-500">
              {lostPiecesCount}x Lost
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PackingListInfoDemo({
  packingList,
  locations,
  pieces,
  updateSelectedPackingList,
  deselectPackingList,
}: {
  packingList: PackingList;
  locations: Location[];
  pieces: ClothingPiece[];
  updateSelectedPackingList: (list: PackingList) => void;
  deselectPackingList: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(packingList.name);
  const [description, setDescription] = useState(
    packingList.description ?? "",
  );
  const [packingLoc, setPackingLoc] = useState<Id | null>(
    packingList.packingLocation ?? null,
  );
  const [departureDate, setDepartureDate] = useState<string>(
    packingList.departureDate
      ? new Date(packingList.departureDate).toISOString().slice(0, 10)
      : "",
  );

  // Status like in your query: percentage packed of items in list
  const piecesInList = pieces.filter((p) =>
    packingList.items.includes(p._id),
  );
  const packedPieces = piecesInList.filter(
    (p) => p.packed === packingList._id,
  );
  const percentagePacked =
    piecesInList.length === 0
      ? 0
      : Math.round((packedPieces.length / piecesInList.length) * 100);

  const hasChanges =
    name !== packingList.name ||
    description !== (packingList.description ?? "") ||
    (departureDate
      ? new Date(departureDate).getTime()
      : undefined) !== packingList.departureDate ||
    packingLoc !== (packingList.packingLocation ?? null);

  async function handleUpdateInfo() {
    setLoading(true);
    if (!hasChanges) {
      setLoading(false);
      return;
    }
    const updated: PackingList = {
      ...packingList,
      name,
      description: description.trim() === "" ? undefined : description,
      departureDate: departureDate
        ? new Date(departureDate).getTime()
        : undefined,
      packingLocation: packingLoc ?? undefined,
    };
    updateSelectedPackingList(updated);
    setLoading(false);
  }

  function clearFields() {
    setName(packingList.name);
    setDescription(packingList.description ?? "");
    setDepartureDate(
      packingList.departureDate
        ? new Date(packingList.departureDate)
          .toISOString()
          .slice(0, 10)
        : "",
    );
    setPackingLoc(packingList.packingLocation ?? null);
  }

  function markExpired() {
    setLoading(true);
    const expired: PackingList = { ...packingList, expired: true, items: [] };
    updateSelectedPackingList(expired);
    deselectPackingList();
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
                  options={locations.map((l) => ({
                    value: l._id,
                    label: l.name,
                  }))}
                  value={packingLoc ?? ""}
                  onValueChange={(value) =>
                    setPackingLoc((value as Id) || null)
                  }
                  placeholder="Select a location..."
                  emptyMessage="No location found."
                  onCreateNew={(newLocName) => {
                    if (newLocName.trim() === "") return;
                    const id = `loc-${Math.random()
                      .toString(36)
                      .slice(2, 8)}`;
                    const loc: Location = { _id: id, name: newLocName };
                    // In demo we can't mutate upstream; just set local value
                    setPackingLoc(loc._id);
                  }}
                />
              </div>
              <div className="flex items-end gap-1">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="dep">Departure date</Label>
                  <Input
                    id="dep"
                    type="date"
                    value={departureDate}
                    onChange={(e) => setDepartureDate(e.target.value)}
                    className="rounded-none"
                  />
                </div>
              </div>
            </div>

            <Button
              variant="ghost"
              className="rounded-none cursor-pointer opacity-50 hover:opacity-100 transition-opacity w-fit"
              onClick={markExpired}
            >
              Mark as Expired
            </Button>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <Progress className="rounded-none" value={percentagePacked} />
            <div className="w-fit text-sm opacity-50">
              {packedPieces.length} of {piecesInList.length} items packed
            </div>
          </div>
        </div>
        {hasChanges && (
          <div className="absolute bottom-0 right-0">
            <div className="flex justify-end gap-3 items-center m-3 p-1 ps-4 bg-neutral-900">
              <button onClick={clearFields} className="opacity-80 cursor-pointer">
                Revert Changes
              </button>

              <Button onClick={handleUpdateInfo} className="rounded-none cursor-pointer">
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

function PackingListSelectorDemo({
  packingLists,
  locations,
  onSelect,
  onCreate,
}: {
  packingLists: PackingList[];
  locations: Location[];
  onSelect: (pl: PackingList) => void;
  onCreate: (pl: PackingList) => void;
}) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [departure, setDeparture] = useState<string>("");
  const [packingLoc, setPackingLoc] = useState<Id | null>(null);
  const [description, setDescription] = useState("");

  function reset() {
    setName("");
    setDeparture("");
    setPackingLoc(null);
    setDescription("");
  }

  function create() {
    if (!name.trim()) return;
    const id = `pl-${Math.random().toString(36).slice(2, 8)}`;
    const pl: PackingList = {
      _id: id,
      _creationTime: Date.now(),
      name,
      description: description.trim() || undefined,
      departureDate: departure ? new Date(departure).getTime() : undefined,
      packingLocation: packingLoc ?? undefined,
      items: [],
    };
    onCreate(pl);
    setOpen(false);
    reset();
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="rounded-none">
          Packing Lists <PlaneIcon className="ml-1 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="rounded-none w-72 p-0">
        <div className="p-4 border-b border-neutral-700 text-lg font-semibold">
          My Packing Lists
        </div>
        <ScrollArea className="h-[220px]">
          <div className="flex flex-col">
            {packingLists.length > 0 ? (
              packingLists.map((list) => (
                <Button
                  key={list._id}
                  onClick={() => {
                    onSelect(list);
                    setOpen(false);
                  }}
                  variant="ghost"
                  className="rounded-none justify-start px-4 py-2 w-full text-left hover:bg-neutral-800"
                >
                  {list.name}
                </Button>
              ))
            ) : (
              <div className="p-4 text-center text-neutral-400">
                No packing lists yet.
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="border-t border-neutral-700 p-3">
          <div className="text-sm mb-2 font-medium">Create New</div>
          <div className="grid gap-2">
            <Input
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-none"
            />
            <Input
              type="date"
              value={departure}
              onChange={(e) => setDeparture(e.target.value)}
              className="rounded-none"
            />
            <SearchableCreateSelect
              options={locations.map((l) => ({
                value: l._id,
                label: l.name,
              }))}
              value={packingLoc ?? ""}
              onValueChange={(v) =>
                setPackingLoc((v as Id) || null)
              }
              placeholder="Select a packing location..."
              emptyMessage="No location found."
              onCreateNew={(name) => {
                if (!name.trim()) return;
                const id = `loc-${Math.random()
                  .toString(36)
                  .slice(2, 8)}`;
                // In demo we can't push to global list from here, just set
                setPackingLoc(id);
              }}
            />
            <Input
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-none"
            />
            <Button className="rounded-none" onClick={create}>
              <PlusIcon className="mr-2 h-4 w-4" />
              Create
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Re-usable select like your SearchableCreateSelect
type Option = {
  value: string;
  label: string;
};

function SearchableCreateSelect({
  options,
  placeholder = "Select an item...",
  emptyMessage = "No item found.",
  onCreateNew,
  onValueChange,
  value,
  disabled = false,
}: {
  options: Option[];
  placeholder?: string;
  emptyMessage?: string;
  onCreateNew?: (newValue: string) => void;
  onValueChange?: (value: string) => void;
  value?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filtered = useMemo(() => {
    if (!searchValue) return options;
    return options.filter((o) =>
      o.label.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [options, searchValue]);

  const showCreate =
    searchValue &&
    !options.some(
      (o) => o.label.toLowerCase() === searchValue.toLowerCase(),
    );

  function handleSelect(currentValue: string) {
    if (currentValue === `create-new-${searchValue.toLowerCase()}`) {
      onCreateNew?.(searchValue);
      onValueChange?.(searchValue);
    } else {
      onValueChange?.(currentValue === value ? "" : currentValue);
    }
    setOpen(false);
    setSearchValue("");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[220px] justify-between rounded-none"
        >
          {value
            ? options.find((o) => o.value === value)?.label || value
            : placeholder}
          <ArrowRightIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[220px] p-0 rounded-none">
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <ScrollArea className="max-h-[220px]">
              <CommandGroup>
                {filtered.map((o) => (
                  <CommandItem
                    key={o.value}
                    value={o.value}
                    onSelect={handleSelect}
                  >
                    {o.label}
                  </CommandItem>
                ))}
                {showCreate && (
                  <CommandItem
                    key={`create-new-${searchValue.toLowerCase()}`}
                    value={`create-new-${searchValue.toLowerCase()}`}
                    onSelect={handleSelect}
                  >
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create “{searchValue}”
                  </CommandItem>
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}