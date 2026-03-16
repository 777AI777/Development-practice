const YAHOO_API_URL =
  "https://jlp.yahooapis.jp/FuriganaService/V2/furigana";

interface YahooWord {
  surface: string;
  furigana?: string;
  roman?: string;
}

interface YahooResponse {
  id: string;
  jsonrpc: string;
  result: {
    word: YahooWord[];
  };
}

export function hiraganaToKatakana(str: string): string {
  return str.replace(/[\u3041-\u3096]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) + 0x60),
  );
}

export async function getReadings(text: string): Promise<string[]> {
  const clientId = process.env.YAHOO_CLIENT_ID;
  if (!clientId) {
    return [];
  }

  try {
    const response = await fetch(YAHOO_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": `Yahoo AppID: ${clientId}`,
      },
      body: JSON.stringify({
        id: "1",
        jsonrpc: "2.0",
        method: "jlp.furiganaservice.furigana",
        params: { q: text, grade: 1 },
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data: YahooResponse = await response.json();
    const words = data.result?.word ?? [];

    if (words.length === 0) {
      return [];
    }

    const concatenated = words
      .map((w) => (w.furigana ? hiraganaToKatakana(w.furigana) : w.surface))
      .join("");

    return [concatenated];
  } catch {
    return [];
  }
}
