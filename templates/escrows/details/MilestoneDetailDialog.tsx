"use client";

import { Button } from "__UI_BASE__/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "__UI_BASE__/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "__UI_BASE__/card";
import { Badge } from "__UI_BASE__/badge";
import {
  DollarSign,
  FileCheck2,
  User,
  Calendar,
  Hash,
  ExternalLink,
  CircleAlert,
  CircleCheckBig,
  Handshake,
  CheckCheck,
  Layers,
} from "lucide-react";
import {
  GetEscrowsFromIndexerResponse,
  MultiReleaseMilestone,
  SingleReleaseMilestone,
} from "@trustless-work/escrow";
import Link from "next/link";

interface MilestoneDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  selectedMilestone: {
    milestone: MultiReleaseMilestone | SingleReleaseMilestone;
    index: number;
  } | null;
  selectedEscrow: GetEscrowsFromIndexerResponse;
  userRolesInEscrow: string[];
  evidenceVisibleMap: Record<number, boolean>;
  setEvidenceVisibleMap: React.Dispatch<
    React.SetStateAction<Record<number, boolean>>
  >;
}

export const MilestoneDetailDialog = ({
  isOpen,
  onClose,
  selectedMilestone,
}: MilestoneDetailDialogProps) => {
  const getMilestoneStatusBadge = (
    milestone: SingleReleaseMilestone | MultiReleaseMilestone
  ) => {
    if ("flags" in milestone && milestone.flags?.disputed) {
      return (
        <Badge variant="destructive">
          <CircleAlert className="h-3.5 w-3.5" />
          <span>Disputed</span>
        </Badge>
      );
    }
    if ("flags" in milestone && milestone.flags?.released) {
      return (
        <Badge variant="default">
          <CircleCheckBig className="h-3.5 w-3.5" />
          <span>Released</span>
        </Badge>
      );
    }
    if (
      "flags" in milestone &&
      milestone.flags?.resolved &&
      !milestone.flags?.disputed
    ) {
      return (
        <Badge variant="default">
          <Handshake className="h-3.5 w-3.5" />
          <span>Resolved</span>
        </Badge>
      );
    }
    if (
      ("flags" in milestone && milestone.flags?.approved) ||
      ("approved" in milestone && milestone.approved)
    ) {
      return (
        <Badge variant="default">
          <CheckCheck className="h-3.5 w-3.5" />
          <span>Approved</span>
        </Badge>
      );
    }
    return (
      <Badge variant="outline">
        <Layers className="h-3.5 w-3.5" />
        <span className="uppercase">
          {milestone.status
            ? milestone.status.match(/[a-z][A-Z]/)
              ? milestone.status.replace(/([A-Z])/g, " $1").toLowerCase()
              : milestone.status.toLowerCase()
            : ""}
        </span>
      </Badge>
    );
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  };

  if (!selectedMilestone) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-full">
              <Hash className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold truncate">
                {selectedMilestone.milestone.description}
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Detailed information about this milestone
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          <div className="flex items-center justify-between p-4  rounded-lg border border-border">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-background rounded-full shadow-sm border border-border">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  Current Status
                </p>
                <p className="text-xs text-muted-foreground">
                  Milestone progress
                </p>
              </div>
            </div>
            {getMilestoneStatusBadge(selectedMilestone.milestone)}
          </div>

          <Card className="border border-border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <div className="w-1 h-6 bg-primary rounded-full"></div>
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <FileCheck2 className="w-4 h-4 text-muted-foreground" />
                  Description
                </label>
                <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md border-l-4 border-primary/20">
                  {selectedMilestone.milestone.description}
                </p>
              </div>

              {"amount" in selectedMilestone.milestone && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-600 dark:text-green-400" />
                    Amount
                  </label>
                  <div className="flex items-center gap-2 bg-green-500/10 dark:bg-green-400/10 p-3 rounded-md border-l-4 border-green-500/20 dark:border-green-400/20">
                    <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <span className="text-lg font-bold text-green-700 dark:text-green-300">
                      {selectedMilestone.milestone.amount}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {selectedMilestone.milestone.evidence && (
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-1 h-6 bg-green-600 dark:bg-green-400 rounded-full"></div>
                  Evidence
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground flex items-center gap-2">
                    <FileCheck2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                    Evidence URL
                  </label>
                  <div className="bg-muted/50 p-3 rounded-md border-l-4 border-green-500/20 dark:border-green-400/20">
                    {(() => {
                      const result = isValidUrl(
                        selectedMilestone.milestone.evidence
                      );
                      return (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground break-all pr-2">
                            {selectedMilestone.milestone.evidence}
                          </span>
                          {result && (
                            <Link
                              href={selectedMilestone.milestone.evidence}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0"
                              >
                                <ExternalLink className="w-4 h-4 mr-1" />
                                Open
                              </Button>
                            </Link>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {"disputeStartedBy" in selectedMilestone.milestone && (
            <Card className="border border-border shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <div className="w-1 h-6 bg-red-600 dark:bg-red-400 rounded-full"></div>
                  Dispute Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3 bg-red-500/10 dark:bg-red-400/10 p-3 rounded-md border-l-4 border-red-500/20 dark:border-red-400/20">
                  <User className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <div>
                    <p className="text-sm font-medium text-red-700 dark:text-red-300">
                      <span className="font-bold">Disputed by:</span>{" "}
                      {selectedMilestone.milestone.disputeStartedBy ===
                      "serviceProvider"
                        ? "Service Provider"
                        : "Approver"}
                    </p>
                    {"flags" in selectedMilestone.milestone &&
                      !selectedMilestone.milestone.flags?.resolved && (
                        <p className="text-xs text-red-600 dark:text-red-400">
                          This milestone is currently under dispute
                        </p>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
