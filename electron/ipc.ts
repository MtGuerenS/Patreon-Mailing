import { ipcMain, BrowserWindow, dialog, app } from "electron";
import {
  openPatreonAuth,
  loadTokens,
  clearTokens,
  isTokenExpired,
} from "./auth";
import {
  fetchCampaigns,
  fetchCampaignMembers,
  clearMembersCache,
  loadMembersCache,
} from "./members";
import {
  getAllMembers,
  getMemberById,
  upsertMember,
  updateCleanAddress,
  setAddressStatus,
  getDb,
  getPackedIds,
  setPacked,
} from "./db";
import type { PatreonAddressResource } from "../src/shared/patreon-types";
import { isPledgeEvent, isAddress } from "../src/shared/patreon-types";
import fs from "fs";
import path from "path";

export function registerIpcHandlers(getWin: () => BrowserWindow | null) {
  ipcMain.on("patreon-login", () => openPatreonAuth(getWin()));

  ipcMain.handle("patreon-get-saved-tokens", () => {
    if (isTokenExpired()) {
      clearTokens();
      return null;
    }
    return loadTokens();
  });

  ipcMain.handle("patreon-logout", () => {
    clearTokens();
    clearMembersCache();
  });

  ipcMain.handle(
    "patreon-get-campaigns",
    async (_event, accessToken: string) => {
      return fetchCampaigns(accessToken);
    },
  );

  ipcMain.handle(
    "patreon-get-campaign-members",
    async (_event, campaignId: string, accessToken: string) => {
      return fetchCampaignMembers(campaignId, accessToken);
    },
  );

  ipcMain.handle("patreon-refresh-members", () => {
    clearMembersCache();
  });

  ipcMain.handle("db-sync-members", (_event) => {
    const cache = loadMembersCache();
    if (!cache) throw new Error("No members cache found, fetch members first");

    const { data, included } = cache;

    const paidMembers = data.filter((member) => {
      const pledgeEventIds: string[] = (
        (member.relationships?.pledge_history?.data as Array<{ id: string }>) ??
        []
      ).map((d) => d.id);

      if (pledgeEventIds.length === 0) return false;

      return included.some(
        (item) =>
          isPledgeEvent(item) &&
          pledgeEventIds.includes(item.id) &&
          item.attributes.payment_status === "Paid",
      );
    });

    const sync = getDb().transaction(() => {
      for (const member of paidMembers) {
        const existing = getMemberById(member.id);

        const addressId =
          (member.relationships?.address?.data as { id: string } | null)?.id ??
          null;
        const addressObj = addressId
          ? included.find(
              (i): i is PatreonAddressResource =>
                isAddress(i) && i.id === addressId,
            )
          : null;
        const a = addressObj?.attributes ?? null;

        const hasAddress = !!a?.line_1;

        const addressChanged =
          existing &&
          hasAddress &&
          (existing.raw_line_1 !== (a.line_1 ?? null) ||
            existing.raw_city !== (a.city ?? null) ||
            existing.raw_postal_code !== (a.postal_code ?? null));

            const hasCleanAddress = !!existing?.clean_line_1;

            const status: "missing" | "check_needed" | "verified" =
              existing?.address_status === "verified" && hasCleanAddress
                ? "verified"
                : !hasAddress
                  ? "missing"
                  : addressChanged
                    ? "check_needed"
                    : (existing?.address_status ?? "check_needed");

        upsertMember({
          id: member.id,
          full_name: member.attributes?.full_name ?? null,
          raw_addressee: a?.addressee ?? null,
          raw_line_1: a?.line_1 ?? null,
          raw_line_2: a?.line_2 ?? null,
          raw_city: a?.city ?? null,
          raw_state: a?.state ?? null,
          raw_postal_code: a?.postal_code ?? null,
          raw_country: a?.country ?? null,
          clean_addressee: existing?.clean_addressee ?? null,
          clean_line_1: existing?.clean_line_1 ?? null,
          clean_line_2: existing?.clean_line_2 ?? null,
          clean_city: existing?.clean_city ?? null,
          clean_state: existing?.clean_state ?? null,
          clean_postal_code: existing?.clean_postal_code ?? null,
          clean_country: existing?.clean_country ?? null,
          address_status: status,
        });
      }
    });

    sync();
    return getAllMembers();
  });

  ipcMain.handle("db-get-members", () => getAllMembers());

  ipcMain.handle("db-update-clean-address", (_event, id: string, fields) => {
    updateCleanAddress(id, fields);
  });

  ipcMain.handle("db-set-status", (_event, id: string, status) => {
    setAddressStatus(id, status);
  });

  ipcMain.handle("get-packed", (_e, year: number, month: number) =>
    getPackedIds(year, month),
  );

  ipcMain.handle(
    "set-packed",
    (_e, memberId: string, year: number, month: number, packed: boolean) => {
      setPacked(memberId, year, month, packed);
    },
  );

  ipcMain.on("window-set-main", () => {
    const win = getWin();
    if (!win) return;
    win.setResizable(true);
    win.setSize(1200, 800);
    win.center();
  });

  ipcMain.handle("test-print-pdf", async () => {
    const printWin = new BrowserWindow({
      show: true,
      webPreferences: { contextIsolation: false },
    });

    await printWin.loadURL(
      `data:text/html,<body style="background:red"><h1>HELLO PDF</h1></body>`,
    );

    await new Promise((r) => setTimeout(r, 1000));

    const pdfBuffer = await printWin.webContents.printToPDF({
      printBackground: true,
      pageSize: "A4",
    });

    printWin.close();

    const outPath = path.join(app.getPath("desktop"), "test-output.pdf");
    fs.writeFileSync(outPath, pdfBuffer);
    console.log("PDF written to:", outPath);
    return outPath;
  });

  ipcMain.handle(
    "export-pdf",
    async (_event, dataUrls: string[], aspectRatio: number) => {
      const { filePath } = await dialog.showSaveDialog({
        defaultPath: "envelopes.pdf",
        filters: [{ name: "PDF", extensions: ["pdf"] }],
      });
      if (!filePath) return { cancelled: true };
  
      // Page size in microns. 1 inch = 25400 microns.
      // Use a fixed width (e.g. 9.5 inches) and derive height from aspect ratio.
      const pageWidthMicrons = 241300; // ~9.5 inches
      const pageHeightMicrons = Math.round(pageWidthMicrons / aspectRatio);
  
      // Convert to pixels at 96 DPI for the HTML viewport
      // 1 inch = 96 px, 1 inch = 25400 microns => px = microns * 96 / 25400
      const pageWidthPx = (pageWidthMicrons * 96) / 25400;
      const pageHeightPx = (pageHeightMicrons * 96) / 25400;
  
      const imagesHtml = dataUrls
        .map((dataUrl) => `<div class="page"><img src="${dataUrl}" /></div>`)
        .join("\n");
  
      const html = `<!DOCTYPE html>
  <html><head><meta charset="utf-8"><style>
    @page {
      size: ${pageWidthPx}px ${pageHeightPx}px;
      margin: 0;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { width: ${pageWidthPx}px; background: white; }
    .page {
      width: ${pageWidthPx}px;
      height: ${pageHeightPx}px;
      display: flex;
      align-items: center;
      justify-content: center;
      page-break-after: always;
      page-break-inside: avoid;
      overflow: hidden;
    }
    .page:last-child { page-break-after: auto; }
    img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      display: block;
    }
  </style></head>
  <body>${imagesHtml}</body></html>`;
  
      // Use a hidden offscreen window — DON'T disturb the main window.
      const printWin = new BrowserWindow({
        show: false,
        webPreferences: {
          offscreen: false,
          contextIsolation: true,
          nodeIntegration: false,
        },
      });
  
      try {
        const tmpDir = path.join(app.getPath("temp"), "patreon-envelopes");
        fs.mkdirSync(tmpDir, { recursive: true });
        const tmpHtml = path.join(tmpDir, "envelopes-print.html");
        fs.writeFileSync(tmpHtml, html, "utf-8");
  
        // Wait for the page to fully load
        await printWin.loadFile(tmpHtml);
  
        // Wait for all images to decode
        await printWin.webContents.executeJavaScript(`
          Promise.all(
            Array.from(document.images).map(img =>
              img.complete ? Promise.resolve() :
                new Promise(res => { img.onload = img.onerror = res; })
            )
          ).then(() => true)
        `);
  
        const pdfBuffer = await printWin.webContents.printToPDF({
          printBackground: true,
          pageSize: {
            width: pageWidthMicrons,
            height: pageHeightMicrons,
          },
          margins: { top: 0, bottom: 0, left: 0, right: 0 },
          preferCSSPageSize: true,
        });
  
        fs.writeFileSync(filePath, pdfBuffer);
        fs.rmSync(tmpDir, { recursive: true, force: true });
  
        return { cancelled: false };
      } finally {
        if (!printWin.isDestroyed()) printWin.close();
      }
    },
  );

  if (process.env.NODE_ENV === "development") {
    ipcMain.handle("dev-verify-all-members", () => {
      const db = getDb();
      db.prepare(
        `UPDATE members SET address_status = 'verified', updated_at = ? WHERE address_status != 'missing'`,
      ).run(new Date().toISOString());
      return getAllMembers();
    });
  
    ipcMain.handle("dev-unverify-all-members", () => {
      const db = getDb();
      db.prepare(
        `UPDATE members SET address_status = 'check_needed', updated_at = ? WHERE address_status != 'missing'`,
      ).run(new Date().toISOString());
      return getAllMembers();
    });
  }
}
