"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Copy,
  ExternalLink,
  Loader2,
  MapPinned,
  Sparkles,
  Wand2,
} from "lucide-react";

import { EnrichmentDialog } from "@/components/enrichment/enrichment-dialog";
import { ResultsTable } from "@/components/results/results-table";
import { SearchPanel } from "@/components/search/search-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useBusinessTable } from "@/hooks/use-business-table";
import {
  enrichBusinesses,
  exportCsv,
  exportJson,
  getPresets,
  pushToSheets,
  randomSearch,
  searchBusinesses,
} from "@/lib/api";
import type {
  BusinessRecord,
  CategoryInputMode,
  EnrichedBusinessRecord,
  SearchPreset,
  SearchResponse,
} from "@/types/business";

type StatusTone = "neutral" | "success" | "error";

export default function Page() {
  const [presets, setPresets] = useState<SearchPreset | null>(null);
  const [isLoadingPresets, setIsLoadingPresets] = useState(true);

  const [categoryInputMode, setCategoryInputMode] = useState<CategoryInputMode>("list");
  const [category, setCategory] = useState("Dental Clinic");
  const [customCategory, setCustomCategory] = useState("");
  const [city, setCity] = useState("Austin, TX");
  const [maxResults, setMaxResults] = useState(20);

  const [autoRunRandom, setAutoRunRandom] = useState(true);
  const [randomSelection, setRandomSelection] = useState<{ category: string; city: string } | null>(null);

  const [searchResponse, setSearchResponse] = useState<SearchResponse | null>(null);
  const [records, setRecords] = useState<BusinessRecord[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [isEnriching, setIsEnriching] = useState(false);
  const [enrichmentDialogOpen, setEnrichmentDialogOpen] = useState(false);
  const [enrichmentDialogRecords, setEnrichmentDialogRecords] = useState<EnrichedBusinessRecord[]>([]);
  const [enrichmentWarnings, setEnrichmentWarnings] = useState<string[]>([]);
  const [enrichmentError, setEnrichmentError] = useState<string | null>(null);
  const [enrichmentByPlaceId, setEnrichmentByPlaceId] = useState<Record<string, EnrichedBusinessRecord>>({});

  const [isExportingJson, setIsExportingJson] = useState(false);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isPushingSheets, setIsPushingSheets] = useState(false);
  const [sheetsDialogOpen, setSheetsDialogOpen] = useState(false);
  const [sheetsDialogMessage, setSheetsDialogMessage] = useState("");
  const [sheetsDialogUrl, setSheetsDialogUrl] = useState<string | null>(null);
  const [sheetsDialogCount, setSheetsDialogCount] = useState(0);

  const [statusMessage, setStatusMessage] = useState<string>("Ready");
  const [statusTone, setStatusTone] = useState<StatusTone>("neutral");

  const {
    filters,
    setFilters,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    selectedIds,
    selectedRecords,
    filteredRecords,
    isAllVisibleSelected,
    toggleSelect,
    toggleSelectVisible,
    clearSelection,
  } = useBusinessTable(records);

  const selectedPayloadRecords = useMemo(
    () =>
      selectedRecords.map((record) => {
        const enriched = enrichmentByPlaceId[record.place_id];
        if (!enriched) {
          return record;
        }
        return {
          ...record,
          enrichment: enriched.enrichment,
        };
      }),
    [enrichmentByPlaceId, selectedRecords],
  );

  useEffect(() => {
    async function loadPresets() {
      try {
        const data = await getPresets();
        setPresets(data);
        setCategory((previous) => previous || data.categories[0] || "");
        setCity((previous) => previous || data.cities[0] || "");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load presets.";
        setStatusTone("error");
        setStatusMessage(message);
      } finally {
        setIsLoadingPresets(false);
      }
    }

    void loadPresets();
  }, []);

  function resolveCategory() {
    return categoryInputMode === "custom" ? customCategory.trim() : category;
  }

  async function runSearch(categoryValue: string, cityValue: string) {
    setIsSearching(true);
    setSearchError(null);

    try {
      const response = await searchBusinesses({
        category_input_mode: categoryInputMode,
        category: categoryValue,
        city: cityValue,
        max_results: maxResults,
      });

      setSearchResponse(response);
      setRecords(response.records);
      setEnrichmentByPlaceId({});
      clearSelection();
      setStatusTone("success");
      setStatusMessage(`Loaded ${response.total} business records.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Search failed.";
      setSearchError(message);
      setStatusTone("error");
      setStatusMessage(message);
    } finally {
      setIsSearching(false);
    }
  }

  async function handleSearch() {
    const activeCategory = resolveCategory();
    if (!activeCategory || !city.trim()) {
      setStatusTone("error");
      setStatusMessage("Category and city are required.");
      return;
    }

    await runSearch(activeCategory, city.trim());
  }

  async function handleRandomSearch() {
    if (!presets || presets.categories.length === 0 || presets.cities.length === 0) {
      setStatusTone("error");
      setStatusMessage("Random search requires loaded category and city presets.");
      return;
    }

    if (autoRunRandom) {
      setIsSearching(true);
      setSearchError(null);
      try {
        const result = await randomSearch(maxResults);
        setCategoryInputMode("list");
        setCategory(result.random_category);
        setCity(result.random_city);
        setRandomSelection({ category: result.random_category, city: result.random_city });
        setSearchResponse(result.search_response);
        setRecords(result.search_response.records);
        setEnrichmentByPlaceId({});
        clearSelection();

        setStatusTone("success");
        setStatusMessage(
          `Random search loaded ${result.search_response.total} records for ${result.random_category} in ${result.random_city}.`,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Random search failed.";
        setSearchError(message);
        setStatusTone("error");
        setStatusMessage(message);
      } finally {
        setIsSearching(false);
      }
      return;
    }

    const randomCategory = presets.categories[Math.floor(Math.random() * presets.categories.length)];
    const randomCity = presets.cities[Math.floor(Math.random() * presets.cities.length)];

    setCategoryInputMode("list");
    setCategory(randomCategory);
    setCity(randomCity);
    setRandomSelection({ category: randomCategory, city: randomCity });
    setStatusTone("neutral");
    setStatusMessage("Random values selected. Press Search to run.");
  }

  function handleNotesChange(placeId: string, notes: string) {
    setRecords((previous) =>
      previous.map((record) => (record.place_id === placeId ? { ...record, user_notes: notes } : record)),
    );
  }

  function requireSelection() {
    if (!searchResponse || selectedPayloadRecords.length === 0) {
      setStatusTone("error");
      setStatusMessage("Select at least one row first.");
      return false;
    }
    return true;
  }

  async function handleEnrichSelected() {
    if (!requireSelection()) {
      return;
    }

    setIsEnriching(true);
    setEnrichmentDialogOpen(true);
    setEnrichmentError(null);

    try {
      const response = await enrichBusinesses(selectedRecords, true);
      setEnrichmentDialogRecords(response.enriched_records);
      setEnrichmentWarnings(response.warnings);

      setEnrichmentByPlaceId((previous) => {
        const next = { ...previous };
        response.enriched_records.forEach((record) => {
          next[record.place_id] = record;
        });
        return next;
      });

      setStatusTone("success");
      setStatusMessage(`Enriched ${response.total} selected businesses.`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Enrichment failed.";
      setEnrichmentError(message);
      setStatusTone("error");
      setStatusMessage(message);
    } finally {
      setIsEnriching(false);
    }
  }

  async function handleExportJson() {
    if (!requireSelection() || !searchResponse) {
      return;
    }

    setIsExportingJson(true);
    try {
      const response = await exportJson(
        searchResponse.query,
        searchResponse.category,
        searchResponse.city,
        selectedPayloadRecords,
      );

      await navigator.clipboard.writeText(JSON.stringify(response.payload, null, 2));
      setStatusTone("success");
      setStatusMessage("JSON payload copied to clipboard.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "JSON export failed.";
      setStatusTone("error");
      setStatusMessage(message);
    } finally {
      setIsExportingJson(false);
    }
  }

  async function handleExportCsv() {
    if (!requireSelection() || !searchResponse) {
      return;
    }

    setIsExportingCsv(true);
    try {
      const { blob, filename } = await exportCsv(
        searchResponse.query,
        searchResponse.category,
        searchResponse.city,
        selectedPayloadRecords,
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);

      setStatusTone("success");
      setStatusMessage("CSV export downloaded.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "CSV export failed.";
      setStatusTone("error");
      setStatusMessage(message);
    } finally {
      setIsExportingCsv(false);
    }
  }

  async function handlePushSheets() {
    if (!requireSelection() || !searchResponse) {
      return;
    }

    setIsPushingSheets(true);
    try {
      const response = await pushToSheets(
        searchResponse.query,
        searchResponse.category,
        searchResponse.city,
        selectedPayloadRecords,
      );

      if (response.success) {
        setStatusTone("success");
        setStatusMessage("Rows pushed to Google Sheets successfully.");
        setSheetsDialogCount(selectedPayloadRecords.length);
        setSheetsDialogUrl(response.destination_url || null);
        setSheetsDialogMessage(
          response.destination_url
            ? "Your data has been pushed to Google Sheets."
            : "Rows pushed to Google Sheets webhook successfully.",
        );
        setSheetsDialogOpen(true);
      } else {
        setStatusTone("error");
        setStatusMessage(response.message);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Google Sheets export failed.";
      setStatusTone("error");
      setStatusMessage(message);
    } finally {
      setIsPushingSheets(false);
    }
  }

  return (
    <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-10">
      <section className="mb-6 animate-fade-in">
        <div className="rounded-xl border border-border/70 bg-white/80 p-5 shadow-[0_14px_35px_-28px_rgba(16,84,86,0.9)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <p className="inline-flex items-center gap-2 rounded-full bg-primary/8 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                <Building2 className="h-3.5 w-3.5" />
                Business Discovery and Enrichment
              </p>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Business discovery and enrichment tool powered by Google Maps Platform Places API
              </h1>
              <p className="max-w-3xl text-sm text-muted-foreground">
                Search by category and location, refine lead quality, enrich selected records with AI, and export
                structured data for outbound workflows.
              </p>
            </div>

            <div className="rounded-lg border border-border/70 bg-muted/35 px-4 py-3 text-sm">
              <p className="font-semibold">Run Status</p>
              <p
                className={
                  statusTone === "success"
                    ? "text-emerald-700"
                    : statusTone === "error"
                      ? "text-destructive"
                      : "text-muted-foreground"
                }
              >
                {statusMessage}
              </p>
            </div>
          </div>

          <Separator className="my-4" />

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-md border border-border/60 bg-background px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Mode</p>
              <p className="mt-1 font-semibold">Live Google Mode</p>
            </div>
            <div className="rounded-md border border-border/60 bg-background px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected Rows</p>
              <p className="mt-1 font-semibold">{selectedIds.size}</p>
            </div>
            <div className="rounded-md border border-border/60 bg-background px-3 py-2">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Enriched Rows</p>
              <p className="mt-1 font-semibold">{Object.keys(enrichmentByPlaceId).length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        {isLoadingPresets ? (
          <Card>
            <CardContent className="space-y-3 p-5">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ) : (
          <SearchPanel
            presets={presets}
            categoryInputMode={categoryInputMode}
            category={category}
            customCategory={customCategory}
            city={city}
            maxResults={maxResults}
            autoRunRandom={autoRunRandom}
            randomSelection={randomSelection}
            isSearching={isSearching}
            onCategoryInputModeChange={setCategoryInputMode}
            onCategoryChange={setCategory}
            onCustomCategoryChange={setCustomCategory}
            onCityChange={setCity}
            onMaxResultsChange={setMaxResults}
            onAutoRunRandomChange={setAutoRunRandom}
            onSearch={handleSearch}
            onRandomSearch={handleRandomSearch}
          />
        )}

        {isSearching ? (
          <Card>
            <CardContent className="flex items-center justify-center gap-2 py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Searching businesses...</span>
            </CardContent>
          </Card>
        ) : null}

        {searchError ? (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="flex items-start gap-2 py-4 text-destructive">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <p className="text-sm">{searchError}</p>
            </CardContent>
          </Card>
        ) : null}

        {searchResponse?.warnings.length ? (
          <Card className="border-amber-300 bg-amber-50">
            <CardContent className="space-y-2 py-4 text-sm text-amber-800">
              <p className="font-semibold">Search Warnings</p>
              {searchResponse.warnings.map((warning) => (
                <p key={warning}>- {warning}</p>
              ))}
            </CardContent>
          </Card>
        ) : null}

        <ResultsTable
          searchResponse={searchResponse}
          visibleRecords={filteredRecords}
          selectedIds={selectedIds}
          isAllVisibleSelected={isAllVisibleSelected}
          filters={filters}
          sortBy={sortBy}
          sortDirection={sortDirection}
          isEnriching={isEnriching}
          isExportingJson={isExportingJson}
          isExportingCsv={isExportingCsv}
          isPushingSheets={isPushingSheets}
          onToggleSelect={toggleSelect}
          onToggleSelectVisible={toggleSelectVisible}
          onFilterChange={(next) => setFilters((current) => ({ ...current, ...next }))}
          onSortByChange={setSortBy}
          onSortDirectionChange={setSortDirection}
          onNotesChange={handleNotesChange}
          onEnrichSelected={handleEnrichSelected}
          onExportJson={handleExportJson}
          onExportCsv={handleExportCsv}
          onPushSheets={handlePushSheets}
        />
      </section>

      <Dialog open={sheetsDialogOpen} onOpenChange={setSheetsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <DialogTitle className="text-center">Pushed to Sheets!</DialogTitle>
            <DialogDescription className="text-center">
              {sheetsDialogCount} record{sheetsDialogCount === 1 ? "" : "s"} sent successfully.
              {sheetsDialogMessage && (
                <span className="mt-1 block">{sheetsDialogMessage}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col">
            {sheetsDialogUrl && (
              <Button
                className="w-full"
                onClick={() => window.open(sheetsDialogUrl, "_blank")}
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Open Spreadsheet
              </Button>
            )}
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setSheetsDialogOpen(false)}
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EnrichmentDialog
        open={enrichmentDialogOpen}
        onOpenChange={setEnrichmentDialogOpen}
        records={enrichmentDialogRecords}
        warnings={enrichmentWarnings}
        error={enrichmentError}
      />

      <footer className="mt-7 border-t border-border/60 pt-4 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-4">
          <span className="inline-flex items-center gap-1">
            <MapPinned className="h-3.5 w-3.5" />
            Official Google Maps Platform Places API requests
          </span>
          <span className="inline-flex items-center gap-1">
            <Wand2 className="h-3.5 w-3.5" />
            AI-assisted enrichment for selected businesses
          </span>
          <span className="inline-flex items-center gap-1">
            <Copy className="h-3.5 w-3.5" />
            Structured JSON/CSV export workflows
          </span>
          <span className="inline-flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            Live Google mode for production-style discovery workflows
          </span>
        </div>
      </footer>
    </main>
  );
}

