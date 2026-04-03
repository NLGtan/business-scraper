"use client";

import { Mail, MessageSquareText, Sparkles, Target, User, Users } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EnrichedBusinessRecord } from "@/types/business";

interface EnrichmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  records: EnrichedBusinessRecord[];
  warnings: string[];
  error: string | null;
}

export function EnrichmentDialog({
  open,
  onOpenChange,
  records,
  warnings,
  error,
}: EnrichmentDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[82vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Enrichment Results
          </DialogTitle>
          <DialogDescription>
            Expanded summaries, lead quality insights, and outreach drafts for selected records.
          </DialogDescription>
        </DialogHeader>

        {error ? (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {warnings.length > 0 ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            <p className="font-semibold">Warnings</p>
            <ul className="mt-1 list-disc pl-4">
              {warnings.map((warning) => (
                <li key={warning}>{warning}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="space-y-3">
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground">No enrichment results yet.</p>
          ) : null}

          {records.map((record) => (
            <Card key={record.place_id} className="border-border/70">
              <CardHeader className="pb-3">
                <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                  <span>{record.name}</span>
                  <Badge variant="success">Score: {record.enrichment.lead_quality_score}/10</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-md border border-border/60 bg-muted/25 p-3">
                    <p className="mb-1 flex items-center gap-2 font-semibold">
                      <Target className="h-4 w-4 text-primary" /> Summary
                    </p>
                    <p className="text-muted-foreground">{record.enrichment.summary}</p>
                  </div>

                  <div className="rounded-md border border-border/60 bg-muted/25 p-3">
                    <p className="mb-1 flex items-center gap-2 font-semibold">
                      <Users className="h-4 w-4 text-primary" /> Target Customer
                    </p>
                    <p className="text-muted-foreground">{record.enrichment.likely_target_customer}</p>
                  </div>
                </div>

                <div className="rounded-md border border-border/60 bg-muted/25 p-3">
                  <p className="mb-1 flex items-center gap-2 font-semibold">
                    <User className="h-4 w-4 text-primary" /> Outreach Angle
                  </p>
                  <p className="text-muted-foreground">{record.enrichment.outreach_angle}</p>
                </div>

                <div className="rounded-md border border-border/60 bg-muted/25 p-3">
                  <p className="mb-1 flex items-center gap-2 font-semibold">
                    <MessageSquareText className="h-4 w-4 text-primary" /> First Contact Draft
                  </p>
                  <p className="text-muted-foreground">{record.enrichment.first_contact_message}</p>
                </div>

                <div className="rounded-md border border-border/60 bg-muted/25 p-3">
                  <p className="mb-2 flex items-center gap-2 font-semibold">
                    <Mail className="h-4 w-4 text-primary" /> Website Signals ({record.enrichment.website_scan_status})
                  </p>
                  <div className="grid gap-2 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Emails</p>
                      <p className="text-sm text-muted-foreground">
                        {record.enrichment.extracted_emails.join(", ") || "None detected"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Social Links</p>
                      <p className="text-sm text-muted-foreground">
                        {record.enrichment.extracted_social_links.join(", ") || "None detected"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground">Extra Phones</p>
                      <p className="text-sm text-muted-foreground">
                        {record.enrichment.extracted_phone_numbers.join(", ") || "None detected"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

