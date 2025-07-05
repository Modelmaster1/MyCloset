import { useRef, useState, FormEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export default function ClothingItemForm() {
  const generateUploadUrl = useMutation(api.upload.generateUploadUrl);

  const imageInput = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  const [brand, setBrand] = useState("");
  const [colors, setColors] = useState<string[]>([]);
  const [newColorInput, setNewColorInput] = useState("");
  const [types, setTypes] = useState<string[]>([]);
  const [newTypeInput, setNewTypeInput] = useState("");
  const [location, setLocation] = useState<Id<"locations"> | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [newLocationName, setNewLocationName] = useState("");
  const [loading, setLoading] = useState(false);
  const [aiTest, setAiTest] = useState<string | null>(null);

  const locations = useQuery(api.locations.list);
  const createLocation = useMutation(api.locations.create);
  const createClothingItem = useMutation(api.clothingItems.create);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!selectedImage) return;
    if (!location) return;

    // 1. Get a short-lived upload URL from Convex
    const postUrl = await generateUploadUrl();

    // 2. POST the file to the URL
    const result = await fetch(postUrl, {
      method: "POST",
      headers: { "Content-Type": selectedImage!.type },
      body: selectedImage,
    });
    const { storageId } = await result.json();

    createClothingItem({
      storageId: storageId,
      colors: colors as any,
      brand: brand,
      types: types,
      piecesAmount: quantity,
      location: location,
    });

    if (imageInput.current) imageInput.current.value = "";
  }

  async function AiFill() {
    if (!selectedImage) return;
    setLoading(true);
    const {
      maxWidth = 800,
      maxHeight = 800,
      quality = 0.8,
      mimeType = "image/jpeg",
    } = {};

    // 1) Read file as Data-URL
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(reader.error);
      reader.onload = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("Failed to read file as Data URL"));
      };
      reader.readAsDataURL(selectedImage);
    });

    // 2) Load into an <img> so we know its natural dimensions
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onerror = () => reject(new Error("Invalid image"));
      image.onload = () => resolve(image);
      image.src = dataUrl;
    });

    // 3) Compute scaled dimensions
    const ratio = Math.min(
      maxWidth / img.width,
      maxHeight / img.height,
      1, // don't upscale
    );
    const width = Math.round(img.width * ratio);
    const height = Math.round(img.height * ratio);

    // 4) Draw to canvas
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Cannot get 2D context on canvas");
    ctx.drawImage(img, 0, 0, width, height);

    // 5) Re-encode as Data-URL
    const compressedDataUrl = canvas.toDataURL(mimeType, quality);

    // 6) Copy the data-URL string to clipboard
    await navigator.clipboard.writeText(compressedDataUrl);
  }

  if (!locations) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="p-6 rounded-lg shadow-xl">
        <h2 className="text-3xl font-bold mb-6 text-center">
          Add New Clothing Item
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Photo Upload */}
          <div>
            <label htmlFor="photo" className="block text-sm font-medium mb-2">
              Upload Photo
            </label>
            <input
              type="file"
              accept="image/*"
              ref={imageInput}
              onChange={(e) => setSelectedImage(e.target.files![0])}
              disabled={selectedImage !== null}
            />
            {selectedImage && (
              <div className="mt-4 flex items-center space-x-4">
                <img
                  src={
                    selectedImage !== null
                      ? URL.createObjectURL(selectedImage)
                      : ""
                  }
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-lg shadow-md"
                />
                <button
                  type="button"
                  onClick={async () => await AiFill()}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                >
                  {loading ? (
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  ) : (
                    "Auto-fill with AI"
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Brand */}
          <div>
            <label htmlFor="brand" className="block text-sm font-medium  mb-2">
              Brand
            </label>
            <input
              type="text"
              id="brand"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
              placeholder="e.g., Nike"
            />
          </div>

          {/* Colors */}
          <div>
            <label className="block text-sm font-medium  mb-2">Colors</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {colors.map((color, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800"
                >
                  {color}
                  <button
                    type="button"
                    onClick={() => {
                      setColors(colors.filter((c) => c !== color));
                    }}
                    className="ml-2 -mr-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-blue-200 text-blue-800 hover:bg-blue-300"
                  >
                    <svg
                      className="h-2 w-2"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              ))}
            </div>

            <div className="flex">
              <input
                type="text"
                value={newColorInput}
                onChange={(e) => setNewColorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setColors([...colors, newColorInput]);
                    setNewColorInput("");
                  }
                }}
                className="mt-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                placeholder="Add a color (e.g., Red)"
              />
            </div>
          </div>

          {/* Types */}
          <div>
            <label className="block text-sm font-medium  mb-2">
              Types (e.g., Shirt, Polo, Casual)
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {types.map((type, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                >
                  {type}
                  <button
                    type="button"
                    onClick={() => {
                      setTypes(types.filter((t) => t !== type));
                    }}
                    className="ml-2 -mr-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-purple-200 text-purple-800 hover:bg-purple-300"
                  >
                    <svg
                      className="h-2 w-2"
                      stroke="currentColor"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
            <div className="flex">
              <input
                type="text"
                value={newTypeInput}
                onChange={(e) => setNewTypeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    setTypes([...types, newTypeInput.toLowerCase()]);
                    setNewTypeInput("");
                  }
                }}
                className="mt-1 block w-full rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
                placeholder="Add a type (e.g., shirt)"
              />
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
              >
                Add
              </button>
            </div>
          </div>

          {/* Current Location */}
          <div>
            <label
              htmlFor="currentLocation"
              className="block text-sm font-medium  mb-2"
            >
              Current Location
            </label>
            <select
              id="currentLocation"
              value={location ?? undefined}
              onChange={(e) =>
                setLocation(e.target.value as Id<"locations"> | null)
              }
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            >
              <option value="">Select a location</option>
              {locations.map((loc) => (
                <option key={loc._id} value={loc._id}>
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label
              htmlFor="quantity"
              className="block text-sm font-medium  mb-2"
            >
              Quantity (for identical items)
            </label>
            <input
              type="number"
              id="quantity"
              value={quantity}
              onChange={(e) =>
                setQuantity(Math.max(1, parseInt(e.target.value, 10)))
              }
              min="1"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 p-2 border"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-center">
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300 transform hover:scale-105"
            >
              Add Item
            </button>
          </div>
        </form>
        {aiTest}
      </div>
      <div className="flex gap-2">
        <input
          value={newLocationName}
          onChange={(e) => setNewLocationName(e.target.value)}
          placeholder="Location Name"
        />
        <button
          onClick={async () => {
            if (newLocationName.trim() === "") return;
            await createLocation({ name: newLocationName });
            setNewLocationName("");
          }}
        >
          Add Location
        </button>
      </div>
    </div>
  );
}
