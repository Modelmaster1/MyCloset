import { api } from "../../../convex/_generated/api";
import { PackingList } from "../../view";
import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import { Button } from "../../components/ui/button";
import { PlaneIcon, PlusIcon } from "lucide-react";
import { ScrollArea } from "../../components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import { Label } from "../../components/ui/label";
import { Input } from "../../components/ui/input";
import { SimpleDatePicker } from "../../newItemInputs/simpleDatePicker";
import { SearchableCreateSelect } from "../../NewItem";
import { Id } from "convex/_generated/dataModel";
import { Textarea } from "../../components/ui/textarea";


export function PackingListSelector({
  selectPackingList,
}: {
  selectPackingList: (packingList: PackingList) => void;
}) {
  const packingLists = useQuery(api.packinglists.list, {});
  const locations = useQuery(api.locations.list); // Fetch locations for the create form

  // State for the new packing list form
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState<string | null>(null);
  const [packingLoc, setPackingLoc] = useState<Id<"locations"> | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false); // State to control dialog open/close

  const createPackingList = useMutation(api.packinglists.create);
  const createLocation = useMutation(api.locations.create);

  const resetForm = () => {
    setName("");
    setDescription(null);
    setDepartureDate(null);
    setPackingLoc(null);
  };

  async function handleCreatePackingList() {
    // Basic validation
    if (!name.trim()) {
      alert("Packing list name cannot be empty.");
      return;
    }

    try {
      await createPackingList({
        name: name,
        description: description ?? undefined,
        packingLocation: packingLoc ?? undefined,
        departureDate: departureDate ? departureDate.getTime() : undefined,
      });
      resetForm(); // Reset form fields on successful creation
      setIsDialogOpen(false); // Close the dialog
    } catch (error) {
      console.error("Failed to create packing list:", error);
      alert("Failed to create packing list. Please try again.");
    }
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="rounded-none">
          Packing Lists <PlaneIcon className="ml-1 h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="rounded-none w-64 p-0">
        <div className="p-4 border-b border-neutral-700 text-lg font-semibold">
          My Packing Lists
        </div>
        <ScrollArea className="h-[200px]">
          {packingLists && packingLists.length > 0 ? (
            <div className="flex flex-col">
              {packingLists.map((list) => (
                <Button
                  key={list._id}
                  onClick={() => selectPackingList(list)}
                  variant="ghost"
                  className="rounded-none justify-start px-4 py-2 w-full text-left hover:bg-neutral-800"
                >
                  {list.name}
                  {list.departureDate && (
                    <span className="text-xs ml-auto opacity-70">
                      (
                      {formatDistanceToNow(list.departureDate, {
                        addSuffix: true,
                      })}
                      )
                    </span>
                  )}
                </Button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center text-neutral-400">
              No packing lists yet.
            </div>
          )}
        </ScrollArea>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="ghost"
              className="rounded-none w-full justify-start mt-2 border-t border-neutral-700"
              onClick={resetForm} // Reset form when opening dialog
            >
              <PlusIcon className="mr-2 h-4 w-4" /> Create New
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-none max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Packing List</DialogTitle>
              <DialogDescription>
                Packing list allow you to digitally organize your clothes for a
                trip.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-5">
              <div className="flex flex-col gap-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Name"
                  className="rounded-none"
                />
              </div>
              <SimpleDatePicker
                date={departureDate}
                setDate={setDepartureDate}
                name="Departure Date"
              />
              <div className="flex flex-col gap-2">
                <Label htmlFor="packing">
                  Packing Location (where are you packing for this trip?)
                </Label>
                <SearchableCreateSelect
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

              <div className="flex flex-col gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description ?? ""}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description"
                  className="rounded-none"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleCreatePackingList}
                  className="rounded-none"
                >
                  Create
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </PopoverContent>
    </Popover>
  );
}