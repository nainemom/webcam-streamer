const { argv } = Bun;

const toNumber = (value: string) => /^(\d)+$/g.test(value) ? Number(value) : undefined;

type ArgvType = 'string' | 'number';

export const readArgv = <T>(
  argvNames: string[],
  type: ArgvType,
) => {

  const toType = (value: string | undefined): T | undefined => {
    if (typeof value === 'undefined') return undefined;
    let converted;
    if (type === 'number') {
      converted = toNumber(value);
    } else {
      converted = value;
    }
    return converted as T;
  }

  const flagList = argv.slice(2);
  for (let flag in argvNames) {
    for (let i = 0; i < flagList.length; i++) {
      if (flagList[i] === flag) {
        return toType(flagList[i + 1]);
      }
    }
  }
  return undefined;
}