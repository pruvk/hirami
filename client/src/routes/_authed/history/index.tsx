import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authed/history/')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/_authed/history/"!</div>
}
