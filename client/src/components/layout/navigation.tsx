import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: {
    id: string;
    label: string;
    icon: React.ReactNode;
  }[];
}

export default function Navigation({ activeTab, onTabChange, tabs }: NavigationProps) {
  return (
    <div className="border-b border-neutral-border mb-8">
      <nav className="-mb-px flex space-x-8">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant="ghost"
            className={`border-b-2 py-2 px-1 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </Button>
        ))}
      </nav>
    </div>
  );
}
