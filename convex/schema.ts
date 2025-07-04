import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";


export default defineSchema({
  
  clothingInfoItems: defineTable({
    pic: v.string(), // url of the picture
    colors: v.array(v.string()),
    brand: v.string(),
    type: v.array(v.string()),
    user: v.string(),

    items: v.array(v.id("clothingItems")),
  }),

  clothingItems: defineTable({
    info: v.id("clothingInfoItems"),
    location: v.array(v.object({
      name: v.id("locations"),
    })),
    lost: v.optional(v.number()),
  }),

  locations: defineTable({
    name: v.string(),
  }),
});
