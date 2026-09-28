import React from "react";

export default function AuthLayout({ icon: Icon, title, subtitle, footer, children }) {
	return (
		<main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
			<section className="w-full max-w-md rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
				{Icon && (
					<div className="mb-4 flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary">
						<Icon className="h-5 w-5" aria-hidden="true" />
					</div>
				)}
				<h1 className="text-2xl font-semibold">{title}</h1>
				{subtitle && <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>}
				<div className="mt-6">{children}</div>
				{footer && <div className="mt-6 text-center text-sm">{footer}</div>}
			</section>
		</main>
	);
}