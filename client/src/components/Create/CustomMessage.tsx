import React, { useState, useEffect } from "react";
import Button from "../Button";

interface MessageProps {
  message: string;
  onChange?: (newMessage: string) => void;
  onSave?: (message: string) => void;
}

export default function CustomMessage({
  message,
  onChange,
  onSave,
}: MessageProps) {
  const [inputValue, setInputValue] = useState(message);

  useEffect(() => {
    setInputValue(message);
  }, [message]);

  const placeholder = `Hey John,\nJapan has been amazing! Tokyo's energy is unreal, Kyoto's temples are peaceful, and the sushi—next level. Tried a tiny izakaya with incredible yakitori and sake.\n\nWish you were here!\nSarah`;

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
    if (onChange) {
      onChange(e.target.value);
    }
  };

  const handleSave = () => {
    if (onSave) {
      onSave(inputValue);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="flex w-[25rem] max-w-[90vw] flex-col items-center rounded-md bg-background-hero p-6">
        <h2 className="mb-4 text-center text-lg font-semibold text-black">
          Customize Your Message
        </h2>
        <textarea
          value={inputValue}
          onChange={handleInputChange}
          className="m-4 min-h-[230px] w-full resize-none rounded-lg border-none bg-white p-4 text-[15px] text-gray-700 outline-none placeholder:text-[14px] placeholder:text-gray-400 focus:ring-2 focus:ring-button-green"
          placeholder={placeholder}
          maxLength={500}
        />
        <Button
          onClick={handleSave}
          className="w-full rounded-full bg-[#6B8F6E] py-2 text-lg font-medium text-white transition-colors duration-200 hover:bg-[#5e7e60]"
        >
          Save Message
        </Button>
      </div>
    </div>
  );
}
