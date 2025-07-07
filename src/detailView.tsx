import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Dialog, DialogContent } from "./components/ui/dialog";
import { ClothingPiece, type ClothingInfoItem } from "./view";
import { Color } from "convex/schema";
import BrandInput from "./newItemInputs/brandInput";
import TypesInput from "./newItemInputs/typesInput";
import { format, formatDistanceToNow } from "date-fns";
import ColorInput from "./newItemInputs/colorInput";
import { Card } from "./components/ui/card";
import { XIcon } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./components/ui/accordion";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export default function DetailView({
  open,
  setOpen,
  item,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  item: ClothingInfoItem;
}) {
  const [selectedColors, setSelectedColors] = useState<Color[]>(item.colors);
  const [brandInput, setBrandInput] = useState(item.brand);

  const [types, setTypes] = useState<string[]>(item.types);
  const multiplePieces = item.pieces.length > 1;

  useEffect(() => {
    setBrandInput(item.brand);
    setTypes(item.types);
    setSelectedColors(item.colors);
  }, [item]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-md p-0 max-h-[90vh] overflow-y-auto">
        <div className="relative">
          <div className="flex flex-col gap-2">
            <img
              src={item.imageURL ?? ""}
              alt={item.brand}
              className="aspect-square w-full object-cover"
            />
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
