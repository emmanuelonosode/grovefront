import {
  Utensils, Zap, Waves, PawPrint, Thermometer, Wind, WashingMachine,
  Car, Shield, Dumbbell, TreePine, Check, Refrigerator, Microwave,
  Flame, ShowerHead, Wifi, Fence, Sparkles, House, Sofa, Trees,
  type LucideIcon,
} from "lucide-react";

/**
 * Amenity names arrive as free text from the scrapers, so match on keywords
 * rather than an enum. Falls back to a check mark, which reads fine in a chip.
 */
export function amenityIconFor(name: string | null | undefined): LucideIcon {
  // Amenity rows can carry a blank or missing name; don't let that throw.
  const n = (name ?? "").toLowerCase();
  if (/refrigerator|fridge/.test(n)) return Refrigerator;
  if (/microwave/.test(n)) return Microwave;
  if (/stove|range|oven|fireplace/.test(n)) return Flame;
  if (/granite|quartz|counter|island|kitchen|dishwasher|nook|pantry|cook/.test(n)) return Utensils;
  if (/stainless|appliance|updated|renovat/.test(n)) return Sparkles;
  if (/washer|dryer|laundry|washing/.test(n)) return WashingMachine;
  if (/air.condition|central.air|\bac\b|hvac|cooling/.test(n)) return Wind;
  if (/heat|furnace|thermostat/.test(n)) return Thermometer;
  if (/shower|bath|tub|vanity/.test(n)) return ShowerHead;
  if (/electric|utility|power|solar/.test(n)) return Zap;
  if (/wifi|internet|cable|network|smart/.test(n)) return Wifi;
  if (/pool|spa|hot tub|swim/.test(n)) return Waves;
  if (/garage|parking|carport|driveway/.test(n)) return Car;
  if (/yard|fence|patio|deck|porch|balcony|outdoor/.test(n)) return Fence;
  if (/garden|landscap|lawn/.test(n)) return Trees;
  if (/tree|park|trail|walk|nature|playground|tot lot/.test(n)) return TreePine;
  if (/gym|fitness|workout/.test(n)) return Dumbbell;
  if (/gated|security|guard|camera|alarm/.test(n)) return Shield;
  if (/pet|dog|cat|animal/.test(n)) return PawPrint;
  if (/carpet|hardwood|floor|closet|storage|ceiling|window|blinds/.test(n)) return Sofa;
  if (/hoa|community|club|floorplan|open floor/.test(n)) return House;
  return Check;
}
