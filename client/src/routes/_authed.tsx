import { Navbar } from "@/components/navbar";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import type { JSX } from "react";

export const Route = createFileRoute("/_authed")({
	component: RouteComponent,
	beforeLoad: async ({ context }) => {
		const session = await context.auth.validateSession();
		if (session === null) {
			throw redirect({ to: "/login" });
		}

		return {
			session: session,
		};
	},
});

function RouteComponent(): JSX.Element {
	return (
		<div className="pt-[calc(1.25rem+env(safe-area-inset-top))] pb-[calc(5rem+env(safe-area-inset-bottom))] px-4 lg:px-10 h-svh">
			<Outlet />
			<Navbar /> 
		</div>
	);
}
