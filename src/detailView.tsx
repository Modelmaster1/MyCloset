import {
  Dispatch,
  SetStateAction,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { type ClothingInfoItem } from "./view";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { type Color } from "convex/schema";
import { XIcon, PlusIcon, LoaderCircleIcon, TrashIcon } from "lucide-react";

// Data from NewItem.tsx
const existingBrands = [
  "Nike",
  "Adidas",
  "Puma",
  "Reebok",
  "Converse",
  "New Balance",
  "Asics",
  "Vans",
  "Fila",
  "Champion",
  "Reef",
  "Superdry",
  "Under Armour",
  "Mizuno",
  "Uniqlo",
  "Hugo Boss",
  "Lululemon",
  "Athleta",
  "Lacoste",
];

export const existingTypes = [
  "polo",
  "shirt",
  "dress",
  "jacket",
  "sweater",
  "t-shirt",
  "shorts",
  "pants",
  "skirt",
  "blouse",
  "sweatshirt",
  "linen",
  "jumper",
  "cardigan",
  "coat",
  "vest",
  "blazer",
  "jeans",
  "leggings",
  "trousers",
  "socks",
  "hat",
  "underwear",
];

const availableColors: {
  tailclass: string;
  color: Color;
  favourite: boolean;
}[] = [
  // Rainbow order
  {
    tailclass: "bg-red-500 dark:bg-red-600 text-white",
    color: "red",
    favourite: true,
  },
  {
    tailclass: "bg-orange-500 dark:bg-orange-600 text-white",
    color: "orange",
    favourite: false,
  },
  {
    tailclass: "bg-yellow-400 dark:bg-yellow-500 text-black dark:text-black",
    color: "yellow",
    favourite: false,
  },
  {
    tailclass: "bg-green-500 dark:bg-green-600 text-white",
    color: "green",
    favourite: true,
  },
  {
    tailclass: "bg-blue-500 dark:bg-blue-600 text-white",
    color: "blue",
    favourite: true,
  },
  {
    tailclass: "bg-purple-500 dark:bg-purple-600 text-white",
    color: "purple",
    favourite: false,
  },
  {
    tailclass: "bg-pink-500 dark:bg-pink-600 text-white",
    color: "pink",
    favourite: false,
  },

  // Earth tone
  {
    tailclass: "bg-amber-950 dark:bg-amber-950 text-white",
    color: "brown",
    favourite: true,
  },
  {
    tailclass: "bg-[#F5F5DC] dark:bg-[#E8E6D9] text-black",
    color: "beige",
    favourite: true,
  },

  // Neutrals
  {
    tailclass: "bg-white dark:bg-gray-100 text-black",
    color: "white",
    favourite: true,
  },
  {
    tailclass: "bg-gray-500 dark:bg-gray-600 text-white",
    color: "gray",
    favourite: true,
  },
  { tailclass: "bg-black text-white", color: "black", favourite: true },
];

export default function DetailView({
  open,
  setOpen,
  item,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  item: ClothingInfoItem;
}) {
  const [brandInput, setBrandInput] = useState(item.brand);
  const [showBrandSuggestions, setShowBrandSuggestions] = useState(false);

  const [currentTypes, setCurrentTypes] = useState(item.types);
  const [newTypeInput, setNewTypeInput] = useState("");
  const [showTypesSuggestions, setShowTypesSuggestions] = useState(false);

  const [selectedColors, setSelectedColors] = useState<Color[]>(
    item.colors ?? [],
  );
  const [showAllColors, setShowAllColors] = useState(false);

  const [loading, setLoading] = useState(false);

  const updateClothingItem = useMutation(api.clothingItems.update);
  const deleteClothingItem = useMutation(api.clothingItems.delete);

  useEffect(() => {
    if (item) {
      setBrandInput(item.brand);
      setCurrentTypes(item.types);
      setSelectedColors(item.colors ?? []);
    }
  }, [item]);

  const filteredBrands = existingBrands.filter((b) =>
    b.toLowerCase().includes(brandInput.toLowerCase()),
  );

  const filteredTypes = existingTypes.filter((t) =>
    t.toLowerCase().includes(newTypeInput.toLowerCase()),
  );

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateClothingItem({
        id: item._id,
        brand: brandInput,
        types: currentTypes,
        colors: selectedColors,
      });
    } catch (error) {
      console.error("Failed to update item", error);
      // Consider adding user-facing error feedback
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  const handleDelete = async () => {
    setLoading(true);
    try {
      await deleteClothingItem({ id: item._id });
    } catch (error) {
      console.error("Failed to delete item", error);
      // Consider adding user-facing error feedback
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Item</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="flex flex-col gap-4">
            <img
              src={item.imageURL ?? ""}
              alt={item.brand}
              className="rounded-lg object-cover w-full aspect-square"
            />
            <div className="grid w-full items-center gap-2">
              <Label>Location(s)</Label>
              <div className="flex flex-wrap gap-2">
                {item.pieces.map((piece) => (
                  <div
                    key={piece._id}
                    className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md text-sm"
                  >
                    {piece.currentLocation.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="brand">Brand</Label>
              <div className="relative">
                <Input
                  type="text"
                  id="brand"
                  placeholder="e.g., Nike"
                  value={brandInput}
                  onChange={(e) => {
                    setBrandInput(e.target.value);
                    setShowBrandSuggestions(true);
                  }}
                  onFocus={() => setShowBrandSuggestions(true)}
                  onBlur={() =>
                    setTimeout(() => setShowBrandSuggestions(false), 200)
                  }
                />
                {showBrandSuggestions && filteredBrands.length > 0 && (
                  <div className="absolute w-full bg-white dark:bg-neutral-800 border rounded-md mt-1 max-h-48 overflow-y-auto z-10">
                    {filteredBrands.map((brand, index) => (
                      <div
                        key={index}
                        className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-neutral-600 cursor-pointer"
                        onMouseDown={() => {
                          setBrandInput(brand);
                          setShowBrandSuggestions(false);
                        }}
                      >
                        {brand}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="type">Types</Label>
              {currentTypes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentTypes.map((type, index) => (
                    <button
                      onClick={() =>
                        setCurrentTypes(currentTypes.filter((t) => t !== type))
                      }
                      key={index}
                      className="flex gap-1 cursor-pointer items-center bg-neutral-200 dark:bg-neutral-800 p-1 px-2 rounded-sm text-sm"
                    >
                      {type}
                      <XIcon className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}
              <div className="relative">
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    id="type"
                    placeholder="Add a type"
                    value={newTypeInput}
                    onChange={(e) => {
                      setNewTypeInput(e.target.value);
                      setShowTypesSuggestions(true);
                    }}
                    onFocus={() => setShowTypesSuggestions(true)}
                    onBlur={() =>
                      setTimeout(() => setShowTypesSuggestions(false), 200)
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newTypeInput.trim() !== "") {
                        setCurrentTypes([
                          ...currentTypes,
                          newTypeInput.trim(),
                        ]);
                        setNewTypeInput("");
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    variant="outline"
                    onClick={() => {
                      if (newTypeInput.trim() !== "") {
                        setCurrentTypes([
                          ...currentTypes,
                          newTypeInput.trim(),
                        ]);
                        setNewTypeInput("");
                      }
                    }}
                  >
                    <PlusIcon className="h-4 w-4" />
                  </Button>
                </div>
                {showTypesSuggestions && filteredTypes.length > 0 && (
                  <div className="absolute w-full bg-white dark:bg-neutral-800 border rounded-md mt-1 max-h-48 overflow-y-auto z-10">
                    {filteredTypes.map((type, index) => (
                      <div
                        key={index}
                        className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-neutral-600 cursor-pointer"
                        onMouseDown={() => {
                          setCurrentTypes([...currentTypes, type]);
                          setNewTypeInput("");
                          setShowTypesSuggestions(false);
                        }}
                      >
                        {type}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid w-full items-center gap-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {availableColors.map(
                  (colorOption) =>
                    (colorOption.favourite || showAllColors) && (
                      <div
                        key={colorOption.color}
                        className="flex flex-col items-center relative group"
                      >
                        <button
                          className={`w-8 h-8 rounded-full ${colorOption.tailclass} ring-offset-background transition-all hover:scale-110 ${selectedColors.includes(colorOption.color) ? "ring-2 ring-ring" : ""}`}
                          onClick={() => {
                            if (selectedColors.includes(colorOption.color)) {
                              setSelectedColors(
                                selectedColors.filter(
                                  (c) => c !== colorOption.color,
                                ),
                              );
                            } else {
                              setSelectedColors([
                                ...selectedColors,
                                colorOption.color,
                              ]);
                            }
                          }}
                          type="button"
                        />
                        <div className="text-xs text-muted-foreground mt-1 capitalize">
                          {colorOption.color}
                        </div>
                      </div>
                    ),
                )}
              </div>
              <Button
                onClick={() => setShowAllColors(!showAllColors)}
                size="sm"
                className="w-fit text-xs p-0"
                variant="link"
              >
                Show {showAllColors ? "less" : "more"}
              </Button>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              <>
                <TrashIcon className="h-4 w-4 mr-2" />
                Delete
              </>
            )}
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? (
              <LoaderCircleIcon className="animate-spin" />
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}