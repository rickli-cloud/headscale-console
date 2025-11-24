export class Hex {
  public static encode(str: string): string {
    let hex = "";
    for (let i = 0; i < str.length; i++) {
      hex += str.charCodeAt(i).toString(16).padStart(2, "0");
    }
    return hex;
  }

  public static decode(hex: string): string {
    let str = "";
    for (let i = 0; i < hex.length; i += 2) {
      str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return str;
  }
}

/** Returns a 2 char name mostly used for avatar fallback */
export function shortName(name: string | number | undefined) {
  if (typeof name !== "string" || !name?.length) return "?";
  const split = String(name).split(/\s+/g);
  return split.length === 2
    ? `${split[0][0]}${split[1][0]}`.toUpperCase()
    : String(name).slice(0, 2).toUpperCase();
}

export function debounce<T extends Array<any>>(
  func: (...args: T) => void,
  timeout: number = 500
) {
  let timer: NodeJS.Timeout;
  return (...args: T) => {
    clearTimeout(timer);
    timer = setTimeout(() => func(...args), timeout);
  };
}
