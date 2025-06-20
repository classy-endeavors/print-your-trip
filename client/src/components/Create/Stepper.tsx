import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Check from "../icons/Check";

interface StepperProps {
  steps: string[];
  currentStep: number; // 0-based index
  labels?: string[]; // Optional labels for each step
  setCurrentStep: (step: number) => void;
  stepComponents: React.ReactNode[]; // Components to render for each step
}

const Stepper: React.FC<StepperProps> = ({
  steps,
  currentStep,
  labels,
  setCurrentStep,
  stepComponents,
}) => {
  return (
    <>
      <div className="flex h-20 w-full flex-col items-start px-5">
        <div className="mx-auto flex w-full max-w-2xl items-center rounded-full bg-alice-blue/50 px-1 py-1">
          {steps.map((step, idx) => (
            <React.Fragment key={step}>
              <div
                className="flex flex-col items-center"
                onClick={() => setCurrentStep(idx)}
              >
                <motion.div
                  layout
                  initial={{ scale: 0.8, opacity: 0.5 }}
                  animate={{
                    scale: 1,
                    opacity: 1,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-colors duration-300 ${
                    idx < currentStep
                      ? "border-button-green bg-button-green text-white"
                      : idx === currentStep
                        ? "border-button-green bg-white font-bold text-button-green"
                        : "border-alice-blue-dark bg-background text-black"
                  } `}
                >
                  {idx < currentStep ? (
                    <Check color="white" />
                  ) : (
                    String(idx + 1).padStart(2, "0")
                  )}
                </motion.div>
                <AnimatePresence mode="wait">
                  {labels && (
                    <motion.span
                      key={labels[idx]}
                      initial={{ opacity: 0, y: 40 }}
                      animate={{ opacity: 1, y: 30 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.3 }}
                      className={`absolute mt-2 min-h-[1.5em] text-xs font-semibold text-button-green ${idx === currentStep && "underline underline-offset-5"}`}
                    >
                      {labels[idx]}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              {idx < steps.length - 1 && (
                <div className="relative flex h-1 flex-1 items-center">
                  {/* Track */}
                  <div className="absolute top-0 left-0 h-1 w-full overflow-hidden bg-alice-blue-dark" />
                  {/* Animated fill */}
                  <motion.div
                    className="absolute top-0 left-0 h-1 bg-button-green"
                    initial={{ width: "0%" }}
                    animate={{
                      width: idx < currentStep ? "100%" : "0%",
                      opacity:
                        idx < currentStep || idx === currentStep ? 1 : 0.5,
                    }}
                    style={{ zIndex: 1 }}
                  />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className="mt-4 w-full">{stepComponents[currentStep]}</div>
    </>
  );
};

export default Stepper;
