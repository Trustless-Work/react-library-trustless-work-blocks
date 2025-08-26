<p align="center"> <img src="https://github.com/user-attachments/assets/5b182044-dceb-41f5-acf0-da22dea7c98a" alt="CLR-S (2)"> </p>

# Trustless Work <a href="https://www.npmjs.com/package/@trustless-work/blocks" target="_blank">React Library</a>

A production-ready set of React blocks for integrating Trustless Work's escrow and dispute resolution flows. It ships:
- UI blocks (cards/tables/dialogs/forms) to list and manage escrows
- Providers for API config, wallet context, dialogs and amounts
- TanStack Query hooks for fetching and mutating escrows
- Wallet-kit helpers and error handling utilities

## Installation

```bash
npm install @trustless-work/blocks
# or
yarn add @trustless-work/blocks

# Then run the CLI to scaffold UI and providers
npx trustless-work init
```

What init does:
- Installs shadcn/ui components (prompted)
- Installs required deps: @tanstack/react-query, @trustless-work/escrow, axios, zod, react-hook-form, @creit.tech/stellar-wallets-kit, react-day-picker, etc.
- Creates .twblocks.json with your UI base alias (default: "@/components/ui")
- Optionally wires providers into Next.js `app/layout.tsx`

Environment:
- Create `NEXT_PUBLIC_API_KEY` in your env. The library uses `TrustlessWorkProvider` with `development` base URL by default.

## Quick Start

1. Initialize
```bash
npx trustless-work init
```

2. Add providers (if you skipped wiring during init)
```bash
npx trustless-work add providers
```

3. Wrap your Next.js layout
```tsx
// app/layout.tsx
import { ReactQueryClientProvider } from "@/components/tw-blocks/providers/ReactQueryClientProvider";
import { TrustlessWorkProvider } from "@/components/tw-blocks/providers/TrustlessWork";
import { WalletProvider } from "@/components/tw-blocks/wallet-kit/WalletProvider";
import { EscrowProvider } from "@/components/tw-blocks/escrows/escrow-context/EscrowProvider";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ReactQueryClientProvider>
          <TrustlessWorkProvider>
            <WalletProvider>
              <EscrowProvider>
                {children}
              </EscrowProvider>
            </WalletProvider>
          </TrustlessWorkProvider>
        </ReactQueryClientProvider>
      </body>
    </html>
  );
}
```

4. Add a wallet button to your header
```bash
npx trustless-work add wallet-kit
```
```tsx
// Example usage
import { WalletButton } from "@/components/tw-blocks/wallet-kit/WalletButtons";

export function Header() {
  return (
    <div className="flex justify-end p-4">
      <WalletButton />
    </div>
  );
}
```

5. List escrows quickly
```bash
# By role
npx trustless-work add escrows/escrows-by-role/cards
# Or table view
npx trustless-work add escrows/escrows-by-role/table
```
```tsx
// app/escrows/page.tsx
import { EscrowsByRoleCards } from "@/components/tw-blocks/escrows/escrows-by-role/cards/EscrowsCards";
import { EscrowDialogsProvider } from "@/components/tw-blocks/escrows/escrow-context/EscrowDialogsProvider";

export default function Page() {
  return (
    <EscrowDialogsProvider>
      <EscrowsByRoleCards />
    </EscrowDialogsProvider>
  );
}
```

## State Management Integration

This library works with any state solution. It exposes React Context providers and TanStack Query hooks. You can also integrate the hooks into Redux/Zustand if needed.

### With TanStack Query (Recommended)

```tsx
// Fetch escrows by role
import { useEscrowsByRoleQuery } from "@/components/tw-blocks/tanstak/useEscrowsByRoleQuery";

export function MyEscrows({ roleAddress }: { roleAddress: string }) {
  const { data, isLoading, isError, refetch } = useEscrowsByRoleQuery({
    role: "approver",
    roleAddress,
    isActive: true,
    validateOnChain: true,
    page: 1,
    orderBy: "createdAt",
    orderDirection: "desc",
  });

  if (isLoading) return <p>Loading…</p>;
  if (isError) return <button onClick={() => refetch()}>Retry</button>;
  return <pre>{JSON.stringify(data, null, 2)}</pre>;
}

// Mutations (deploy/fund/update/approve/change-status/release/dispute/resolve)
import { useEscrowsMutations } from "@/components/tw-blocks/tanstak/useEscrowsMutations";

export function DeployButton({ address }: { address: string }) {
  const { deployEscrow } = useEscrowsMutations();
  return (
    <button
      onClick={() =>
        deployEscrow.mutate({
          payload: { /* InitializeSingleReleaseEscrowPayload */ },
          type: "single-release",
          address,
        })
      }
    >
      Deploy
    </button>
  );
}
```

## Available Blocks

In order to see all of them, just run this script:

```shell
# Scaffold top-level groups
npx trustless-work add providers
npx trustless-work add wallet-kit
npx trustless-work add handle-errors
npx trustless-work add helpers
npx trustless-work add tanstak
npx trustless-work add escrows

# Escrow context providers
npx trustless-work add escrows/escrow-context

# Escrows by role
npx trustless-work add escrows/escrows-by-role
npx trustless-work add escrows/escrows-by-role/table
npx trustless-work add escrows/escrows-by-role/cards

# Escrows by signer
npx trustless-work add escrows/escrows-by-signer
npx trustless-work add escrows/escrows-by-signer/table
npx trustless-work add escrows/escrows-by-signer/cards

# Escrow details (optional standalone)
npx trustless-work add escrows/details

# Single-release flows
npx trustless-work add escrows/single-release
npx trustless-work add escrows/single-release/initialize-escrow
npx trustless-work add escrows/single-release/approve-milestone
npx trustless-work add escrows/single-release/change-milestone-status
npx trustless-work add escrows/single-release/fund-escrow
npx trustless-work add escrows/single-release/release-escrow
npx trustless-work add escrows/single-release/dispute-escrow
npx trustless-work add escrows/single-release/resolve-dispute
npx trustless-work add escrows/single-release/update-escrow
```

### Escrows
- Cards and tables to browse escrows (by role or by signer) with filters, pagination, and sort
- Detail dialog with actions gated by roles and escrow flags
- Dialogs/forms for single-release lifecycle (initialize, fund, approve, change status, release, dispute, resolve, update)

Using cards (by role):
```tsx
import { EscrowDialogsProvider } from "@/components/tw-blocks/escrows/escrow-context/EscrowDialogsProvider";
import { EscrowsByRoleCards } from "@/components/tw-blocks/escrows/escrows-by-role/cards/EscrowsCards";

export default function Screen() {
  return (
    <EscrowDialogsProvider>
      <EscrowsByRoleCards />
    </EscrowDialogsProvider>
  );
}
```

Make sure to:
1. Set `NEXT_PUBLIC_API_KEY` and run the app against the correct environment (the provider defaults to `development`).
2. Configure your UI base imports. CLI uses `.twblocks.json` `uiBase` to replace `__UI_BASE__`. If your UI alias differs, pass `--ui-base`:
   ```bash
   npx trustless-work add escrows/escrows-by-role/cards --ui-base "@/components/ui"
   ```
3. Wrap your app with all providers in the order: `ReactQueryClientProvider` → `TrustlessWorkProvider` → `WalletProvider` → `EscrowProvider`.

## Best Practices

1. Providers
   - `ReactQueryClientProvider`: global query cache and devtools.
   - `TrustlessWorkProvider`: sets API `baseURL` and `apiKey` via `TrustlessWorkConfig` from `@trustless-work/escrow`.
   - `WalletProvider`: minimal wallet state (address/name) persisted in localStorage; used by wallet button and mutations.
   - `EscrowProvider`: holds the currently selected escrow and roles; persisted in localStorage.
   - `EscrowDialogsProvider`: centralizes dialog open/close state for escrow UI.
   - `EscrowAmountProvider`: computes receiver/platform/fee splits for releases.

2. Queries and caching
   - Use provided queries: `useEscrowsByRoleQuery`, `useEscrowsBySignerQuery`.
   - All mutations invalidate `['escrows']` automatically.

3. Error handling
   - Use `handleError(error)` from `handle-errors/handle.ts` to map Axios and wallet errors to normalized types (`ApiErrorTypes`).
   ```ts
   import { handleError } from "@/components/tw-blocks/handle-errors/handle";
   try { /* ... */ } catch (e) { const err = handleError(e as any); /* show toast */ }
   ```

4. Wallet-kit
   - `WalletButton` opens a modal using `@creit.tech/stellar-wallets-kit` and stores address/name in `WalletProvider`.
   - `signTransaction({ unsignedTransaction, address })` signs and returns XDR used by mutations.
   - `trustlines` and `trustlineOptions` include common assets for testnet/mainnet.

5. Env and network
   - Use `development` (default) or `mainNet` from `@trustless-work/escrow` in `TrustlessWorkProvider`.
   - Keep your API key in env and never commit it.

## Contributing

We welcome contributions! Please read our contributing guidelines before submitting pull requests.

## License

MIT License - see LICENSE file for details

# Maintainers | [Telegram](https://t.me/+kmr8tGegxLU0NTA5)

<table align="center">
  <tr>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/6b97e15f-9954-47d0-81b5-49f83bed5e4b" alt="Owner 1" width="150" />
      <br /><br />
      <strong>Tech Rebel | Product Manager</strong>
      <br /><br />
      <a href="https://github.com/techrebelgit" target="_blank">techrebelgit</a>
      <br />
      <a href="https://t.me/Tech_Rebel" target="_blank">Telegram</a>
    </td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/e245e8af-6f6f-4a0a-a37f-df132e9b4986" alt="Owner 2" width="150" />
      <br /><br />
      <strong>Joel Vargas | Frontend Developer</strong>
      <br /><br />
      <a href="https://github.com/JoelVR17" target="_blank">JoelVR17</a>
      <br />
      <a href="https://t.me/joelvr20" target="_blank">Telegram</a>
    </td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/53d65ea1-007e-40aa-b9b5-e7a10d7bea84" alt="Owner 3" width="150" />
      <br /><br />
      <strong>Armando Murillo | Full Stack Developer</strong>
      <br /><br />
      <a href="https://github.com/armandocodecr" target="_blank">armandocodecr</a>
      <br />
      <a href="https://t.me/armandocode" target="_blank">Telegram</a>
    </td>
    <td align="center">
      <img src="https://github.com/user-attachments/assets/851273f6-2f91-413d-bd2d-d8dc1f3c2d28" alt="Owner 4" width="150" />
      <br /><br />
      <strong>Caleb Loría | Smart Contract Developer</strong>
      <br /><br />
      <a href="https://github.com/zkCaleb-dev" target="_blank">zkCaleb-dev</a>
      <br />
      <a href="https://t.me/zkCaleb_dev" target="_blank">Telegram</a>
    </td>
  </tr>
</table>
