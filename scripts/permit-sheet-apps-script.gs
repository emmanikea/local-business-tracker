const SHEET_NAME = 'Permits';
const HEADERS = [
  'id','projectName','city','state','permitNumber','portalUrl','adapter','pmPhone','active',
  'status','milestone','inspection','fees','rawHash','lastChecked','lastChanged','changedFields','lastError',
  'statusPath','milestonePath','inspectionPath','feesPath'
];

function secret_() {
  return PropertiesService.getScriptProperties().getProperty('PERMIT_WEBHOOK_TOKEN');
}

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  return sheet;
}

function rows_() {
  const sheet = sheet_();
  if (sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(2, 1, sheet.getLastRow() - 1, HEADERS.length).getValues();
  return values.map((row, index) => {
    const item = { _row: index + 2 };
    HEADERS.forEach((header, i) => item[header] = row[i]);
    item.active = item.active === '' ? true : !['false','0','no'].includes(String(item.active).toLowerCase());
    return item;
  });
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value)).setMimeType(ContentService.MimeType.JSON);
}

function authorized_(token) {
  return Boolean(secret_()) && token === secret_();
}

function doGet(e) {
  if (!authorized_(e.parameter.token)) return json_({ error: 'unauthorized' });
  if (e.parameter.action !== 'list') return json_({ error: 'unsupported_action' });
  return json_({ permits: rows_().map(({ _row, ...permit }) => permit) });
}

function doPost(e) {
  const body = JSON.parse(e.postData.contents || '{}');
  if (!authorized_(body.token)) return json_({ error: 'unauthorized' });
  if (body.action !== 'update') return json_({ error: 'unsupported_action' });

  const sheet = sheet_();
  const row = rows_().find(item => String(item.id) === String(body.id));
  if (!row) return json_({ error: 'permit_not_found' });

  const snapshot = body.snapshot || {};
  const now = snapshot.checkedAt || new Date().toISOString();
  const changedFields = Array.isArray(body.changedFields) ? body.changedFields.join(', ') : '';

  const updates = {
    status: snapshot.status || '',
    milestone: snapshot.milestone || '',
    inspection: snapshot.inspection || '',
    fees: snapshot.fees || '',
    rawHash: snapshot.rawHash || '',
    lastChecked: now,
    lastChanged: changedFields ? now : row.lastChanged,
    changedFields,
    lastError: body.error || ''
  };

  Object.entries(updates).forEach(([key, value]) => {
    const col = HEADERS.indexOf(key) + 1;
    if (col > 0) sheet.getRange(row._row, col).setValue(value);
  });

  return json_({ ok: true });
}

function setupPermitSheet() {
  const sheet = sheet_();
  sheet.setFrozenRows(1);
  sheet.autoResizeColumns(1, HEADERS.length);
  return 'Permit sheet initialized';
}
