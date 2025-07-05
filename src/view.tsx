import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

export default function View() {
  const items = useQuery(api.clothingItems.list);
  const locations = useQuery(api.locations.list);

  if (!items || !locations) {
    return <div>Loading...</div>;
  }
  return (
    <div className="mt-4">
      <h1>View</h1>
      {items.map((item) => (
        <div
          key={item._id}
          className="bg-slate-700 border-b border-slate-100 p-2"
        >
          <h2>{item.brand}</h2>
          <p>{item.types.join(", ")}</p>
          <p>{item.colors.join(", ")}</p>
          <p>{item.pieces.length} pieces</p>
          {item.pieces.map((piece) => (
            <div key={piece._id} className="flex gap-2">
              <p>1x at</p>
              <p>
                {
                  locations.find((loc) => loc._id === piece.currentLocation)
                    ?.name
                }
              </p>
            </div>
          ))}
          <img
            src={item.imageURL ?? undefined}
            className="w-32 h-32 object-cover rounded-lg shadow-md"
            alt={item.brand}
          />
        </div>
      ))}
    </div>
  );
}
