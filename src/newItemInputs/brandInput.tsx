import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dispatch, SetStateAction, useState } from "react";

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

export default function BrandInput({
  brandInput,
  setBrandInput,
  simpleInput = false,
}: {
  brandInput: string;
  setBrandInput: Dispatch<SetStateAction<string>>;
  simpleInput?: boolean;
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);

  const filteredBrands = existingBrands.filter((brand) =>
    brand.toLowerCase().includes(brandInput.toLowerCase()),
  );

  const props = {
    type: "text",
    id: "brand",
    placeholder: "brand name",
    value: brandInput,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setBrandInput(e.target.value.toLowerCase());
      setShowSuggestions(true);
    },
    onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => 
      handleBrandKeyDown(e, brandInput, filteredBrands),
    onFocus: () => setShowSuggestions(true),
    onBlur: () => {
      // Delay hiding suggestions to allow clicking them
      setTimeout(() => setShowSuggestions(false), 200);
    }
  }

  function handleBrandKeyDown(
    e: React.KeyboardEvent<HTMLInputElement>,
    input: string,
    filList: string[],
  ) {
    if (e.key === "ß" && input) {
      e.preventDefault();
      if (filList.length > 0) {
        setBrandInput(filList[0]);
      }
      setShowSuggestions(false);
    }
  }

  return (
    <div className="grid w-full items-center gap-3 mb-3">
      {simpleInput !== true && <Label htmlFor="brand">Brand</Label>}
      <div className="relative">
        {simpleInput == true ? (
          <input
            className="text-3xl font-light uppercase focus:outline-none"
            {...props}
          />
        ) : (
          <Input
            className="rounded-none"
            {...props}
          />
        )}
        {showSuggestions && filteredBrands.length > 0 && (
          <div className="absolute w-full bg-white dark:bg-neutral-800 border rounded-md mt-2 max-h-48 overflow-y-auto z-10">
            {filteredBrands.map((brand, index) => (
              <div
                key={index}
                className="px-3 py-1 hover:bg-gray-100 dark:hover:bg-neutral-600 cursor-pointer"
                onMouseDown={() => {
                  setBrandInput(brand);
                  setShowSuggestions(false);
                }}
              >
                {brand}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
