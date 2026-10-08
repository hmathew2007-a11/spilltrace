/**
 * SpillTrace AI — Persistent Database Storage Layer (SpillTraceDB)
 *
 * Implements a persistent relational database using IndexedDB.
 * Manages tables for cases, slicks, origin_zones, vessels, dark_vessels,
 * scorecards, analyst_reviews, and reports.
 */

const DB_NAME = 'SpillTraceDB';
const DB_VERSION = 1;

class DatabaseManager {
  constructor() {
    this.db = null;
    this.initPromise = this.init();
  }

  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Table: cases
        if (!db.objectStoreNames.contains('cases')) {
          const caseStore = db.createObjectStore('cases', { keyPath: 'case_id' });
          caseStore.createIndex('status', 'status', { unique: false });
        }

        // Table: slicks
        if (!db.objectStoreNames.contains('slicks')) {
          const slickStore = db.createObjectStore('slicks', { keyPath: 'id' });
          slickStore.createIndex('case_id', 'case_id', { unique: false });
        }

        // Table: origin_zones
        if (!db.objectStoreNames.contains('origin_zones')) {
          const zoneStore = db.createObjectStore('origin_zones', { keyPath: 'id' });
          zoneStore.createIndex('case_id', 'case_id', { unique: false });
        }

        // Table: vessels
        if (!db.objectStoreNames.contains('vessels')) {
          const vesselStore = db.createObjectStore('vessels', { keyPath: 'vessel_id' });
          vesselStore.createIndex('case_id', 'case_id', { unique: false });
        }

        // Table: dark_vessels
        if (!db.objectStoreNames.contains('dark_vessels')) {
          const darkStore = db.createObjectStore('dark_vessels', { keyPath: 'id' });
          darkStore.createIndex('case_id', 'case_id', { unique: false });
        }

        // Table: scorecards
        if (!db.objectStoreNames.contains('scorecards')) {
          const scoreStore = db.createObjectStore('scorecards', { keyPath: 'id' }); // id: caseId_vesselId
          scoreStore.createIndex('case_id', 'case_id', { unique: false });
        }

        // Table: analyst_reviews
        if (!db.objectStoreNames.contains('analyst_reviews')) {
          const reviewStore = db.createObjectStore('analyst_reviews', { keyPath: 'id' }); // id: caseId_vesselId
          reviewStore.createIndex('case_id', 'case_id', { unique: false });
        }

        // Table: reports
        if (!db.objectStoreNames.contains('reports')) {
          const reportStore = db.createObjectStore('reports', { keyPath: 'report_id' });
          reportStore.createIndex('case_id', 'case_id', { unique: false });
        }
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onerror = (event) => {
        console.error('Database failed to open:', event.target.error);
        reject(event.target.error);
      };
    });
  }

  // Helper method for generic transaction operations
  async getStore(storeName, mode = 'readonly') {
    await this.initPromise;
    const tx = this.db.transaction(storeName, mode);
    return tx.objectStore(storeName);
  }

  // --- CRUD Operations for Cases ---
  async getAllCases() {
    const store = await this.getStore('cases');
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async getCaseById(caseId) {
    const store = await this.getStore('cases');
    return new Promise((resolve) => {
      const request = store.get(caseId);
      request.onsuccess = () => resolve(request.result || null);
    });
  }

  async saveCase(caseObj) {
    const store = await this.getStore('cases', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(caseObj);
      request.onsuccess = () => resolve(caseObj);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  // --- CRUD Operations for Analyst Reviews & Sign-Offs ---
  async getAnalystReviews(caseId) {
    const store = await this.getStore('analyst_reviews');
    const index = store.index('case_id');
    return new Promise((resolve) => {
      const request = index.getAll(caseId);
      request.onsuccess = () => resolve(request.result || []);
    });
  }

  async saveAnalystReview(caseId, vesselId, reviewed) {
    const store = await this.getStore('analyst_reviews', 'readwrite');
    const id = `${caseId}_${vesselId}`;
    return new Promise((resolve, reject) => {
      if (reviewed) {
        const record = { id, case_id: caseId, vessel_id: vesselId, reviewed_at: new Date().toISOString() };
        const req = store.put(record);
        req.onsuccess = () => resolve(record);
        req.onerror = (e) => reject(e.target.error);
      } else {
        const req = store.delete(id);
        req.onsuccess = () => resolve(null);
        req.onerror = (e) => reject(e.target.error);
      }
    });
  }

  async saveAnalystSignoff(caseId, signoffStatus, notes = '') {
    const caseObj = await this.getCaseById(caseId);
    if (caseObj) {
      caseObj.analyst_signoff = signoffStatus;
      if (notes) caseObj.analyst_notes = notes;
      await this.saveCase(caseObj);
    }
    return caseObj;
  }

  // --- CRUD Operations for Generated Reports ---
  async saveReport(reportObj) {
    const store = await this.getStore('reports', 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(reportObj);
      request.onsuccess = () => resolve(reportObj);
      request.onerror = (e) => reject(e.target.error);
    });
  }

  async getAllReports() {
    const store = await this.getStore('reports');
    return new Promise((resolve) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
    });
  }
}

export const dbManager = new DatabaseManager();
