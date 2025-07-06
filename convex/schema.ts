import { defineSchema, defineTable } from "convex/server";
import { Infer, v } from "convex/values";

export const colorEnum = v.union(
  v.literal("red"),
  v.literal("green"),
  v.literal("blue"),
  v.literal("yellow"),
  v.literal("purple"),
  v.literal("orange"),
  v.literal("pink"),
  v.literal("beige"),
  v.literal("brown"),
  v.literal("gray"),
  v.literal("black"),
  v.literal("white"),
);

export type Color = Infer<typeof colorEnum>;

export default defineSchema({

  clothingInfoItems: defineTable({
    pic: v.id("_storage"),
    colors: v.array(colorEnum),
    brand: v.string(),
    types: v.array(v.string()),
    user: v.string(),
  }),

  clothingPieces: defineTable({
    info: v.id("clothingInfoItems"),
    currentLocation: v.id("locations"),
    locationHistory: v.array(v.id("locationLogs")),
    lost: v.optional(v.number()),
  }),

  locationLogs: defineTable({
    name: v.id("locations"),
  }),


  locations: defineTable({
    name: v.string(),
    user: v.string(),
  }),
});
