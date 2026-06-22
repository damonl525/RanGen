import { Outfit, Manrope } from "next/font/google"; // Using modern geometric/scientific fonts

export const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

export const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-mono", // Using Manrope for numbers/technical data often
  display: "swap",
});
