import { Dispatch, SetStateAction, useState } from "react";
import { Dialog, DialogContent } from "./components/ui/dialog";
import { type ClothingInfoItem } from "./view";
import { Color } from "convex/schema";
import BrandInput from "./newItemInputs/brandInput";
import TypesInput from "./newItemInputs/typesInput";
import { format } from "date-fns";
import ColorInput from "./newItemInputs/colorInput";
import { Card } from "./components/ui/card";

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

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="w-md p-0">
        <div className="flex flex-col gap-2">
          <img
            src={item.imageURL ?? ""}
            alt={item.brand}
            className="h-62 w-full object-cover"
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
            {false && item.pieces.map((piece) => (
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
      </DialogContent>
    </Dialog>
  );
}
