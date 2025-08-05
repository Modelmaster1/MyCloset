import { v } from "convex/values";
import { mutation } from "./_generated/server";

export const convertImage = mutation({
  args: {
    oldStorageId: v.id("_storage"),
    newStorageId: v.id("_storage"),
  },

  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    const imagesUsingOldStorage = await ctx.db
      .query("clothingInfoItems")
      .filter((q) => q.eq(q.field("pic"), args.oldStorageId))
      .collect();

    for (const image of imagesUsingOldStorage) {
      await ctx.db.patch(image._id, {
        pic: args.newStorageId,
      });
    }

    ctx.storage.delete(args.oldStorageId);
  },
});
