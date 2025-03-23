export function hex2a(hexx: string) {
  let hex = hexx.toString();
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}

export function joinUrl(base: URL | Location, path: string) {
  return `${base.protocol}//${base.hostname}${base.port ? ":" : ""}${
    base.port
  }${base.pathname}${base.pathname.endsWith("/") ? "" : "/"}${path}`;
}
