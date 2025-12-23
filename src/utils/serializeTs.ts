export const serializeTs = (obj: any, ident = 2): string => {
  const pad = ' '.repeat(ident);

  let str = '{\n';

  for (const key in obj) {
    const value = obj[key];
    // Manipulate JS keys
    const keyStr = /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : `"${key}"`;

    if (
      typeof value === 'object' &&
      value !== null &&
      !('path' in value && 'import' in value)
    ) {
      // Create sub folders
      str += `${pad}${keyStr}: ${serializeTs(value, ident + 2)},\n`;
    } else {
      // Routes
      str += `${pad}${keyStr}: { path: "${value.path}", import: "${value.import}" },\n`;
    }
  }

  str += ' '.repeat(ident - 2) + '}';

  return str;
};
