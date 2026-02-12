import { Suspense } from 'react'

export const metadata = {
  title: 'Opscale Portal',
  description: 'FBPA Administrative Portal',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<div>Loading...</div>}>
          {children}
        </Suspense>
      </body>
    </html>
  )
}
