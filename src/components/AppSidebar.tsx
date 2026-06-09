import { Home, Mail, LogIn, LogOut } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar'

const navItems = [
  { title: 'Members', url: '/', icon: Home },
  { title: 'Envelopes', url: '/envelopes', icon: Mail },
]

interface Props {
  accessToken: string | null
  onLogin: () => void
  onLogout: () => void
}

function AppSidebarInner({ accessToken, onLogin, onLogout }: Props) {
  const location = useLocation()
  const { setOpen, setOpenMobile } = useSidebar()

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth
      if (w < 640) {
        setOpen(false)
        setOpenMobile(false)
      } else if (w < 1024) {
        setOpen(false)
      } else {
        setOpen(true)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setOpen, setOpenMobile])

  return (
    <Sidebar collapsible="icon" style={{ '--sidebar-width': '250px' } as React.CSSProperties}>
      <SidebarHeader className="p-4 group-data-[collapsible=icon]:p-4">
        <div className="flex items-center gap-2">        
          <span className="font-semibold text-[14px] group-data-[collapsible=icon]:hidden">
            Patreon Mailing
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map(item => (
                <SidebarMenuItem key={item.title} className="mx-[12px] my-[8px] group-data-[collapsible=icon]:mx-0">
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    tooltip={item.title}
                  >
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="p-2">
        {accessToken ? (
          <SidebarMenuButton
            onClick={onLogout}
            tooltip="Log out"
            className="mx-[12px] my-[8px] group-data-[collapsible=icon]:mx-0"
          >
            <LogOut />
            <span>Log out</span>
          </SidebarMenuButton>
        ) : (
          <SidebarMenuButton
            onClick={onLogin}
            tooltip="Login with Patreon"
            className="mx-[12px] my-[8px] group-data-[collapsible=icon]:mx-0"
          >
            <LogIn />
            <span>Login with Patreon</span>
          </SidebarMenuButton>
        )}
      </SidebarFooter>
    </Sidebar>
  )
}

export function AppSidebar(props: Props) {
  return <AppSidebarInner {...props} />
}