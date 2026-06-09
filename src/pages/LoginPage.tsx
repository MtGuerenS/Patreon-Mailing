import { Button } from "@/components/ui/button"

interface Props {
  onLogin: () => void
  error: string | null
}

export function LoginPage({ onLogin, error }: Props) {
  return (
    <div className="flex flex-col items-center justify-center h-screen gap-6 p-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-2xl font-semibold">Patreon Mailing</h1>
        <p className="text-sm text-muted-foreground">
          Connect your Patreon account to get started
        </p>
      </div>
      {error && <p className="text-destructive text-sm text-center">{error}</p>}
      <Button onClick={onLogin} className="w-full max-w-xs">
        Login with Patreon
      </Button>
    </div>
  )
}