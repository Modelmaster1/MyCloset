import { useEffect, useState } from "react";
import { PackingList } from "../../view";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "convex/_generated/dataModel";
import { Card } from "../../components/ui/card";
import { LoaderCircleIcon, XIcon } from "lucide-react";
import { Label } from "@radix-ui/react-label";
import { SearchableCreateSelect } from "../../NewItem";
import { SimpleDatePicker } from "../../newItemInputs/simpleDatePicker";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../../components/ui/alert-dialog";
import { Button } from "../../components/ui/button";
import { Progress } from "../../components/ui/progress";


export function PackingListInfo({
  packingList,
  updateSelectedPackingList,
  deselectPackingList,
}: {
  packingList: PackingList;
  updateSelectedPackingList: (list: PackingList) => void;
  deselectPackingList: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState(packingList.name);
  const [description, setDescription] = useState(packingList.description ?? "");
  const [packingLoc, setPackingLoc] = useState<Id<"locations"> | null>(
    packingList.packingLocation ?? null,
  );
  const [departureDate, setDepartureDate] = useState<Date | null>(
    new Date(packingList.departureDate ?? 0),
  );

  const packingListStatus = useQuery(api.clothingItems.getPackStatus, {
    packingList: packingList._id,
  });
  const locations = useQuery(api.locations.list);
  const createLocation = useMutation(api.locations.create);

  const updatePackingList = useMutation(api.packinglists.update);
  const markPackingListExpired = useMutation(
    api.packinglists.markPackingListExpired,
  );

  useEffect(() => {
    clearFields();
  }, [packingList]);

  function clearFields() {
    setName(packingList.name);
    setDescription(packingList.description ?? "");
    setDepartureDate(new Date(packingList.departureDate ?? 0));
    setPackingLoc(packingList.packingLocation ?? null);
  }

  const hasChanges =
    name !== packingList.name ||
    description !== (packingList.description ?? "") ||
    (departureDate?.getTime() ?? null) !==
      (packingList.departureDate ?? null) ||
    packingLoc !== (packingList.packingLocation ?? null);

  async function handleUpdateInfo() {
    setLoading(true);

    if (!hasChanges) {
      // No changes to save
      setLoading(false);
      return;
    }

    const newItem = await updatePackingList({
      id: packingList._id,
      name: name,
      description: description.trim() === "" ? undefined : description,
      departureDate: departureDate?.getTime(),
      packingLocation: packingLoc ?? undefined,
    });

    if (newItem) {
      updateSelectedPackingList(newItem);
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <Card className="relative p-0 rounded-none w-full">
        <div className="absolute top-0 right-0 p-3">
          <button onClick={deselectPackingList} className="cursor-pointer">
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="flex flex-col gap-2 p-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value.toLowerCase())}
            className="text-3xl font-light uppercase focus:outline-none"
            placeholder="Packing List Name"
          />

          <textarea
            className="rounded-none outline-none h-12"
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="flex justify-between items-end">
            <div className="flex gap-2">
              <div className="flex flex-col gap-3">
                <Label htmlFor="packing">Packing Location</Label>
                <SearchableCreateSelect
                  disabled={(packingListStatus?.packedPieces.length ?? 5) > 0}
                  options={
                    locations
                      ? locations.map((location) => ({
                          value: location._id,
                          label: location.name,
                        }))
                      : [{ value: "", label: "loading..." }]
                  }
                  value={packingLoc ?? ""}
                  onValueChange={(value) => {
                    setPackingLoc(value as Id<"locations"> | null);
                  }}
                  placeholder="Select a location..."
                  emptyMessage="No location found."
                  onCreateNew={async (newLocName) => {
                    if (newLocName.trim() === "") return;
                    const locId = await createLocation({ name: newLocName });
                    setPackingLoc(locId);
                  }}
                />
              </div>
              <div className="flex items-end gap-1">
                <SimpleDatePicker
                  name="Departure date"
                  date={departureDate}
                  setDate={setDepartureDate}
                />

                {departureDate && (
                  <div className="opacity-50 p-1.5">
                    ({formatDistanceToNow(departureDate, { addSuffix: true })})
                  </div>
                )}
              </div>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="rounded-none cursor-pointer opacity-50 hover:opacity-100 transition-opacity w-fit"
                >
                  Mark as Expired
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-none">
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently disable
                    your packing list and remove its packed items.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-none">
                    Cancel
                  </AlertDialogCancel>
                  <AlertDialogAction
                    className="rounded-none"
                    onClick={() => {
                      setLoading(true);
                      markPackingListExpired({
                        packingList: packingList._id,
                      });
                      deselectPackingList();
                      setLoading(false);
                    }}
                  >
                    {loading ? (
                      <LoaderCircleIcon className="animate-spin" />
                    ) : (
                      "Yes, mark as expired"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <div className="flex flex-col gap-2 mt-4">
            <Progress
              className="rounded-none"
              value={packingListStatus?.percentagePacked}
            />
            <div className="w-fit text-sm opacity-50">
              {packingListStatus?.packedPieces.length} of{" "}
              {packingListStatus?.totalPieces.length} items packed
            </div>
          </div>
        </div>
        {hasChanges && (
          <div className="absolute bottom-0 right-0">
            <div className="flex justify-end gap-3 items-center m-3 p-1 ps-4 bg-neutral-900">
              <button
                onClick={clearFields}
                className="opacity-80 cursor-pointer"
              >
                Revert Changes
              </button>

              <Button
                onClick={handleUpdateInfo}
                className="rounded-none cursor-pointer"
              >
                {loading ? (
                  <LoaderCircleIcon className="animate-spin" />
                ) : (
                  "Save Changes"
                )}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}