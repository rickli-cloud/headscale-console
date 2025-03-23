export function hex2a(hexx: string) {
  let hex = hexx.toString();
  let str = "";
  for (let i = 0; i < hex.length; i += 2) {
    str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return str;
}

export function joinUrl(base: URL | Location, path: string) {
  let str = "";

  str = str + base.protocol;
  str = str + "//";
  str = str + base.hostname;
  str = str + base.port.length ? ":" + base.port : "";
  str = str + base.pathname;
  str = str + base.pathname.endsWith("/") ? "" : "/";
  str = str + path.replace(/^\//, "");

  return str;
}
