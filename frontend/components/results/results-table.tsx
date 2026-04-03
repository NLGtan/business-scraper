"use client";

import {
  Download,
  FileJson,
  Filter,
  Globe,
  Phone,
  Sparkles,
  Table2,
  Upload,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SortBy, SortDirection, TableFilters } from "@/hooks/use-business-table";
import type { BusinessRecord, SearchResponse } from "@/types/business";

interface ResultsTableProps {
  searchResponse: SearchResponse | null;
  visibleRecords: BusinessRecord[];
  selectedIds: Set<string>;
  isAllVisibleSelected: boolean;
  filters: TableFilters;
  sortBy: SortBy;
  sortDirection: SortDirection;
  isEnriching: boolean;
  isExportingJson: boolean;
  isExportingCsv: boolean;
  isPushingSheets: boolean;
  onToggleSelect: (placeId: string) => void;
  onToggleSelectVisible: () => void;
  onFilterChange: (next: Partial<TableFilters>) => void;
  onSortByChange: (value: SortBy) => void;
  onSortDirectionChange: (value: SortDirection) => void;
  onNotesChange: (placeId: string, notes: string) => void;
  onEnrichSelected: () => void;
  onExportJson: () => void;
  onExportCsv: () => void;
  onPushSheets: () => void;
}

export function ResultsTable({
  searchResponse,
  visibleRecords,
  selectedIds,
  isAllVisibleSelected,
  filters,
  sortBy,
  sortDirection,
  isEnriching,
  isExportingJson,
  isExportingCsv,
  isPushingSheets,
  onToggleSelect,
  onToggleSelectVisible,
  onFilterChange,
  onSortByChange,
  onSortDirectionChange,
  onNotesChange,
  onEnrichSelected,
  onExportJson,
  onExportCsv,
  onPushSheets,
}: ResultsTableProps) {
  if (!searchResponse) {
    return (
      <Card className="border-border/70 bg-white/80">
        <CardContent className="flex min-h-56 flex-col items-center justify-center gap-3 text-center">
          <Table2 className="h-9 w-9 text-muted-foreground" />
          <div>
            <p className="font-semibold">No search results yet</p>
            <p className="text-sm text-muted-foreground">
              Run a search or random preset to load business records.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const selectedCount = selectedIds.size;

  return (
    <Card className="border-border/70 bg-white/95 shadow-[0_10px_32px_-26px_rgba(16,78,72,0.8)]">
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle className="text-xl">Discovered Businesses</CardTitle>
            <CardDescription>
              {searchResponse.query} | {searchResponse.total} total record
              {searchResponse.total === 1 ? "" : "s"}
            </CardDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="outline">Visible: {visibleRecords.length}</Badge>
              <Badge variant="secondary">Selected: {selectedCount}</Badge>
              <Badge variant="success">Live Google Mode</Badge>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={onEnrichSelected}
              disabled={selectedCount === 0 || isEnriching}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {isEnriching ? "Enriching..." : "Enrich with AI"}
            </Button>
            <Button
              variant="outline"
              onClick={onExportJson}
              disabled={selectedCount === 0 || isExportingJson}
            >
              <FileJson className="mr-2 h-4 w-4" />
              {isExportingJson ? "Preparing..." : "Copy JSON"}
            </Button>
            <Button
              variant="outline"
              onClick={onExportCsv}
              disabled={selectedCount === 0 || isExportingCsv}
            >
              <Download className="mr-2 h-4 w-4" />
              {isExportingCsv ? "Exporting..." : "Export CSV"}
            </Button>
            <Button
              variant="outline"
              onClick={onPushSheets}
              disabled={selectedCount === 0 || isPushingSheets}
            >
              <Upload className="mr-2 h-4 w-4" />
              {isPushingSheets ? "Pushing..." : "Push to Sheets"}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid gap-3 rounded-md border border-border/60 bg-muted/35 p-3 lg:grid-cols-6">
          <div className="space-y-2 lg:col-span-2">
            <Label className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground">
              <Filter className="h-3.5 w-3.5" /> Filters
            </Label>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={filters.hasWebsite}
                  onCheckedChange={(checked) => onFilterChange({ hasWebsite: checked === true })}
                />
                Has website
              </label>
              <label className="flex items-center gap-2">
                <Checkbox
                  checked={filters.hasPhone}
                  onCheckedChange={(checked) => onFilterChange({ hasPhone: checked === true })}
                />
                Has phone
              </label>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Minimum rating</Label>
            <Select
              value={String(filters.minRating)}
              onValueChange={(value) => onFilterChange({ minRating: Number(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Any</SelectItem>
                <SelectItem value="3.5">3.5+</SelectItem>
                <SelectItem value="4">4.0+</SelectItem>
                <SelectItem value="4.5">4.5+</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Sort by</Label>
            <Select value={sortBy} onValueChange={(value) => onSortByChange(value as SortBy)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="review_count">Review count</SelectItem>
                <SelectItem value="name">Name</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Direction</Label>
            <Select
              value={sortDirection}
              onValueChange={(value) => onSortDirectionChange(value as SortDirection)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <Button variant="ghost" className="w-full" onClick={onToggleSelectVisible}>
              {isAllVisibleSelected ? "Unselect Visible" : "Select Visible"}
            </Button>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <Checkbox checked={isAllVisibleSelected} onCheckedChange={() => onToggleSelectVisible()} />
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Contacts</TableHead>
              <TableHead>Address</TableHead>
              <TableHead>User Notes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleRecords.map((record) => (
              <TableRow key={record.place_id} data-state={selectedIds.has(record.place_id) ? "selected" : ""}>
                <TableCell>
                  <Checkbox
                    checked={selectedIds.has(record.place_id)}
                    onCheckedChange={() => onToggleSelect(record.place_id)}
                  />
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{record.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{record.place_id}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1">
                    <p className="font-medium">{record.rating ?? "-"}</p>
                    <p className="text-xs text-muted-foreground">
                      {record.review_count ? `${record.review_count} reviews` : "No reviews"}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="space-y-1 text-sm">
                    <p className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {record.phone || "-"}
                    </p>
                    <p className="flex items-center gap-2 truncate max-w-64">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      {record.website || "-"}
                    </p>
                  </div>
                </TableCell>
                <TableCell className="max-w-72 truncate text-sm text-muted-foreground">{record.address}</TableCell>
                <TableCell>
                  <Input
                    value={record.user_notes ?? ""}
                    onChange={(event) => onNotesChange(record.place_id, event.target.value)}
                    placeholder="Optional lead notes"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

