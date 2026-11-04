import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      text: ["nano", "micro", "caption", "label", "body", "control", "title",
             "lead", "h3", "h2", "h1", "kpi", "kiosk-md", "kiosk-lg", "kiosk-xl"],
      radius: ["xs", "sm", "md", "lg", "pop", "xl", "modal", "2xl"],
    },
  },
});

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));
