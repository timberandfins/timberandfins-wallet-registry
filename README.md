# Timber&Fins Wallet Registry

A mobile-first GitHub Pages app connected to the **Products** and **Orders** tabs in the Timber&Fins Google Sheet.

## What it does

- Loads wallet editions from `Products!A2:A`
- Displays the next number from the tracker
- Saves order number, customer name, product and assigned wallet number into `Orders`
- Prevents duplicate order numbers
- Uses an Apps Script lock to prevent duplicate wallet numbers if two requests arrive together
- Shows the five most recent registrations
- Can be added to an iPhone Home Screen

## Important privacy note

GitHub Pages websites are publicly reachable, even when Pages is built from a private repository on plans that support that. Do **not** place customer data, spreadsheet exports, passwords or private API keys in this repository.

The Google Sheet itself stays private. The Apps Script web-app URL acts as the bridge. Because a static GitHub Pages site cannot safely hold a secret, anyone who discovers both the app and endpoint could theoretically submit data. For a one-person, unlisted workshop tool this is a practical lightweight setup, not bank-level access control.

# Setup

## 1. Import the Excel tracker into Google Sheets

1. Open Google Drive.
2. Upload `Fly_Wallet_Tracker (1).xlsx`.
3. Open it with Google Sheets.
4. Choose **File → Save as Google Sheets** if Google is still treating it as an Excel file.
5. Confirm the sheet tabs are named exactly `Products` and `Orders`.

## 2. Add the Google Apps Script backend

1. Open the Google Sheet.
2. Choose **Extensions → Apps Script**.
3. Delete the sample `myFunction` code.
4. Open `apps-script/Code.gs` from this project.
5. Copy its complete contents into the Apps Script editor.
6. Click **Save** and name the project `Timber&Fins Wallet Registry API`.

## 3. Deploy the Apps Script as a web app

1. In Apps Script, choose **Deploy → New deployment**.
2. Click the gear beside **Select type** and choose **Web app**.
3. Set **Execute as** to **Me**.
4. Set **Who has access** to **Anyone**.
5. Click **Deploy**.
6. Google will ask you to authorize access to the spreadsheet. Complete the authorization.
7. Copy the **Web app URL**. It must end in `/exec`, not `/dev`.

## 4. Connect the GitHub app to the Sheet

1. Open `config.js`.
2. Replace:

```js
apiUrl: "PASTE_YOUR_GOOGLE_APPS_SCRIPT_URL_HERE"
```

with the `/exec` URL copied from Apps Script.

Example:

```js
apiUrl: "https://script.google.com/macros/s/EXAMPLE_DEPLOYMENT_ID/exec"
```

3. Save the file.

## 5. Create the GitHub repository

1. Sign in to GitHub.
2. Create a new repository named `wallet-registry`.
3. A public repository works with GitHub Free. Keep all customer data out of the repository.
4. Upload every file and folder in this project to the repository root:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `config.js`
   - `manifest.webmanifest`
   - `.nojekyll`
   - `assets/`
   - `apps-script/` may remain in the repository as a backup
5. Commit the files.

## 6. Turn on GitHub Pages

1. In the repository, open **Settings**.
2. Open **Pages** under **Code and automation**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select the `main` branch and the `/ (root)` folder.
5. Click **Save**.
6. GitHub will show the published address. It will normally look like:
   `https://YOUR-USERNAME.github.io/wallet-registry/`

## 7. Test before using it

1. Open the GitHub Pages URL.
2. Confirm the status reads **Sheet connected**.
3. Select an edition and verify the next number matches the Products sheet.
4. Enter a test order such as `TEST-001` and a customer name.
5. Submit it.
6. Open the Google Sheet and confirm the record appears in the first open row of Orders.
7. Delete the test row from the Sheet when finished.

## 8. Add it to the iPhone Home Screen

1. Open the GitHub Pages URL in Safari on the iPhone.
2. Tap **Share**.
3. Choose **Add to Home Screen**.
4. Keep **Open as Web App** enabled when offered.
5. Name it `Wallet Registry` and tap **Add**.

## Updating the app

Edit a file in GitHub and commit the change. GitHub Pages republishes the app automatically.

## Updating Apps Script

After changing `Code.gs`:

1. Open **Deploy → Manage deployments**.
2. Edit the active web-app deployment.
3. Choose **New version**.
4. Click **Deploy**.

The `/exec` URL normally stays the same.

## Tracker assumptions

The app expects:

### Products

| A | B | C | D |
|---|---|---|---|
| Product Name | Starting Number | Total Ordered | Next Number to Assign |

### Orders

| A | B | C | D |
|---|---|---|---|
| Order Number | Customer Name | Product | Assigned Wallet # |

The Apps Script writes the assigned number directly into column D. Existing formulas can remain in unused rows, but the script deliberately finds the first row where column A is empty.
