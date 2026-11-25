ionique.in favicon package (23-11-26)
Made from "Ionique screensaver dark 4K.png" (the i-dot and Q mark on navy #0a143c).

Upload all files to the root of the site (https://ionique.in/), next to index.html:

  favicon.ico            16, 32 and 48 px in one file (old browsers, Windows, search results)
  favicon-16x16.png      browser tab
  favicon-32x32.png      browser tab (high-resolution screens)
  apple-touch-icon.png   180 px, iPhone/iPad home screen
  icon-192.png           Android home screen
  icon-512.png           Android splash and install
  site.webmanifest       tells Android which icons to use
  og-image.png           1200x630 preview shown when the link is shared on WhatsApp, LinkedIn etc.

Then put these lines in the <head> of the page, replacing the single embedded
<link rel="icon" ...> line in the v4 draft:

  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  <link rel="manifest" href="/site.webmanifest">
  <meta name="theme-color" content="#0a143c">
  <meta property="og:image" content="https://ionique.in/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">

Check after upload: open https://ionique.in/favicon.ico and https://ionique.in/og-image.png
directly; both should load. WhatsApp caches previews, so test the link in a new chat.
