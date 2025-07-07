import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Color } from "convex/schema";
import { Dispatch, SetStateAction, useState } from "react";

export default function ColorInput({
  selectedColors,
  setSelectedColors,
  simpleInput = false,
}: {
  selectedColors: Color[];
  setSelectedColors: Dispatch<SetStateAction<Color[]>>;
  simpleInput?: boolean;
}) {
  const [showAllColors, setShowAllColors] = useState(false);

  return (
    <div className={`grid w-full items-center gap-3 mt-4 ${simpleInput ? "" : "mb-3"}`}>
      {!simpleInput && <Label>Color</Label>}
      <div className="flex flex-wrap gap-2">
        {availableColors.map(
          (colorOption) =>
            (colorOption.favourite || showAllColors) && (
              <div
                key={colorOption.color}
                className="flex flex-col items-center relative group"
              >
                <button
                  className={`w-8 h-8 rounded-full ${colorOption.tailclass} ring-offset-2 ring-offset-white transition-all hover:scale-110 ${selectedColors.includes(colorOption.color) ? "ring-2 ring-black dark:ring-slate-300" : ""} dark:ring-offset-gray-900`}
                  onClick={() => {
                    if (selectedColors.includes(colorOption.color)) {
                      setSelectedColors(
                        selectedColors.filter((c) => c !== colorOption.color),
                      );
                    } else {
                      setSelectedColors([...selectedColors, colorOption.color]);
                    }
                  }}
                  type="button"
                />
                <div
                  className={`text-xs mt-2 ${simpleInput ? "uppercase scale-90 opacity-50" : "text-neutral-400"}`}
                >
                  {colorOption.color.charAt(0).toUpperCase() +
                    colorOption.color.slice(1)}
                </div>
                {selectedColors.includes(colorOption.color) && (
                  <div className="absolute -top-1 -right-1 w-3 h-3 bg-slate-300 rounded-full border-2 border-white dark:border-gray-900" />
                )}
              </div>
            ),
        )}
      </div>
      {simpleInput ? (
        <button onClick={() => setShowAllColors(!showAllColors)} className="text-xs w-fit opacity-50">
          Show {showAllColors ? "less" : "more"}
        </button>
      ) : (
        <Button
          onClick={() => setShowAllColors(!showAllColors)}
          size="sm"
          className="w-fit text-xs p-0 hover:p-2"
          variant="ghost"
        >
          Show {showAllColors ? "less" : "more"}
        </Button>
      )}
    </div>
  );
}

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
