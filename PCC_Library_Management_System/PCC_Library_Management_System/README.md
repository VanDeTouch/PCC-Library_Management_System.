# PCC Library Management System

A vanilla HTML, CSS, JavaScript, and JSON prototype based on the structure and visual style of the Pasig Catholic College Library Management System frames in Figma.

## Files
- `index.html` — login screen and application structure
- `style.css` — layout, colors, responsive styling
- `script.js` — navigation, dashboard, search/filter, add/edit/delete, borrowing/return demo, and JSON export
- `books.json` — starter book records

## Run locally
Because the app loads `books.json` with `fetch()`, run it through a local web server instead of opening `index.html` directly:
1. Open the folder in Visual Studio Code.
2. Install/enable the **Live Server** extension if needed.
3. Right-click `index.html` and choose **Open with Live Server**.

Demo login:
- Username: `admin`
- Password: `admin`

## Notes
- This is a front-end prototype, not a production library system.
- Book changes are saved in the current browser's `localStorage`.
- Borrowing records and student names are sample data in `script.js`.
- A real deployment needs server-side authentication, a database, access controls, backups, and proper loan/member validation.
