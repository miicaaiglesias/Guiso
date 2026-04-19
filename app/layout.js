import "./globals.css";

export const metadata = {
  title: "Guiso",
  description: "Tu recetario personal con IA",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, background: '#f8f8f8' }}>
        {children}
      </body>
    </html>
  );
}