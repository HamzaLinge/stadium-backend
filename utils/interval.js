function convertToMinutes(timeString) {
  const [hours, minutes] = timeString.split(":");
  return parseInt(hours, 10) * 60 + parseInt(minutes, 10);
}

function subtractIntervals(mainInterval, intervalsToSubtract) {
  let result = [];

  const mainFrom = convertToMinutes(mainInterval.from);
  const mainTo = convertToMinutes(mainInterval.to);

  for (let i = 0; i < intervalsToSubtract.length; i++) {
    const subtractInterval = intervalsToSubtract[i];

    const subtractFrom = convertToMinutes(subtractInterval.from);
    const subtractTo = convertToMinutes(subtractInterval.to);

    if (subtractFrom >= mainTo || subtractTo <= mainFrom) {
      // No intersection, add the whole main interval
      result.push({ from: mainInterval.from, to: mainInterval.to });
    } else if (subtractFrom > mainFrom && subtractTo < mainTo) {
      // Subtract interval is fully contained within the main interval, split the main interval
      result.push({ from: mainInterval.from, to: subtractInterval.from });
      mainInterval.from = subtractInterval.to;
    } else if (subtractFrom <= mainFrom && subtractTo >= mainTo) {
      // Subtract interval fully contains the main interval, no non-intersecting intervals
      mainInterval.from = mainInterval.to;
    } else if (subtractFrom <= mainFrom && subtractTo > mainFrom && subtractTo < mainTo) {
      // Subtract interval overlaps with the start of the main interval
      mainInterval.from = subtractInterval.to;
    } else if (subtractFrom > mainFrom && subtractFrom < mainTo && subtractTo >= mainTo) {
      // Subtract interval overlaps with the end of the main interval
      result.push({ from: mainInterval.from, to: subtractInterval.from });
      mainInterval.from = mainInterval.to;
    }
  }

  if (mainInterval.from < mainInterval.to) {
    result.push({ from: mainInterval.from, to: mainInterval.to });
  }

  return result;
}

function checkIfThereIsIntersection(interval, intervalArray) {
  const startMain = convertToMinutes(interval.from);
  const endMain = convertToMinutes(interval.to);

  for (const { from, to } of intervalArray) {
    const start = convertToMinutes(from);
    const end = convertToMinutes(to);

    if (
      (startMain >= start && startMain <= end) ||
      (endMain >= start && endMain <= end)
    )
      return false;
  }
  return true;
}

module.exports = { subtractIntervals, checkIfThereIsIntersection, convertToMinutes };
