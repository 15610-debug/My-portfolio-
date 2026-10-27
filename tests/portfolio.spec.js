const { test, expect } = require('@playwright/test');

test('profile creation, portfolio CRUD, image crop and persistence', async ({ page }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/');
  await expect(page.getByLabel('ชื่อที่ใช้แสดง')).toBeVisible();
  await page.getByLabel('ชื่อที่ใช้แสดง').fill('PN Test Portfolio');
  await page.getByRole('button', { name: 'เริ่มใช้งาน' }).click();
  await expect(page.getByRole('heading', { name: 'PN Test Portfolio' })).toBeVisible();

  await page.getByRole('button', { name: /เพิ่มผลงาน/ }).click();
  await page.getByLabel('ชื่อรายการ (จำเป็น)').fill('งานทดสอบ');
  await page.getByLabel('รายละเอียดสั้น ๆ').fill('ทดสอบการบันทึกผลงาน');

  const png = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jW5kAAAAASUVORK5CYII=',
    'base64'
  );
  await page.locator('#f-i').setInputFiles({
    name: 'test.png',
    mimeType: 'image/png',
    buffer: png
  });
  const cropDialog = page.locator('dialog').filter({ has: page.getByRole('heading', { name: 'จัดกรอบรูปภาพ' }) });
  await expect(cropDialog).toBeVisible();
  await cropDialog.locator('#cratio').selectOption('1:1');
  await cropDialog.getByRole('button', { name: 'ใช้รูปนี้' }).click();
  await expect(page.locator('#th img')).toHaveCount(1);

  await page.getByRole('button', { name: 'บันทึก', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'งานทดสอบ' })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'PN Test Portfolio' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'งานทดสอบ' })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('layout stays within a narrow mobile viewport', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    await new Promise(resolve => {
      const req = indexedDB.open('pn-portfolio', 1);
      req.onupgradeneeded = () => req.result.createObjectStore('kv');
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction('kv', 'readwrite');
        tx.objectStore('kv').put({
          name: 'Viewport Test', tagline: '', items: [{
            id: 'sample', title: 'Sample certificate', cat: 'การเรียนรู้และใบรับรอง',
            date: '2569', desc: '', tags: [], imgs: [], originals: [], at: Date.now()
          }]
        }, 's');
        tx.oncomplete = () => { db.close(); resolve(); };
      };
    });
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Viewport Test' })).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    client: document.documentElement.clientWidth,
    scroll: document.documentElement.scrollWidth
  }));
  expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client + 1);
});
