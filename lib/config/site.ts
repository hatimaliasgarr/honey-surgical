export const siteConfig = {
  name: "HONEY SURGICALS",
  description:
    "HONEY SURGICALS – Surgical products catalog for hospitals, clinics, laboratories, and healthcare procurement teams.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://honeysurgical.com",
  phone: "+91 93012 32196",
  email: "contact@honeysurgical.com",
  address: "HONEY SURGICALS, Medical Market, India",
  whatsapp: "9301232196",
  mapsUrl:
    "https://www.google.com/maps/place/HONEY+SURGICAL/@21.2423919,81.6298221,17z"
};

export const primaryNav = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/categories", label: "Categories" },
  { href: "/compare", label: "Compare" },
  { href: "/contact", label: "Contact" }
];
