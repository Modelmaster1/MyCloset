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
        brand: v.optional(v.string()),
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

    const imageModel = await Promise.all(
      infoItems.map(async (item) => {
        const f = await ctx.db.system.get(item.pic);
        const url = await ctx.storage.getUrl(item.pic);
        return {
          extension: f?.contentType ?? "image/jpeg",
          url: url,
        };
      }),
    );

    const result = infoItems.map((infoItem, index) => {
      const allPieces = pieces.filter((piece) => piece.info === infoItem._id);
      return {
        ...infoItem,
        storageId: infoItem.pic,
        imageURL: imageModel[index].url,
        contentType: imageModel[index].extension,
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
        currentLocationId: v.id("locations"),
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

    const piecesNotAlreadyInLocation = args.pieces.filter(
      (piece) => piece.currentLocationId !== args.newLocation,
    );

    if (piecesNotAlreadyInLocation.length === 0) {
      return;
    }

    const newLocationLog = await ctx.db.insert("locationLogs", {
      name: args.newLocation,
    });

    for (const piece of piecesNotAlreadyInLocation) {
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
    forceBrand: v.optional(v.boolean()),
    types: v.optional(v.array(v.string())),
    colors: v.optional(v.array(colorEnum)),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const patchObject: {
      pic?: Id<"_storage">;
      brand?: string;
      types?: string[];
      colors?: Color[];
    } = {};

    if (args.pic !== undefined) {
      const currentObject = await ctx.db.get(args.currentId);
      patchObject.pic = args.pic;

      if (patchObject && currentObject?.pic) {
        ctx.storage.delete(currentObject?.pic);
      }
    }
    if (args.brand !== undefined || args.forceBrand == true) {
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

export const packPieces = mutation({
  args: {
    pieces: v.array(v.id("clothingPieces")),
    packingList: v.id("packingLists"),
    packLocation: v.id("locations"),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    if (args.pieces.length === 0) {
      throw new Error("No pieces to pack");
    }

    const locationLog = await ctx.db.insert("locationLogs", {
      name: args.packLocation,
      packingList: args.packingList,
    });

    for (const pieceID of args.pieces) {
      const piece = await ctx.db.get(pieceID);

      if (!piece) {
        throw new Error("Piece not found");
      }

      await ctx.db.patch(pieceID, {
        currentLocation: args.packLocation,
        packed: args.packingList,
        locationHistory: [...piece.locationHistory, locationLog],
      });
    }
  },
});

export const unpackPieces = mutation({
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
      throw new Error("No pieces to unpack");
    }

    const packingListInfo = await ctx.db.get(args.packingList);

    if (!packingListInfo || !packingListInfo.packingLocation) return;

    const newLog = await ctx.db.insert("locationLogs", {
      name: packingListInfo.packingLocation,
    });

    for (const pieceID of args.pieces) {
      const piece = await ctx.db.get(pieceID);

      if (!piece) {
        throw new Error("Piece not found");
      }

      await ctx.db.patch(pieceID, {
        packed: undefined,
        locationHistory: [...piece.locationHistory, newLog],
      });
    }
  },
});

export const getPackStatus = query({
  args: {
    packingList: v.id("packingLists"),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const packingListInfo = await ctx.db.get(args.packingList);

    if (!packingListInfo) return null;

    const packedPiecesInPackingList = await ctx.db
      .query("clothingPieces")
      .filter((q) => q.eq(q.field("packed"), args.packingList))
      .collect();

    const percentagePacked =
      packedPiecesInPackingList.length / packingListInfo?.items.length;
    return {
      packedPieces: packedPiecesInPackingList,
      totalPieces: packingListInfo?.items,
      percentagePacked: Math.round(percentagePacked * 100),
    };
  },
});

export const deletePiece = mutation({
  args: {
    piece: v.id("clothingPieces"),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const piece = await ctx.db.get(args.piece);

    if (!piece) {
      throw new Error("Piece not found");
    }

    const packingLists = await ctx.db.query("packingLists").collect();

    const packingListsWithPiece = packingLists.filter((list) =>
      list.items.includes(piece._id),
    );

    if (packingListsWithPiece.length > 0) {
      for (const list of packingListsWithPiece) {
        await ctx.db.patch(list._id, {
          items: list.items.filter((id) => id !== piece._id),
        });
      }
    }

    const numOfPieces = (
      await ctx.db
        .query("clothingPieces")
        .filter((q) => q.eq(q.field("info"), piece.info))
        .collect()
    ).length;

    // delete the piece
    await ctx.db.delete(piece._id);

    if (numOfPieces <= 1) {
      // delete the info if there are no more pieces
      await ctx.db.delete(piece.info);
    }
  },
});

export const markPieceLost = mutation({
  args: {
    piece: v.id("clothingPieces"),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const piece = await ctx.db.get(args.piece);

    if (!piece) {
      throw new Error("Piece not found");
    }

    if (piece.lost) {
      throw new Error("Piece already lost");
    }

    const log = await ctx.db.insert("locationLogs", {
      lost: true,
    });

    await ctx.db.patch(piece._id, {
      lost: Date.now(),
      locationHistory: [...piece.locationHistory, log],
    });
  },
});

export const markPieceFound = mutation({
  args: {
    piece: v.id("clothingPieces"),
    newLocation: v.id("locations"),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const piece = await ctx.db.get(args.piece);

    if (!piece) {
      throw new Error("Piece not found");
    }

    if (!piece.lost) {
      throw new Error("Piece not lost");
    }

    const newLocationLog = await ctx.db.insert("locationLogs", {
      name: args.newLocation,
    });

    await ctx.db.patch(piece._id, {
      lost: undefined,
      locationHistory: [...piece.locationHistory, newLocationLog],
      currentLocation: args.newLocation,
    });
  },
});

export const getPieces = query({
  args: {
    info: v.id("clothingInfoItems"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const locations = await ctx.db.query("locations").collect();

    const pieces = await ctx.db
      .query("clothingPieces")
      .filter((q) => q.eq(q.field("info"), args.info))
      .collect();

    const result = pieces.map((piece) => {
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
    });
    return result;
  },
});

export const addNewPiece = mutation({
  args: {
    info: v.id("clothingInfoItems"),
    location: v.id("locations"),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("Not authenticated");
    }

    const info = await ctx.db.get(args.info);

    if (!info) {
      throw new Error("Info not found");
    }

    const log = await ctx.db.insert("locationLogs", {
      name: args.location,
    });

    await ctx.db.insert("clothingPieces", {
      info: args.info,
      currentLocation: args.location,
      locationHistory: [log],
    });
  },
});
