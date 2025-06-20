import { useState } from "react";
import ImageUploader from "../components/Create/ImageUploader";
import Stepper from "../components/Create/Stepper";

export default function Create() {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ["01", "02", "03", "04"];
  const stepLabels = ["Add Photo", "Add Message", "Add Address", "Review"];
  const stepComponents = [
    <ImageUploader key="step-1" />,
    <div key="step-2">Add Message Step (TODO)</div>,
    <div key="step-3">Add Address Step (TODO)</div>,
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
