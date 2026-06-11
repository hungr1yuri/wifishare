wifishare — share files between your phone and PC over WiFi
============================================================

HOW TO START
------------
Easiest: double-click  start.bat
(or in a terminal here, run:  node server.js )

It prints two addresses:
  - On THIS pc:    http://localhost:4000
  - On your phone: http://192.168.178.45:4000   <- type this in your phone browser

Your phone must be on the SAME WiFi as the PC.

Open http://localhost:4000 on the PC and a QR code shows at the top -
just scan it with your phone camera instead of typing the address.
(The QR is generated locally/offline - nothing is sent to the internet.)

HOW TO USE
----------
- Phone -> PC:  open the phone address, tap the upload box, pick photos/files.
                They appear in the "shared" folder on the PC.
- PC -> Phone:  drop files on the page (or they're already listed), tap "Save"
                on the phone to download them.

Received files are saved to the "shared" folder right next to this file:
  C:\Users\j\wifishare\shared

KEEP THIS FOLDER OUT OF DOCUMENTS
---------------------------------
Windows "Controlled Folder Access" protects Documents (and Pictures, Desktop,
etc.) and blocks node.exe from writing there - that silently stalls uploads
halfway. This folder lives in your home root, which is NOT protected, so it
works. If you ever move it into Documents, uploads will break.

Want files saved somewhere else? Set SHARE_DIR before starting:
  set SHARE_DIR=D:\transfers && node server.js

FIRST-TIME FIREWALL POPUP
-------------------------
The very first time, Windows may ask "Allow Node.js to communicate on..."
-> tick Private networks and click Allow. That's what lets your phone connect.

If the phone still can't connect, run this once in an ADMIN PowerShell:
  New-NetFirewallRule -DisplayName "wifishare" -Direction Inbound -Action Allow -Protocol TCP -LocalPort 4000

CHANGE THE PORT
---------------
  set PORT=5000 && node server.js
