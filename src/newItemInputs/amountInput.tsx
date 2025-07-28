import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AmountInput({
  amount,
  setAmount,
}: {
  amount: number;
  setAmount: React.Dispatch<React.SetStateAction<number>>;
}) {
    
  return (
    <div className="grid w-full items-center gap-3 mt-4">
      <Label htmlFor="amount">Amount</Label>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="rounded-none"
          disabled={amount <= 1}
          onClick={() => setAmount(Math.max(1, amount - 1))}
        >
          -
        </Button>
        <Input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) =>
            setAmount(Math.max(1, parseInt(e.target.value) || 1))
          }
          className="w-20 text-center rounded-none"
          min="1"
        />
        <Button
          type="button"
          variant="outline"
          className="rounded-none"
          size="icon"
          onClick={() => setAmount(amount + 1)}
        >
          +
        </Button>
      </div>
    </div>
  );
}
