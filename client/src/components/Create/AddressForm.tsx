import React, { useState } from "react";
import Button from "../Button";
import { motion } from "framer-motion";

export interface Address {
  name: string;
  company?: string;
  address: string;
  suite?: string;
  state: string;
  city: string;
  zip: string;
  country: string;
}

interface AddressFormProps {
  initialAddress?: Address;
  onChange?: (address: Address) => void;
  onSave?: (address: Address) => void;
}

const countries = ["United States", "Canada", "United Kingdom", "Australia"];

const inputVariants = {
  initial: { x: 0 },
  shake: {
    x: [0, -8, 8, -6, 6, -3, 3, 0],
    transition: { duration: 0.4, type: "tween" as const },
  },
};

export default function AddressForm({
  initialAddress = {
    name: "",
    company: "",
    address: "",
    suite: "",
    state: "",
    city: "",
    zip: "",
    country: "United States",
  },
  onChange,
  onSave,
}: AddressFormProps) {
  const [address, setAddress] = useState<Address>(initialAddress);
  const [errors, setErrors] = useState<{ [K in keyof Address]?: boolean }>({});
  const [attemptedSave, setAttemptedSave] = useState(false);

  const validate = (addr: Address) => {
    const newErrors: { [K in keyof Address]?: boolean } = {};
    if (!addr.name.trim()) newErrors.name = true;
    if (!addr.address.trim()) newErrors.address = true;
    if (!addr.city.trim()) newErrors.city = true;
    if (!addr.state.trim()) newErrors.state = true;
    if (!addr.zip.trim()) newErrors.zip = true;
    if (!addr.country.trim()) newErrors.country = true;
    return newErrors;
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setAddress((prev) => {
      const updated = { ...prev, [name]: value };
      if (onChange) onChange(updated);
      if (attemptedSave) setErrors(validate(updated));
      return updated;
    });
  };

  const handleSave = () => {
    setAttemptedSave(true);
    const validation = validate(address);
    setErrors(validation);
    if (Object.keys(validation).length === 0) {
      if (onSave) onSave(address);
    }
  };

  const inputClass = (field: keyof Address) =>
    `mb-3 w-full rounded-md border-none bg-white p-3 text-[16px] outline-none focus:ring-2 focus:ring-button-green ${
      errors[field]
        ? "border border-red-500 text-red-600 placeholder:text-red-400"
        : "text-black placeholder:text-gray-300"
    }`;

  const smallInputClass = (field: keyof Address, width: string) =>
    `${width} rounded-md border-none bg-white p-3 text-[16px] outline-none focus:ring-2 focus:ring-button-green ${
      errors[field]
        ? "border border-red-500 text-red-600 placeholder:text-red-400"
        : "text-black placeholder:text-gray-300"
    }`;

  return (
    <div className="flex flex-col items-center justify-center py-4">
      <div className="flex w-[25rem] max-w-[90vw] flex-col items-center rounded-xl bg-background-hero p-6">
        <motion.input
          name="name"
          value={address.name}
          onChange={handleChange}
          className={inputClass("name")}
          placeholder={errors.name ? "Name is required" : "Name"}
          variants={inputVariants}
          animate={errors.name && attemptedSave ? "shake" : "initial"}
        />
        <input
          name="company"
          value={address.company}
          onChange={handleChange}
          className="mb-3 w-full rounded-md border-none bg-white p-3 text-[16px] text-black outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-button-green"
          placeholder="Company (optional)"
        />
        <motion.input
          name="address"
          value={address.address}
          onChange={handleChange}
          className={inputClass("address")}
          placeholder={
            errors.address ? "Street Address is required" : "Street Address"
          }
          variants={inputVariants}
          animate={errors.address && attemptedSave ? "shake" : "initial"}
        />
        <input
          name="suite"
          value={address.suite}
          onChange={handleChange}
          className="mb-3 w-full rounded-md border-none bg-white p-3 text-[16px] text-black outline-none placeholder:text-gray-300 focus:ring-2 focus:ring-button-green"
          placeholder="Suite/Apartment (optional)"
        />
        <div className="mb-3 flex w-full gap-2">
          <motion.input
            name="city"
            value={address.city}
            onChange={handleChange}
            className={smallInputClass("city", "w-1/2")}
            placeholder={errors.city ? "City is required" : "City"}
            variants={inputVariants}
            animate={errors.city && attemptedSave ? "shake" : "initial"}
          />
          <motion.input
            name="state"
            value={address.state}
            onChange={handleChange}
            className={smallInputClass("state", "w-1/4")}
            placeholder={errors.state ? "State is required" : "State"}
            variants={inputVariants}
            animate={errors.state && attemptedSave ? "shake" : "initial"}
          />
          <motion.input
            name="zip"
            value={address.zip}
            onChange={handleChange}
            className={smallInputClass("zip", "w-1/4")}
            placeholder={errors.zip ? "Zip is required" : "Zip"}
            variants={inputVariants}
            animate={errors.zip && attemptedSave ? "shake" : "initial"}
          />
        </div>
        <select
          name="country"
          value={address.country}
          onChange={handleChange}
          className={`mb-5 w-full rounded-md border-none bg-white p-3 text-[16px] outline-none focus:ring-2 focus:ring-button-green ${errors.country ? "border border-red-500 text-red-600" : "text-black"}`}
        >
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <Button
          onClick={handleSave}
          className="w-full rounded-full bg-button-green py-2 text-lg font-medium text-white transition-colors duration-200"
        >
          Save Address
        </Button>
      </div>
    </div>
  );
}
