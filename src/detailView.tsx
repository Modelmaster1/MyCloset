import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "./components/ui/dialog";
import { ClothingPiece, type ClothingInfoItem } from "./view";
import { Color } from "convex/schema";
import BrandInput from "./newItemInputs/brandInput";
import TypesInput from "./newItemInputs/typesInput";
import { format, formatDistanceToNow } from "date-fns";
import ColorInput from "./newItemInputs/colorInput";
import { Card } from "./components/ui/card";
import { LoaderCircleIcon, XIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/ui/accordion";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Button } from "./components/ui/button";
import { Id } from "convex/_generated/dataModel";

export default function DetailView({
  open,
  setOpen,
  item,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  item: ClothingInfoItem;
}) {
  const [newFile, setNewFile] = useState<File | null>(null);
  const [selectedColors, setSelectedColors] = useState<Color[]>(item.colors);
  const [brandInput, setBrandInput] = useState(item.brand);
  const [loading, setLoading] = useState(false);

  const [types, setTypes] = useState<string[]>(item.types);
  const multiplePieces = item.pieces.length > 1;
  const updateInfo = useMutation(api.clothingItems.editInfo);
  const generateUploadUrl = useMutation(api.upload.generateUploadUrl);

  const filePreview = newFile ? URL.createObjectURL(newFile) : null;

  const hasChanges =
    brandInput !== item.brand ||
    new Set(types).size !== new Set(item.types).size ||
    !types.every((t) => item.types.includes(t)) ||
    new Set(selectedColors).size !== new Set(item.colors).size ||
    !selectedColors.every((c) => item.colors.includes(c)) ||
    newFile !== null;

  useEffect(() => {
    revertAnyChanges();
  }, [item]);

  function revertAnyChanges() {
    setBrandInput(item.brand);
    setTypes(item.types);
    setSelectedColors(item.colors);
    setNewFile(null);
  }

  async function handleUpdateInfo() {
    setLoading(true);

    if (!hasChanges) {
      // No changes to save
      setLoading(false);
      return;
    }

    const updateArgs: {
      currentId: Id<"clothingInfoItems">;
      pic?: Id<"_storage">;
      brand?: string;
      types?: string[];
      colors?: Color[];
    } = {
      currentId: item._id,
    };

    if (brandInput !== item.brand) {
      updateArgs.brand = brandInput;
    }

    if (
      new Set(types).size !== new Set(item.types).size ||
      !types.every((t) => item.types.includes(t))
    ) {
      updateArgs.types = types;
    }

    if (
      new Set(selectedColors).size !== new Set(item.colors).size ||
      !selectedColors.every((c) => item.colors.includes(c))
    ) {
      updateArgs.colors = selectedColors;
    }

    if (newFile) {
      const postUrl = await generateUploadUrl();
      const result = await fetch(postUrl, {
        method: "POST",
        headers: { "Content-Type": newFile!.type },
        body: newFile,
      });

      const { storageId } = await result.json();
      updateArgs.pic = storageId as Id<"_storage">;
    }

    // Only call the mutation if there are actual changes to send
    if (Object.keys(updateArgs).length > 1) {
      // 'id' is always present, so if length > 1, there are other fields
      await updateInfo(updateArgs);
    }

    setLoading(false);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-md p-0">
        <DialogTitle className="hidden">{item.brand} clothing item</DialogTitle>
        <div className="max-h-[90vh] overflow-y-auto">
          <div className={"relative" + (hasChanges ? " mb-20" : "")}>
            <div className="flex flex-col gap-2">
              <div className="relative">
                <img
                  src={filePreview ?? item.imageURL ?? ""}
                  alt={item.brand}
                  className="aspect-square w-full object-cover"
                />
                <div className="absolute bottom-0 left-0 m-1">
                  <div className="flex gap-2 items-center">
                    <label className="flex items-center gap-2 px-3 py-2 bg-black hover:bg-black/80 transition-colors cursor-pointer text-sm">
                      <input
                        type="file"
                        onChange={(e) => {
                          setNewFile(e.target.files?.[0] ?? null);
                        }}
                        max={1}
                        multiple={false}
                        className="hidden"
                        accept="image/png, image/jpeg"
                      />
                      {newFile ? newFile.name : "Change Image"}
                    </label>
                    {newFile && (
                      <button
                        onClick={() => setNewFile(null)}
                        className="bg-black hover:bg-black/80 transition-colors p-3"
                      >
                        <XIcon className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1 p-3">
                <BrandInput
                  brandInput={brandInput}
                  setBrandInput={setBrandInput}
                  simpleInput
                />
                <div className="w-full">
                  <TypesInput types={types} setTypes={setTypes} simpleInput />
                </div>
                {false &&
                  item.pieces.map((piece) => (
                    <Card className="p-1">
                      <div className="flex gap-1 flex-col">
                        <div className="text-lg font-semibold">
                          {piece.currentLocation.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(piece._creationTime, "dd.MM.yyyy")}
                        </div>
                      </div>
                    </Card>
                  ))}
                <ColorInput
                  selectedColors={selectedColors}
                  setSelectedColors={setSelectedColors}
                  simpleInput
                />
              </div>
            </div>
            <Accordion
              type="single"
              collapsible
              className="w-full p-3"
              defaultValue="item-1"
            >
              {item.pieces.map((piece) => (
                <LocationHistoryPieceItem
                  multiplePieces={multiplePieces}
                  key={piece._id}
                  item={piece}
                />
              ))}
            </Accordion>
            <div
              className="absolute z-10 m-2 top-0 right-0 bg-black/50 p-1 aspect-square cursor-pointer"
              onClick={() => setOpen(false)}
            >
              <XIcon className="h-4 w-4" />
            </div>
          </div>
        </div>
        {hasChanges && (
          <div className="absolute bottom-0 w-full">
            <div className="flex justify-end gap-3 items-center bg-black w-full p-4">

              <button onClick={revertAnyChanges} className="opacity-80 cursor-pointer">
                Revert Changes
              </button>

              <Button
                className="rounded-none cursor-pointer"
                onClick={handleUpdateInfo}
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
      </DialogContent>
    </Dialog>
  );
}

function LocationHistoryPieceItem({
  item,
  multiplePieces,
}: {
  item: ClothingPiece;
  multiplePieces: boolean;
}) {
  const locationLogs = useQuery(api.locations.getLocationHistoryLogs, {
    locHistory: item.locationHistory,
  });

  if (!locationLogs) return null;

  return (
    <AccordionItem value={item._id}>
      <AccordionTrigger>
        {multiplePieces && "1x at"} {item.currentLocation.name} -{" "}
        {format(locationLogs[0]._creationTime, "dd.MM")} (
        {formatDistanceToNow(locationLogs[0]._creationTime, {
          addSuffix: true,
        })}
        )
      </AccordionTrigger>
      <AccordionContent>
        <div className="px-6 py-4">
          <div className="relative">
            {/* The continuous vertical line */}
            <div className="absolute left-[7px] top-0 h-full w-0.5 bg-muted-foreground/30"></div>

            {locationLogs.map((log, index) => (
              <div key={log._id} className="relative flex gap-4 pb-8 last:pb-0">
                {/* Timeline dot positioned on the line */}
                <div
                  className={`absolute left-0 top-0 mt-0.5 h-4 w-4 rounded-full ${
                    index !== 0 ? "bg-secondary" : "bg-primary"
                  }`}
                />

                {/* Placeholder to push content to the right of the dot and line */}
                <div className="w-4 flex-shrink-0" />

                {/* Log details */}
                <div className="flex-1">
                  <div className="font-medium">{log.loc.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {format(log._creationTime, "MMMM d, yyyy")} (
                    {formatDistanceToNow(log._creationTime, {
                      addSuffix: true,
                    })}
                    )
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
