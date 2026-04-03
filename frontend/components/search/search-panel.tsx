"use client";

import { useEffect, useMemo, useState, type KeyboardEvent } from "react";
import { Compass, Loader2, MapPin, Search, Shuffle } from "lucide-react";

import { getLocationSuggestions } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { CategoryInputMode, LocationSuggestion, SearchPreset } from "@/types/business";

interface SearchPanelProps {
  presets: SearchPreset | null;
  categoryInputMode: CategoryInputMode;
  category: string;
  customCategory: string;
  city: string;
  maxResults: number;
  autoRunRandom: boolean;
  randomSelection: { category: string; city: string } | null;
  isSearching: boolean;
  onCategoryInputModeChange: (value: CategoryInputMode) => void;
  onCategoryChange: (value: string) => void;
  onCustomCategoryChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onMaxResultsChange: (value: number) => void;
  onAutoRunRandomChange: (value: boolean) => void;
  onSearch: () => void;
  onRandomSearch: () => void;
}

export function SearchPanel({
  presets,
  categoryInputMode,
  category,
  customCategory,
  city,
  maxResults,
  autoRunRandom,
  randomSelection,
  isSearching,
  onCategoryInputModeChange,
  onCategoryChange,
  onCustomCategoryChange,
  onCityChange,
  onMaxResultsChange,
  onAutoRunRandomChange,
  onSearch,
  onRandomSearch,
}: SearchPanelProps) {
  const categories = presets?.categories ?? [];
  const presetCities = useMemo(() => presets?.cities ?? [], [presets?.cities]);

  const [isCityFocused, setIsCityFocused] = useState(false);
  const [highlightedCityIndex, setHighlightedCityIndex] = useState(0);
  const [isLoadingCitySuggestions, setIsLoadingCitySuggestions] = useState(false);
  const [apiSuggestions, setApiSuggestions] = useState<LocationSuggestion[]>([]);

  useEffect(() => {
    if (!isCityFocused) {
      return;
    }

    const query = city.trim();
    if (query.length < 2) {
      setApiSuggestions([]);
      setIsLoadingCitySuggestions(false);
      return;
    }

    let isActive = true;
    const timeoutId = window.setTimeout(async () => {
      setIsLoadingCitySuggestions(true);
      try {
        const response = await getLocationSuggestions(query, 8);
        if (!isActive) {
          return;
        }
        setApiSuggestions(response.suggestions);
      } catch {
        if (isActive) {
          setApiSuggestions([]);
        }
      } finally {
        if (isActive) {
          setIsLoadingCitySuggestions(false);
        }
      }
    }, 250);

    return () => {
      isActive = false;
      window.clearTimeout(timeoutId);
    };
  }, [city, isCityFocused]);

  const citySuggestions = useMemo(() => {
    const query = city.trim().toLowerCase();

    if (query.length >= 2 && apiSuggestions.length > 0) {
      return apiSuggestions.map((item) => item.text);
    }

    if (!query) {
      return presetCities.slice(0, 8);
    }

    return presetCities.filter((item) => item.toLowerCase().includes(query)).slice(0, 8);
  }, [apiSuggestions, city, presetCities]);

  useEffect(() => {
    setHighlightedCityIndex((previous) => Math.min(previous, Math.max(citySuggestions.length - 1, 0)));
  }, [citySuggestions.length]);

  const showCitySuggestions = isCityFocused && citySuggestions.length > 0;

  function selectCitySuggestion(selectedCity: string) {
    onCityChange(selectedCity);
    setIsCityFocused(false);
    setHighlightedCityIndex(0);
  }

  function handleCityKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!showCitySuggestions) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightedCityIndex((previous) => Math.min(previous + 1, citySuggestions.length - 1));
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedCityIndex((previous) => Math.max(previous - 1, 0));
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const nextCity = citySuggestions[highlightedCityIndex];
      if (nextCity) {
        selectCitySuggestion(nextCity);
      }
      return;
    }

    if (event.key === "Escape") {
      setIsCityFocused(false);
    }
  }

  return (
    <Card className="border-border/70 bg-white/90 shadow-[0_12px_30px_-24px_rgba(10,65,71,0.65)]">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Compass className="h-5 w-5 text-primary" />
              Search Workspace
            </CardTitle>
            <CardDescription>
              Discover businesses by category and location using official API-backed search.
            </CardDescription>
          </div>
          <Badge variant="success">Live Google Mode</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Business Category Input</Label>
            <Tabs
              value={categoryInputMode}
              onValueChange={(value) => onCategoryInputModeChange(value as CategoryInputMode)}
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="list">Choose from list</TabsTrigger>
                <TabsTrigger value="custom">Custom input</TabsTrigger>
              </TabsList>
            </Tabs>

            {categoryInputMode === "list" ? (
              <Select value={category} onValueChange={onCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a business category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Input
                placeholder="e.g. Pediatric Dental Office"
                value={customCategory}
                onChange={(event) => onCustomCategoryChange(event.target.value)}
              />
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="city-input">City / Location</Label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="city-input"
                className="pl-9"
                placeholder="e.g. Austin, TX or 5th Avenue, New York"
                value={city}
                autoComplete="off"
                onFocus={() => setIsCityFocused(true)}
                onBlur={() => {
                  window.setTimeout(() => {
                    setIsCityFocused(false);
                  }, 120);
                }}
                onKeyDown={handleCityKeyDown}
                onChange={(event) => {
                  onCityChange(event.target.value);
                  setIsCityFocused(true);
                  setHighlightedCityIndex(0);
                }}
              />

              {showCitySuggestions ? (
                <div className="absolute z-20 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-md">
                  {citySuggestions.map((suggestion, index) => (
                    <button
                      key={`${suggestion}-${index}`}
                      type="button"
                      className={`w-full rounded-sm px-3 py-2 text-left text-sm transition-colors ${
                        index === highlightedCityIndex
                          ? "bg-muted text-foreground"
                          : "text-foreground hover:bg-muted/70"
                      }`}
                      onMouseEnter={() => setHighlightedCityIndex(index)}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        selectCitySuggestion(suggestion);
                      }}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              {isLoadingCitySuggestions ? (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading Google location suggestions...
                </span>
              ) : (
                "Type at least 2 characters to get address and location suggestions."
              )}
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <Label htmlFor="max-results">Max Results (Optional)</Label>
            <Input
              id="max-results"
              type="number"
              min={1}
              max={100}
              value={maxResults}
              onChange={(event) => {
                const parsed = Number(event.target.value);
                if (Number.isNaN(parsed)) {
                  onMaxResultsChange(20);
                  return;
                }
                onMaxResultsChange(Math.max(1, Math.min(100, parsed)));
              }}
            />
          </div>

          <div className="md:col-span-2 flex items-end justify-between rounded-md border border-border/70 bg-muted/35 px-3 py-2">
            <div>
              <p className="text-sm font-medium">Auto-run random search</p>
              <p className="text-xs text-muted-foreground">
                When enabled, random presets immediately trigger a search.
              </p>
            </div>
            <Switch checked={autoRunRandom} onCheckedChange={onAutoRunRandomChange} />
          </div>
        </div>

        {randomSelection ? (
          <div className="animate-fade-in rounded-md border border-dashed border-primary/35 bg-primary/5 px-3 py-2 text-sm">
            <p className="font-medium text-primary">Random Selection</p>
            <div className="mt-1 flex flex-wrap gap-2">
              <Badge variant="outline">Category: {randomSelection.category}</Badge>
              <Badge variant="outline">City: {randomSelection.city}</Badge>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Button className="min-w-32" onClick={onSearch} disabled={isSearching}>
            <Search className="mr-2 h-4 w-4" />
            {isSearching ? "Searching..." : "Search"}
          </Button>
          <Button variant="secondary" onClick={onRandomSearch} disabled={isSearching}>
            <Shuffle className="mr-2 h-4 w-4" />
            Random Search
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
