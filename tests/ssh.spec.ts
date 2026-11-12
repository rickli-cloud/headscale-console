import { expect, type Page, test } from "@playwright/test";

async function preferences(page: Page, values: Record<string, string>) {
  await page.addInitScript((settings) => {
    for (const [key, value] of Object.entries(settings)) {
      localStorage.setItem(`user-setting_${key}`, value);
    }
  }, values);
}
async function calls(page: Page) {
  return page.evaluate(() =>
    (window as unknown as {
      sshCalls: {
        host: string;
        username: string;
        input: string[];
        closed: boolean;
        connected: boolean;
        ended: boolean;
      }[];
    }).sshCalls
  );
}
async function terminalReady(page: Page) {
  await page.getByRole("region", { name: "SSH terminal", exact: true })
    .waitFor();
  await page.locator(".xterm-helper-textarea").focus();
}
async function connected(page: Page, index = 0) {
  await expect.poll(async () => (await calls(page))[index]?.connected).toBe(
    true,
  );
}
async function endSession(page: Page, index = 0) {
  await page.locator(".xterm-helper-textarea").focus();
  await page.keyboard.type("exit");
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await calls(page))[index]?.ended).toBe(true);
}
const enabled = {
  "ssh-default-username-enabled": "true",
  "ssh-auto-connect": "true",
};

test("settings persist username choices and an explicit opt-out", async ({ page }) => {
  await page.goto("/tests/browser.html?defaults#/settings");
  const username = page.getByRole("combobox", {
    name: "Username",
    exact: true,
  });
  await expect(username).toHaveValue("headscale");
  await expect(username.locator("option:checked")).toHaveText(
    "Headscale username (alex)",
  );
  await username.selectOption("root");
  await expect(page.getByLabel("Custom username", { exact: true })).toHaveCount(
    0,
  );
  await username.selectOption("custom");
  await expect(page.getByRole("switch", { name: "Connect automatically" }))
    .toBeDisabled();
  await expect(page.getByRole("switch", { name: "Connect automatically" })).not
    .toBeChecked();
  await page.getByLabel("Custom username", { exact: true }).fill("deploy");
  await page.getByRole("switch", { name: "Connect automatically" }).uncheck();
  await page.reload();
  await expect(page.getByRole("switch", { name: "Connect automatically" })).not
    .toBeChecked();
  await expect(username).toHaveValue("custom");
  await expect(page.getByLabel("Custom username", { exact: true })).toHaveValue(
    "deploy",
  );
  await username.selectOption("headscale");
  await expect(username.locator("option:checked")).toHaveText(
    "Headscale username (alex)",
  );
});

test("ask every time turns automatic connection off and remains off after reload", async ({ page }) => {
  await page.goto("/tests/browser.html?defaults#/settings");
  const username = page.getByRole("combobox", {
    name: "Username",
    exact: true,
  });
  const autoConnect = page.getByRole("switch", {
    name: "Connect automatically",
  });
  await expect(autoConnect).toBeChecked();
  await username.selectOption("ask");
  await expect(autoConnect).not.toBeChecked();
  await expect(autoConnect).toBeDisabled();
  await page.reload();
  await expect(username).toHaveValue("ask");
  await username.selectOption("root");
  await expect(autoConnect).toBeEnabled();
  await expect(autoConnect).not.toBeChecked();
});

test("custom validation is contextual and the compact form works on mobile and keyboard", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/tests/browser.html#/settings");
  const username = page.getByRole("combobox", {
    name: "Username",
    exact: true,
  });
  await expect(username).toHaveValue("ask");
  await username.focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  await expect(username).toHaveValue("headscale");
  await username.selectOption("custom");
  const custom = page.getByLabel("Custom username", { exact: true });
  await expect(page.getByText("Enter a valid Linux username.")).toHaveCount(0);
  await custom.fill("bad name");
  await expect(custom).toHaveAttribute("aria-invalid", "true");
  await expect(custom).toHaveAccessibleDescription(
    "Enter a valid Linux username.",
  );
  await expect(page.getByText("Enter a valid Linux username.")).toBeVisible();
  await custom.fill("deploy");
  await expect(custom).toHaveAttribute("aria-invalid", "false");
  await expect(page.getByText("Enter a valid Linux username.")).toHaveCount(0);
  expect(
    await page.evaluate(() =>
      document.documentElement.scrollWidth > innerWidth
    ),
  ).toBe(false);
});

for (
  const [source, username] of [["headscale", "alex"], ["root", "root"], [
    "custom",
    "deploy",
  ]]
) {
  test(`automatic connection uses ${source} exactly once`, async ({ page }) => {
    await preferences(page, {
      ...enabled,
      "ssh-username-source": source,
      "ssh-custom-username": " deploy ",
    });
    await page.goto("/tests/browser.html#/connect?proto=ssh&host=server");
    await connected(page);
    expect(await calls(page)).toMatchObject([{ host: "server", username }]);
    await expect(page.getByRole("button")).toHaveCount(0);
    await endSession(page);
    await page.waitForTimeout(100);
    expect(await calls(page)).toHaveLength(1);
    await page.keyboard.press("Enter");
    await page.keyboard.type("other");
    await page.keyboard.press("Enter");
    await connected(page, 1);
    expect((await calls(page))[1].username).toBe("other");
    await page.keyboard.type("echo test");
    expect((await calls(page))[1].input.join("")).toBe("echo test");
  });
}

test("known host skips confirmation with manual defaults", async ({ page }) => {
  await page.goto("/tests/browser.html#/connect?proto=ssh&host=server");
  await terminalReady(page);
  await page.locator(".xterm-helper-textarea").focus();
  await page.keyboard.type("manual");
  await page.keyboard.press("Enter");
  await connected(page);
  expect(await calls(page)).toMatchObject([{
    host: "server",
    username: "manual",
  }]);
});

test("prefilled username waits for Enter when auto-connect is off", async ({ page }) => {
  await preferences(page, { ...enabled, "ssh-auto-connect": "false" });
  await page.goto("/tests/browser.html#/connect?proto=ssh&host=server");
  await terminalReady(page);
  expect(await calls(page)).toHaveLength(0);
  await page.locator(".xterm-helper-textarea").focus();
  await page.keyboard.press("Enter");
  await connected(page);
  expect((await calls(page))[0].username).toBe("alex");
});

test("invalid profile login falls back to manual input without guessing", async ({ page }) => {
  await preferences(page, enabled);
  await page.goto(
    "/tests/browser.html?login=Alex%20Example#/connect?proto=ssh&host=server",
  );
  await terminalReady(page);
  expect(await calls(page)).toHaveLength(0);
});

test("missing host is prompted before an automatic connection", async ({ page }) => {
  await preferences(page, enabled);
  await page.goto("/tests/browser.html#/connect?proto=ssh");
  await terminalReady(page);
  expect(await calls(page)).toHaveLength(0);
  await page.locator(".xterm-helper-textarea").focus();
  await page.keyboard.type("server");
  await page.keyboard.press("Enter");
  await connected(page);
});

test("failure waits for a key and manual username without automatic retry", async ({ page }) => {
  await preferences(page, enabled);
  await page.goto("/tests/browser.html?fail#/connect?proto=ssh&host=server");
  await terminalReady(page);
  await expect.poll(async () => (await calls(page))[0]?.ended).toBe(true);
  await page.waitForTimeout(100);
  expect(await calls(page)).toHaveLength(1);
  await page.keyboard.press("Enter");
  expect(await calls(page)).toHaveLength(1);
  await page.keyboard.type("other");
  await page.keyboard.press("Enter");
  await expect.poll(async () => (await calls(page))[1]?.ended).toBe(true);
  expect((await calls(page))[1].username).toBe("other");
});

test("manual retry sends input once and browser navigation closes the session", async ({ page }) => {
  await preferences(page, enabled);
  await page.goto("/tests/browser.html#/settings");
  await page.getByRole("combobox", { name: "Username", exact: true }).waitFor();
  await page.evaluate(() =>
    window.appRouter.goto(
      new URL("#/connect?proto=ssh&host=server", location.href),
    )
  );
  await connected(page);
  await endSession(page);
  await page.keyboard.press("Enter");
  await page.keyboard.type("alex");
  await page.keyboard.press("Enter");
  await connected(page, 1);
  await page.keyboard.type("echo once");
  expect((await calls(page))[1].input.join("")).toBe("echo once");
  await page.goBack();
  await expect.poll(async () => (await calls(page))[1].closed).toBe(true);
});

test("multi-line paste cannot submit a username or send input to a shell", async ({ page }) => {
  await page.goto("/tests/browser.html#/connect?proto=ssh&host=server");
  await terminalReady(page);
  await page.locator(".xterm-helper-textarea").focus();
  await page.locator(".xterm-helper-textarea").evaluate((element) => {
    const data = new DataTransfer();
    data.setData("text/plain", "alex\n");
    // Firefox discards the constructor's synthetic clipboardData. Supply the
    // fixture explicitly so both engines exercise Xterm's real paste listener.
    const event = new ClipboardEvent("paste", { bubbles: true });
    Object.defineProperty(event, "clipboardData", { value: data });
    element.dispatchEvent(event);
  });
  expect(await calls(page)).toHaveLength(0);
  await page.keyboard.press("Enter");
  await connected(page);
  expect(await calls(page)).toMatchObject([{ username: "alex", input: [] }]);
});
