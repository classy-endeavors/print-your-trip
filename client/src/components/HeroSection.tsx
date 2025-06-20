import Button from "./Button";
import heroZ0 from "../assets/hero-z-0.jpg";
import heroZ1 from "../assets/hero-z-1.png";
import bgVector1 from "../assets/bg-vector-1.png";
import { useNavigate } from "react-router-dom";

export default function HeroSection() {
  const navigate = useNavigate();
  return (
    <div className="relative overflow-hidden rounded-b-[4rem] bg-background-hero p-7 pb-20 md:h-[80vh] md:p-16 md:pb-32">
      <div className="flex h-full flex-col gap-8 md:flex-row md:items-center md:justify-between md:gap-0">
        {/* Left: Text and Button */}
        <div className="flex flex-col items-center justify-center gap-4 text-center md:w-1/2 md:items-start md:text-left">
          <span className="text-[2rem] leading-tight font-bold md:text-[2.5rem] lg:text-[2.8rem]">
            Turn Your Travel Pics into Postcards - Mailed for You!
          </span>
          <span className="text-lg font-medium md:text-xl">
            No stamps. No post office. No hassle.
          </span>
          <span className="text-base font-light md:text-lg">
            Upload a photo, add a message & the address, and we'll do the rest.
          </span>
          <Button
            className="mt-4 w-fit px-8 py-3 text-lg font-medium"
            onClick={() => navigate("/create")}
          >
            Create My Postcard
          </Button>
        </div>
        {/* Right: Postcard Images */}
        <div className="relative z-10 mt-8 flex justify-center md:mt-0 md:w-1/2">
          <img
            className="-translate-x-5 scale-75 -rotate-3 rounded-md drop-shadow-2xl drop-shadow-black/50 md:h-[320px] md:w-[420px] md:scale-100"
            src={heroZ0}
            alt="card-1"
          />
          <img
            className="absolute top-14 translate-x-10 scale-110 rotate-6 drop-shadow-2xl drop-shadow-black/70 md:top-20 md:left-32 md:h-[320px] md:w-[420px]"
            src={heroZ1}
            alt="card-2"
          />
        </div>
        {/* Eiffel Tower Vector */}
        <img
          className="absolute right-0 bottom-0 z-0 hidden w-64 md:block lg:w-80"
          src={bgVector1}
          alt="eiffel"
        />
        {/* Mobile Eiffel Tower (if needed) */}
        <img
          className="absolute bottom-0 left-0 z-0 w-40 md:hidden"
          src={bgVector1}
          alt="eiffel"
        />
      </div>
    </div>
  );
}
