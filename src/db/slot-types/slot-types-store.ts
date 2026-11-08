"use client";

import { useSyncExternalStore } from "react";

import { createStore } from "@/db/store";
import { isSlotTypeList, SLOT_TYPES, type SlotType } from "./slot-types";

const store = createStore<readonly SlotType[]>({
  domain: "slot-types",
  seed: SLOT_TYPES,
  validate: isSlotTypeList,
});

export function getStoredSlotTypes(): readonly SlotType[] {
  return store.get();
}

export function useSlotTypes(): readonly SlotType[] {
  return useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
}

export function addSlotType(
  input: Omit<SlotType, "id">,
): SlotType {
  const slotType: SlotType = Object.freeze({
    ...input,
    id: `custom-${crypto.randomUUID()}`,
  });
  const next = [...store.get(), slotType];
  if (!isSlotTypeList(next)) throw new Error("Cannot add an invalid slot type");
  store.set(next);
  return slotType;
}

export function updateSlotType(
  id: string,
  changes: Omit<SlotType, "id">,
): SlotType {
  const types = store.get();
  const index = types.findIndex((slotType) => slotType.id === id);
  if (index < 0) throw new Error(`Slot type ${id} does not exist`);

  const updated = Object.freeze({ ...types[index], ...changes });
  const next = types.map((slotType, currentIndex) =>
    currentIndex === index ? updated : slotType,
  );
  if (!isSlotTypeList(next)) throw new Error("Cannot save an invalid slot type");
  store.set(next);
  return updated;
}

export function deleteSlotType(id: string): void {
  const types = store.get();
  const slotType = types.find((item) => item.id === id);
  if (!slotType) throw new Error(`Slot type ${id} does not exist`);
  if (slotType.isDefault) throw new Error("Default slot types cannot be deleted");
  store.set(types.filter((item) => item.id !== id));
}
