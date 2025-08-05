import { useMutation } from "convex/react";
import { Button } from "./components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { ClothingInfoItem } from "./view";
import { api } from "../convex/_generated/api";
import { useState } from "react";
import { LoaderCircleIcon } from "lucide-react";
import { convertToWebp } from "./compressAndConvertImage";

export function ConvertAlertScreen({ items }: { items: ClothingInfoItem[] }) {
  const generateUploadUrl = useMutation(api.upload.generateUploadUrl);
  const updateItemsPicIds = useMutation(api.convert.convertImage);
  const [loading, setLoading] = useState(false);

  const itemsWithOldImageType = items.filter(
    (item) => item.contentType !== "image/webp",
  );

  if (itemsWithOldImageType.length === 0) {
    return null;
  }

  async function handleConvertImages() {
    setLoading(true);

    await Promise.all(
      itemsWithOldImageType.map(async (item) => {
        const oldStorageId = item.storageId;

        if (!item.imageURL) {
          throw new Error("No image URL found");
        }

        const response = await fetch(item.imageURL);
        if (!response.ok) {
          throw new Error(`Failed to download file from ${item.imageURL}: ${response.statusText}`);
        }
        const blob = await response.blob();

        const fileName = `item-${item._id}`;
        const file = new File([blob], fileName, { type: blob.type });

        const webPFile = await convertToWebp(file);

        const postUrl = await generateUploadUrl();

        if (!webPFile) {
          console.error("Image conversion failed. Cannot upload.");
          throw new Error(`Image conversion failed. Cannot upload.`);
        }

        const result = await fetch(postUrl, {
          method: "POST",
          headers: { "Content-Type": webPFile.type },
          body: webPFile,
        });

        const { storageId } = await result.json();

        await updateItemsPicIds({
          oldStorageId: oldStorageId,
          newStorageId: storageId,
        });
      }),
    );
    setLoading(false);
  }

  return (
    <div className="absolute h-full w-full bg-black/80 z-10 backdrop-blur-sm">
      <div className="flex h-full w-full items-center justify-center">
        <Card className="w-[380px] rounded-none border-neutral-700 bg-neutral-900/80">
          <CardHeader className="text-center">
            <CardTitle>Before you continue</CardTitle>
            <CardDescription>
              Some of your images are still in our old format. At MyCloset we
              try to offer the best free experience possible for all our users.
              To help us archive that please convert your images so that we can
              save space.
            </CardDescription>
          </CardHeader>

          <CardFooter className="flex flex-col items-center gap-2">
            <Button
              onClick={handleConvertImages}
              variant="default"
              className="w-full rounded-none"
            >
              {loading ? (
                <LoaderCircleIcon className="animate-spin" />
              ) : (
                "Convert Images"
              )}
            </Button>
            <div className="text-xs text-muted-foreground">
              {itemsWithOldImageType.length} items to convert
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
