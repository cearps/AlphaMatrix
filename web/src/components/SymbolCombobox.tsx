import * as React from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { filterSymbols } from "../lib/symbols";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
};

export default function SymbolCombobox({
  value,
  onChange,
  placeholder = "Select symbol",
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const items = filterSymbols(query);
  const custom = (query || "").trim().toUpperCase();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="justify-between w-full"
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[280px]">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search ticker..."
            value={query}
            onValueChange={setQuery}
            onKeyDown={(e) => {
              if (e.key === "Enter" && custom) {
                onChange(custom);
                setOpen(false);
              }
            }}
          />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Symbols">
              {custom && !items.includes(custom) && (
                <CommandItem
                  key={`custom-${custom}`}
                  value={custom}
                  onSelect={() => {
                    onChange(custom);
                    setOpen(false);
                  }}
                >
                  {custom}
                </CommandItem>
              )}
              {items.map((sym) => (
                <CommandItem
                  key={sym}
                  value={sym}
                  onSelect={() => {
                    onChange(sym);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      sym === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {sym}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
