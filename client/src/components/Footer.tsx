import Envelope1 from "./icons/Envelope1";
import Facebook from "./icons/Facebook";
import Instagram from "./icons/Instagram";
import Tiktok from "./icons/TikTok";
import logoFull from "../assets/logo-full.png";

export default function Footer() {
  const quickLinks = [
    { name: "Home", href: "/" },
    { name: "How it works", href: "/how-it-works" },
    { name: "Pricing", href: "/pricing" },
    { name: "FAQ", href: "/faq" },
    { name: "Blog", href: "/blogs" },
  ];
  const socialLinks = [
    {
      name: "Instagram",
      href: "https://instagram.com",
      icon: <Instagram className="h-20 w-20 cursor-pointer hover:opacity-80" />,
    },
    {
      name: "Facebook",
      href: "https://facebook.com",
      icon: <Facebook className="h-20 w-20 cursor-pointer hover:opacity-80" />,
    },
    {
      name: "TikTok",
      href: "https://tiktok.com",
      icon: <Tiktok className="h-20 w-20 cursor-pointer hover:opacity-80" />,
    },
  ];
  return (
    <footer className="font-league-spartan">
      <div className="flex flex-col space-y-8 bg-alice-blue p-8">
        <img src={logoFull} className="w-full" />

        <a
          href="mailto:info@pyt.com"
          className="flex items-center gap-x-6 font-quicksand hover:underline"
        >
          <Envelope1 className="h-8 w-8 cursor-pointer hover:opacity-80" />
          info@pyt.com
        </a>

        <div className="space-y-4">
          <span className="block text-3xl font-semibold">Quick Links</span>
          <div className="flex flex-col text-xl">
            {quickLinks.map((link) => (
              <div key={link.name}>
                <a
                  href={link.href}
                  className="text-gray-500 hover:text-gray-700"
                >
                  {link.name}
                </a>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <span className="text-3xl font-semibold">Out Social</span>
          <div className="flex space-x-2">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.href}
                className="h-20 w-20 cursor-pointer hover:opacity-80"
              >
                {social.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="flex h-20 w-full items-center justify-center text-center font-quicksand text-lg font-medium">
        Copyright © PYT- Real-Time Postcard
      </div>
    </footer>
  );
}
