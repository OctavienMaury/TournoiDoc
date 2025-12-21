// ============================================
// GOOGLE APPS SCRIPT - Backend pour GeoGuessr Tournament
// ============================================
// 
// INSTRUCTIONS D'INSTALLATION :
// 
// 1. Crée un nouveau Google Sheet
// 2. Nomme la première feuille "Scores"
// 3. Ajoute ces en-têtes en ligne 1 : participantId | day | geoScore | timestamp
// 4. Va dans Extensions > Apps Script
// 5. Supprime tout le code par défaut et colle ce fichier
// 6. Sauvegarde (Ctrl+S)
// 7. Clique sur "Déployer" > "Nouveau déploiement"
// 8. Type : "Application Web"
// 9. Exécuter en tant que : "Moi"
// 10. Accès : "Tout le monde"
// 11. Clique sur "Déployer"
// 12. Copie l'URL et colle-la dans le fichier React (GOOGLE_SCRIPT_URL)
//
// ============================================

const SHEET_NAME = 'Scores';

// Handle GET requests (fetch scores)
function doGet(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    
    const scores = [];
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0] !== '') { // Skip empty rows
        scores.push({
          participantId: parseInt(row[0]),
          day: parseInt(row[1]),
          geoScore: parseInt(row[2]),
          timestamp: row[3]
        });
      }
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: true, scores: scores }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle POST requests (add/update score)
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    
    if (data.action === 'add') {
      const participantId = parseInt(data.participantId);
      const day = parseInt(data.day);
      const geoScore = parseInt(data.geoScore);
      const timestamp = data.timestamp || new Date().toISOString();
      
      // Check if score already exists for this participant/day
      const existingData = sheet.getDataRange().getValues();
      let rowToUpdate = -1;
      
      for (let i = 1; i < existingData.length; i++) {
        if (parseInt(existingData[i][0]) === participantId && parseInt(existingData[i][1]) === day) {
          rowToUpdate = i + 1; // +1 because sheets are 1-indexed
          break;
        }
      }
      
      if (rowToUpdate > 0) {
        // Update existing row
        sheet.getRange(rowToUpdate, 1, 1, 4).setValues([[participantId, day, geoScore, timestamp]]);
      } else {
        // Add new row
        sheet.appendRow([participantId, day, geoScore, timestamp]);
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, message: 'Score saved' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    if (data.action === 'delete') {
      const participantId = parseInt(data.participantId);
      const day = parseInt(data.day);
      
      const existingData = sheet.getDataRange().getValues();
      
      for (let i = 1; i < existingData.length; i++) {
        if (parseInt(existingData[i][0]) === participantId && parseInt(existingData[i][1]) === day) {
          sheet.deleteRow(i + 1);
          break;
        }
      }
      
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, message: 'Score deleted' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: 'Unknown action' }))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Test function (run this to make sure everything works)
function testSetup() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
  if (!sheet) {
    SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
    const newSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
    newSheet.getRange(1, 1, 1, 4).setValues([['participantId', 'day', 'geoScore', 'timestamp']]);
    Logger.log('Sheet created with headers!');
  } else {
    Logger.log('Sheet already exists!');
  }
}
