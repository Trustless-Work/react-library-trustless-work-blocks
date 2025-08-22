"use client";

import React from "react";
import { Button } from "__UI_BASE__/button";
import type {
  GetEscrowsFromIndexerResponse as Escrow,
  MultiReleaseMilestone,
} from "@trustless-work/escrow/types";
import Filters from "./Filters";
import { useEscrowsBySigner } from "./useEsrowsBySigner";
import { Card, CardContent, CardHeader, CardTitle } from "__UI_BASE__/card";
import { Badge } from "__UI_BASE__/badge";
import { Separator } from "__UI_BASE__/separator";
import {
  Shield,
  CalendarDays,
  Wallet,
  Loader2,
  AlertTriangle,
  RefreshCw,
  FileX,
} from "lucide-react";

export function EscrowsBySignerCards() {
  const {
    walletAddress,
    data,
    isLoading,
    isError,
    refetch,
    isFetching,
    nextData,
    isFetchingNext,
    page,
    setPage,
    orderBy,
    setOrderBy,
    orderDirection,
    setOrderDirection,
    sorting,
    title,
    setTitle,
    engagementId,
    setEngagementId,
    isActive,
    setIsActive,
    validateOnChain,
    setValidateOnChain,
    type,
    setType,
    status,
    setStatus,
    minAmount,
    setMinAmount,
    maxAmount,
    setMaxAmount,
    dateRange,
    setDateRange,
    formattedRangeLabel,
    onClearFilters,
    handleSortingChange,
  } = useEscrowsBySigner();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(value);
  };

  function formatTimestamp(ts?: { _seconds: number; _nanoseconds: number }) {
    if (!ts) return "-";
    const d = new Date(ts._seconds * 1000);
    return d.toLocaleString();
  }

  const escrows: Escrow[] = data ?? [];

  const currentSort = sorting?.[0];
  const sortField =
    (currentSort?.id as "amount" | "createdAt" | "updatedAt" | undefined) ??
    undefined;
  const sortDesc = currentSort?.desc ?? true;

  const setSort = (field: "amount" | "createdAt" | "updatedAt") => {
    if (sortField === field) {
      handleSortingChange([{ id: field, desc: !sortDesc }]);
    } else {
      handleSortingChange([{ id: field, desc: true }]);
    }
  };

  const clearSort = () => handleSortingChange([]);

  return (
    <div className="w-full flex flex-col gap-4">
      <Filters
        title={title}
        engagementId={engagementId}
        isActive={isActive}
        validateOnChain={validateOnChain}
        type={type}
        status={status}
        minAmount={minAmount}
        maxAmount={maxAmount}
        dateRange={dateRange}
        formattedRangeLabel={formattedRangeLabel}
        setTitle={setTitle}
        setEngagementId={setEngagementId}
        setIsActive={setIsActive}
        setValidateOnChain={setValidateOnChain}
        setType={(v) => setType(v as typeof type)}
        setStatus={(v) => setStatus(v as typeof status)}
        setMinAmount={setMinAmount}
        setMaxAmount={setMaxAmount}
        setDateRange={setDateRange}
        onClearFilters={onClearFilters}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        orderBy={orderBy}
        orderDirection={orderDirection}
        setOrderBy={(v) => setOrderBy(v)}
        setOrderDirection={(v) => setOrderDirection(v)}
      />

      <div className="w-full p-2 sm:p-4">
        <div className="mb-2 sm:mb-3 flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground">Sort</span>
          <Button
            className="cursor-pointer"
            variant={sortField === "createdAt" ? "default" : "outline"}
            size="sm"
            onClick={() => setSort("createdAt")}
          >
            Created {sortField === "createdAt" ? (sortDesc ? "▼" : "▲") : ""}
          </Button>
          <Button
            className="cursor-pointer"
            variant={sortField === "updatedAt" ? "default" : "outline"}
            size="sm"
            onClick={() => setSort("updatedAt")}
          >
            Updated {sortField === "updatedAt" ? (sortDesc ? "▼" : "▲") : ""}
          </Button>
          <Button
            className="cursor-pointer"
            variant={sortField === "amount" ? "default" : "outline"}
            size="sm"
            onClick={() => setSort("amount")}
          >
            Amount {sortField === "amount" ? (sortDesc ? "▼" : "▲") : ""}
          </Button>
          <Button
            className="cursor-pointer"
            variant="ghost"
            size="sm"
            onClick={clearSort}
            disabled={!currentSort}
          >
            Reset
          </Button>
        </div>
        <div className="mt-2 sm:mt-4 overflow-x-auto">
          {!walletAddress ? (
            <div>
              <div className="p-6 md:p-8 flex flex-col items-center justify-center text-center">
                <Wallet className="h-8 w-8 md:h-12 md:w-12 text-primary mb-3" />
                <h3 className="font-medium text-foreground mb-2">
                  Connect your wallet
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  To continue, connect your wallet and authorize the
                  application.
                </p>
              </div>
            </div>
          ) : isLoading ? (
            <div>
              <div className="p-6 md:p-8 flex flex-col items-center justify-center text-center">
                <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary mb-3" />
                <p className="text-sm text-muted-foreground">
                  Loading escrows…
                </p>
              </div>
            </div>
          ) : isError ? (
            <div>
              <div className="p-6 md:p-8 flex flex-col items-center justify-center text-center">
                <AlertTriangle className="h-8 w-8 md:h-10 md:w-10 text-destructive mb-3" />
                <h3 className="font-medium text-foreground mb-2">
                  Error loading data
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-4">
                  An error occurred while loading the information. Please try
                  again.
                </p>
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Retry
                </Button>
              </div>
            </div>
          ) : escrows.length === 0 ? (
            <div>
              <div className="p-6 md:p-8 flex flex-col items-center justify-center text-center">
                <FileX className="h-8 w-8 md:h-10 md:w-10 text-muted-foreground/60 mb-3" />
                <h3 className="font-medium text-foreground mb-2">
                  No data available
                </h3>
                <p className="text-sm text-muted-foreground">
                  No escrows found for the selected filters.
                </p>
              </div>
            </div>
          ) : (
            <>
              {escrows.map((escrow) => (
                <Card
                  key={(escrow as any).engagementId ?? (escrow as any).title}
                  className="w-full max-w-md mx-auto hover:shadow-lg transition-shadow duration-200"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <CardTitle className="text-lg font-semibold leading-tight line-clamp-2">
                        {escrow.title}
                      </CardTitle>
                      <Badge
                        variant={isActive ? "default" : "destructive"}
                        className="shrink-0"
                      >
                        {isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                      {escrow.description}
                    </p>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Amount Section */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Amount</span>
                        <span className="font-semibold">
                          {escrow.type === "single-release"
                            ? formatCurrency(escrow.amount)
                            : formatCurrency(
                                escrow.milestones.reduce(
                                  (acc, milestone) =>
                                    acc +
                                    (milestone as MultiReleaseMilestone).amount,
                                  0
                                )
                              )}
                        </span>
                      </div>

                      {escrow.balance !== undefined && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Balance</span>
                          <span className="font-medium text-green-600 dark:text-green-400">
                            {formatCurrency(escrow.balance)}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Platform Fee
                        </span>
                        <span className="text-muted-foreground">
                          {escrow.platformFee}%
                        </span>
                      </div>
                    </div>

                    <Separator />

                    {/* Details Section */}
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium">Trustline</span>
                        <Badge variant="outline" className="text-xs">
                          {escrow.trustline.name}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          Created {formatTimestamp(escrow.createdAt)}
                        </span>
                      </div>
                    </div>

                    {/* Type Badge */}
                    <div className="pt-2">
                      <Badge variant="secondary" className="text-xs">
                        {escrow.type
                          .replace("_", " ")
                          .toLowerCase()
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="text-xs sm:text-sm text-muted-foreground">
            Page {page}
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <Button
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1 || isFetching}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={
                isFetching ||
                !walletAddress ||
                ((nextData?.length ?? 0) === 0 && !isFetchingNext)
              }
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EscrowsBySignerCards;
