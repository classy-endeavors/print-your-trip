import { useState } from "react";
import ImageUploader from "../components/ImageUploader";
import Stepper from "../components/Stepper";

export default function Create() {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ["01", "02", "03", "04"];
  const stepLabels = ["Add Photo", "Add Message", "Add Address", "Review"];
  return (
    <div>
      <Stepper
        steps={steps}
        labels={stepLabels}
        currentStep={currentStep}
        setCurrentStep={setCurrentStep}
      />
      <ImageUploader />
    </div>
  );
}
