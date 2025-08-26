import * as React from "react";
import type {
  GetEscrowsFromIndexerResponse as Escrow,
  MultiReleaseMilestone,
  SingleReleaseMilestone,
} from "@trustless-work/escrow/types";
import { Badge } from "__UI_BASE__/badge";
import { Button } from "__UI_BASE__/button";
import { Card } from "__UI_BASE__/card";
import { Separator } from "__UI_BASE__/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "__UI_BASE__/dialog";
import { Eye } from "lucide-react";

type Props = {
  escrow: Escrow;
  trigger?: React.ReactNode;
  children?: React.ReactNode; // when provided, used as trigger via asChild
};

function formatCurrency(value: number, currency: string) {
  return `${currency} ${value.toFixed(2)}`;
}

function formatTimestamp(ts?: { _seconds: number; _nanoseconds: number }) {
  if (!ts) return "-";
  const d = new Date(ts._seconds * 1000);
  return d.toLocaleString();
}

function allMilestonesReleasedOrResolved(milestones: MultiReleaseMilestone[]) {
  return milestones.every(
    (milestone) => milestone.flags?.released || milestone.flags?.resolved
  );
}

function allMilestonesApproved(milestones: SingleReleaseMilestone[]) {
  return milestones.every((milestone) => milestone.approved);
}

function getSingleReleaseStatus(
  flags: { disputed?: boolean; resolved?: boolean; released?: boolean } = {}
) {
  if (flags.disputed) return { label: "Disputed", variant: "destructive" };
  if (flags.resolved) return { label: "Resolved", variant: "outline" };
  if (flags.released) return { label: "Released", variant: "outline" };
  return { label: "Working", variant: "outline" };
}

export function EscrowDetailsSheet({ escrow, trigger, children }: Props) {
  const [open, setOpen] = React.useState(false);

  const headerBadges = (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="text-xs">
        {escrow.type
          .replace("_", " ")
          .toLowerCase()
          .replace(/\b\w/g, (l) => l.toUpperCase())}
      </Badge>
      {escrow.type === "single-release" &&
        !allMilestonesApproved(
          escrow.milestones as SingleReleaseMilestone[]
        ) && (
          <Badge
            variant={
              getSingleReleaseStatus(escrow.flags ?? {}).variant as
                | "destructive"
                | "outline"
            }
            className="text-xs"
          >
            {getSingleReleaseStatus(escrow.flags ?? {}).label}
          </Badge>
        )}
      {escrow.type === "single-release" &&
        allMilestonesApproved(escrow.milestones as SingleReleaseMilestone[]) &&
        !escrow.flags?.released &&
        !escrow.flags?.resolved &&
        !escrow.flags?.disputed && (
          <Badge variant="outline" className="text-xs">
            Pending Release
          </Badge>
        )}
      {escrow.type === "multi-release" &&
        allMilestonesReleasedOrResolved(
          escrow.milestones as MultiReleaseMilestone[]
        ) && (
          <Badge variant="outline" className="text-xs">
            Finished
          </Badge>
        )}
      {escrow.type === "multi-release" &&
        !allMilestonesReleasedOrResolved(
          escrow.milestones as MultiReleaseMilestone[]
        ) && (
          <Badge variant="outline" className="text-xs">
            Working
          </Badge>
        )}
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ? (
          <div role="button" className="focus:outline-none">
            {children}
          </div>
        ) : (
          trigger ?? (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 cursor-pointer"
            >
              <Eye className="h-4 w-4" />
            </Button>
          )
        )}
      </DialogTrigger>
      <DialogContent className="!w-full sm:!max-w-2xl max-h-[95vh] overflow-y-auto sm:ml-auto">
        <DialogHeader>
          <DialogTitle className="flex items-start justify-between gap-3">
            <span className="text-base sm:text-lg leading-tight line-clamp-2">
              {escrow.title}
            </span>
            {headerBadges}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {escrow.description && (
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {escrow.description}
            </p>
          )}

          <Card className="p-3 sm:p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <div className="text-xs text-muted-foreground">
                  Engagement ID
                </div>
                <div className="text-sm font-medium break-all">
                  {escrow.engagementId}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Trustline</div>
                <div className="text-sm font-medium break-all">
                  {escrow.trustline.name} ({escrow.trustline.address})
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Amount</div>
                <div className="text-sm font-semibold">
                  {escrow.type === "single-release"
                    ? formatCurrency(escrow.amount, escrow.trustline.name)
                    : formatCurrency(
                        (escrow.milestones as MultiReleaseMilestone[]).reduce(
                          (acc, m) => acc + m.amount,
                          0
                        ),
                        escrow.trustline.name
                      )}
                </div>
              </div>
              {typeof escrow.balance === "number" && (
                <div>
                  <div className="text-xs text-muted-foreground">Balance</div>
                  <div className="text-sm font-medium text-green-800 dark:text-green-600">
                    {formatCurrency(escrow.balance, escrow.trustline.name)}
                  </div>
                </div>
              )}
              <div>
                <div className="text-xs text-muted-foreground">
                  Platform Fee
                </div>
                <div className="text-sm text-muted-foreground">
                  {escrow.platformFee}%
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Type</div>
                <div className="text-sm font-medium">{escrow.type}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Created</div>
                <div className="text-sm">
                  {formatTimestamp(escrow.createdAt)}
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Updated</div>
                <div className="text-sm">
                  {formatTimestamp(escrow.updatedAt)}
                </div>
              </div>
            </div>
          </Card>

          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Milestones</h4>
              <div className="text-xs text-muted-foreground">
                {escrow.milestones.length} total
              </div>
            </div>
            <Separator className="my-2" />
            <ul className="space-y-2">
              {escrow.milestones.map((milestone, idx) => (
                <li
                  key={`${idx}-${milestone.description.slice(0, 8)}`}
                  className="text-xs sm:text-sm flex items-start justify-between gap-2"
                >
                  <div className="flex-1">
                    <div className="font-medium break-words">
                      {milestone.description}
                    </div>
                    {escrow.type === "multi-release" &&
                      "amount" in milestone && (
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(
                            (milestone as MultiReleaseMilestone).amount,
                            escrow.trustline.name
                          )}
                        </div>
                      )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {escrow.type === "single-release" &&
                      "approved" in milestone && (
                        <Badge
                          variant={
                            (milestone as SingleReleaseMilestone).approved
                              ? "outline"
                              : "destructive"
                          }
                          className="text-2xs"
                        >
                          {(milestone as SingleReleaseMilestone).approved
                            ? "Approved"
                            : "Pending"}
                        </Badge>
                      )}
                    {escrow.type === "multi-release" && (
                      <div className="flex items-center gap-1">
                        <span
                          className={`bg-red-800 rounded-full h-2 w-2 ${
                            milestone.flags?.disputed
                              ? "opacity-100"
                              : "opacity-20"
                          }`}
                          title="Disputed"
                        />
                        <span
                          className={`bg-green-800 rounded-full h-2 w-2 ${
                            milestone.flags?.resolved ||
                            milestone.flags?.released
                              ? "opacity-100"
                              : "opacity-20"
                          }`}
                          title="Resolved/Released"
                        />
                        <span
                          className={`bg-yellow-800 rounded-full h-2 w-2 ${
                            milestone.flags?.approved &&
                            !milestone.flags?.disputed &&
                            !milestone.flags?.resolved &&
                            !milestone.flags?.released
                              ? "opacity-100"
                              : "opacity-20"
                          }`}
                          title="Approved"
                        />
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EscrowDetailsSheet;
