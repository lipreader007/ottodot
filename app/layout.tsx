export const metadata = {
  title: 'Ottodot – AI Math Problem Generator',
  description: 'P5 math word problem generator with feedback',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <header className="border-b bg-white">
          <div className="mx-auto flex max-w-5xl items-center gap-3 p-3">
            <img src="/Logo%20Horizontal.png" alt="OTTODOT HR" className="h-8 w-auto md:h-10 object-contain"/>
            <span className="chip">Demo</span>
          </div>
        </header>
        <div className="mx-auto max-w-5xl p-4">{children}</div>
      </body>
    </html>
  )
}
