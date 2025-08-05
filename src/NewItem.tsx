import { useState, useCallback, useEffect, useMemo } from "react";
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
  Check,
  ChevronsUpDown,
  PlusCircle,
  LoaderCircleIcon,
  CircleAlertIcon,
} from "lucide-react";
import { Card } from "./components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Label } from "./components/ui/label";
import { Color } from "convex/schema";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { cn } from "@/lib/utils";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import BrandInput from "./newItemInputs/brandInput";
import TypesInput from "./newItemInputs/typesInput";
import AmountInput from "./newItemInputs/amountInput";
import ColorInput from "./newItemInputs/colorInput";
import { convertToWebp } from "./compressAndConvertImage";

interface ClothingInfoFormItem {
  placeholderID: string;
  file: File;
  brand: string;
  colors: Color[];
  types: string[];
  amount: number;

  hasError?: boolean;
  errors?: ("types" | "colors" | "amount" | "upload" | "network")[];
}

export default function NewItemForm() {
  const [items, setItems] = useState<ClothingInfoFormItem[]>([]);
  const [location, setLocation] = useState<Id<"locations"> | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const locations = useQuery(api.locations.list);
  const createLocation = useMutation(api.locations.create);
  const generateUploadUrl = useMutation(api.upload.generateUploadUrl);
  const createClothingItem = useMutation(api.clothingItems.create);

  const handleFilesAccepted = useCallback(async (files: File[]) => {
    const newClothingItems = await Promise.all(
      files.map(async (file) => {
        const webPFile = await convertToWebp(file);

        if (!webPFile) {
          console.error("Image conversion failed. Cannot upload.");
          throw new Error(`Image conversion failed. Cannot upload.`);
        }

        return {
          placeholderID: crypto.randomUUID() + file.name,
          file: webPFile, // Use the converted WebP file
          brand: "",
          colors: [],
          types: [],
          amount: 1,
        };
      }),
    );
    setItems((prevItems) => [...prevItems, ...newClothingItems]);
  }, []);

  function handleItemDataChange(item: ClothingInfoFormItem) {
    setItems(items.map((i) => (i.file === item.file ? item : i)));
  }

  function handleRemoveItem(item: ClothingInfoFormItem) {
    setItems(items.filter((i) => i.file !== item.file));
  }

  async function addItems() {
    setLoading(true);

    if (!location) {
      alert("Please select a location.");
      setLoading(false);
      return;
    }

    // This will store the results for each item, including success/failure status
    const processingResults: Array<{
      originalItem: ClothingInfoFormItem;
      processedData?: {
        storageId: Id<"_storage">;
        colors: Color[];
        brand?: string;
        types: string[];
        piecesAmount: number;
      };
      error?: {
        type: ("types" | "colors" | "amount" | "upload" | "network")[];
        message: string;
      };
    }> = [];

    // Use Promise.allSettled to process all items independently,
    // even if some promises reject (though we're handling rejections within the map)
    const itemPromises = items.map(async (item, index) => {
      let currentItemErrors: ("types" | "colors" | "amount" | "upload")[] = [];

      // --- Client-side validation for mandatory fields ---
      if (item.colors.length === 0) {
        currentItemErrors.push("colors");
      }

      if (item.types.length === 0) {
        currentItemErrors.push("types");
      }

      if (item.amount === 0) {
        currentItemErrors.push("amount");
      }

      if (currentItemErrors.length > 0) {
        processingResults.push({
          originalItem: {
            ...item,
            hasError: true,
            errors: currentItemErrors,
          },
        });
        return; // Skip to next item in map, but don't stop Promise.all
      }

      // --- File Upload ---
      try {
        const postUrl = await generateUploadUrl();

        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": item.file.type }, // ! is okay here as we assume file exists if validation passed
          body: item.file,
        });

        if (!result.ok) {
          const errorDetail = await result
            .text()
            .catch(() => "No error detail available");
          throw new Error(
            `Upload failed with status ${result.status}: ${errorDetail}`,
          );
        }

        const { storageId } = await result.json();

        const processedData = {
          storageId: storageId as Id<"_storage">,
          colors: item.colors,
          brand: item.brand.trim() === "" ? undefined : item.brand,
          types: item.types,
          piecesAmount: item.amount,
        };

        processingResults.push({
          originalItem: item,
          processedData: processedData,
        });
      } catch (error) {
        console.error(
          `Error uploading file for item ${item.placeholderID || index}:`,
          error,
        );
        processingResults.push({
          originalItem: {
            ...item,
            hasError: true,
            errors: ["upload"],
          },
        });
      }
    });

    // Wait for all individual item processing to complete
    await Promise.all(itemPromises);

    // Filter out successfully processed items to be sent to createClothingItem
    const itemsToSendToBackend = processingResults
      .filter((res) => res.processedData)
      .map((res) => res.processedData!); // ! because we filtered for non-null

    // --- Backend call for successful items ---
    let backendCallSuccessful = false;
    let itemsThatFailedBackendCall: ClothingInfoFormItem[] = []; // To re-add these if backend fails

    if (itemsToSendToBackend.length > 0) {
      try {
        await createClothingItem({
          items: itemsToSendToBackend,
          location: location,
        });
        backendCallSuccessful = true;
      } catch (error) {
        console.error("Error creating clothing items in backend:", error);
        alert(
          "Some items were uploaded but failed to be saved. Please contact support.",
        );
        // Identify which original items correspond to the items that failed the backend call
        itemsThatFailedBackendCall = processingResults
          .filter((res) => res.processedData) // These were ready for backend
          .map((res) => ({
            ...res.originalItem,
            hasError: true,
            errors: [...(res.originalItem.errors || []), "network"], // Add a 'network' or 'backend' error type
            errorMessage: `Failed to save to backend: ${error instanceof Error ? error.message : "Unknown error"}`,
          }));
      }
    } else {
      // If no items were valid or uploaded, inform the user
      if (processingResults.every((res) => res.originalItem.hasError)) {
        alert("No valid items were found to add. Please correct the errors.");
      }
    }

    // --- Update the main `items` state based on what was *not* sent/saved successfully ---
    // We want to keep items that:
    // 1. Failed client-side validation
    // 2. Failed file upload
    // 3. Were successfully uploaded but failed the backend `createClothingItem` call
    const itemsToRetainInForm = processingResults
      .filter((res) => {
        // Retain if it had validation/upload errors
        if (res.originalItem.hasError) return true;

        // Retain if it was processed for backend, but the backend call itself failed
        if (res.processedData && !backendCallSuccessful) return true; // It means it was intended for backend but failed there

        return false; // Otherwise, it was successfully sent and saved, so remove it
      })
      .map((res) => {
        // For items that failed the backend call, we need to return their updated error state
        if (res.processedData && !backendCallSuccessful) {
          // Find the specific item in itemsThatFailedBackendCall
          return (
            itemsThatFailedBackendCall.find(
              (failedItem) =>
                failedItem.placeholderID === res.originalItem.placeholderID,
            ) || res.originalItem
          );
        }
        return res.originalItem; // For client-side/upload errors, originalItem already has errors
      });

    setItems(itemsToRetainInForm);

    setLoading(false);

    // --- Conditional `setOpen(false)` logic ---
    // Only close if all items were *successfully* processed and saved to the backend.
    // This means the number of original items equals the number of items that were successfully
    // sent and the backend call itself succeeded for those items.
    if (
      items.length > 0 &&
      items.length === itemsToSendToBackend.length &&
      backendCallSuccessful
    ) {
      setOpen(false);
    } else if (items.length === 0) {
      setOpen(false); // No items were present initially, so close
    } else {
      // Keep form open if some items failed or were skipped.
      // The UI should now show the errors on the retained items.
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="link">New Item</Button>
        </DialogTrigger>
        <DialogContent className="rounded-none">
          <DialogHeader>
            <DialogTitle>Add new Items</DialogTitle>
            <DialogDescription>
              To get started drag the image files into the drop zone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 max-h-[80vh] overflow-y-auto -m-1 p-1">
            <FileDropzone
              onFilesAccepted={handleFilesAccepted}
              acceptedFileTypes={["image/png", "image/jpeg", "image/webp"]}
            />
            <div className="flex gap-2 items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="location">Location</Label>
                <p className="text-xs opacity-50">
                  Select a location to add the items to.
                </p>
              </div>
              <SearchableCreateSelect
                options={
                  locations
                    ? locations.map((location) => ({
                        value: location._id,
                        label: location.name,
                      }))
                    : [{ value: "", label: "loading..." }]
                }
                value={location ?? ""}
                onValueChange={(value) => {
                  setLocation(value as Id<"locations"> | null);
                }}
                placeholder="Select a location..."
                emptyMessage="No location found."
                onCreateNew={async (newLocName) => {
                  if (newLocName.trim() === "") return;
                  const locId = await createLocation({ name: newLocName });
                  setLocation(locId);
                }}
              />
            </div>

            {items.map((item) => (
              <SingleItemForm
                handleRemoveItem={handleRemoveItem}
                handleItemDataChange={handleItemDataChange}
                key={item.placeholderID}
                item={item}
              />
            ))}
          </div>
          <div className="flex justify-end">
            <Button
              className="rounded-none"
              onClick={addItems}
              disabled={items.length <= 0}
            >
              {loading ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                `Add ${items.length} Item${items.length > 1 ? "s" : ""}`
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SingleItemForm({
  item,
  handleItemDataChange,
  handleRemoveItem,
}: {
  item: ClothingInfoFormItem;
  handleRemoveItem: (item: ClothingInfoFormItem) => void;
  handleItemDataChange: (item: ClothingInfoFormItem) => void;
}) {
  const imageURL = URL.createObjectURL(item.file);
  const [amount, setAmount] = useState(1);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [selectedColors, setSelectedColors] = useState<Color[]>([]);
  const [brandInput, setBrandInput] = useState("");

  const [types, setTypes] = useState<string[]>([]);

  const errors = () => {
    if (!item.errors) return;
    var errors: ("types" | "colors")[] = [];
    if (types.length === 0) errors.push("types");
    if (selectedColors.length === 0) errors.push("colors");
    const result = errors.length > 0 ? errors : undefined;
    return result;
  };

  useEffect(() => {
    const newItem = {
      placeholderID: item.placeholderID,
      file: item.file,
      brand: brandInput,
      colors: selectedColors,
      types: types,
      amount: amount,
      errors: errors(),
    };
    handleItemDataChange(newItem);
  }, [brandInput, selectedColors, types, amount]);

  return (
    <Card className="p-0 rounded-none">
      <Accordion type="single" collapsible>
        <AccordionItem
          value="item-1"
          className={item.errors && "outline outline-red-700"}
        >
          <AccordionTrigger
            className={`flex items-center rounded-none ${item.errors ? "bg-red-900/10" : "bg-black/40"} p-2 hover:no-underline cursor-pointer`}
          >
            <div className="flex items-center gap-2">
              <div className="relative">
                <img
                  src={imageURL}
                  alt={item.file.name}
                  className="h-8 w-8 rounded-none"
                />
              </div>
              <div className="">{item.file.name}</div>
              {item.errors && (
                <CircleAlertIcon className="h-4 w-4 text-red-500" />
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <Dialog open={showImagePreview} onOpenChange={setShowImagePreview}>
              <DialogContent className="sm:max-w-[800px] p-0 w-fit rounded-none">
                <DialogHeader className="p-2 pt-3">
                  <DialogTitle>{item.file.name}</DialogTitle>
                </DialogHeader>
                <div className="relative rounded-none overflow-hidden">
                  <img
                    src={imageURL}
                    alt={item.file.name}
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
                    <div>Press ß to autofill</div>
                  </div>
                  <Button
                    size="sm"
                    className="text-xs font-normal w-fit rounded-none"
                    variant="secondary"
                    onClick={() => setShowImagePreview(true)}
                  >
                    <EyeIcon />
                    Preview Image
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleRemoveItem(item)}
                    size="sm"
                    className="text-xs font-normal w-fit rounded-none"
                  >
                    Remove
                  </Button>
                </div>

                <BrandInput
                  brandInput={brandInput}
                  setBrandInput={setBrandInput}
                />
                <TypesInput
                  hasError={item.errors?.includes("types")}
                  types={types}
                  setTypes={setTypes}
                />
                <AmountInput amount={amount} setAmount={setAmount} />
                <ColorInput
                  selectedColors={selectedColors}
                  setSelectedColors={setSelectedColors}
                  hasError={item.errors?.includes("colors")}
                />
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
      className={`relative flex min-h-[160px] items-center justify-center rounded-none outline-dashed outline-2 transition-colors ${
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

interface Option {
  value: string;
  label: string;
}

interface SearchableCreateSelectProps {
  options: Option[];
  placeholder?: string;
  emptyMessage?: string;
  onCreateNew?: (newValue: string) => void;
  onValueChange?: (value: string) => void;
  value?: string;
  disabled?: boolean;
}

export function SearchableCreateSelect({
  options,
  placeholder = "Select an item...",
  emptyMessage = "No item found.",
  onCreateNew,
  onValueChange,
  value,
  disabled = false,
}: SearchableCreateSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const filteredOptions = useMemo(() => {
    if (!searchValue) {
      return options;
    }
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [options, searchValue]);

  const handleSelect = (currentValue: string) => {
    // If the selected value is the special "create-new" value
    if (currentValue === `create-new-${searchValue.toLowerCase()}`) {
      onCreateNew?.(searchValue);
      onValueChange?.(searchValue); // Optionally set the new value as selected
    } else {
      onValueChange?.(currentValue === value ? "" : currentValue);
    }
    setOpen(false);
    setSearchValue(""); // Clear search when an item is selected or created
  };

  const showCreateNew =
    searchValue &&
    !options.some(
      (option) => option.label.toLowerCase() === searchValue.toLowerCase(),
    );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[200px] justify-between rounded-none"
        >
          {value
            ? options.find((option) => option.value === value)?.label || value // Fallback to value if label not found (e.g., newly created)
            : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 rounded-none">
        <Command>
          <CommandInput
            placeholder={placeholder}
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <ScrollArea className="max-h-[200px]">
              <CommandGroup>
                {filteredOptions.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={handleSelect}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0",
                      )}
                    />
                    {option.label}
                  </CommandItem>
                ))}
                {showCreateNew && (
                  <CommandItem
                    key={`create-new-${searchValue.toLowerCase()}`}
                    value={`create-new-${searchValue.toLowerCase()}`} // Unique value for create
                    onSelect={handleSelect}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create new &quot;{searchValue}&quot;
                  </CommandItem>
                )}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
