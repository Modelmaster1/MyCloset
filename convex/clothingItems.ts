import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { colorEnum } from "./schema";


export const create = mutation({
  args: {
    storageId: v.id("_storage"),
    colors: v.array(colorEnum),
    brand: v.string(),
    types: v.array(v.string()),

    piecesAmount: v.number(),
    location: v.id("locations"),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userID = identity.subject;

    const InfoItem = {
      pic: args.storageId,
      colors: args.colors,
      brand: args.brand,
      types: args.types,
      user: userID,
    };

    const infoID = await ctx.db.insert("clothingInfoItems", InfoItem);

    const locHistoryItem = await ctx.db.insert("locationLogs", {
      name: args.location,
    });

    for (let i = 0; i < args.piecesAmount; i++) {
      await ctx.db.insert("clothingPieces", {
        info: infoID,
        currentLocation: args.location,
        locationHistory: [locHistoryItem],
      });
    }
  },
});

export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userID = identity.subject;

    const pieces = await ctx.db
      .query("clothingPieces")
      .collect();

    const infoItems = await ctx.db
      .query("clothingInfoItems")
      .filter((q) => q.eq(q.field("user"), userID))
      .collect();
    
    const urls = await Promise.all(infoItems.map(item => ctx.storage.getUrl(item.pic)));
    const result = infoItems.map((infoItem, index) => {
      const allPieces = pieces.filter((piece) => piece.info === infoItem._id);
      return {
        ...infoItem,
        imageURL: urls[index],
        pieces: allPieces
      };
    });

    return result;
  },
});
