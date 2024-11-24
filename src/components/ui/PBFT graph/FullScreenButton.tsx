// FullScreenButton.jsx
import React from "react";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button" // Update this path as needed
import { Maximize2 } from 'lucide-react'

const FullScreenButton = () => {
  const location = useLocation();

  // Logic to determine text and link
  const isPbftPage = location.pathname === "/pbft";
  const buttonText = isPbftPage ? "Back to Home" : "Maximize the view";
  const buttonLink = isPbftPage ? "/#" : "/pbft";

  return (
    <div>
      <a href={buttonLink}>
        <Button variant="outline" className="full-screen-button">
          <Maximize2 className="mr-2 h-4 w-4" />
          {buttonText}
        </Button>
      </a>
    </div>
  );
};

export default FullScreenButton;