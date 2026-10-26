export function ymIndex(ym) {
  const [y, m] = ym.split('-')
  return parseInt(y, 10) * 12 + (parseInt(m, 10) - 1)
}

// Bind the same date rules to canonical records or to lightweight browser metadata.
export function assetHistoryMinDate(assets, overrides, assetId) {
  return overrides[assetId] ?? assets[assetId].points[0].date
}

export function createAnniversaryYearOptions({ getAssetMinDate, getAssetMaxDate, isQualifiedMonth }) {
  return function getValidYearsBackOptions(assetId, today) {
    const minDate = getAssetMinDate(assetId);
    const minIdx = ymIndex(minDate);
    const options = [];
    for (let yearsBack = 1; yearsBack <= 10; yearsBack++) {
      const past = new Date(today.getFullYear() - yearsBack, today.getMonth(), 1);
      const ym = past.getFullYear() + "-" + String(past.getMonth() + 1).padStart(2, "0");
      if (ymIndex(ym) >= minIdx && ymIndex(ym) <= ymIndex(getAssetMaxDate(assetId)) && isQualifiedMonth(assetId, ym)) options.push(yearsBack);
    }
    return options;
  }
}

export function ymForYearsBack(yearsBack, today) {
  const past = new Date(today.getFullYear() - yearsBack, today.getMonth(), 1);
  return past.getFullYear() + "-" + String(past.getMonth() + 1).padStart(2, "0");
}

export function fmtYm(ym, { monthLabels }) {
  const [y, m] = ym.split("-");
  return `${monthLabels[Number(m) - 1]} ${y}`;
}
