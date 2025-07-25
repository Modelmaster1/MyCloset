import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userID = identity.subject;

    const locations = await ctx.db
      .query("locations")
      .filter((q) => q.eq(q.field("user"), userID))
      .collect();

    return locations;
  },
});

export const create = mutation({
  args: {
    name: v.string(),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userID = identity.subject;

    const location = await ctx.db.insert("locations", {
      name: args.name,
      user: userID,
    });

    return location;
  },
});

export const getLocationHistoryLogs = query({
  args: {
    locHistory: v.array(v.id("locationLogs")),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const userID = identity.subject;

    const location = await ctx.db.query("locations").filter((q) => q.eq(q.field("user"), userID)).collect();
    const packingLists = await ctx.db.query("packingLists").collect();

    const locationLogs = await ctx.db
      .query("locationLogs")
      .collect();
    
    const locHistoryModel = locationLogs.filter((log) => args.locHistory.includes(log._id)).map((log) => {
      const loc = location.find((l) => l._id === log.name);
      const packingList = log.packingList ? packingLists.find((l) => l._id === log.packingList) : null;
      return {
        ...log,
        loc: loc ?? null,
        _id: log._id,
        packingList: packingList ?? null,
      };
    }).filter((d) => d !== null).sort((a, b) => b._creationTime - a._creationTime);

    return locHistoryModel;
  },
});