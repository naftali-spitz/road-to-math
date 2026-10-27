import { test, expect } from '@playwright/test';
import Database from 'better-sqlite3';
let db;
test.beforeAll(() => { db = new Database(process.env.E2E_DATABASE_PATH); });
test.afterAll(() => db?.close());
function player(name) { return db.prepare('SELECT * FROM players WHERE display_name = ?').get(name); }
function pending(name) {
  return db.prepare(`SELECT q.* FROM issued_questions q JOIN players p ON p.id = q.player_id
    WHERE p.display_name = ? AND q.result_json IS NULL ORDER BY q.rowid DESC LIMIT 1`).get(name);
}
function attempts(name) { return db.prepare('SELECT COUNT(*) AS n FROM question_attempts WHERE player_id = ?').get(player(name).id).n; }
async function create(page, name) {
  await page.goto('/'); await page.getByLabel('Name', { exact: true }).fill(name);
  await expect(page.getByLabel('Name', { exact: true })).toHaveValue(name);
  await page.getByRole('button', { name: 'Create', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start Practice', exact: true }).first()).toBeEnabled();
}
async function submit(page, name) {
  await expect(page.locator('.question-text')).toBeVisible();
  const row = pending(name); const q = JSON.parse(row.question_json);
  db.prepare('UPDATE issued_questions SET issued_at_ms = ? WHERE id = ?').run(Date.now() - 500, row.id);
  if (['solve', 'fillBlank'].includes(q.format)) {
    await page.getByRole('textbox', { name: 'Answer', exact: true }).fill(String(q.expectedAnswer));
    await page.getByRole('button', { name: 'Submit', exact: true }).click();
  } else {
    await page.locator('.choice-grid button').nth(q.format === 'multipleChoice' ? Number(q.expectedAnswer) - 1 : q.expectedAnswer ? 0 : 1).click();
  }
}
async function practiceRound(page, name) {
  for (let i = 0; i < 10; i++) {
    await submit(page, name);
    await expect(page.getByRole('status')).toContainText('Correct');
    await page.getByRole('button', { name: i === 9 ? 'Finish Practice' : 'Next Question', exact: true }).click();
  }
  await expect(page.getByText('Practice Complete', { exact: true })).toBeVisible();
}
function expireRush(name) { db.prepare('UPDATE rush_sessions SET deadline_ms = 1 WHERE player_id = ? AND ended_at IS NULL').run(player(name).id); }

test('Practice saves, survives reload, completes once and restores format progress', async ({ page }) => {
  const name = 'Practice persistence'; await create(page, name);
  await page.getByRole('button', { name: 'Start Practice', exact: true }).first().click();
  for (let i = 0; i < 5; i++) { await submit(page, name); await page.getByRole('button', { name: 'Next Question', exact: true }).click(); }
  await page.reload(); await page.getByRole('button', { name: 'Start Practice', exact: true }).first().click();
  await expect(page.locator('.question-panel__top strong')).toHaveText('6 / 10');
  for (let i = 5; i < 10; i++) { await submit(page, name);
    await page.getByRole('button', { name: i === 9 ? 'Finish Practice' : 'Next Question', exact: true }).click(); }
  await expect(page.getByText('Practice Complete', { exact: true })).toBeVisible();
  expect(attempts(name)).toBe(10); expect(player(name).xp_total).toBe(20);
  await page.getByRole('button', { name: 'Keep Practicing', exact: true }).click();
  await expect(page.locator('.choice-grid button')).toHaveCount(4);
});
test('rapid submissions while saving create one attempt', async ({ page }) => {
  const name = 'Rapid input'; await create(page, name);
  await page.getByRole('button', { name: 'Start Practice', exact: true }).first().click();
  await expect(page.getByRole('textbox', { name: 'Answer', exact: true })).toBeVisible();
  const q = JSON.parse(pending(name).question_json);
  await page.getByRole('textbox', { name: 'Answer', exact: true }).fill(String(q.expectedAnswer));
  let requests = 0;
  await page.route('**/attempts/practice', async route => { requests++; const response = await route.fetch();
    await new Promise(resolve => setTimeout(resolve, 200)); await route.fulfill({ response }); });
  await page.locator('.answer-form').evaluate(form => { form.requestSubmit(); form.requestSubmit(); form.requestSubmit(); });
  await expect(page.getByRole('button', { name: 'Next Question', exact: true })).toBeVisible();
  expect(requests).toBe(1); expect(attempts(name)).toBe(1);
});
test('a lost answer response can be retried without duplicate XP', async ({ page }) => {
  const name = 'Lost response'; await create(page, name);
  await page.getByRole('button', { name: 'Start Practice', exact: true }).first().click();
  let dropped = false;
  await page.route('**/attempts/practice', async route => {
    if (!dropped) { dropped = true; await route.fetch(); await route.abort('failed'); } else await route.continue();
  });
  await submit(page, name); await expect(page.getByRole('alert')).toContainText('try again');
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Next Question', exact: true })).toBeVisible();
  expect(attempts(name)).toBe(1); expect(player(name).xp_total).toBe(1);
});
test('Rush refresh preserves session/deadline and abandonment is final', async ({ page }) => {
  const name = 'Rush resume'; await create(page, name);
  const rushButton = () => page.getByRole('button', { name: 'I already know this — try Rush', exact: true }).first();
  await rushButton().click(); await submit(page, name);
  await expect(page.locator('.rush-meter').getByText('1', { exact: true }).first()).toBeVisible();
  const before = db.prepare('SELECT * FROM rush_sessions WHERE player_id = ?').get(player(name).id);
  await page.reload(); await rushButton().click(); await expect(page.locator('.question-text')).toBeVisible();
  const after = db.prepare('SELECT * FROM rush_sessions WHERE player_id = ? AND ended_at IS NULL').get(player(name).id);
  expect(after.id).toBe(before.id); expect(after.deadline_ms).toBe(before.deadline_ms);
  await page.getByRole('button', { name: 'Exit Rush', exact: true }).click();
  await expect(page.getByText('Rush Abandoned', { exact: true })).toBeVisible();
  expect(attempts(name)).toBe(1);
});
test('Rush completion waits for an in-flight answer and shows authoritative summary', async ({ page }) => {
  const name = 'Rush completion race'; await page.clock.install(); await create(page, name);
  await page.getByRole('button', { name: 'I already know this — try Rush', exact: true }).first().click();
  await expect(page.locator('.question-text')).toBeVisible();
  let release; const held = new Promise(resolve => { release = resolve; });
  let saved; const serverSaved = new Promise(resolve => { saved = resolve; });
  let completed = false;
  await page.route('**/rush-sessions/*/attempts', async route => { const response = await route.fetch(); saved(); await held; await route.fulfill({ response }); });
  await page.route('**/rush-sessions/*/complete', async route => { completed = true; await route.continue(); });
  await submit(page, name); await serverSaved; expireRush(name); await page.clock.fastForward(61000);
  expect(completed).toBe(false); release();
  await expect(page.getByText('Rush Complete', { exact: true })).toBeVisible();
  expect(attempts(name)).toBe(1); expect(player(name).xp_total).toBe(37);
  await page.getByRole('button', { name: 'Play Again', exact: true }).click();
  await expect(page.locator('.question-text')).toBeVisible();
});
test('Practice and a qualifying Rush unlock the next level through the UI', async ({ page }) => {
  const name = 'Mastery journey'; await page.clock.install(); await create(page, name);
  await page.getByRole('button', { name: 'Start Practice', exact: true }).first().click();
  await practiceRound(page, name); await page.getByRole('button', { name: 'Keep Practicing', exact: true }).click();
  await practiceRound(page, name); await page.getByRole('button', { name: 'Back to Levels', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start Practice', exact: true }).nth(1)).toBeDisabled();
  await page.getByRole('button', { name: 'I already know this — try Rush', exact: true }).first().click();
  for (let i = 0; i < 10; i++) {
    const old = pending(name)?.id;
    await submit(page, name);
    await expect.poll(() => pending(name)?.id).not.toBe(old);
    await expect(page.locator('.answer-form input, .choice-grid button').first()).toBeEnabled();
  }
  expireRush(name); await page.clock.fastForward(61000);
  await expect(page.getByText('Rush Complete', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Back to Levels', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Start Practice', exact: true }).nth(1)).toBeEnabled();
  await page.reload(); await expect(page.getByRole('button', { name: 'Start Practice', exact: true }).nth(1)).toBeEnabled();
});

test('Rush keeps its question visible and usable on a phone', async ({ page }) => {
  const errors = []; page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  const name = 'Phone gameplay'; await create(page, name);
  await page.getByRole('button', { name: 'I already know this — try Rush', exact: true }).first().click();
  await expect(page.locator('.question-text')).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Submit', exact: true })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await submit(page, name);
  await expect(page.locator('.answer-form input, .choice-grid button').first()).toBeEnabled();
  expect(attempts(name)).toBe(1); expect(errors).toEqual([]);
});
