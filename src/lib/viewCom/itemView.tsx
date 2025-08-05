import { Dispatch, SetStateAction, useState } from "react";
import { ClothingInfoItem, ClothingPiece } from "../../view";
import { Id } from "convex/_generated/dataModel";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
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
} from "../../components/ui/alert-dialog";
import { ArrowRightIcon, EyeIcon, LockIcon, LuggageIcon, TriangleAlertIcon } from "lucide-react";
import { Button } from "../../components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/ui/popover";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";

export function ItemView({
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
        <p className="text-sm" style={{ opacity: item.brand ? 1 : 0.5 }}>
          {item.brand ?? "N/A"}
        </p>
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