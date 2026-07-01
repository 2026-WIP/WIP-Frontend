const TEXT = {
  editedFile: '\uC218\uC815\uD55C \uD30C\uC77C :',
  add: '\uCD94\uAC00',
  cancel: '\uCDE8\uC18C',
  channel: '\uCC44\uB110',
  notifications: '\uC54C\uB9BC',
  snippets: '\uC2A4\uB2C8\uD3AB',
  search: '\uAC80\uC0C9',
  message: '\uBA54\uC2DC\uC9C0',
  inProgress: '\uC9C4\uD589 \uC911',
  complete: '\uC644\uB8CC',
};

const KNOWN_MOJIBAKE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/(^|\s)\?{4,}:?\s*/g, `$1${TEXT.editedFile} `],
  [/\?+\S*\uC808\?+\S*\uC529:?\s*/g, `${TEXT.editedFile} `],
  [/\?+\uC12F\uC819\?+\uB69F\uC52A:?\s*/g, `${TEXT.editedFile} `],
  [/\?+\S*\uC819\?+\S*\uC52A:?\s*/g, `${TEXT.editedFile} `],
  [/\?\uC0C7\uC808\?\?\?\uB73B\uC529:?/g, TEXT.editedFile],
  [/\?\?\uC0C7\uC808\?\?\?\uB73B\uC529:?/g, TEXT.editedFile],
  [/\?\uC12F\uC819\?\?\?\uB69F\uC52A:?/g, TEXT.editedFile],
  [/\u7570\uBD09\?/g, TEXT.add],
  [/\u75CD\u2465\uB0BC/g, TEXT.cancel],
  [/\uF9E2\uAFB8\uB07C/g, TEXT.channel],
  [/\?\uB69E\u251D/g, TEXT.notifications],
  [/\?\u317B\uB575\?\?/g, TEXT.snippets],
  [/\u5BC3\u0080\?\?/g, TEXT.search],
  [/\uF9CE\uBD93\uB5C6\uC9C0\u0080/g, TEXT.message],
  [/\uF98E\uAFBE\uFB7E \u4EE5\?/g, TEXT.inProgress],
  [/\?\uAFB8\uC989/g, TEXT.complete],
];

export function normalizeKnownEncodingArtifacts(value: string) {
  const normalized = KNOWN_MOJIBAKE_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value,
  );
  return normalized
    .replace(
      /(?:\?|\uFFFD)+[^\s:]{0,16}(?:\uC808|\uC819)[^\s:]{0,16}(?:\uC529|\uC52A):?\s*/g,
      `${TEXT.editedFile} `,
    )
    .replace(/수정한 파일\s*:/g, TEXT.editedFile)
    .replace(/\*\*(수정한 파일\s*:)\s+\*\*/g, '**$1**')
    .replace(/\*\*(수정한 파일 :)\s+\*\*/g, '**$1**')
    .replace(/\*\*(코드 수정)\s+\*\*/g, '**$1**')
    .replace(/^\s*(수정한 파일\s*:)\s*/gm, `${TEXT.editedFile} `)
    .replace(/^\s*(코드 수정)\s*$/gm, '$1');
}

export function previewMessageText(value: string) {
  return normalizeKnownEncodingArtifacts(value)
    .replace(/```[\s\S]*?```/g, '[code]')
    .replace(/\*\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function splitLeadingEditLabel(value: string) {
  const preview = previewMessageText(value);
  const match = /^(수정한 파일\s*:|코드 수정)(?:\s+)?(.*)$/.exec(preview);
  if (!match) return { label: null as string | null, rest: preview };
  const label = match[1].startsWith('수정한 파일') ? TEXT.editedFile : match[1];
  return { label, rest: match[2] ?? '' };
}
