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
      }[];
    }).sshCalls
  );
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
    await expect(page.getByRole("status")).toHaveText("Connected");
    expect(await calls(page)).toMatchObject([{ host: "server", username }]);
    await page.getByRole("button", { name: "Disconnect", exact: true }).click();
    await expect(page.getByRole("status")).toHaveText("Disconnected");
    await page.waitForTimeout(100);
    expect(await calls(page)).toHaveLength(1);
    await page.getByRole("button", { name: "Change user", exact: true })
      .click();
    await page.keyboard.type("other");
    await page.keyboard.press("Enter");
    await expect(page.getByRole("status")).toHaveText("Connected");
    expect((await calls(page))[1].username).toBe("other");
    await page.keyboard.type("echo test");
    expect((await calls(page))[1].input.join("")).toBe("echo test");
  });
}

test("known host skips confirmation with manual defaults", async ({ page }) => {
  await page.goto("/tests/browser.html#/connect?proto=ssh&host=server");
  await expect(page.getByRole("status")).toHaveText("Ready");
  await page.locator(".xterm-helper-textarea").focus();
  await page.keyboard.type("manual");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Connected");
  expect(await calls(page)).toMatchObject([{
    host: "server",
    username: "manual",
  }]);
});

test("prefilled username waits for Enter when auto-connect is off", async ({ page }) => {
  await preferences(page, { ...enabled, "ssh-auto-connect": "false" });
  await page.goto("/tests/browser.html#/connect?proto=ssh&host=server");
  await expect(page.getByRole("status")).toHaveText("Ready");
  expect(await calls(page)).toHaveLength(0);
  await page.locator(".xterm-helper-textarea").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Connected");
  expect((await calls(page))[0].username).toBe("alex");
});

test("invalid profile login falls back to manual input without guessing", async ({ page }) => {
  await preferences(page, enabled);
  await page.goto(
    "/tests/browser.html?login=Alex%20Example#/connect?proto=ssh&host=server",
  );
  await expect(page.getByRole("status")).toHaveText("Ready");
  expect(await calls(page)).toHaveLength(0);
});

test("missing host is prompted before an automatic connection", async ({ page }) => {
  await preferences(page, enabled);
  await page.goto("/tests/browser.html#/connect?proto=ssh");
  await expect(page.getByRole("status")).toHaveText("Ready");
  expect(await calls(page)).toHaveLength(0);
  await page.locator(".xterm-helper-textarea").focus();
  await page.keyboard.type("server");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toHaveText("Connected");
});

test("failure does not retry; reconnect is explicit and input is not duplicated", async ({ page }) => {
  await preferences(page, enabled);
  await page.goto("/tests/browser.html?fail#/connect?proto=ssh&host=server");
  await expect(page.getByRole("status")).toHaveText("Failed");
  await page.waitForTimeout(100);
  expect(await calls(page)).toHaveLength(1);
  await page.getByRole("button", { name: "Reconnect", exact: true }).click();
  await expect.poll(async () => (await calls(page)).length).toBe(2);
  await expect(page.getByRole("status")).toHaveText("Failed");
});

test("reconnect sends each keystroke once and navigation closes the session", async ({ page }) => {
  await preferences(page, enabled);
  await page.goto("/tests/browser.html#/connect?proto=ssh&host=server");
  await expect(page.getByRole("status")).toHaveText("Connected");
  await page.getByRole("button", { name: "Disconnect", exact: true }).click();
  await page.getByRole("button", { name: "Reconnect", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("Connected");
  await page.keyboard.type("echo once");
  expect((await calls(page))[1].input.join("")).toBe("echo once");
  await page.getByRole("link", { name: "← Machines" }).click();
  await expect.poll(async () => (await calls(page))[1].closed).toBe(true);
});

test("multi-line paste cannot submit a username or send input to a shell", async ({ page }) => {
  await page.goto("/tests/browser.html#/connect?proto=ssh&host=server");
  await expect(page.getByRole("status")).toHaveText("Ready");
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
  await expect(page.getByRole("status")).toHaveText("Connected");
  expect(await calls(page)).toMatchObject([{ username: "alex", input: [] }]);
});
