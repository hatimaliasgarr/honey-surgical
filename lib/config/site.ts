export const siteConfig = {
  name: "HONEY SURGICALS",
  description:
    "HONEY SURGICALS – Surgical products catalog for hospitals, clinics, laboratories, and healthcare procurement teams.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  phone: process.env.NEXT_PUBLIC_CONTACT_PHONE || "+91 93012 32196",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@honeysurgical.com",
  address:
    process.env.NEXT_PUBLIC_CONTACT_ADDRESS || "HONEY SURGICALS, Medical Market, India",
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "9301232196",
  mapsUrl:
    "https://www.google.com/maps/search/?api=1&query=HONEY%20SURGICALS%20medical%20supplier"
};

export const primaryNav = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/compare", label: "Compare" },
  { href: "/contact", label: "Contact" }
];
