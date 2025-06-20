import Button from "./Button";
import heroZ0 from "../assets/hero-z-0.jpg";
import heroZ1 from "../assets/hero-z-1.png";
import bgVector1 from "../assets/bg-vector-1.png";

export default function HeroSection() {
  return (
    <div className="relative overflow-hidden rounded-b-[4rem] bg-background-hero p-7 pb-20">
      <div className="flex h-full flex-col justify-center gap-4">
        <span className="text-[2rem] font-bold">
          Turn Your Travel Pics into Postcards - Mailed for You!
        </span>
        <span className="font-medium">
          No stamps. No post office. No hassle.
        </span>
        <span className="font-light">
          Upload a photo, add a message & the address, and we'll do the rest.
        </span>
        <Button className="w-fit text-lg font-medium">
          Create My Postcard
        </Button>
        <div className="relative z-10">
          <img
            className="-translate-x-5 scale-75 -rotate-3 rounded-md drop-shadow-2xl drop-shadow-black/50"
            src={heroZ0}
            alt="card-1"
          />
          <img
            className="absolute top-14 translate-x-10 scale-110 rotate-6 drop-shadow-2xl drop-shadow-black/70"
            src={heroZ1}
            alt="card-2"
          />
        </div>
        <img className="absolute bottom-0" src={bgVector1} alt="eiffel" />
      </div>
    </div>
  );
}
