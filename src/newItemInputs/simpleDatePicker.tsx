import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ChevronDownIcon } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export function SimpleDatePicker({
  date,
  setDate,
  simpleInput = false,
  name,
}: {
  date: Date | null;
  setDate: React.Dispatch<React.SetStateAction<Date | null>>;
  simpleInput?: boolean;
  name: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex flex-col gap-3">
      <Label htmlFor="date" className="">
        {name}
      </Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          {simpleInput ? (
            <button
              id="date"
              className="flex gap-2 w-fit items-center justify-between font-normal"
            >
              {date ? format(date, "dd.MM.yyyy") : "Select date"}
              <ChevronDownIcon className="h-4 w-4" />
            </button>
          ) : (
            <Button
              id="date"
              variant="outline"
              className="flex gap-2 rounded-none w-fit items-center justify-between font-normal"
            >
              {date ? format(date, "dd.MM.yyyy") : "Select date"}
              <ChevronDownIcon className="h-4 w-4" />
            </Button>
          )}
        </PopoverTrigger>
        <PopoverContent
          className="w-auto overflow-hidden p-0 rounded-none bg-black"
          align="start"
        >
          <Calendar
            mode="single"
            selected={date ?? undefined}
            captionLayout="dropdown"
            onSelect={(date) => {
              setDate(date ?? null);
              setOpen(false);
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
