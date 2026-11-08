function isResourceId(value) {
  if (typeof value === 'number') return Number.isSafeInteger(value) && value > 0;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return false;
  const id = BigInt(value);
  return id > 0n && id <= 9223372036854775807n;
}

module.exports = { isResourceId };
