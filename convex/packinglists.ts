import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userID = identity.subject;

    const pieces = await ctx.db.query("clothingPieces").collect();
    const locations = await ctx.db.query("locations").collect();

    const packingLists = await ctx.db
      .query("packingLists")
      .filter((q) => q.eq(q.field("user"), userID))
      .collect();

    const packingListModels = packingLists.map((list) => {
      const piecesInList = pieces.filter((piece) =>
        list.items.includes(piece._id),
      );
      return {
        ...list,
        pieces: piecesInList.map((piece) => {
          const matchedLoc = locations.find(
            (location) => location._id === piece.currentLocation,
          );
          return {
            ...piece,
            currentLocation: {
              _id: piece.currentLocation ?? "error",
              name: matchedLoc?.name ?? "error",
            },
          };
        }),
      };
    });

    return packingListModels;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    departureDate: v.optional(v.number()),
    packingLocation: v.optional(v.id("locations")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userID = identity.subject;

    const packingList = await ctx.db.insert("packingLists", {
      name: args.name,
      description: args.description,
      departureDate: args.departureDate,
      packingLocation: args.packingLocation,
      items: [], // Initialize empty array for clothing pieces
      user: userID,
    });

    return packingList;
  },
});

export const update = mutation({
  args: {
    id: v.id("packingLists"),
    name: v.string(),
    description: v.optional(v.string()),
    departureDate: v.optional(v.number()),
    packingLocation: v.optional(v.id("locations")),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    await ctx.db.patch(args.id, {
      name: args.name,
      description: args.description,
      departureDate: args.departureDate,
      packingLocation: args.packingLocation,
    });

    const packingList = await ctx.db.get(args.id);
    return packingList;
  },
});

export const addItemsToPackingList = mutation({
  args: {
    id: v.id("packingLists"),
    items: v.array(v.id("clothingPieces")),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const currentData = await ctx.db.get(args.id);

    if (!currentData) {
      throw new Error("Packing list not found");
    }

    await ctx.db.patch(args.id, {
      items: [...currentData.items, ...args.items],
    });

    const packingList = await ctx.db.get(args.id);
    return packingList;
  },
});

export const removeItemsFromPackingList = mutation({
    args: {
      pieces: v.array(v.id("clothingPieces")),
      packingList: v.id("packingLists"),
    },
  
    handler: async (ctx, args) => {
      const identity = await ctx.auth.getUserIdentity();
  
      if (!identity) {
        throw new Error("Not authenticated");
      }
  
      if (args.pieces.length === 0) {
        throw new Error("No pieces to remove");
      }
  
      const packingListInfo = await ctx.db.get(args.packingList);
  
      if (!packingListInfo) {
        throw new Error("Packing list not found");
      }
  
      await ctx.db.patch(args.packingList, {
        items: packingListInfo.items.filter((id) => !args.pieces.includes(id)),
      });

      const packingList = await ctx.db.get(args.packingList);
  
      return packingList;
    },
  });
