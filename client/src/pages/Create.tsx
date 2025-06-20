import { useState, useEffect } from "react";
import ImageUploader from "../components/Create/ImageUploader";
import Stepper from "../components/Create/Stepper";
import CustomMessage from "../components/Create/CustomMessage";
import AddressForm, { type Address } from "../components/Create/AddressForm";

const LOCAL_STORAGE_KEY = "createPageState";

function loadState() {
  if (typeof window === "undefined")
    return { currentStep: 0, message: "", address: undefined };
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  return { currentStep: 0, message: "", address: undefined };
}

export default function Create() {
  const [currentStep, setCurrentStep] = useState(() => loadState().currentStep);
  const [message, setMessage] = useState(() => loadState().message);
  const [address, setAddress] = useState(() => loadState().address);

  useEffect(() => {
    localStorage.setItem(
      LOCAL_STORAGE_KEY,
      JSON.stringify({ currentStep, message, address }),
    );
  }, [currentStep, message, address]);

  const handleMessageSave = (newMessage: string) => {
    setMessage(newMessage);
    setCurrentStep((prevStep: number) => prevStep + 1);
  };

  const handleAddressSave = (newAddress: Address) => {
    setAddress(newAddress);
    setCurrentStep((prevStep: number) => prevStep + 1);
  };

  const steps = ["01", "02", "03", "04"];
  const stepLabels = ["Add Photo", "Add Message", "Add Address", "Review"];
  const stepComponents = [
    <ImageUploader key="step-1" />,
    <CustomMessage
      message={message}
      onSave={(newMessage) => handleMessageSave(newMessage)}
      key="step-2"
    />,
    <AddressForm
      initialAddress={address}
      onSave={handleAddressSave}
      key="step-3"
    />,
    <div key="step-4">Review Step (TODO)</div>,
  ];
  return (
    <div>
      <Stepper
        steps={steps}
        labels={stepLabels}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
        stepComponents={stepComponents}
      />
    </div>
  );
}
