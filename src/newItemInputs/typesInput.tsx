import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PlusIcon, XIcon } from "lucide-react";
import { useState } from "react";

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

export default function TypesInput({
  types,
  setTypes,
}: {
  types: string[];
  setTypes: React.Dispatch<React.SetStateAction<string[]>>;
}) {
  const [showTypesSuggestions, setShowTypesSuggestions] = useState(false);
  const [newTypeInput, setNewTypeInput] = useState("");

  const filteredTypes = existingTypes.filter((type) =>
    type.toLowerCase().includes(newTypeInput.toLowerCase()),
  );

  function handleBrandKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    input: string,
    filList: string[],
  ) {
    if (e.key === "ß" && input) {
      e.preventDefault();
      if (filList.length > 0) {
        setNewTypeInput(filList[0]);
      }
      setShowTypesSuggestions(false);
    }

    if (e.key === "Enter" && input) {
      e.preventDefault();
      if (input.length > 0) {
        setTypes([...types, input]);
        setNewTypeInput("");
      }
      setShowTypesSuggestions(false);
    }
  }

  return (
    <div className="grid w-full items-center gap-3">
      <Label htmlFor="type">Types</Label>
      {types.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {types.map((type, index) => (
            <button
              onClick={() => {
                setTypes(types.filter((t) => t !== type));
              }}
              key={index}
              className="flex gap-1 cursor-pointer items-center bg-neutral-800 p-1 px-2 rounded-sm text-sm"
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
            placeholder="e.g., polo, shirt"
            value={newTypeInput}
            onChange={(e) => {
              setNewTypeInput(e.target.value);
              setShowTypesSuggestions(true);
            }}
            onKeyDown={(e) =>
              handleBrandKeyDown(e, newTypeInput, filteredTypes)
            }
            onFocus={() => setShowTypesSuggestions(true)}
            onBlur={() => {
              // Delay hiding suggestions to allow clicking them
              setTimeout(() => setShowTypesSuggestions(false), 200);
            }}
          />
          <Button
            onClick={() => {
              setTypes([...types, newTypeInput]);
              setNewTypeInput("");
            }}
          >
            <PlusIcon />
          </Button>
        </div>
        {showTypesSuggestions && filteredTypes.length > 0 && (
          <div className="absolute w-full bg-white dark:bg-neutral-800 border rounded-md mt-2 max-h-48 overflow-y-auto z-10">
            {filteredTypes.map((type, index) => (
              <div
                key={index}
                className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-neutral-600 cursor-pointer"
                onMouseDown={() => {
                  setTypes([...types, type]);
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
  );
}
