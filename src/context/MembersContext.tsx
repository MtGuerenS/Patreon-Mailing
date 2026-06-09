import { createContext, useContext } from "react"
import type { PatreonMember, PatreonIncluded } from "@/shared/patreon-types"
import type { DbMember } from "@/shared/db-types"

interface MembersContextValue {
    members: PatreonMember[]
    included: PatreonIncluded[]
    dbMembers: DbMember[]
    setDbMembers: (members: DbMember[]) => void
    loading: boolean
    loadStatus: string | null
    error: string | null
    loadMembers: (token: string) => Promise<void>
    refreshMembers: (token: string) => Promise<void>
    reset: () => void
  }

export const MembersContext = createContext<MembersContextValue | null>(null)

export function useMembersContext(): MembersContextValue {
  const ctx = useContext(MembersContext)
  if (!ctx) throw new Error("useMembersContext must be used within MembersContext.Provider")
  return ctx
}