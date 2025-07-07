import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Color, colorEnum } from "./schema";
import { Id } from "./_generated/dataModel";

export const create = mutation({
  args: {
    items: v.array(
      v.object({
        storageId: v.id("_storage"),
        colors: v.array(colorEnum),
        brand: v.string(),
        types: v.array(v.string()),
        piecesAmount: v.number(),
      }),
    ),
    location: v.id("locations"),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userID = identity.subject;

    for (const item of args.items) {
      const InfoItem = {
        pic: item.storageId,
        colors: item.colors,
        brand: item.brand,
        types: item.types,
        user: userID,
      };

      const infoID = await ctx.db.insert("clothingInfoItems", InfoItem);

      const locHistoryItem = await ctx.db.insert("locationLogs", {
        name: args.location,
      });

      for (let i = 0; i < item.piecesAmount; i++) {
        await ctx.db.insert("clothingPieces", {
          info: infoID,
          currentLocation: args.location,
          locationHistory: [locHistoryItem],
        });
      }
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

    const pieces = await ctx.db.query("clothingPieces").collect();
    const locations = await ctx.db.query("locations").collect();

    const infoItems = await ctx.db
      .query("clothingInfoItems")
      .filter((q) => q.eq(q.field("user"), userID))
      .collect();

    const urls = await Promise.all(
      infoItems.map((item) => ctx.storage.getUrl(item.pic)),
    );
    const result = infoItems.map((infoItem, index) => {
      const allPieces = pieces.filter((piece) => piece.info === infoItem._id);
      return {
        ...infoItem,
        imageURL: urls[index],
        pieces: allPieces.map((piece) => {
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

    return result;
  },
});

export const move = mutation({
  args: {
    pieces: v.array(
      v.object({
        _id: v.id("clothingPieces"),
        locationHistory: v.array(v.id("locationLogs")),
      }),
    ),
    newLocation: v.id("locations"),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const newLocationLog = await ctx.db.insert("locationLogs", {
      name: args.newLocation,
    });

    for (const piece of args.pieces) {
      await ctx.db.patch(piece._id, {
        currentLocation: args.newLocation,
        locationHistory: [...piece.locationHistory, newLocationLog],
      });
    }
  },
});

export const editInfo = mutation({
  args: {
    currentId: v.id("clothingInfoItems"),
    pic: v.optional(v.id("_storage")),
    brand: v.optional(v.string()),
    types: v.optional(v.array(v.string())),
    colors: v.optional(v.array(colorEnum)),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const patchObject: {
      pic?: Id<"_storage">
      brand?: string;
      types?: string[];
      colors?: Color[];
    } = {};

    if (args.pic !== undefined) {
      patchObject.pic = args.pic;
    }
    if (args.brand !== undefined) {
      patchObject.brand = args.brand;
    }
    if (args.types !== undefined) {
      patchObject.types = args.types;
    }
    if (args.colors !== undefined) {
      patchObject.colors = args.colors;
    }

    await ctx.db.patch(args.currentId, patchObject);
  },
});
