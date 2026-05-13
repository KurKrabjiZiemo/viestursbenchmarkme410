import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";

interface LanguageSwitchProps {
  className?: string;
}

const LanguageSwitch = ({ className = "" }: LanguageSwitchProps) => {
  const { language, toggleLanguage } = useLanguage();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className={`gap-2 ${className}`.trim()}
      aria-label="Switch language"
    >
      <Languages className="w-4 h-4" />
      {language === "lv" ? "LV" : "EN"}
    </Button>
  );
};

export default LanguageSwitch;
