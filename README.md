# wifishare

![Node](https://img.shields.io/badge/Node-%3E%3D18-brightgreen)
![Dependencies](https://img.shields.io/badge/dependencies-0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

Share files between your phone and PC over your local WiFi. Run one small Node
script, scan a QR code with your phone, and move files either direction. Nothing
leaves your network, and there are no accounts or cloud uploads.

It has zero dependencies. The whole thing is a single Node server plus one static
page, so there's nothing to install.

## Run it

You need [Node.js](https://nodejs.org) 18 or newer.

```
node server.js
```

It prints two addresses:

```
On this computer:  http://localhost:4000
On your phone:     http://192.168.1.42:4000
```

Open the phone address on your phone (same WiFi), or open the PC address and scan
the QR code at the top of the page. On Windows you can also double-click
`start.bat`.

## Use it

- **Phone to PC:** open the page on your phone, tap the drop box, pick photos or
  files. They show up in the `shared` folder.
- **PC to phone:** the page lists everything in `shared`. Tap Save on the phone to
  download.

Files are written to a `shared` folder next to the script. To save them somewhere
else, set `SHARE_DIR`:

```
SHARE_DIR=/path/to/folder node server.js     # macOS / Linux
set SHARE_DIR=D:\transfers && node server.js  # Windows
```

## Notes

- Change the port with `PORT=5000 node server.js`.
- The first time, Windows may ask to allow Node through the firewall. Allow it on
  private networks so your phone can reach the server.
- On Windows, keep this folder out of Documents, Pictures and Desktop. Controlled
  Folder Access blocks Node from writing there and uploads stall partway. Your home
  folder, or any other location, works fine.

## How it works

`server.js` is a plain Node HTTP server with no dependencies. It serves the page
from `public/`, lists and streams files from `shared/`, and reports the LAN address
so the page can draw a QR code (generated offline with a bundled `qrcode.min.js`).

## License

MIT. See [LICENSE](LICENSE).
