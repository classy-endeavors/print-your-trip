import Button from "./Button";
import heroImg from "../assets/hero-z-1.png";
import postcardImg from "../assets/hero-z-0.jpg";
import fridgeImg from "../assets/logo-full.png";
import { useNavigate } from "react-router-dom";

export default function HowItWorksComponent() {
  const navigate = useNavigate();
  return (
    <>
      <header className="mt-6 mb-4 flex flex-col items-center justify-center p-4 text-center">
        <h1 className="mb-2 text-2xl font-bold md:text-3xl">How It Works</h1>
        <p className="max-w-xs text-base md:max-w-md md:text-lg">
          Because core memories shouldn't live on your phone forever.
        </p>
      </header>
      <section className="flex w-full flex-col items-center">
        {/* Step 1 */}
        <div className="mb-2 flex w-full flex-col items-center px-6">
          <h2 className="mb-1 text-xl font-semibold md:text-2xl">Step 1</h2>
          <h3 className="mb-2 text-lg font-bold md:text-xl">Snap & Upload</h3>
          <p className="mb-2 max-w-xs text-center text-sm text-gray-700 md:text-base">
            Pick a fave travel pic (yes, even that one where your hair is a
            mess).
          </p>
          <img
            src={heroImg}
            alt="Snap & Upload"
            className="mb-2 h-40 w-64 rounded-lg object-cover shadow-md"
          />
        </div>
        {/* Arrow */}
        <svg
          width="32"
          height="48"
          viewBox="0 0 32 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mb-2"
        >
          <path
            d="M16 0V44M16 44L4 32M16 44L28 32"
            stroke="#222"
            strokeWidth="2"
            strokeDasharray="6 6"
            strokeLinecap="round"
          />
        </svg>
        {/* Step 2 */}
        <div className="mb-2 flex w-full flex-col items-center px-6">
          <h2 className="mb-1 text-xl font-semibold md:text-2xl">Step 2</h2>
          <h3 className="mb-2 text-lg font-bold md:text-xl">Add a Message</h3>
          <p className="mb-2 max-w-xs text-center text-sm text-gray-700 md:text-base">
            "Greetings from the North Pole" or something more believable.
          </p>
          <img
            src={postcardImg}
            alt="Add a Message"
            className="mb-2 h-40 w-64 rounded-lg object-cover shadow-md"
          />
        </div>
        {/* Arrow */}
        <svg
          width="32"
          height="48"
          viewBox="0 0 32 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="mb-2"
        >
          <path
            d="M16 0V44M16 44L4 32M16 44L28 32"
            stroke="#222"
            strokeWidth="2"
            strokeDasharray="6 6"
            strokeLinecap="round"
          />
        </svg>
        {/* Step 3 */}
        <div className="mb-2 flex w-full flex-col items-center px-6">
          <h2 className="mb-1 text-xl font-semibold md:text-2xl">Step 3</h2>
          <h3 className="mb-2 text-lg font-bold md:text-xl">
            We Print & Mail It
          </h3>
          <p className="mb-2 max-w-xs text-center text-sm text-gray-700 md:text-base">
            Now you're Grandma's favorite again! You can thank us later.
          </p>
          <img
            src={fridgeImg}
            alt="We Print & Mail It"
            className="mb-2 h-40 w-64 rounded-lg object-cover shadow-md"
          />
        </div>
        {/* CTA Button */}
        <div className="mt-6 mb-4 flex w-full items-center justify-center">
          <Button className="rounded-full px-8 py-3 text-lg" onClick={() => navigate("/create")}>
            Start Sending!
          </Button>
        </div>
      </section>
    </>
  );
}
