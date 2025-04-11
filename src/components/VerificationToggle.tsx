
import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { CheckCircle, ShieldAlert } from "lucide-react";

interface VerificationToggleProps {
  onToggle: (showVerifiedOnly: boolean) => void;
}

const VerificationToggle = ({ onToggle }: VerificationToggleProps) => {
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);

  const handleToggle = (checked: boolean) => {
    setShowVerifiedOnly(checked);
    onToggle(checked);
  };

  return (
    <div className="flex items-center space-x-6 p-3 bg-highlight-800 rounded-lg mb-6">
      <div className="flex items-center space-x-2">
        <Switch 
          checked={showVerifiedOnly} 
          onCheckedChange={handleToggle} 
          className="data-[state=checked]:bg-[#FFC30B]"
        />
        <span className="text-sm text-white">
          {showVerifiedOnly ? "Verified highlights only" : "All highlights"}
        </span>
      </div>
      
      <div className="flex items-center space-x-2">
        {showVerifiedOnly ? (
          <CheckCircle size={16} className="text-[#FFC30B]" />
        ) : (
          <ShieldAlert size={16} className="text-gray-400" />
        )}
        <span className="text-xs text-gray-400">
          {showVerifiedOnly 
            ? "Showing only verified highlights from official sources" 
            : "Showing all available highlights including unofficial sources"}
        </span>
      </div>
    </div>
  );
};

export default VerificationToggle;
