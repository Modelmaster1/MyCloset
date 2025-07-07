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
  "underpants",
];

export default function TypesInput({
  types,
  setTypes,
  simpleInput = false,
}: {
  types: string[];
  setTypes: React.Dispatch<React.SetStateAction<string[]>>;
  simpleInput?: boolean;
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

  const props = {
    type: "text",
    id: "type",
    placeholder: "new type",
    value: newTypeInput,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setNewTypeInput(e.target.value);
      setShowTypesSuggestions(true);
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) =>
      handleBrandKeyDown(e, newTypeInput, filteredTypes),
    onFocus: () => setShowTypesSuggestions(true),
    onBlur: () => {
      // Delay hiding suggestions to allow clicking them
      setTimeout(() => setShowTypesSuggestions(false), 200);
    },
  };

  return (
    <div className={`grid w-full items-center ${simpleInput ? "gap-1" : "gap-3"}`}>
      {simpleInput !== true && <Label htmlFor="type">Types</Label>}
      {types.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {types.map((type, index) => (
            <button
              onClick={() => {
                setTypes(types.filter((t) => t !== type));
              }}
              key={index}
              className={`flex cursor-pointer items-center ${simpleInput ? "" : "bg-neutral-800 p-1 px-2 gap-1" } rounded-sm text-sm`}
            >
              {type}
              <XIcon className="h-3 w-3" />
            </button>
          ))}
        </div>
      )}
      <div className="relative">
        <div className="flex items-center gap-2">
          {simpleInput == true ? (
            <>
              <input
                className="text-base font-light uppercase focus:outline-none w-full"
                {...props}
              />
              <button
                onClick={() => {
                  if (newTypeInput.trim() === "") return;
                  setTypes([...types, newTypeInput.toLowerCase()]);
                  setNewTypeInput("");
                }}
                className={"cursor-pointer" + (newTypeInput.trim() === "" ? " opacity-50" : "")}
                disabled={newTypeInput.trim() === ""}
              >
                <PlusIcon />
              </button>
            </>
          ) : (
            <>
              <Input {...props} />
              <Button
                onClick={() => {
                  if (newTypeInput.trim() === "") return;
                  setTypes([...types, newTypeInput.toLocaleLowerCase()]);
                  setNewTypeInput("");
                }}
              >
                <PlusIcon />
              </Button>
            </>
          )}
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
