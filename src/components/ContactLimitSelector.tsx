
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface ContactLimitSelectorProps {
  value: number;
  onChange: (value: number) => void;
}

export const ContactLimitSelector = ({ value, onChange }: ContactLimitSelectorProps) => {
  const options = [
    { value: 10, label: "10 contacts" },
    { value: 25, label: "25 contacts" },
    { value: 50, label: "50 contacts" },
    { value: 100, label: "100 contacts" },
    { value: 250, label: "250 contacts" },
    { value: 500, label: "500 contacts" },
    { value: -1, label: "All contacts" }
  ];

  return (
    <div className="space-y-2">
      <Label htmlFor="contact-limit">Number of contacts to categorize</Label>
      <Select 
        value={value.toString()} 
        onValueChange={(val) => onChange(parseInt(val))}
      >
        <SelectTrigger id="contact-limit">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value.toString()}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};
