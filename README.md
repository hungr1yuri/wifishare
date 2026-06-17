# wifishare

![Node](https://img.shields.io/badge/Node-%3E%3D18-brightgreen)
![Dependencies](https://img.shields.io/badge/dependencies-0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

Share files between your phone and PC over your WiFi. No accounts, no cloud, nothing
to install. It's one small Node script and a static page.

## Run it

Install [Node.js](https://nodejs.org) 18+, then double-click `start.bat`.

(On Mac or Linux there's no `.bat`, so run `node server.js` instead.)

It prints an address for your phone like `http://192.168.1.42:4000`. Open that on
your phone (same WiFi), or scan the QR code on the PC page.

## Use it

- **Phone to PC:** tap the drop box and pick files. They land in the `shared` folder.
- **PC to phone:** tap Save next to any file to download it.

## Notes

- Change the port with `PORT=5000`, or save somewhere else with `SHARE_DIR=/path`.
- Windows may ask to allow Node through the firewall the first time. Allow it on
  private networks so your phone can reach it.
- On Windows, keep this folder out of Documents, Pictures and Desktop. Controlled
  Folder Access blocks Node from writing there and uploads just stall.

MIT licensed.
