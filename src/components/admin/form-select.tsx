import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const SELECT_NONE_VALUE = "__none__";

type FormSelectOption = {
  value: string;
  label: string;
};

type FormSelectProps = {
  id?: string;
  name: string;
  placeholder: string;
  options: FormSelectOption[];
  defaultValue?: string | null;
  required?: boolean;
};

export function FormSelect({
  id,
  name,
  placeholder,
  options,
  defaultValue,
  required = false,
}: FormSelectProps) {
  return (
    <Select defaultValue={defaultValue ?? SELECT_NONE_VALUE} name={name} required={required}>
      <SelectTrigger className="w-full" id={id}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectItem value={SELECT_NONE_VALUE}>{placeholder}</SelectItem>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
