import { Inter } from 'next/font/google';
import { ToastContainer } from 'react-toastify';

import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'BQE',
  description: 'Best QMS Evarrr!',
};

export const viewport = {
  width: 1,
  themeColor: 'dark',
};

export default function RootLayout({ children }) {
  return (
    <html lang='en'>
      <body className={inter.className}>
        {children}
        <ToastContainer
          position='top-center'
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme='dark'
          // transition={Bounce}
        />
      </body>
    </html>
  );
}
