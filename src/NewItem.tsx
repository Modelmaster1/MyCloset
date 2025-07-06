import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "./components/ui/button";
import {
  CloudUploadIcon,
  EyeIcon,
  LightbulbIcon,
  PlusIcon,
  XIcon,
} from "lucide-react";
import { Card } from "./components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import { Color } from "convex/schema";

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

const existingTypes = [
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
  "underwear"
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

export default function NewItemForm() {
  const [files, setFiles] = useState<File[]>([]);

  const handleFilesAccepted = useCallback((files: File[]) => {
    setFiles(files);
  }, []);
  return (
    <>
      <Dialog>
        <DialogTrigger asChild>
          <Button>New Item</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add new Items</DialogTitle>
            <DialogDescription>
              To get started drag the image files into the drop zone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 max-h-[80vh] overflow-y-auto -m-1 p-1">
            <FileDropzone
              onFilesAccepted={handleFilesAccepted}
              acceptedFileTypes={["image/png", "image/jpeg"]}
            />
            {files.map((file) => (
              <SingleItemForm key={file.name} file={file} />
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SingleItemForm({ file }: { file: File }) {
  const imageURL = URL.createObjectURL(file);
  const [amount, setAmount] = useState(1);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedColors, setSelectedColors] = useState<Color[]>([]);
  const [showAllColors, setShowAllColors] = useState(false);
  const [brandInput, setBrandInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [types, setTypes] = useState<string[]>([]);
  const [newTypeInput, setNewTypeInput] = useState("");
  const [showTypesSuggestions, setShowTypesSuggestions] = useState(false);

  // Filter brands based on input
  const filteredBrands = existingBrands.filter((brand) =>
    brand.toLowerCase().includes(brandInput.toLowerCase()),
  );

  // Filter types based on input
  const filteredTypes = existingTypes.filter((type) =>
    type.toLowerCase().includes(newTypeInput.toLowerCase()),
  );

  const handleBrandKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    input: string,
    filList: string[],
    isBrand = true,
  ) => {
    if (e.key === "." && input) {
      e.preventDefault();
      if (filList.length > 0) {
        if (isBrand) {
          setBrandInput(filList[0]);
        } else {
          setNewTypeInput(filList[0]);
        }
      }
      setShowSuggestions(false);
      setShowTypesSuggestions(false);
    }

    if (e.key === "Enter" && input && !isBrand) {
      e.preventDefault();
      if (input.length > 0) {
        setTypes([...types, input]);
        setNewTypeInput("");
      }
      setShowSuggestions(false);
      setShowTypesSuggestions(false);
    }
  };

  return (
    <Card className="p-0">
      <Accordion type="single" collapsible>
        <AccordionItem value="item-1">
          <AccordionTrigger className="flex items-center bg-black/40 p-2 hover:no-underline cursor-pointer">
            <div className="flex items-center gap-2">
              <div className="relative">
                <img
                  src={imageURL}
                  alt={file.name}
                  className="h-8 w-8 rounded-md"
                />
              </div>
              <div className="">{file.name}</div>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
              <DialogContent className="sm:max-w-[800px] w-fit">
                <DialogHeader>
                  <DialogTitle>{file.name}</DialogTitle>
                </DialogHeader>
                <div className="relative rounded-lg overflow-hidden">
                  <img
                    src={imageURL}
                    alt={file.name}
                    className="object-contain max-h-[50vh]"
                  />
                </div>
              </DialogContent>
            </Dialog>
            <div className="p-2">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center justify-end">
                  <div className="flex gap-1 opacity-50">
                    <LightbulbIcon className="h-4 w-4" />
                    <div>Press . to autofill</div>
                  </div>
                  <Button
                    size="sm"
                    className="text-xs font-normal w-fit"
                    variant="secondary"
                    onClick={() => setShowImagePreview(true)}
                  >
                    <EyeIcon />
                    Preview Image
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {}}
                    size="sm"
                    className="text-xs font-normal w-fit"
                  >
                    Remove
                  </Button>
                </div>

                <div className="grid w-full items-center gap-3 mb-3">
                  <Label htmlFor="brand">Brand</Label>
                  <div className="relative">
                    <Input
                      type="text"
                      id="brand"
                      placeholder="e.g., Nike"
                      value={brandInput}
                      onChange={(e) => {
                        setBrandInput(e.target.value);
                        setShowSuggestions(true);
                      }}
                      onKeyDown={(e) =>
                        handleBrandKeyDown(e, brandInput, filteredBrands)
                      }
                      onFocus={() => setShowSuggestions(true)}
                      onBlur={() => {
                        // Delay hiding suggestions to allow clicking them
                        setTimeout(() => setShowSuggestions(false), 200);
                      }}
                    />
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
                          handleBrandKeyDown(
                            e,
                            newTypeInput,
                            filteredTypes,
                            false,
                          )
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
                <div className="grid w-full items-center gap-3 mt-4">
                  <Label htmlFor="amount">Amount</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setAmount(Math.max(1, amount - 1))}
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      id="amount"
                      value={amount}
                      onChange={(e) => setAmount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-20 text-center"
                      min="1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => setAmount(amount + 1)}
                    >
                      +
                    </Button>
                  </div>
                </div>
                <div className="grid w-full items-center gap-3 mt-4 mb-3">
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
                              className={`w-8 h-8 rounded-full ${colorOption.tailclass} ring-offset-2 ring-offset-white transition-all hover:scale-110 ${selectedColors.includes(colorOption.color) ? "ring-2 ring-black dark:ring-slate-300" : ""} dark:ring-offset-gray-900`}
                              onClick={() => {
                                if (
                                  selectedColors.includes(colorOption.color)
                                ) {
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
                            <div className="text-xs text-neutral-400 mt-2">
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
                  <Button
                    onClick={() => setShowAllColors(!showAllColors)}
                    size="sm"
                    className="w-fit text-xs p-0 hover:p-2"
                    variant="ghost"
                  >
                    Show {showAllColors ? "less" : "more"}
                  </Button>
                </div>
                
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </Card>
  );
}

interface FileDropzoneProps {
  onFilesAccepted?: (files: File[]) => void;
  acceptedFileTypes?: string[]; // e.g., ['image/png', 'image/jpeg', '.pdf']
}

function FileDropzone({
  onFilesAccepted,
  acceptedFileTypes,
}: FileDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault(); // Prevent default to allow drop
      setIsDragOver(true);
    },
    [],
  );

  const handleDragLeave = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);
    },
    [],
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragOver(false);

      const files = Array.from(event.dataTransfer.files);
      if (onFilesAccepted) {
        // Filter files based on acceptedFileTypes if provided
        const filteredFiles = acceptedFileTypes
          ? files.filter((file) => {
              if (acceptedFileTypes.includes(file.type)) {
                return true;
              }
              const fileExtension = "." + file.name.split(".").pop();
              return acceptedFileTypes.includes(fileExtension);
            })
          : files;
        onFilesAccepted(filteredFiles);
      }
    },
    [onFilesAccepted, acceptedFileTypes],
  );

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      if (onFilesAccepted) {
        const filteredFiles = acceptedFileTypes
          ? files.filter((file) => {
              if (acceptedFileTypes.includes(file.type)) {
                return true;
              }
              const fileExtension = "." + file.name.split(".").pop();
              return acceptedFileTypes.includes(fileExtension);
            })
          : files;
        onFilesAccepted(filteredFiles);
      }
    },
    [onFilesAccepted, acceptedFileTypes],
  );

  return (
    <div
      className={`relative flex min-h-[160px] items-center justify-center rounded-md outline-dashed outline-2 transition-colors ${
        isDragOver ? "opacity-80" : ""
      }`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        id="file-upload"
        type="file"
        className="absolute inset-0 z-20 cursor-pointer opacity-0" // Ensure z-index is higher than anything else
        onChange={handleFileSelect}
        multiple // Allow multiple file selection
        accept={acceptedFileTypes ? acceptedFileTypes.join(",") : undefined}
      />
      <div className="z-10 flex flex-col items-center gap-2 text-gray-500 dark:text-gray-400">
        <CloudUploadIcon className="h-10 w-10" />
        <p className="text-center text-sm sm:text-base">
          Drag and drop images here, or{" "}
          <label
            htmlFor="file-upload"
            className="cursor-pointer dark:text-white/80 text-black hover:underline"
          >
            click to browse
          </label>
        </p>
        {acceptedFileTypes && (
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            (Accepted:{" "}
            {acceptedFileTypes
              .map((type) => {
                if (type.startsWith(".")) return type; // file extensions
                return type.split("/")[1] || type; // just the subtype for MIME types
              })
              .join(", ")}
            )
          </p>
        )}
      </div>
    </div>
  );
}
