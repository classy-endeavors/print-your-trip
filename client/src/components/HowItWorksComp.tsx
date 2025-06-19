import Button from "./Button";

export default function HowItWorksComponent() {
  return (
    <>
      <header className="flex h-[50vh] flex-col items-center justify-center p-4 text-center">
        <h1 className="text-2xl font-bold">How It Works</h1>
        <p className="mt-2">
          Because core memories shouldn't live on your phone forever.
        </p>
      </header>
      <div className="p-8">
        <h2 className="mb-4 text-3xl font-semibold">Step 1: Snap & Upload</h2>
        <p className="mb-4 text-lg text-gray-700">
          Pick a fave travel pic (yes, even that one where your hair is a mess).
        </p>
      </div>
      <div className="p-8">
        <h2 className="mb-4 text-3xl font-semibold">
          Step 2: Add a Message & the Address
        </h2>
        <p className="mb-4 text-lg text-gray-700">
          "Greetings from the North Pole" or something more believable.
        </p>
      </div>
      <div className="p-8">
        <h2 className="mb-4 text-3xl font-semibold">
          Step 3: We Print & Mail It
        </h2>
        <p className="mb-4 text-lg text-gray-700">
          Grandma’s fridge-worthy postcard, incoming!
        </p>
      </div>
      <div className="mt-8 flex w-full items-center justify-center">
        <Button className="">Start Sending!</Button>
      </div>
    </>
  );
}
