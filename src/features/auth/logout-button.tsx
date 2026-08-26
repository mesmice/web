import { Button } from '../../components/ui/button.js'
import { useLogout } from './use-logout.js'

export function LogoutButton() {
  const { mutate: logout, isPending } = useLogout()

  return (
    <Button variant="secondary" onClick={() => logout()} disabled={isPending}>
      {isPending ? 'Saindo…' : 'Sair'}
    </Button>
  )
}
